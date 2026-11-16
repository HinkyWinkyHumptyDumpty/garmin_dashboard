// Alle Datensätze des angemeldeten Nutzers in einem Abruf. Unverändert seit dem letzten Abruf → 304 ohne Inhalt.
const crypto = require('crypto');
const { laden, fuerCoachLaden, coachListe } = require('../lib/daten');
const nutzer = require('../lib/nutzer');
const store = require('../lib/store');
const { send, handler, query } = require('../lib/http');

// Version 59: ?coach=1 → die Athleten des angemeldeten Coaches mit ihrer Lage · ?athlet=<uid> → die freigegebenen Daten
// dieses Athleten (nur mit Zugriff; nur lesen) · ?athlet=<uid>&serie=<id> → Verlauf einer Einheit, wenn Training freigegeben ist
const etagVon = (wer, daten) => '"' + crypto.createHash('sha1').update(wer + JSON.stringify(daten)).digest('base64url') + '"';
async function alsCoach(req, res, ctx, athlet, serie) {
  const kein = () => send(res, 403, { fehler: 'Kein Zugriff – der Athlet hat die Freigabe beendet oder dich nicht eingeladen.', code: 'kein_zugriff' });
  if (serie) {
    const z = await nutzer.coachZugriff(ctx.uid, athlet);
    if (!z) return kein();
    return send(res, 200, { serie: z.rechte.training && /^\d{1,20}$/.test(serie) ? await store.fuer(athlet).hget('serie', serie) : null });
  }
  const daten = await fuerCoachLaden(ctx.uid, athlet);
  if (!daten) return kein();
  await nutzer.coachGesehen(ctx.uid, athlet);
  daten.konto = { uid: ctx.uid, email: ctx.nutzer.email, garmin: !!ctx.nutzer.garmin, garmin_seit: ctx.nutzer.garmin_seit || null, rolle: ctx.nutzer.rolle || 'athlet' };
  const etag = etagVon(ctx.uid + '|' + athlet, daten);
  if (req.headers['if-none-match'] === etag) { res.statusCode = 304; res.setHeader('ETag', etag); res.setHeader('Cache-Control', 'no-store'); return res.end(); }
  send(res, 200, Object.assign(daten, { etag }), { ETag: etag });
}

module.exports = handler(async (req, res, ctx) => {
  const q = query(req), id = q.get('serie'), athlet = q.get('athlet'); // serie: Verlauf einer Einheit für den Einheiten-Check
  if (q.get('coach')) return send(res, 200, await coachListe(ctx.nutzer)); // Version 59
  if (athlet) return alsCoach(req, res, ctx, athlet, id);
  if (id) return send(res, 200, { serie: /^\d{1,20}$/.test(id) ? await ctx.db.hget('serie', id) : null });
  const aktiv = await ctx.db.get('aktiv');
  if (!aktiv || Date.now() - aktiv > 6 * 3600e3) await ctx.db.set('aktiv', Date.now()); // für den Cron: wer die App nutzt, bekommt Abrufe
  const daten = await laden(ctx.db);
  daten.konto = { uid: ctx.uid, email: ctx.nutzer.email, garmin: !!ctx.nutzer.garmin, garmin_seit: ctx.nutzer.garmin_seit || null, rolle: ctx.nutzer.rolle || 'athlet' };
  const etag = etagVon(ctx.uid, daten);
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304; res.setHeader('ETag', etag); res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  send(res, 200, Object.assign(daten, { etag }), { ETag: etag });
});
