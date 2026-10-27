// Eigenes Konto verwalten.
// GET → Übersicht · GET ?export=1 → alle eigenen Daten als JSON-Datei (Auskunft und Datenübertragbarkeit, Art. 15 und 20 DSGVO)
// · POST { aktion: 'garmin', schluessel } prüft und speichert den Garmin-Schlüssel (leer = entfernen)
// · { aktion: 'passwort', alt, neu } · { aktion: 'notfallcode', passwort } · { aktion: 'loeschen', passwort } löscht Konto und alle Daten
const auth = require('../lib/auth');
const nutzer = require('../lib/nutzer');
const garmin = require('../lib/garmin');
const { laden } = require('../lib/daten');
const { send, body, handler, query } = require('../lib/http');

async function export_(ctx) {
  const n = ctx.nutzer, d = await laden(ctx.db), ds = Object.assign({}, d.datasets);
  delete ds.methoden; delete ds.athlet; // Beschreibungstexte der App und daraus Berechnetes, keine gespeicherten Daten
  const [profil, analysen, serien, push] = await Promise.all([ctx.db.get('profil'), ctx.db.hgetall('analyse'), ctx.db.hgetall('serie'), ctx.db.hgetall('push:abos')]);
  return {
    hinweis: 'Alle Daten, die Tagesform zu deinem Konto gespeichert hat. Passwort, Notfall-Code und Garmin-Zugang stehen nur als Prüf- bzw. verschlüsselter Wert in der Datenbank und sind hier nicht enthalten.',
    exportiert_am: new Date().toISOString(),
    konto: { email: n.email, angelegt: n.angelegt, einwilligung: n.einwilligung || null, garmin_verbunden: !!n.garmin, garmin_seit: n.garmin_seit || null },
    profil: profil || null, rechner: d.rechner, stand: d.stand,
    daten: Object.assign(ds, { analysen: Object.values(analysen), einheiten_verlauf: serien }),
    mitteilungen: Object.values(push || {}).map((a) => ({ geraet: a.geraet || 'Gerät', seit: a.seit || a.at || null })),
  };
}

module.exports = handler(async (req, res, ctx) => {
  const n = ctx.nutzer;
  if (req.method === 'GET' && query(req).get('export')) {
    return send(res, 200, await export_(ctx), { 'Content-Disposition': 'attachment; filename="tagesform-daten-' + new Date().toISOString().slice(0, 10) + '.json"' });
  }
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
