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
  console.log(fehler ? fehler + ' Fehler' : 'Alles in Ordnung.');
  process.exit(fehler ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
