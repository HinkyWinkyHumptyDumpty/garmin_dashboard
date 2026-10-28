// Eingaben des Rennrechners geräteübergreifend merken.
// POST { sport, dist: { tri: 'ld', … }, tri_ld: {…}, lauf_10k: {…}, … } – ältere Form { ld, md, strecke } bleibt lesbar.
// Dazu { plan }, { gym }, { flow }: Einstellungen von Trainingsplan, Gym und Pilates/Yoga, { spiel }: Spielstand (null löscht).
const { send, body, handler } = require('../lib/http');
const { DISTANZEN, gueltig, SCHLUESSEL } = require('../lib/distanzen');

const SPORT = Object.keys(DISTANZEN);
const WERT = (v) => (typeof v === 'number' ? isFinite(v) : typeof v === 'string' ? v.length <= 24 : typeof v === 'boolean');
// Trainingsplan, Gym, Pilates/Yoga und Spielstand: verschachtelte Einstellungen (Listen, Häkchen je Einheit) – begrenzt in Tiefe und Größe
const TIEF = new Set(['plan', 'gym', 'flow', 'spiel']);
function sauber(v, tiefe) {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return isFinite(v) ? v : undefined;
  if (typeof v === 'string') return v.length <= 60 ? v : undefined;
  if (tiefe >= 4 || typeof v !== 'object') return undefined;
  if (Array.isArray(v)) return v.slice(0, 60).map((x) => sauber(x, tiefe + 1)).filter((x) => x !== undefined);
  const o = {};
  for (const [k, x] of Object.entries(v).slice(0, 400)) { if (!/^[a-zA-Z0-9_:#.-]{1,40}$/.test(k)) continue; const y = sauber(x, tiefe + 1); if (y !== undefined) o[k] = y; }
  return o;
}

// Spielstand von mehreren Geräten zusammenführen: früherer Start, abgeschlossene Monate bleiben, Trophäen mit dem
// frühesten Datum, gelesene Begriffe vereinigt, gefeiertes Level als Maximum, die Auswahl (Profilbild, Banner …) vom Absender
const TAG = (x) => typeof x === 'string' && /^\d{4}-\d\d-\d\d$/.test(x);
function spielMischen(alt, neu) {
  if (!alt || typeof alt !== 'object' || !neu || typeof neu !== 'object') return neu;
  const m = Object.assign({}, alt, neu);
  if (TAG(alt.start) && TAG(neu.start)) m.start = alt.start < neu.start ? alt.start : neu.start;
  m.monate = Object.assign({}, neu.monate || {}, alt.monate || {});
  m.tr = Object.assign({}, alt.tr || {});
  Object.entries(neu.tr || {}).forEach(([k, v]) => { if (TAG(v) && (!TAG(m.tr[k]) || v < m.tr[k])) m.tr[k] = v; });
  const gl = [...(Array.isArray(alt.gelesen) ? alt.gelesen : []), ...(Array.isArray(neu.gelesen) ? neu.gelesen : [])];
  m.gelesen = [...new Set(gl.filter((x) => typeof x === 'string'))].slice(-60);
  const tage = Object.assign({}, alt.tage || {});
  Object.entries(neu.tage || {}).forEach(([k, v]) => { tage[k] = [...new Set(String(tage[k] || '') + String(v || ''))].join('').slice(0, 10); });
  m.tage = Object.fromEntries(Object.entries(tage).sort().slice(-60));
  const ga = alt.gesehen || {}, gn = neu.gesehen || {};
  m.gesehen = Object.assign({}, ga, gn, { lvl: Math.max(+ga.lvl || 1, +gn.lvl || 1) });
  m.wahl = neu.wahl !== undefined ? neu.wahl : alt.wahl;
  return m;
}

module.exports = handler(async (req, res, ctx) => {
  const store = ctx.db; // Speicherbereich des angemeldeten Nutzers
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req), out = {};
  for (const [k, o] of Object.entries(b)) {
    if (TIEF.has(k)) { if (o === null) out[k] = null; else if (o && typeof o === 'object' && !Array.isArray(o)) out[k] = sauber(o, 0); continue; }
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
  const vorher = (await store.get('rechner')) || {};
  if (out.spiel) out.spiel = spielMischen(vorher.spiel, out.spiel);
  const cur = Object.assign(vorher, out);
  for (const k of TIEF) if (cur[k] === null) delete cur[k]; // null = löschen
  if (JSON.stringify(cur).length > 60000) return send(res, 400, { fehler: 'Zu viele Angaben.' });
  await store.set('rechner', cur);
  send(res, 200, Object.assign({ ok: true }, 'spiel' in out ? { spiel: cur.spiel || null } : {}));
});
