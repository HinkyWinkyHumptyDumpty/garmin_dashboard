// Kohlenhydrate einer langen Einheit eintragen (POST {id, kh_g}) oder löschen (DELETE ?id=)
const store = require('../lib/store');
const { send, body, handler, query } = require('../lib/http');

module.exports = handler(async (req, res) => {
  if (req.method === 'DELETE') {
    const id = String(query(req).get('id') || '');
    if (!/^\d{1,20}$/.test(id)) return send(res, 400, { fehler: 'Ungültige Einheit.' });
    await store.hdel('fueling', id);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req), id = String(b.id || ''), g = Math.round(+b.kh_g);
  if (!/^\d{1,20}$/.test(id)) return send(res, 400, { fehler: 'Ungültige Einheit.' });
  if (!(g >= 0 && g <= 2000)) return send(res, 400, { fehler: 'Bitte Gramm zwischen 0 und 2000 eintragen.' });
  await store.hset('fueling', id, { id, kh_g: g, at: new Date().toISOString() });
  send(res, 200, { ok: true });
});
