// Eingaben des Rennrechners geräteübergreifend merken (POST {ld:{…}, md:{…}, strecke})
const { send, body, handler } = require('../lib/http');

module.exports = handler(async (req, res, ctx) => {
  const store = ctx.db; // Speicherbereich des angemeldeten Nutzers
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req), out = {};
  for (const k of ['ld', 'md']) {
    if (!b[k] || typeof b[k] !== 'object') continue;
    out[k] = {};
    for (const [f, v] of Object.entries(b[k])) if (/^[a-z_0-9]{1,24}$/.test(f) && (typeof v === 'number' ? isFinite(v) : typeof v === 'string' && v.length <= 24 || typeof v === 'boolean')) out[k][f] = v;
  }
  if (b.strecke === 'ld' || b.strecke === 'md') out.strecke = b.strecke;
  if (JSON.stringify(out).length > 8000) return send(res, 400, { fehler: 'Zu viele Angaben.' });
  const cur = (await store.get('rechner')) || {};
  await store.set('rechner', Object.assign(cur, out));
  send(res, 200, { ok: true });
});
