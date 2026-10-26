// Anmelden (POST {passwort}), Status (GET), Abmelden (DELETE)
const auth = require('../lib/auth');
const store = require('../lib/store');
const { send, body, handler } = require('../lib/http');

module.exports = handler(async (req, res) => {
  if (req.method === 'GET') {
    return send(res, 200, { angemeldet: auth.isAuthed(req), passwort_gesetzt: !!process.env.APP_PASSWORD, speicher: store.connected(), garmin: !!process.env.GARMIN_API_KEY });
  }
  if (req.method === 'DELETE') return send(res, 200, { ok: true }, { 'Set-Cookie': auth.clearCookie() });
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  if (!process.env.APP_PASSWORD) return send(res, 500, { fehler: 'APP_PASSWORD ist in Vercel noch nicht gesetzt.' });

  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'x').split(',')[0].trim();
  const key = 'login:fehl:' + ip;
  if (store.connected() && ((await store.get(key)) || 0) >= 8) return send(res, 429, { fehler: 'Zu viele Versuche – bitte in 15 Minuten noch einmal.' });
  const b = await body(req);
  if (!auth.checkPassword(String(b.passwort || ''))) {
    if (store.connected()) await store.incr(key, 900);
    await new Promise((r) => setTimeout(r, 500));
    return send(res, 401, { fehler: 'Falsches Passwort.' });
  }
  return send(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie() });
}, { open: true });
