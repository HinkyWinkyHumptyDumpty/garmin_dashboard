// Morgen-Check-in speichern (POST) oder löschen (DELETE ?date=).
// Dazu das Tagesprotokoll „Heute notiert“: POST { art: 'tagebuch', date, w, p, k, s } · DELETE ?art=tagebuch&date=
//   w: getrunken in ml · p: Eiweiß in g · k: Uhrzeiten mit Koffein ['HH:MM'] · s: { eigeneId: Anzahl } für den eigenen Stack
const { send, body, handler, query, isDate } = require('../lib/http');

const ITEMS = ['schlaf', 'energie', 'muskeln', 'stress', 'stimmung'];
const ORTE = ['schienbein', 'knie', 'achilles', 'fuss', 'huefte', 'ruecken', 'schulter', 'sonstiges'];
const TAGEBUCH_MAX = 400; // Tage, die das Protokoll höchstens aufhebt

const ganz = (v, lo, hi) => { const n = Math.round(+v); return isFinite(n) && n >= lo && n <= hi ? n : null; };
const UHR = /^([01]\d|2[0-3]):[0-5]\d$/;
const tagOk = (d, zurueck) => isDate(d) && Date.parse(d) <= Date.now() + 2 * 864e5 && Date.parse(d) >= Date.now() - zurueck * 864e5;

async function tagebuch(req, res, db, b) {
  if (req.method === 'DELETE') {
    const d = query(req).get('date');
    if (!isDate(d)) return send(res, 400, { fehler: 'Ungültiges Datum.' });
    await db.hdel('tagebuch', d);
    return send(res, 200, { ok: true });
  }
  if (!b) b = await body(req);
  if (!tagOk(b.date, 60)) return send(res, 400, { fehler: 'Einträge gehen nur für die letzten 60 Tage.' });
  const row = { date: b.date };
  const w = b.w == null ? 0 : ganz(b.w, 0, 10000), p = b.p == null ? 0 : ganz(b.p, 0, 500);
  if (w == null) return send(res, 400, { fehler: 'Getrunken: bitte 0 bis 10.000 ml.' });
  if (p == null) return send(res, 400, { fehler: 'Eiweiß: bitte 0 bis 500 g.' });
  if (w) row.w = w;
  if (p) row.p = p;
  if (b.k != null) {
    if (!Array.isArray(b.k) || b.k.length > 12 || !b.k.every((x) => typeof x === 'string' && UHR.test(x))) return send(res, 400, { fehler: 'Koffein: Uhrzeiten als HH:MM, höchstens 12.' });
    if (b.k.length) row.k = [...b.k].sort();
  }
  if (b.s != null) {
    if (typeof b.s !== 'object' || Array.isArray(b.s) || Object.keys(b.s).length > 20) return send(res, 400, { fehler: 'Ungültige Einträge.' });
    const s = {};
    for (const [id, n] of Object.entries(b.s)) {
      const v = ganz(n, 0, 20);
      if (!/^[a-z0-9]{1,8}$/.test(id) || v == null) return send(res, 400, { fehler: 'Ungültige Einträge.' });
      if (v) s[id] = v;
    }
    if (Object.keys(s).length) row.s = s;
  }
  if (Object.keys(row).length === 1) { await db.hdel('tagebuch', b.date); return send(res, 200, { ok: true, row: null }); } // nichts mehr drin → Tag löschen
  row.at = new Date().toISOString();
  await db.hset('tagebuch', b.date, row);
  // ältere Tage über der Grenze entfernen
  const alle = Object.keys(await db.hgetall('tagebuch')).sort();
  for (const d of alle.slice(0, Math.max(0, alle.length - TAGEBUCH_MAX))) await db.hdel('tagebuch', d);
  send(res, 200, { ok: true, row });
}

module.exports = handler(async (req, res, ctx) => {
  const store = ctx.db; // Speicherbereich des angemeldeten Nutzers
  if (req.method !== 'DELETE' && req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  if (query(req).get('art') === 'tagebuch') return tagebuch(req, res, store);
  if (req.method === 'DELETE') {
    const d = query(req).get('date');
    if (!isDate(d)) return send(res, 400, { fehler: 'Ungültiges Datum.' });
    await store.hdel('checkin', d);
    return send(res, 200, { ok: true });
  }
  const b = await body(req);
  if (b.art === 'tagebuch') return tagebuch(req, res, store, b);
  if (!isDate(b.date) || Date.parse(b.date) > Date.now() + 2 * 864e5) return send(res, 400, { fehler: 'Ungültiges Datum.' });
  const row = { date: b.date };
  for (const k of ITEMS) {
    const v = Math.round(+b[k]);
    if (!(v >= 1 && v <= 5)) return send(res, 400, { fehler: 'Bitte alle fünf Fragen beantworten.' });
    row[k] = v;
  }
  row.schmerz = Math.max(0, Math.min(10, Math.round(+b.schmerz || 0)));
  row.schmerz_ort = row.schmerz > 0 && ORTE.includes(b.schmerz_ort) ? b.schmerz_ort : null;
  row.krank = !!b.krank;
  row.notiz = String(b.notiz || '').slice(0, 500);
  // ohne Uhr: Ruhepuls und Schlafdauer von Hand (beides freiwillig)
  if (b.puls != null && b.puls !== '') { const v = ganz(b.puls, 30, 130); if (v == null) return send(res, 400, { fehler: 'Ruhepuls bitte zwischen 30 und 130.' }); row.puls = v; }
  if (b.schlaf_h != null && b.schlaf_h !== '') { const v = Math.round(+b.schlaf_h * 4) / 4; if (!(v >= 2 && v <= 14)) return send(res, 400, { fehler: 'Schlaf bitte zwischen 2 und 14 Stunden.' }); row.schlaf_h = v; }
  row.at = new Date().toISOString();
  await store.hset('checkin', b.date, row);
  send(res, 200, { ok: true, row });
});
