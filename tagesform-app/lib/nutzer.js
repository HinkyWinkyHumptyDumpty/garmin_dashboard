// Konten: Anmeldung mit E-Mail und Passwort (scrypt), Notfall-Code zum Zurücksetzen ohne E-Mail-Versand,
// Garmin-Schlüssel verschlüsselt gespeichert (AES-256-GCM, Schlüssel aus AUTH_SECRET abgeleitet).
const crypto = require('crypto');
const util = require('util');
const store = require('./store');

const scrypt = util.promisify(crypto.scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O und 1/I

const normMail = (s) => String(s || '').trim().toLowerCase();
const mailOk = (m) => m.length <= 254 && /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(m);
const passwortFehler = (p) => (typeof p !== 'string' || p.length < 10 ? 'Das Passwort braucht mindestens 10 Zeichen.' : p.length > 200 ? 'Das Passwort ist zu lang.' : null);

async function hash(geheim) {
  const salt = crypto.randomBytes(16), h = await scrypt(String(geheim), salt, 32, SCRYPT);
  return 's1$' + salt.toString('base64url') + '$' + h.toString('base64url');
}
async function passt(geheim, gespeichert) {
  const [v, s, h] = String(gespeichert || '').split('$');
  if (v !== 's1' || !s || !h) return false;
  const soll = Buffer.from(h, 'base64url'), ist = await scrypt(String(geheim), Buffer.from(s, 'base64url'), soll.length, SCRYPT);
  return soll.length === ist.length && crypto.timingSafeEqual(soll, ist);
}

// Notfall-Code: 20 Zeichen (100 Bit), in Fünfergruppen
function neuerCode() {
  const b = crypto.randomBytes(20);
  let s = '';
  for (let i = 0; i < 20; i++) s += B32[b[i] & 31];
  return s.match(/.{5}/g).join('-');
}
const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// Garmin-Schlüssel ver- und entschlüsseln
function kryptoSchluessel() {
  const s = process.env.AUTH_SECRET || '';
  if (s.length < 16) throw new Error('AUTH_SECRET fehlt oder ist zu kurz – in Vercel unter „Environment Variables“ setzen (mindestens 32 Zeichen) und neu deployen.');
  return Buffer.from(crypto.hkdfSync('sha256', s, 'tagesform', 'garmin-schluessel', 32));
}
function verschluessle(text) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', kryptoSchluessel(), iv);
  const d = Buffer.concat([c.update(String(text), 'utf8'), c.final()]);
  return ['g1', iv.toString('base64url'), d.toString('base64url'), c.getAuthTag().toString('base64url')].join('.');
}
function entschluessle(s) {
  const [v, iv, d, t] = String(s || '').split('.');
  if (v !== 'g1') return null;
  try {
    const c = crypto.createDecipheriv('aes-256-gcm', kryptoSchluessel(), Buffer.from(iv, 'base64url'));
    c.setAuthTag(Buffer.from(t, 'base64url'));
    return Buffer.concat([c.update(Buffer.from(d, 'base64url')), c.final()]).toString('utf8');
  } catch (e) { return null; } // AUTH_SECRET geändert → Schlüssel neu eintragen
}

const laden = (uid) => (/^[A-Za-z0-9_-]{8,40}$/.test(String(uid || '')) ? store.get('nutzer:' + uid) : Promise.resolve(null));
const speichern = (n) => store.set('nutzer:' + n.uid, n);

async function finde(email) {
  const uid = await store.get('nutzer:mail:' + normMail(email));
  return uid ? laden(uid) : null;
}

