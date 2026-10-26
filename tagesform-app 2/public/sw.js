/* Tagesform · Service Worker
   1. Schneller Start und offline: Die App-Dateien kommen sofort aus dem Speicher des Geräts und werden im
      Hintergrund mit dem Server abgeglichen. Hat sich etwas geändert, werden alle Dateien gemeinsam ersetzt
      und die App bietet „Neu laden“ an. Daten (/api) laufen nie über diesen Speicher.
   2. Push: zeigt die Morgen-Mitteilung und öffnet beim Antippen die passende Seite. */
'use strict';
const CACHE = 'tagesform-app';
const FILES = ['index.html', 'styles.css', 'shim.js', 'calcs.js', 'app.js', 'vendor/d3.min.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg'];
const abs = (f) => new URL(f, self.registration.scope).href;
const ALLE = new Set(FILES.map(abs));

// Jede Datei sofort vollständig lesen: Offene, ungelesene Antworten würden die Verbindungen des Browsers
// blockieren, bis die übrigen Dateien nie mehr ankommen.
async function holen(f) {
  const r = await fetch(abs(f), { cache: 'no-cache' });
  if (!r.ok) throw new Error(f + ': HTTP ' + r.status);
  return new Response(await r.arrayBuffer(), { status: r.status, statusText: r.statusText, headers: r.headers });
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE), neu = await Promise.all(FILES.map(async (f) => [f, await holen(f)]));
    for (const [f, r] of neu) await c.put(abs(f), r);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function gleich(a, b) {
  const ea = a.headers.get('etag'), eb = b.headers.get('etag');
  if (ea && eb) return ea === eb;
  const [x, y] = await Promise.all([a.arrayBuffer(), b.arrayBuffer()]);
  if (x.byteLength !== y.byteLength) return false;
  const u = new Uint8Array(x), v = new Uint8Array(y);
  for (let i = 0; i < u.length; i++) if (u[i] !== v[i]) return false;
  return true;
}

// Abgleich mit dem Server: höchstens alle 15 s, ersetzt nur vollständig und gemeinsam
let laeuft = null, zuletzt = 0;
function abgleich() {
  if (laeuft || Date.now() - zuletzt < 15e3) return laeuft || Promise.resolve();
  zuletzt = Date.now();
  laeuft = (async () => {
    try {
      const c = await caches.open(CACHE), neu = await Promise.all(FILES.map(async (f) => [f, await holen(f)]));
      let anders = false;
      for (const [f, r] of neu) {
        const alt = await c.match(abs(f));
        if (!alt || !(await gleich(alt, r.clone()))) { anders = true; break; }
      }
      if (!anders) return;
      for (const [f, r] of neu) await c.put(abs(f), r);
      (await self.clients.matchAll({ type: 'window' })).forEach((cl) => cl.postMessage({ typ: 'update' }));
    } catch (e) { /* offline – beim nächsten Start wieder */ } finally { laeuft = null; }
  })();
  return laeuft;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin || u.pathname.startsWith('/api/')) return; // Daten immer frisch vom Server
  const scope = new URL(self.registration.scope);
  if (req.mode === 'navigate') {
    if (u.pathname !== scope.pathname && u.pathname !== scope.pathname + 'index.html') return;
    e.respondWith((async () => {
      const hit = await (await caches.open(CACHE)).match(abs('index.html'));
      if (hit) { e.waitUntil(abgleich()); return hit; }
      try { return await fetch(req); } catch (x) { return new Response('Tagesform ist offline und noch nicht auf diesem Gerät gespeichert.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    })());
    return;
  }
  const key = u.origin + u.pathname;
  if (!ALLE.has(key)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = await c.match(key);
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok) await c.put(key, r.clone());
    return r;
  })());
});

/* ---------- Push ---------- */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Tagesform', {
    body: d.body || '', tag: d.tag || 'tagesform', lang: 'de', icon: abs('icons/icon-192.png'), badge: abs('icons/icon-192.png'), data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const ziel = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope);
  e.waitUntil((async () => {
    const offen = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of offen) {
      if (new URL(c.url).origin !== ziel.origin) continue;
      c.postMessage({ typ: 'oeffne', hash: ziel.hash });
      return c.focus();
    }
    return self.clients.openWindow(ziel.href);
  })());
});
