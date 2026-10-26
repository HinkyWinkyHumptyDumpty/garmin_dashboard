// Alle Datensätze für die App in einem Abruf. Unverändert seit dem letzten Abruf → 304 ohne Inhalt.
const crypto = require('crypto');
const store = require('../lib/store');
const { laden } = require('../lib/daten');
const { send, handler, query } = require('../lib/http');

module.exports = handler(async (req, res) => {
  const id = query(req).get('serie'); // Verlauf einer Einheit für den Einheiten-Check
  if (id) return send(res, 200, { serie: /^\d{1,20}$/.test(id) ? await store.hget('serie', id) : null });
  const daten = await laden();
  const etag = '"' + crypto.createHash('sha1').update(JSON.stringify(daten)).digest('base64url') + '"';
  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304; res.setHeader('ETag', etag); res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  send(res, 200, Object.assign(daten, { etag }), { ETag: etag });
});