// extra.einwilligung: { version, at } – Nachweis der Einwilligung in die Verarbeitung der Gesundheitsdaten
async function anlegen(email, passwort, extra) {
  const m = normMail(email);
  if (!mailOk(m)) throw new Error('Bitte eine gültige E-Mail-Adresse eingeben.');
  const pf = passwortFehler(passwort); if (pf) throw new Error(pf);
  const uid = crypto.randomBytes(12).toString('base64url');
  if (!(await store.setnx('nutzer:mail:' + m, uid))) throw new Error('Für diese E-Mail gibt es schon ein Konto – bitte anmelden.');
  const code = neuerCode();
  const n = { uid, email: m, pw: await hash(passwort), pwv: 1, notfall: await hash(normCode(code)), angelegt: new Date().toISOString(), garmin: null, garmin_seit: null, einwilligung: (extra && extra.einwilligung) || null, rolle: extra && extra.rolle === 'coach' ? 'coach' : 'athlet' }; // Version 59: Rolle
  await speichern(n);
  await store.hset('nutzer:liste', uid, { email: m, angelegt: n.angelegt });
  return { nutzer: n, notfallcode: code };
}

async function anmelden(email, passwort) {
  const n = await finde(email);
  if (!n) { await hash('ausgleich'); return null; } // gleiche Rechenzeit, ob es das Konto gibt oder nicht
  return (await passt(passwort, n.pw)) ? n : null;
}

// Passwort mit dem Notfall-Code neu setzen; es gibt danach einen neuen Code
async function zuruecksetzen(email, code, neu) {
  const pf = passwortFehler(neu); if (pf) throw new Error(pf);
  const n = await finde(email);
  if (!n || !(await passt(normCode(code), n.notfall))) return null;
  const c = neuerCode();
  Object.assign(n, { pw: await hash(neu), pwv: (n.pwv || 1) + 1, notfall: await hash(normCode(c)) });
  await speichern(n);
  return { nutzer: n, notfallcode: c };
}

async function passwortAendern(n, alt, neu) {
  if (!(await passt(alt, n.pw))) throw new Error('Das bisherige Passwort stimmt nicht.');
  const pf = passwortFehler(neu); if (pf) throw new Error(pf);
  Object.assign(n, { pw: await hash(neu), pwv: (n.pwv || 1) + 1 });
  await speichern(n);
  return n;
}

async function neuerNotfallcode(n) {
  const c = neuerCode();
  n.notfall = await hash(normCode(c));
  await speichern(n);
  return c;
}

async function garminSetzen(n, schluessel) {
  Object.assign(n, { garmin: schluessel ? verschluessle(schluessel) : null, garmin_seit: schluessel ? new Date().toISOString() : null });
  await speichern(n);
  return n;
}
const garminLesen = (n) => (n && n.garmin ? entschluessle(n.garmin) : null);

// Konto mit allen Daten löschen
async function loeschen(n) {
  await coachAufraeumen(n); // Version 59: Verbindungen zu Coaches und Athleten, offene Einladungscodes
  const anzahl = await store.fuer(n.uid).alleLoeschen();
  if (n.kalender_token) await store.del('kal:' + n.kalender_token); // Version 21: Kalender-Abo
  await store.del('nutzer:mail:' + n.email);
  await store.hdel('nutzer:liste', n.uid);
  await store.del('nutzer:' + n.uid);
  return anzahl;
}

async function alle() { return Object.keys(await store.hgetall('nutzer:liste')); }

/* ---------- Version 59: Coach ----------
   Ein Athlet lädt seinen Coach ein: Er bekommt einen Code (10 Zeichen, 7 Tage gültig, nur einmal einlösbar) und legt fest,
   was der Coach sehen darf – Erholung, Training, Plan & Rennen, Körper & Ernährung. Der Coach meldet sich mit seinem eigenen
   Konto an und löst den Code ein; Passwörter werden nie geteilt. Der Athlet sieht, wer Zugriff hat und wann zuletzt, ändert
   die Freigaben und beendet den Zugriff jederzeit. Der Coach ändert nichts am Konto des Athleten – er kann ihm Tipps schicken.
   Gespeichert wird beim Athleten (u:<athlet>:coaches, …:coach:einladungen, …:coach:tipps), beim Coach nur die Liste seiner
   Athleten (u:<coach>:athleten). Unter dem Code selbst liegt global nur ein Hash (coach:code:<hash>) mit Ablaufzeit. */
