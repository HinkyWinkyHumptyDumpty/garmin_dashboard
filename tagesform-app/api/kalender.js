// Kalender-Abo (Version 21): Dein Kalender holt sich die Termine selbst.
// · GET  ?t=<Token>   → die gespeicherte Kalenderdatei als text/calendar (ohne Anmeldung – der Token ist das Geheimnis;
//                       Apple Kalender, Google und Outlook rufen die Adresse regelmäßig ab)
// · GET                → Stand des Abos { abo, stand, n, url } (angemeldet)
// · POST { ics, n }    → Kalenderdatei speichern, Token anlegen, falls noch keiner da ist → { url, stand, n }
// · DELETE             → Abo beenden: Token und Datei löschen
// Die Datei baut die App im Browser (plan.js „icsText“) und schickt sie hierher – der Server kennt den Plan nicht.
// Der Token (24 zufällige Bytes) steht nur im Nutzerdatensatz und als Verweis kal:<token> → uid; er lässt sich jederzeit
// durch Beenden und neues Abonnieren erneuern. Gespeichert wird nur die Kalenderdatei, keine weiteren Daten.
const crypto = require('crypto');
const store = require('../lib/store');
const { send, body, handler, query } = require('../lib/http');

const TOKEN_OK = /^[A-Za-z0-9_-]{24,64}$/;
function icsOk(t) {
  return t.length >= 60 && t.length <= 600000 && /^BEGIN:VCALENDAR\r?\n/.test(t) && /\r?\nEND:VCALENDAR\s*$/.test(t)
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t) && !/<\s*\/?\s*(script|html|body|iframe|svg)/i.test(t);
}
const basis = (req) => 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'localhost');
const abo = (req, token) => ({ url: basis(req) + '/api/kalender?t=' + token, webcal: 'webcal://' + (req.headers['x-forwarded-host'] || req.headers.host || 'localhost') + '/api/kalender?t=' + token });

module.exports = handler(async (req, res, ctx) => {
  const t = query(req).get('t');
  if (req.method === 'GET' && t) { // Abruf durch den Kalender – ohne Sitzung
    if (!TOKEN_OK.test(t) || !store.connected()) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('Kein Kalender.'); }
    const uid = await store.get('kal:' + t);
    const k = uid ? await store.fuer(uid).get('kalender') : null;
    if (!k || !k.ics) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); return res.end('Kein Kalender – das Abo wurde beendet.'); }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="dreiklang-training.ics"');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.end(k.ics);
  }
  if (!ctx) return send(res, 401, { fehler: 'Bitte anmelden.' });
  const n = ctx.nutzer;
  if (req.method === 'GET') {
    const k = n.kalender_token ? await ctx.db.get('kalender') : null;
    return send(res, 200, n.kalender_token && k ? Object.assign({ abo: true, stand: k.stand, n: k.n }, abo(req, n.kalender_token)) : { abo: false });
  }
  if (req.method === 'POST') {
    const b = await body(req), ics = String(b.ics || '');
    if (!icsOk(ics)) return send(res, 400, { fehler: 'Das ist keine gültige Kalenderdatei.' });
    if (!n.kalender_token) {
      n.kalender_token = crypto.randomBytes(24).toString('base64url');
      await store.set('kal:' + n.kalender_token, n.uid);
      await store.set('nutzer:' + n.uid, n);
    }
    const stand = new Date().toISOString(), anzahl = Math.max(0, Math.min(5000, +b.n || 0));
    await ctx.db.set('kalender', { ics, stand, n: anzahl });
    return send(res, 200, Object.assign({ abo: true, stand, n: anzahl }, abo(req, n.kalender_token)));
  }
  if (req.method === 'DELETE') {
    if (n.kalender_token) { await store.del('kal:' + n.kalender_token); delete n.kalender_token; await store.set('nutzer:' + n.uid, n); }
    await ctx.db.del('kalender');
    return send(res, 200, { abo: false });
  }
  return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
}, { open: true });
