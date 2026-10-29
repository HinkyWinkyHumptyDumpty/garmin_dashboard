// Prüft den Web-Push ohne echtes Gerät: node scripts/test-push.js
// 1. Verschlüsselung gegen den offiziellen Testvektor aus RFC 8291 (Anhang A)
// 2. Ende-zu-Ende gegen einen lokalen Schein-Push-Dienst: VAPID-Signatur prüfen und Nachricht wie ein Gerät entschlüsseln
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.TF_PUSH_TEST = '1';
process.env.TF_DEV_STORE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tf-push-')), 'store.json');
delete process.env.KV_REST_API_URL; delete process.env.UPSTASH_REDIS_REST_URL;
const push = require('../lib/push');
const store = require('../lib/store');

const b = (s) => Buffer.from(s, 'base64url');
let fehler = 0;
const pruefe = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FEHLER ') + name + (ok || !info ? '' : ' – ' + info)); if (!ok) fehler++; };

// 1. RFC 8291, Anhang A
{
  const body = push.verschluesseln(
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    'BTBZMqHH6r4Tts7J_aSIgg',
    b('V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24'),
    { asPrivate: b('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw'), salt: b('DGv6ra1nlYgDCS1FRnbzlw') },
  );
  const soll = 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN';
  pruefe('RFC 8291 Testvektor', body.toString('base64url') === soll, body.toString('base64url'));
}

