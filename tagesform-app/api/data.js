// Alle Datensätze des angemeldeten Nutzers in einem Abruf. Unverändert seit dem letzten Abruf → 304 ohne Inhalt.
const crypto = require('crypto');
const { laden } = require('../lib/daten');
const { send, handler, query } = require('../lib/http');

module.exports = handler(async (req, res, ctx) => {
  const id = query(req).get('serie'); // Verlauf einer Einheit für den Einheiten-Check
  if (id) return send(res, 200, { serie: /^\d{1,20}$/.test(id) ? await ctx.db.hget('serie', id) : null });
  const daten = await laden(ctx.db);
  daten.konto = { uid: ctx.uid, email: ctx.nutzer.email, garmin: !!ctx.nutzer.garmin, garmin_seit: ctx.nutzer.garmin_seit || null };
  const etag = '"' + crypto.createHash('sha1').update(ctx.uid + JSON.stringify(daten)).digest('base64url') + '"';
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304; res.setHeader('ETag', etag); res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  send(res, 200, Object.assign(daten, { etag }), { ETag: etag });
});
