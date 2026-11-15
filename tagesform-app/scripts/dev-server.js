// Lokaler Testserver: liefert public/ aus und leitet /api/* an die Vercel-Funktionen weiter.
// Speicher: JSON-Datei (TF_DEV_STORE), sonst Upstash, wenn KV_REST_API_URL gesetzt ist.
// usage: AUTH_SECRET=<mind. 32 zufällige Zeichen> TF_DEV_STORE=data/dev-store.json node scripts/dev-server.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = +process.argv[2] || 3000;
// Version 12: dieselben Kopfzeilen wie auf Vercel (vercel.json → headers), damit Tests sehen, was das Handy sieht
const KOPF = []; try { for (const r of (JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers || [])) if (r.source === '/(.*)') KOPF.push(...r.headers); } catch (e) { /* ohne */ }
const TYPES = { '.woff2': 'font/woff2', '.ics': 'text/calendar; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  for (const h of KOPF) res.setHeader(h.key, h.value);
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z]/g, '');
    const file = path.join(ROOT, 'api', name + '.js');
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end('{}'); }
    try { await require(file)(req, res); } catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ fehler: e.message })); }
    return;
  }
  let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  if (p === '/' || p === '\\') p = '/index.html';
  const file = path.join(ROOT, 'public', p);
  if (!file.startsWith(path.join(ROOT, 'public')) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('Nicht gefunden'); }
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('Dreiklang läuft auf http://localhost:' + PORT));
