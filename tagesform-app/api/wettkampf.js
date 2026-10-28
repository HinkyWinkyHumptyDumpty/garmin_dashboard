// Geplante Wettkämpfe des angemeldeten Nutzers.
// POST { id?, name, datum, sport, distanz, prio, ziel_s?, notiz? } legt an oder ändert · DELETE ?id= löscht
// Gelesen werden sie mit allen anderen Daten über /api/data (Datensatz „wettkaempfe“).
const crypto = require('crypto');
const { send, body, handler, query, isDate } = require('../lib/http');
const { DISTANZEN, gueltig } = require('../lib/distanzen');

const SPORT = Object.keys(DISTANZEN);
const PRIO = ['A', 'B', 'C'];
const MAX = 40;

module.exports = handler(async (req, res, ctx) => {
  const db = ctx.db;
  if (req.method === 'DELETE') {
    const id = query(req).get('id') || '';
    if (!/^[A-Za-z0-9_-]{6,24}$/.test(id)) return send(res, 400, { fehler: 'Ungültige ID.' });
    await db.hdel('wettkampf', id);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req);
  const name = String(b.name || '').trim().slice(0, 60);
  if (!name) return send(res, 400, { fehler: 'Bitte einen Namen für den Wettkampf eingeben.' });
  if (!isDate(b.datum)) return send(res, 400, { fehler: 'Bitte ein gültiges Datum wählen.' });
  const t = Date.parse(b.datum), jetzt = Date.now();
  if (t < jetzt - 3 * 365 * 864e5 || t > jetzt + 4 * 365 * 864e5) return send(res, 400, { fehler: 'Das Datum liegt zu weit in der Vergangenheit oder Zukunft.' });
  if (!SPORT.includes(b.sport)) return send(res, 400, { fehler: 'Bitte eine Sportart wählen.' });
  if (!gueltig(b.sport, b.distanz)) return send(res, 400, { fehler: 'Bitte eine Distanz wählen.' });
  if (!PRIO.includes(b.prio)) return send(res, 400, { fehler: 'Bitte die Priorität A, B oder C wählen.' });
  let ziel = null;
  if (b.ziel_s != null && b.ziel_s !== '') { ziel = Math.round(+b.ziel_s); if (!(ziel >= 60 && ziel <= 30 * 3600)) return send(res, 400, { fehler: 'Die Zielzeit passt nicht.' }); }
  const alle = await db.hgetall('wettkampf');
  let id = typeof b.id === 'string' && /^[A-Za-z0-9_-]{6,24}$/.test(b.id) && alle[b.id] ? b.id : null;
  if (!id) {
    if (Object.keys(alle).length >= MAX) return send(res, 400, { fehler: 'Höchstens ' + MAX + ' Wettkämpfe – lösch bitte alte Einträge.' });
    id = crypto.randomBytes(9).toString('base64url');
  }
  const row = { id, name, datum: b.datum, sport: b.sport, distanz: b.distanz, prio: b.prio, ziel_s: ziel, notiz: String(b.notiz || '').slice(0, 300), at: new Date().toISOString() };
  await db.hset('wettkampf', id, row);
  send(res, 200, { ok: true, row });
});