const fehler = (text, code) => Object.assign(new Error(text), { code: code || null });
const UID = /^[A-Za-z0-9_-]{8,40}$/;
const RECHTE = ['erholung', 'training', 'plan', 'koerper'];
const RECHTE_STANDARD = { erholung: true, training: true, plan: true, koerper: false }; // Körper & Ernährung nur, wenn der Athlet es will
function rechteSauber(r) { const o = {}; RECHTE.forEach((k) => { o[k] = r && typeof r === 'object' && typeof r[k] === 'boolean' ? r[k] : RECHTE_STANDARD[k]; }); return o; }
const EINLADUNG_TAGE = 7, EINLADUNGEN_MAX = 5, TIPPS_MAX = 200;
const TIPP_ARTEN = ['training', 'erholung', 'rennen', 'technik', 'allgemein'];
function coachCode() { const b = crypto.randomBytes(10); let s = ''; for (let i = 0; i < 10; i++) s += B32[b[i] & 31]; return s.slice(0, 5) + '-' + s.slice(5); } // 50 Bit
const codeSchluessel = (code) => 'coach:code:' + crypto.createHash('sha256').update('dreiklang-coach|' + normCode(code)).digest('base64url');
async function nameVon(n) { // Anzeigename aus dem Profil, sonst die E-Mail
  if (!n) return '';
  const p = await store.fuer(n.uid).get('profil');
  const name = p && typeof p.name === 'string' ? p.name.trim().slice(0, 30) : '';
  return name || n.email || '';
}
async function rolleSetzen(n, rolle) {
  if (!['athlet', 'coach'].includes(rolle)) throw fehler('Unbekannte Ansicht.');
  if ((n.rolle || 'athlet') !== rolle) { n.rolle = rolle; await speichern(n); }
  return rolle;
}
async function coachEinladen(n, rechte) {
  const db = store.fuer(n.uid), jetzt = Date.now(), offen = await db.hgetall('coach:einladungen');
  let aktiv = 0;
  for (const [id, e] of Object.entries(offen)) { if (e && e.bis > jetzt) aktiv++; else await db.hdel('coach:einladungen', id); } // Abgelaufenes fällt weg
  if (aktiv >= EINLADUNGEN_MAX) throw fehler('Es sind schon ' + EINLADUNGEN_MAX + ' Einladungen offen – zieh eine zurück oder warte, bis sie abläuft.');
  const code = coachCode(), id = crypto.randomBytes(6).toString('base64url'), bis = jetzt + EINLADUNG_TAGE * 864e5, r = rechteSauber(rechte);
  await store.set(codeSchluessel(code), { athlet: n.uid, id, rechte: r, bis }, EINLADUNG_TAGE * 86400);
  const e = { id, code, bis, rechte: r, at: jetzt };
  await db.hset('coach:einladungen', id, e);
  return e;
}
async function coachEinladungWeg(n, id) {
  const db = store.fuer(n.uid), e = await db.hget('coach:einladungen', String(id || ''));
  if (!e) return false;
  await store.del(codeSchluessel(e.code));
  await db.hdel('coach:einladungen', e.id);
  return true;
}
// Gilt der Code noch? (für die Registrierung als Coach) → Einladung oder null
async function coachCodeGilt(code) {
  if (normCode(code).length !== 10) return null;
  const e = await store.get(codeSchluessel(code));
  return e && e.athlet && e.bis > Date.now() ? e : null;
}
// Den Code eines Athleten einlösen → { athlet, name }
async function coachEinloesen(coach, code) {
  const k = codeSchluessel(code), e = await coachCodeGilt(code);
  if (!e) throw fehler('Der Code stimmt nicht oder ist abgelaufen – bitte deinen Athleten um einen neuen.', 'code');
  if (e.athlet === coach.uid) throw fehler('Das ist dein eigener Code – den gibst du deinem Coach.', 'eigen');
  if (!(await store.lock(k + ':los', 30))) throw fehler('Dieser Code wird gerade schon eingelöst.', 'code');
  const a = await laden(e.athlet);
  await store.del(k); // nur einmal einlösbar
  if (!a) throw fehler('Dieses Konto gibt es nicht mehr.', 'code');
  const dbA = store.fuer(a.uid), seit = new Date().toISOString(), alt = await dbA.hget('coaches', coach.uid);
  await dbA.hdel('coach:einladungen', e.id);
  await dbA.hset('coaches', coach.uid, { uid: coach.uid, name: await nameVon(coach), email: coach.email, seit: alt && alt.seit ? alt.seit : seit, rechte: rechteSauber(e.rechte), zuletzt: alt ? alt.zuletzt || null : null });
  await store.fuer(coach.uid).hset('athleten', a.uid, { uid: a.uid, seit: alt && alt.seit ? alt.seit : seit });
  return { athlet: a.uid, name: await nameVon(a) };
}
// Darf dieser Coach diesen Athleten sehen? → Eintrag mit Freigaben oder null
async function coachZugriff(coachUid, athletUid) {
  if (!UID.test(String(athletUid || '')) || !UID.test(String(coachUid || ''))) return null;
  const c = await store.fuer(athletUid).hget('coaches', coachUid);
  return c ? Object.assign({}, c, { rechte: rechteSauber(c.rechte) }) : null;
}
async function coachGesehen(coachUid, athletUid) { // „zuletzt angesehen“ für den Athleten – höchstens alle 5 Minuten schreiben
  const db = store.fuer(athletUid), c = await db.hget('coaches', coachUid);
  if (!c || (c.zuletzt && Date.now() - Date.parse(c.zuletzt) < 5 * 60e3)) return;
  c.zuletzt = new Date().toISOString();
  await db.hset('coaches', coachUid, c);
}
async function coachRechte(athlet, coachUid, rechte) {
  if (!UID.test(String(coachUid || ''))) return null;
  const db = store.fuer(athlet.uid), c = await db.hget('coaches', coachUid);
  if (!c) return null;
  c.rechte = rechteSauber(Object.assign({}, rechteSauber(c.rechte), rechte && typeof rechte === 'object' ? rechte : {}));
  await db.hset('coaches', coachUid, c);
  return c;
}
async function coachTrennen(athletUid, coachUid) {
  if (!UID.test(String(athletUid || '')) || !UID.test(String(coachUid || ''))) return false;
  const war = !!(await store.fuer(athletUid).hget('coaches', coachUid)) || !!(await store.fuer(coachUid).hget('athleten', athletUid));
  await store.fuer(athletUid).hdel('coaches', coachUid);
  await store.fuer(coachUid).hdel('athleten', athletUid);
  return war;
}
// Beim Löschen eines Kontos: die andere Seite jeder Verbindung und offene Codes
async function coachAufraeumen(n) {
  const db = store.fuer(n.uid);
  const [coaches, athleten, einl] = await Promise.all([db.hgetall('coaches'), db.hgetall('athleten'), db.hgetall('coach:einladungen')]);
  for (const c of Object.keys(coaches || {})) if (UID.test(c)) await store.fuer(c).hdel('athleten', n.uid);
  for (const a of Object.keys(athleten || {})) if (UID.test(a)) await store.fuer(a).hdel('coaches', n.uid);
  for (const e of Object.values(einl || {})) if (e && e.code) await store.del(codeSchluessel(e.code));
}
// Übersicht für „Coach“ im Profil (Athlet) und die Athletenliste (Coach)
async function coachUebersicht(n) {
  const db = store.fuer(n.uid), jetzt = Date.now();
  const [coaches, einl, athl] = await Promise.all([db.hgetall('coaches'), db.hgetall('coach:einladungen'), db.hgetall('athleten')]);
  const C = [];
  for (const c of Object.values(coaches || {})) {
    const k = UID.test(String(c && c.uid)) ? await laden(c.uid) : null;
    if (!k) { if (c && c.uid) await db.hdel('coaches', c.uid); continue; } // Konto des Coaches gibt es nicht mehr
    C.push({ uid: c.uid, name: (await nameVon(k)) || c.name, email: k.email, seit: c.seit || null, zuletzt: c.zuletzt || null, rechte: rechteSauber(c.rechte) });
  }
  const AT = [];
  for (const uid of Object.keys(athl || {})) {
    const z = await coachZugriff(n.uid, uid), a = z ? await laden(uid) : null;
    if (!z || !a) { await db.hdel('athleten', uid); continue; } // beendet oder gelöscht
    AT.push({ uid, name: await nameVon(a), seit: (athl[uid] && athl[uid].seit) || z.seit || null, rechte: z.rechte });
  }
  const nachSeit = (x, y) => (String(x.seit) < String(y.seit) ? -1 : 1);
  return {
    rolle: n.rolle || 'athlet',
    coaches: C.sort(nachSeit),
    einladungen: Object.values(einl || {}).filter((e) => e && e.bis > jetzt).sort((x, y) => x.at - y.at).map((e) => ({ id: e.id, code: e.code, bis: new Date(e.bis).toISOString(), rechte: rechteSauber(e.rechte) })),
    athleten: AT.sort(nachSeit),
  };
}
// Tipps: Der Coach schreibt in den Bereich des Athleten; der Athlet liest, antwortet oder entfernt sie
function textSauber(t, max) {
  return String(t == null ? '' : t).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}
