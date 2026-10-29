// Web-Push ohne Zusatzpakete: Anmeldung des Servers per VAPID (RFC 8292) und verschlüsselte Nachricht
// (RFC 8291, Inhaltskodierung aes128gcm nach RFC 8188). Geht an Apple (iPhone ab iOS 16.4, als App vom
// Home-Bildschirm), Google, Mozilla und Microsoft.
const crypto = require('crypto');
const store = require('./store');
const { laden } = require('./daten');
const { rechne } = require('./rechnen');
const AM = require('../public/alltag-motor.js'); // Wochenbilanz und Material – dieselbe Rechnung wie in der App

const TZ = process.env.TF_TIMEZONE || 'Europe/Berlin';
const DIENSTE = [/(^|\.)push\.apple\.com$/, /^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];
const b64u = (b) => Buffer.from(b).toString('base64url');
const vonB64u = (s) => Buffer.from(String(s || ''), 'base64url');
const idVon = (endpoint) => crypto.createHash('sha256').update(String(endpoint)).digest('base64url').slice(0, 22);

// Nur bekannte Push-Dienste anschreiben (sonst könnte ein Abo den Server beliebige Adressen aufrufen lassen)
function erlaubt(endpoint) {
  try {
    const u = new URL(endpoint);
    if (process.env.TF_PUSH_TEST === '1' && u.protocol === 'http:' && u.hostname === '127.0.0.1') return true; // nur lokaler Test
    return u.protocol === 'https:' && DIENSTE.some((d) => d.test(u.hostname));
  } catch (e) { return false; }
}

// Schlüsselpaar des Servers: beim ersten Gebrauch erzeugt und in Redis abgelegt
async function schluessel() {
  const k = await store.get('push:vapid');
  if (k && k.pub && k.jwk) return k;
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = privateKey.export({ format: 'jwk' });
  const neu = { pub: b64u(Buffer.concat([Buffer.from([4]), vonB64u(jwk.x), vonB64u(jwk.y)])), jwk };
  if (await store.setnx('push:vapid', neu)) return neu;
  return store.get('push:vapid'); // ein gleichzeitiger Aufruf war schneller
}

