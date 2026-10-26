// CSS-Test speichern (POST {date, t400_s, t200_s}) – setzt zugleich die CSS im Profil; löschen mit DELETE ?date=
const store = require('../lib/store');
const { send, body, handler, query, isDate } = require('../lib/http');

module.exports = handler(async (req, res) => {
  if (req.method === 'DELETE') {
    const d = query(req).get('date');
    if (!isDate(d)) return send(res, 400, { fehler: 'Ungültiges Datum.' });
    await store.hdel('css', d);
    return send(res, 200, { ok: true });
  }
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req), t400 = +b.t400_s, t200 = +b.t200_s;
  if (!isDate(b.date)) return send(res, 400, { fehler: 'Ungültiges Datum.' });
  if (!(t200 >= 90 && t200 <= 400 && t400 >= 200 && t400 <= 800 && t400 > 1.8 * t200 && t400 < 2.6 * t200)) return send(res, 400, { fehler: 'Die Zeiten passen nicht zusammen – 400 m dauern etwa doppelt so lange wie 200 m.' });
  const css = 100 / (200 / (t400 - t200));
  await store.hset('css', b.date, { date: b.date, t400_s: t400, t200_s: t200 });
  const tests = await store.hgetall('css'), latest = Object.keys(tests).sort().pop();
  if (latest === b.date) { const p = (await store.get('profil')) || {}; p.css_s_100m = +css.toFixed(1); await store.set('profil', p); }
  send(res, 200, { ok: true, css_s_100m: +css.toFixed(1) });
});
