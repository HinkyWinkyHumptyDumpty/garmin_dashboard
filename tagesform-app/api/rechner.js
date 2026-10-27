// Eingaben des Rennrechners geräteübergreifend merken.
// POST { sport, dist: { tri: 'ld', … }, tri_ld: {…}, lauf_10k: {…}, … } – ältere Form { ld, md, strecke } bleibt lesbar.
const { send, body, handler } = require('../lib/http');
const { DISTANZEN, gueltig, SCHLUESSEL } = require('../lib/distanzen');

const SPORT = Object.keys(DISTANZEN);
const WERT = (v) => (typeof v === 'number' ? isFinite(v) : typeof v === 'string' ? v.length <= 24 : typeof v === 'boolean');

module.exports = handler(async (req, res, ctx) => {
  const store = ctx.db; // Speicherbereich des angemeldeten Nutzers
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req), out = {};
  for (const [k, o] of Object.entries(b)) {
    if (!(k === 'ld' || k === 'md' || SCHLUESSEL.has(k)) || !o || typeof o !== 'object' || Array.isArray(o)) continue;
    out[k] = {};
    for (const [f, v] of Object.entries(o)) if (/^[a-z_0-9]{1,24}$/.test(f) && WERT(v)) out[k][f] = v;
  }
  if (SPORT.includes(b.sport)) out.sport = b.sport;
  if (b.dist && typeof b.dist === 'object') {
    out.dist = {};
    for (const s of SPORT) if (gueltig(s, b.dist[s])) out.dist[s] = b.dist[s];
  }
  if (b.strecke === 'ld' || b.strecke === 'md') out.strecke = b.strecke;
  if (JSON.stringify(out).length > 30000) return send(res, 400, { fehler: 'Zu viele Angaben.' });
  const cur = Object.assign((await store.get('rechner')) || {}, out);
  if (JSON.stringify(cur).length > 60000) return send(res, 400, { fehler: 'Zu viele Angaben.' });
  await store.set('rechner', cur);
  send(res, 200, { ok: true });
});
