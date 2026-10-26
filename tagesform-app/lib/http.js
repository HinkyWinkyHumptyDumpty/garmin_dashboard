// Kleine Helfer für die API-Funktionen (ohne Abhängigkeiten).
const auth = require('./auth');

function send(res, status, obj, headers) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const k in headers || {}) res.setHeader(k, headers[k]);
  res.end(JSON.stringify(obj));
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = [];
  for await (const c of req) { chunks.push(c); if (chunks.reduce((s, x) => s + x.length, 0) > 1e6) break; }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}

// Schutz: nur angemeldet (Cookie); Fehler werden als lesbare Meldung zurückgegeben
function handler(fn, { open } = {}) {
  return async (req, res) => {
    try {
      if (!open && !auth.isAuthed(req)) return send(res, 401, { fehler: 'Bitte anmelden.' });
      if (req.method !== 'GET' && req.method !== 'HEAD' && !open) {
        const origin = req.headers.origin, host = req.headers['x-forwarded-host'] || req.headers.host;
        if (origin && host && new URL(origin).host !== host) return send(res, 403, { fehler: 'Fremder Ursprung.' });
      }
      await fn(req, res);
    } catch (e) {
      console.error(e);
      send(res, 500, { fehler: e && e.message ? e.message : 'Unbekannter Fehler' });
    }
  };
}

const query = (req) => new URL(req.url, 'http://x').searchParams;
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d\d-\d\d$/.test(s) && !isNaN(Date.parse(s));

module.exports = { send, body, handler, query, isDate };
