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
  const n = { uid, email: m, pw: await hash(passwort), pwv: 1, notfall: await hash(normCode(code)), angelegt: new Date().toISOString(), garmin: null, garmin_seit: null, einwilligung: (extra && extra.einwilligung) || null };
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
  const anzahl = await store.fuer(n.uid).alleLoeschen();
  await store.del('nutzer:mail:' + n.email);
  await store.hdel('nutzer:liste', n.uid);
  await store.del('nutzer:' + n.uid);
  return anzahl;
}

async function alle() { return Object.keys(await store.hgetall('nutzer:liste')); }

module.exports = { laden, finde, anlegen, anmelden, zuruecksetzen, passwortAendern, neuerNotfallcode, garminSetzen, garminLesen, loeschen, alle, passt, normMail, mailOk };
