// Eigenes Konto verwalten.
// GET → Übersicht · POST { aktion: 'garmin', schluessel } prüft und speichert den Garmin-Schlüssel (leer = entfernen)
// · { aktion: 'passwort', alt, neu } · { aktion: 'notfallcode', passwort } · { aktion: 'loeschen', passwort } löscht Konto und alle Daten
const auth = require('../lib/auth');
const nutzer = require('../lib/nutzer');
const garmin = require('../lib/garmin');
const { send, body, handler } = require('../lib/http');

module.exports = handler(async (req, res, ctx) => {
  const n = ctx.nutzer;
  if (req.method === 'GET') return send(res, 200, { email: n.email, angelegt: n.angelegt, garmin: !!n.garmin, garmin_lesbar: !!nutzer.garminLesen(n), garmin_seit: n.garmin_seit });
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req);

  if (b.aktion === 'garmin') {
    const s = String(b.schluessel || '').trim();
    if (!s) { await nutzer.garminSetzen(n, null); await ctx.db.del('garmin:token'); return send(res, 200, { ok: true, garmin: false }); }
    if (s.length < 20 || s.length > 600 || /\s/.test(s)) return send(res, 400, { fehler: 'Das sieht nicht nach einem Garmin-API-Schlüssel aus – bitte vollständig kopieren (er beginnt meist mit „GCDC_“).' });
    if (((await ctx.db.incr('garmin:pruefungen', 600)) || 0) > 8) return send(res, 429, { fehler: 'Zu viele Versuche – bitte in 10 Minuten noch einmal.' });
    try { await garmin.pruefeSchluessel(s); } catch (e) { return send(res, e.code ? 400 : 502, { fehler: e.message }); }
    await nutzer.garminSetzen(n, s);
    await ctx.db.del('garmin:token');
    return send(res, 200, { ok: true, garmin: true, garmin_seit: n.garmin_seit });
  }

  if (b.aktion === 'passwort') {
    try { const m = await nutzer.passwortAendern(n, String(b.alt || ''), String(b.neu || '')); return send(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie(m) }); }
    catch (e) { return send(res, 400, { fehler: e.message }); }
  }

  if (b.aktion === 'notfallcode') {
    if (!(await nutzer.passt(String(b.passwort || ''), n.pw))) return send(res, 403, { fehler: 'Das Passwort stimmt nicht.' }); // 403, nicht 401: die Sitzung selbst ist gültig
    return send(res, 200, { ok: true, notfallcode: await nutzer.neuerNotfallcode(n) });
  }

  if (b.aktion === 'loeschen') {
    if (!(await nutzer.passt(String(b.passwort || ''), n.pw))) return send(res, 403, { fehler: 'Das Passwort stimmt nicht.' }); // 403, nicht 401: die Sitzung selbst ist gültig
    const anzahl = await nutzer.loeschen(n);
    return send(res, 200, { ok: true, geloescht: anzahl }, { 'Set-Cookie': auth.clearCookie() });
  }

  send(res, 400, { fehler: 'Unbekannte Aktion.' });
});
