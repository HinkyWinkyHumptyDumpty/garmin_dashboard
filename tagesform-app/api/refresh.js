// Garmin-Daten holen: automatisch per Vercel Cron (GET mit CRON_SECRET) oder per Knopf in der App (POST)
const auth = require('../lib/auth');
const store = require('../lib/store');
const garmin = require('../lib/garmin');
const push = require('../lib/push');
const { send, body } = require('../lib/http');

module.exports = async (req, res) => {
  const cron = auth.isCron(req);
  if (!cron && !auth.isAuthed(req)) return send(res, 401, { fehler: 'Bitte anmelden.' });
  if (!cron && req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  try {
    const b = cron ? {} : await body(req);
    if (!(await store.lock('lock:refresh', 280))) return send(res, 409, { fehler: 'Die Aktualisierung läuft schon – gleich noch einmal laden.' });
    try {
      const stand = await garmin.refresh({ full: !!b.voll, budgetMs: cron ? 220e3 : 35e3 }); // Browser: unter einer Minute antworten
      await store.del('data:fehler');
      let morgen = null; // Morgen-Push nur aus dem automatischen Abruf
      if (cron) { try { morgen = await push.morgen(stand); } catch (e) { console.error('Morgen-Push:', e); morgen = { fehler: e.message }; } }
      send(res, 200, { ok: true, stand, push: morgen });
    } finally {
      await store.del('lock:refresh');
    }
  } catch (e) {
    console.error(e);
    try { await store.set('data:fehler', { at: new Date().toISOString(), text: e.message }); } catch (x) { /* Speicher selbst nicht erreichbar */ }
    send(res, 502, { fehler: e.message });
  }
};
