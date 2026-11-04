// Morgen-Push verwalten. GET → öffentlicher Schlüssel und angemeldete Geräte.
// POST { aktion: 'abo', abo, geraet } meldet ein Gerät an · { aktion: 'ab', endpoint } ab · { aktion: 'test', endpoint } sendet eine Probe
const store = require('../lib/store');
const push = require('../lib/push');
const { send, body, handler } = require('../lib/http');

const B64U = /^[A-Za-z0-9_-]+={0,2}$/;

module.exports = handler(async (req, res, ctx) => {
  const db = ctx.db; // Geräte des angemeldeten Nutzers
  if (req.method === 'GET') {
    const [k, abos] = await Promise.all([push.schluessel(), db.hgetall('push:abos')]);
    return send(res, 200, { publicKey: k.pub, geraete: Object.values(abos).map((a) => ({ geraet: a.geraet, seit: a.seit })) });
  }
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req);

  if (b.aktion === 'abo') {
    const a = b.abo || {}, k = a.keys || {};
    if (!push.erlaubt(a.endpoint) || String(a.endpoint).length > 1000 || !B64U.test(k.p256dh || '') || !B64U.test(k.auth || '') || k.p256dh.length > 120 || k.auth.length > 60) return send(res, 400, { fehler: 'Ungültige Anmeldung für Mitteilungen.' });
    const id = push.idVon(a.endpoint), alt = await db.hget('push:abos', id);
    await db.hset('push:abos', id, { endpoint: a.endpoint, keys: { p256dh: k.p256dh, auth: k.auth }, geraet: String(b.geraet || 'Gerät').slice(0, 40), seit: (alt && alt.seit) || new Date().toISOString() });
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    if (/^[a-z0-9.-]+(:\d+)?$/i.test(host)) await store.set('push:kontakt', 'https://' + host); // Kontakt-Adresse im VAPID-Token
    return send(res, 200, { ok: true });
  }

  if (b.aktion === 'ab') {
    if (typeof b.endpoint === 'string') await db.hdel('push:abos', push.idVon(b.endpoint));
    return send(res, 200, { ok: true });
  }

  if (b.aktion === 'test') {
    const id = push.idVon(String(b.endpoint || '')), abo = await db.hget('push:abos', id);
    if (!abo) return send(res, 404, { fehler: 'Dieses Gerät ist nicht angemeldet – bitte Push neu aktivieren.' });
    const m = (await push.nachricht(db)) || { title: 'Tagesform', body: 'Push funktioniert. Inhalte kommen nach dem ersten Garmin-Abruf.', url: '/#heute', tag: 'morgen' };
    const r = await push.senden(abo, m, { ttl: 900, urgency: 'high' });
    if (r.status === 404 || r.status === 410) await db.hdel('push:abos', id);
    return send(res, 200, { ok: r.ok, status: r.status, text: r.text });
  }

  send(res, 400, { fehler: 'Unbekannte Aktion.' });
});
