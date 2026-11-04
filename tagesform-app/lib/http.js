// Kleine Helfer für die API-Funktionen (ohne Abhängigkeiten).
const auth = require('./auth');
const store = require('./store');
const nutzer = require('./nutzer');

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

// Angemeldeter Nutzer der Anfrage → { uid, nutzer, db } oder null
async function kontext(req) {
  const s = auth.sitzung(req);
  if (!s || !store.connected()) return null;
  const n = await nutzer.laden(s.uid);
  if (!n || (n.pwv || 1) !== s.pwv) return null;
  return { uid: n.uid, nutzer: n, db: store.fuer(n.uid) };
}

// Schutz: nur angemeldet (open: auch ohne); fremde Ursprünge dürfen nichts ändern; Fehler als lesbare Meldung
function handler(fn, { open } = {}) {
  return async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const origin = req.headers.origin, host = req.headers['x-forwarded-host'] || req.headers.host;
        if (origin && host && new URL(origin).host !== host) return send(res, 403, { fehler: 'Fremder Ursprung.' });
      }
      const ctx = await kontext(req);
      if (!open && !ctx) return send(res, 401, { fehler: 'Bitte anmelden.' }, { 'Set-Cookie': auth.clearCookie() });
      await fn(req, res, ctx);
    } catch (e) {
      console.error(e);
      send(res, 500, { fehler: e && e.message ? e.message : 'Unbekannter Fehler' });
    }
  };
}

const query = (req) => new URL(req.url, 'http://x').searchParams;
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d\d-\d\d$/.test(s) && !isNaN(Date.parse(s));
const ip = (req) => String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'x').split(',')[0].trim();

module.exports = { send, body, handler, kontext, query, isDate, ip };
