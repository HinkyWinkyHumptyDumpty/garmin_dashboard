// Lokaler Testserver: liefert public/ aus und leitet /api/* an die Vercel-Funktionen weiter.
// Speicher: JSON-Datei (TF_DEV_STORE), sonst Upstash, wenn KV_REST_API_URL gesetzt ist.
// usage: APP_PASSWORD=test GARMIN_API_KEY=… TF_DEV_STORE=data/dev-store.json node scripts/dev-server.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = +process.argv[2] || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
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
}).listen(PORT, () => console.log('Tagesform läuft auf http://localhost:' + PORT));