function bezugSauber(b) {
  if (!b || typeof b !== 'object' || !['einheit', 'tag', 'hinweis', 'woche'].includes(b.typ)) return null;
  const o = { typ: b.typ };
  if (/^\d{4}-\d\d-\d\d$/.test(String(b.date || ''))) o.date = String(b.date);
  if (/^[A-Za-z0-9_:.-]{1,40}$/.test(String(b.id || ''))) o.id = String(b.id);
  const t = textSauber(b.titel, 80).replace(/\n/g, ' ');
  if (t) o.titel = t;
  return o;
}
async function tippSchreiben(coach, athletUid, b) {
  if (!(await coachZugriff(coach.uid, athletUid))) throw fehler('Kein Zugriff mehr – der Athlet hat die Freigabe beendet.', 'kein_zugriff');
  const text = textSauber(b && b.text, 1000);
  if (text.length < 2) throw fehler('Schreib ein paar Worte.');
  if ((await store.incr('coach:tipps:' + coach.uid + ':' + athletUid + ':' + new Date().toISOString().slice(0, 10), 2 * 86400)) > 40) throw fehler('Heute sind schon sehr viele Tipps rausgegangen – morgen geht es weiter.', 'zu_viele');
  const db = store.fuer(athletUid), id = Date.now().toString(36) + crypto.randomBytes(4).toString('base64url');
  const t = { id, von: coach.uid, von_name: await nameVon(coach), at: new Date().toISOString(), art: TIPP_ARTEN.includes(b.art) ? b.art : 'allgemein', text, bezug: bezugSauber(b.bezug), gelesen: null, antwort: null };
  await db.hset('coach:tipps', id, t);
  const alle = await db.hgetall('coach:tipps'), ids = Object.keys(alle).sort((x, y) => (String(alle[x].at) < String(alle[y].at) ? -1 : 1));
  for (const x of ids.slice(0, Math.max(0, ids.length - TIPPS_MAX))) await db.hdel('coach:tipps', x); // die ältesten fallen weg
  return t;
}
async function tippWeg(coach, athletUid, id) { // der Coach nimmt einen eigenen Tipp zurück
  if (!UID.test(String(athletUid || ''))) return false;
  const db = store.fuer(athletUid), t = await db.hget('coach:tipps', String(id || ''));
  if (!t || t.von !== coach.uid) return false;
  await db.hdel('coach:tipps', t.id);
  return true;
}
async function tippsFuer(athletUid, coachUid) {
  const alle = Object.values((await store.fuer(athletUid).hgetall('coach:tipps')) || {}).filter((t) => t && t.id && (!coachUid || t.von === coachUid));
  return alle.sort((x, y) => (String(x.at) < String(y.at) ? 1 : -1));
}
async function tippGelesen(n, id) { // id oder true (alle)
  const db = store.fuer(n.uid), jetzt = new Date().toISOString();
  let k = 0;
  for (const t of await tippsFuer(n.uid)) if (!t.gelesen && (id === true || t.id === id)) { t.gelesen = jetzt; await db.hset('coach:tipps', t.id, t); k++; }
  return k;
}
async function tippAntwort(n, id, text) {
  const db = store.fuer(n.uid), t = await db.hget('coach:tipps', String(id || ''));
  if (!t) throw fehler('Diesen Tipp gibt es nicht mehr.');
  const x = textSauber(text, 1000);
  if (!x) throw fehler('Schreib ein paar Worte.');
  const at = new Date().toISOString();
  t.antwort = { text: x, at, gesehen: null };
  if (!t.gelesen) t.gelesen = at;
  await db.hset('coach:tipps', t.id, t);
  return t;
}
async function tippLoeschen(n, id) {
  const db = store.fuer(n.uid), t = await db.hget('coach:tipps', String(id || ''));
  if (!t) return false;
  await db.hdel('coach:tipps', t.id);
  return true;
}
async function antwortenGesehen(coach, athletUid) {
  if (!(await coachZugriff(coach.uid, athletUid))) return 0;
  const db = store.fuer(athletUid), jetzt = new Date().toISOString();
  let k = 0;
  for (const t of await tippsFuer(athletUid, coach.uid)) if (t.antwort && !t.antwort.gesehen) { t.antwort.gesehen = jetzt; await db.hset('coach:tipps', t.id, t); k++; }
  return k;
}
// Der Name des Coaches, so wie ihn seine Athleten sehen (wie „Über dich“: höchstens 30 Zeichen; leer = die E-Mail).
// Steht in seinem Profil und wird in den Verbindungen und Tipps seiner Athleten mitgeändert.
function nameSauber(roh) {
  const x = roh == null ? '' : String(roh).normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
  if (x.length > 30) throw fehler('Der Name darf höchstens 30 Zeichen haben.', 'name');
  return x;
}
async function coachNameSetzen(n, roh) {
  const name = nameSauber(roh), db = store.fuer(n.uid), p = (await db.get('profil')) || {};
  if (name) p.name = name; else delete p.name;
  await db.set('profil', p);
  const zeige = name || n.email || '';
  for (const a of Object.keys((await db.hgetall('athleten')) || {})) {
    const dbA = store.fuer(a), c = await dbA.hget('coaches', n.uid);
    if (!c) continue;
    if (c.name !== zeige) { c.name = zeige; await dbA.hset('coaches', n.uid, c); }
    for (const t of await tippsFuer(a, n.uid)) if (t.von_name !== zeige) { t.von_name = zeige; await dbA.hset('coach:tipps', t.id, t); }
  }
  return name || null;
}
const coach = { nameSauber, coachNameSetzen, RECHTE, rechteSauber, codeSchluessel, coachCodeGilt, nameVon, rolleSetzen, coachEinladen, coachEinladungWeg, coachEinloesen, coachZugriff, coachGesehen, coachRechte, coachTrennen, coachUebersicht, tippSchreiben, tippWeg, tippsFuer, tippGelesen, tippAntwort, tippLoeschen, antwortenGesehen };

module.exports = Object.assign({ laden, finde, anlegen, anmelden, zuruecksetzen, passwortAendern, neuerNotfallcode, garminSetzen, garminLesen, loeschen, alle, passt, normMail, mailOk }, coach);
