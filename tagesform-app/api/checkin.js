// Morgen-Check-in speichern (POST) oder löschen (DELETE ?date=)
const store = require('../lib/store');
const { send, body, handler, query, isDate } = require('../lib/http');

const ITEMS = ['schlaf', 'energie', 'muskeln', 'stress', 'stimmung'];
const ORTE = ['schienbein', 'knie', 'achilles', 'fuss', 'huefte', 'ruecken', 'schulter', 'sonstiges'];

module.exports = handler(async (req, res) => {
  if (req.method === 'DELETE') {
    const d = query(req).get('date');
    if (!isDate(d)) return send(res, 400, { fehler: 'Ungültiges Datum.' });
    await store.hdel('checkin', d);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req);
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
  row.at = new Date().toISOString();
  await store.hset('checkin', b.date, row);
  send(res, 200, { ok: true, row });
});