// Gegenstück auf dem Gerät: entschlüsseln nach RFC 8291/8188
function entschluesseln(body, uaEcdh, auth) {
  const salt = body.subarray(0, 16), rs = body.readUInt32BE(16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
  const ua = uaEcdh.getPublicKey(), secret = uaEcdh.computeSecret(asPub);
  const prkKey = crypto.createHmac('sha256', auth).update(secret).digest();
  const ikm = crypto.createHmac('sha256', prkKey).update(Buffer.concat([Buffer.from('WebPush: info\0', 'latin1'), ua, asPub, Buffer.from([1])])).digest();
  const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
  const cek = crypto.createHmac('sha256', prk).update(Buffer.from('Content-Encoding: aes128gcm\0\x01', 'latin1')).digest().subarray(0, 16);
  const nonce = crypto.createHmac('sha256', prk).update(Buffer.from('Content-Encoding: nonce\0\x01', 'latin1')).digest().subarray(0, 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
  d.setAuthTag(ct.subarray(ct.length - 16));
  const klar = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  let i = klar.length - 1; while (i >= 0 && klar[i] === 0) i--;
  if (klar[i] !== 2) throw new Error('Trennbyte fehlt');
  return { rs, text: klar.subarray(0, i).toString('utf8') };
}

// 2. Ende zu Ende
(async () => {
  const ua = crypto.createECDH('prime256v1'); ua.generateKeys();
  const auth = crypto.randomBytes(16);
  let empfangen = null;
  const srv = http.createServer((req, res) => {
    const teile = []; req.on('data', (c) => teile.push(c));
    req.on('end', () => { empfangen = { headers: req.headers, url: req.url, body: Buffer.concat(teile) }; res.statusCode = 201; res.end(); });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port, endpoint = 'http://127.0.0.1:' + port + '/wpush/v2/abc';
  await store.set('push:kontakt', 'https://tagesform.example');
  const nachricht = { title: 'Tagesform 78 · Bereit', body: 'HRV 62 ms · Ruhepuls 48 · Schlaf 7:40 h. Ümläute ✓', url: '/#heute', tag: 'morgen' };
  const r = await push.senden({ endpoint, keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } }, nachricht, { ttl: 600 });
  srv.close();
  pruefe('Push-Dienst nimmt an (201)', r.ok && r.status === 201, JSON.stringify(r));
  const h = empfangen.headers;
  pruefe('Header Content-Encoding aes128gcm', h['content-encoding'] === 'aes128gcm');
  pruefe('Header TTL', h.ttl === '600');
  const m = /^vapid t=([^,]+), k=(.+)$/.exec(h.authorization || '');
  pruefe('Authorization im VAPID-Format', !!m, h.authorization);
  const [kopf, inhalt, sig] = m[1].split('.'), k = b(m[2]);
  const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: k.subarray(1, 33).toString('base64url'), y: k.subarray(33).toString('base64url') }, format: 'jwk' });
  pruefe('VAPID-Signatur gültig', crypto.verify('sha256', Buffer.from(kopf + '.' + inhalt), { key: pub, dsaEncoding: 'ieee-p1363' }, b(sig)));
  const claims = JSON.parse(b(inhalt).toString());
  pruefe('JWT aud = Ursprung des Push-Dienstes', claims.aud === 'http://127.0.0.1:' + port, claims.aud);
  pruefe('JWT sub = Kontakt-Adresse', claims.sub === 'https://tagesform.example', claims.sub);
  pruefe('JWT läuft in ≤ 24 h ab', claims.exp > Date.now() / 1000 && claims.exp <= Date.now() / 1000 + 86400);
  const e = entschluesseln(empfangen.body, ua, auth);
  pruefe('Datensatzgröße 4096', e.rs === 4096);
  pruefe('Gerät entschlüsselt die Nachricht', e.text === JSON.stringify(nachricht), e.text);
  pruefe('Schlüssel bleibt gleich', (await push.schluessel()).pub === m[2]);
  pruefe('Fremde Adressen werden abgelehnt', !push.erlaubt('https://example.com/x') && !push.erlaubt('http://web.push.apple.com/x') && push.erlaubt('https://web.push.apple.com/QH8') && push.erlaubt('https://fcm.googleapis.com/fcm/send/x'));

  // 3. Wochenrückblick am Sonntagabend und Material-Erinnerung (Version 8) – je Zyklus genau einmal
  {
    const post = [];
    const srv2 = http.createServer((req, res) => { const t = []; req.on('data', (c) => t.push(c)); req.on('end', () => { post.push(entschluesseln(Buffer.concat(t), ua, auth).text); res.statusCode = 201; res.end(); }); });
    await new Promise((r) => srv2.listen(0, '127.0.0.1', r));
    const db = store.fuer('testkonto-v8');
    await db.hset('push:abos', 'geraet1', { endpoint: 'http://127.0.0.1:' + srv2.address().port + '/wpush/v8', keys: { p256dh: ua.getPublicKey().toString('base64url'), auth: auth.toString('base64url') } });
    const tag = (d, h) => new Date(d + 'T' + String(h).padStart(2, '0') + ':30:00+01:00'); // Ortszeit Berlin (Winterzeit)
    await db.set('data:garmin_tage', [{ date: '2026-10-27', steps: 8200, sleep_s: 27000 }, { date: '2026-10-28', steps: 9100, sleep_s: 26000 }]);
    await db.set('data:garmin_einheiten', [
      { id: 1, date: '2026-10-27', start: '2026-10-27 17:00', type: 'road_biking', dur_s: 7200, moving_s: 7000, dist_m: 72000 },
      { id: 2, date: '2026-10-29', start: '2026-10-29 17:00', type: 'road_biking', dur_s: 9000, moving_s: 8800, dist_m: 81500 },
      { id: 3, date: '2026-10-30', start: '2026-10-30 07:00', type: 'running', dur_s: 3000, moving_s: 3000, dist_m: 10200 },
    ]);
    await db.hset('checkin', '2026-10-28', { date: '2026-10-28', schlaf: 4, energie: 4, muskeln: 3, stress: 4, stimmung: 4 });
    let r = await push.woche(db, tag('2026-10-31', 18));
    pruefe('Wochenrückblick nicht am Samstag', r.grund === 'nicht Sonntagabend', JSON.stringify(r));
    r = await push.woche(db, tag('2026-11-01', 16));
    pruefe('Wochenrückblick nicht vor 17 Uhr', r.grund === 'nicht Sonntagabend', JSON.stringify(r));
    r = await push.woche(db, tag('2026-11-01', 18));
    pruefe('Wochenrückblick am Sonntagabend gesendet', r.gesendet === 1, JSON.stringify(r));
    const w = post.length ? JSON.parse(post[post.length - 1]) : {};
    pruefe('Wochenrückblick: Titel, Text und Link', /Woche/.test(w.title || '') && (w.body || '').length > 10 && w.url === '/#heute/woche', JSON.stringify(w));
    r = await push.woche(db, tag('2026-11-01', 20));
    pruefe('Wochenrückblick nur einmal pro Woche', r.grund === 'diese Woche schon gesendet', JSON.stringify(r));
    // Material: 72 + 81,5 km seit dem Wachsen bei 150 km Intervall → fällig
    await db.set('rechner', { material: { items: [{ id: 'r1', art: 'rad', name: 'Zeitfahrrad', wo: 'beides', ziel: 150, km0: 0, seit: '2026-10-01', std: true, wachs: '2026-10-26T20:00' }, { id: 's1', art: 'schuh', name: 'Daily', wo: 'alle', ziel: 700, km0: 100, seit: '2026-10-01', std: true }], zu: {} } });
    r = await push.material(db, tag('2026-10-30', 23));
    pruefe('Material nachts nicht', r.grund === 'nachts nicht', JSON.stringify(r));
    const vorher = post.length;
    r = await push.material(db, tag('2026-10-30', 9));
    pruefe('Kette fällig → eine Mitteilung', r.gesendet === 1 && r.faellig === 1, JSON.stringify(r));
    const mm = JSON.parse(post[post.length - 1] || '{}');
    pruefe('Material: ganze Kilometer im Text', post.length === vorher + 1 && /Zeitfahrrad: 154 km seit dem letzten Wachsen – dein Intervall sind 150 km\./.test(mm.body || ''), mm.body);
    r = await push.material(db, tag('2026-10-30', 15));
    pruefe('Material nur einmal je Zyklus', r.gesendet === 0 && r.faellig === 1, JSON.stringify(r));
    await db.set('rechner', { material: { items: [{ id: 'r1', art: 'rad', name: 'Zeitfahrrad', wo: 'beides', ziel: 150, km0: 0, seit: '2026-10-01', std: true, wachs: '2026-10-30T19:00' }], zu: {} } });
    r = await push.material(db, tag('2026-10-30', 20));
    pruefe('Nach dem Wachsen ist nichts fällig', r.gesendet === 0 && r.faellig === 0, JSON.stringify(r));
    srv2.close();
  }

  console.log(fehler ? fehler + ' Fehler' : 'Alles in Ordnung.');
  process.exit(fehler ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