function jwt(aud, sub, jwk) {
  const kopf = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const inhalt = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub }));
  const sig = crypto.sign('sha256', Buffer.from(kopf + '.' + inhalt), { key: crypto.createPrivateKey({ key: jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' });
  return kopf + '.' + inhalt + '.' + b64u(sig);
}

// RFC 8291: ECDH mit dem Geräteschlüssel, HKDF mit dem Auth-Geheimnis, AES-128-GCM, ein Datensatz (Trennbyte 0x02)
function verschluesseln(p256dh, auth, klartext, test) {
  const ua = vonB64u(p256dh), geheim = vonB64u(auth);
  if (ua.length !== 65 || ua[0] !== 4 || geheim.length < 16) throw new Error('Ungültige Schlüssel im Abo.');
  const ecdh = crypto.createECDH('prime256v1');
  if (test && test.asPrivate) ecdh.setPrivateKey(test.asPrivate); else ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), gemeinsam = ecdh.computeSecret(ua);
  const salt = test && test.salt ? test.salt : crypto.randomBytes(16);
  const hkdf = (ikm, s, info, n) => Buffer.from(crypto.hkdfSync('sha256', ikm, s, info, n));
  const ikm = hkdf(gemeinsam, geheim, Buffer.concat([Buffer.from('WebPush: info\0', 'latin1'), ua, asPub]), 32);
  const cek = hkdf(ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0', 'latin1'), 16);
  const nonce = hkdf(ikm, salt, Buffer.from('Content-Encoding: nonce\0', 'latin1'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const daten = Buffer.concat([c.update(Buffer.concat([Buffer.from(klartext), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const kopf = Buffer.alloc(21);
  salt.copy(kopf, 0); kopf.writeUInt32BE(4096, 16); kopf[20] = asPub.length;
  return Buffer.concat([kopf, asPub, daten]);
}

async function senden(abo, nachricht, opt) {
  opt = opt || {};
  if (!abo || !erlaubt(abo.endpoint) || !abo.keys) throw new Error('Unbekannter Push-Dienst.');
  const k = await schluessel();
  const kontakt = (await store.get('push:kontakt')) || 'https://' + (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'localhost');
  const body = verschluesseln(abo.keys.p256dh, abo.keys.auth, JSON.stringify(nachricht));
  const r = await fetch(abo.endpoint, {
    method: 'POST', body,
    headers: { TTL: String(opt.ttl || 8 * 3600), Urgency: opt.urgency || 'normal', Topic: 'tagesform', 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', Authorization: 'vapid t=' + jwt(new URL(abo.endpoint).origin, kontakt, k.jwk) + ', k=' + k.pub },
  });
  const text = r.ok ? '' : (await r.text().catch(() => '')).slice(0, 300);
  return { status: r.status, ok: r.status >= 200 && r.status < 300, text };
}

// Inhalt: dieselbe Berechnung wie die Vorschau in der App (public/calcs.js → morgen_push), für einen Nutzer
async function nachricht(db) {
  const d = await laden(db);
  if (!d.stand) return null;
  const m = rechne(d.datasets, ['morgen_push']).morgen_push[0];
  return m ? { title: m.titel, body: m.text, url: m.url, tag: 'morgen' } : null;
}

// An alle Geräte eines Nutzers
async function anAlle(db, m) {
  const abos = await db.hgetall('push:abos'), out = { gesendet: 0, fehler: 0, entfernt: 0 };
  for (const [id, abo] of Object.entries(abos)) {
    try {
      const r = await senden(abo, m);
      if (r.ok) out.gesendet++;
      else { out.fehler++; console.error('Push abgelehnt', r.status, r.text); }
      if (r.status === 404 || r.status === 410) { await db.hdel('push:abos', id); out.entfernt++; } // Abo gibt es nicht mehr
    } catch (e) { out.fehler++; console.error('Push', e.message); }
  }
  return out;
}

// Vom Cron nach dem Garmin-Abruf eines Nutzers: einmal am Tag, morgens – sobald die Nacht da ist, spätestens ab 9 Uhr
async function morgen(db, stand) {
  if (!Object.keys(await db.hgetall('push:abos')).length) return { grund: 'kein Gerät angemeldet' };
  const jetzt = new Date(), stunde = +new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).formatToParts(jetzt).find((t) => t.type === 'hour').value;
  if (stunde < 6 || stunde >= 12) return { grund: 'nicht morgens' };
  if (!(stand && stand.schlaf_heute) && stunde < 9) return { grund: 'Nacht noch nicht synchronisiert' };
  const sperre = 'push:morgen:' + new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(jetzt);
  if (!(await db.lock(sperre, 36 * 3600))) return { grund: 'heute schon gesendet' };
  const m = await nachricht(db);
  if (!m) { await db.del(sperre); return { grund: 'noch keine Daten' }; }
  const r = await anAlle(db, m);
  if (!r.gesendet) await db.del(sperre); // nichts angekommen → beim nächsten Abruf noch einmal
  return r;
}

// Ortszeit: Datum, Wochentag (0 = Sonntag) und Stunde
function ortszeit(jetzt) {
  const t = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(jetzt).map((x) => [x.type, x.value]));
  return { datum: t.year + '-' + t.month + '-' + t.day, stunde: +t.hour, sonntag: t.weekday === 'Sun' };
}

// Sonntagabend: Wochenrückblick – einmal pro Woche, auch ohne Garmin
async function woche(db, jetzt) {
  if (!Object.keys(await db.hgetall('push:abos')).length) return { grund: 'kein Gerät angemeldet' };
  const o = ortszeit(jetzt || new Date());
  if (!o.sonntag || o.stunde < 17 || o.stunde >= 23) return { grund: 'nicht Sonntagabend' };
  const sperre = 'push:woche:' + o.datum;
  if (!(await db.lock(sperre, 36 * 3600))) return { grund: 'diese Woche schon gesendet' };
  const d = await laden(db), r = d.rechner || {}, ds = d.datasets;
  const b = AM.wochenBilanz({ montag: AM.montag(o.datum), bis: o.datum, einheiten: ds.garmin_einheiten, tage: ds.garmin_tage, checkins: ds.checkins, tagebuch: ds.tagebuch, gym: (r.gym && r.gym.log) || [], flow: (r.flow && r.flow.log) || [] });
  const m = AM.wochenText(b);
  if (!m) { await db.del(sperre); return { grund: 'keine Daten diese Woche' }; }
  const out = await anAlle(db, { title: m.titel, body: m.text, url: m.url, tag: 'woche' });
  if (!out.gesendet) await db.del(sperre);
  return out;
}

// Material: Kette wachsen oder Laufschuh am Ende – je Zyklus genau einmal, tagsüber
async function material(db, jetzt) {
  if (!Object.keys(await db.hgetall('push:abos')).length) return { grund: 'kein Gerät angemeldet' };
  const o = ortszeit(jetzt || new Date());
  if (o.stunde < 7 || o.stunde >= 22) return { grund: 'nachts nicht' };
  const d = await laden(db), mat = (d.rechner || {}).material;
  if (!mat || !Array.isArray(mat.items) || !mat.items.length) return { grund: 'kein Material eingetragen' };
  const st = AM.materialStand({ material: mat, einheiten: d.datasets.garmin_einheiten, heute: o.datum });
  const out = { gesendet: 0, faellig: 0 };
  for (const it of st.items.filter((x) => x.faellig && !x.aus)) {
    out.faellig++;
    const sperre = 'push:mat:' + it.id + ':' + (it.art === 'rad' ? it.wachs || it.seit || 'start' : 'ende');
    if (!(await db.lock(sperre, 400 * 86400))) continue;
    const km = (x) => Math.round(+x || 0).toLocaleString('de-DE');
    const m = it.art === 'rad'
      ? { title: 'Kette wachsen', body: it.name + ': ' + km(it.kmWachs) + ' km seit dem letzten Wachsen – dein Intervall sind ' + km(it.zielKm) + ' km.', url: '/#training/material', tag: 'material' }
      : { title: 'Laufschuh am Ende', body: it.name + ': ' + km(it.km) + ' von ' + km(it.zielKm) + ' km – Zeit, ein neues Paar einzulaufen.', url: '/#training/material', tag: 'material' };
    const r = await anAlle(db, m);
    if (r.gesendet) out.gesendet++; else await db.del(sperre);
  }
  return out;
}

module.exports = { schluessel, senden, nachricht, anAlle, morgen, woche, material, ortszeit, erlaubt, idVon, verschluesseln, jwt };
