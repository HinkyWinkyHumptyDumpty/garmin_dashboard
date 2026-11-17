/* Dreiklang · Service Worker
   1. Schneller Start und offline: Die App-Dateien kommen sofort aus dem Speicher des Geräts und werden im
      Hintergrund mit dem Server abgeglichen. Hat sich etwas geändert, werden alle Dateien gemeinsam ersetzt
      und die App bietet „Neu laden“ an. Daten (/api) laufen nie über diesen Speicher.
   2. Push: zeigt die Morgen-Mitteilung und öffnet beim Antippen die passende Seite.
   3. Version 13: Hintergrund-Sync – was ohne Netz gespeichert wurde (IndexedDB „tagesform“, Warteschlange), sendet der
      Browser nach, sobald wieder Netz da ist (nur, wo er es kann; sonst die App beim nächsten Öffnen). Gesendet wird nur,
      was zum gerade angemeldeten Konto gehört.
   4. Version 60: Neue Versionen landen in einem eigenen Speicher („tagesform-app-<Zeit>“). Erst wenn alle Dateien darin
      liegen, zeigt ein Zeiger (Speicher „tagesform-meta“) auf ihn – vorher gilt weiter der alte, vollständige Stand.
      Bis Version 59 wurde ein einziger Speicher Datei für Datei überschrieben; beendete das iPhone den Service Worker
      mittendrin, lief die App mit der neuen Seite und dem alten Stylesheet und Code (Leiste unten mit sieben Knöpfen). */
'use strict';
const BASIS = 'tagesform-app', META = 'tagesform-meta';
const FILES = ['index.html', 'styles.css', 'frueh.js', 'shim.js', 'calcs.js', 'app.js', 'seiten.js', 'wissen.js', 'hubs.js', 'plan.js', 'gym.js', 'flow.js', 'spiel-motor.js', 'spiel.js', 'gesund.js', 'alltag-motor.js', 'alltag.js', 'einblick.js', 'timer.js', 'leistung.js', 'rueckblick.js', 'tageslauf.js', 'experimente.js', 'steuerung.js', 'tutorial.js', 'tour.js', 'beispiel.js', 'rennen-daten.js', 'rennen.js', 'faden.js', 'bibliothek.js', 'quellen-daten.js', 'quellen.js', 'regeneration.js', 'einheit.js', 'buch.js', 'teilen.js', 'bedienung.js', 'start.js', 'vendor/d3.min.js', 'vendor/topojson-client.min.js', 'vendor/welt.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg', 'fonts/plus-jakarta-sans-latin-wght-normal.woff2', 'fonts/plus-jakarta-sans-latin-ext-wght-normal.woff2', 'fonts/jetbrains-mono-latin-wght-normal.woff2'];
const abs = (f) => new URL(f, self.registration.scope).href;
const ALLE = new Set(FILES.map(abs));
const ZEIGER = () => abs('__dreiklang-speicher');

// Welcher Speicher gilt? Jedes Mal den Zeiger lesen – so folgt auch ein älterer, noch laufender Service Worker dem
// neuesten vollständigen Stand. Bis Version 59 gab es nur „tagesform-app“ – den nehmen, bis der erste neue fertig ist.
let aktivName = null; // zuletzt gelesen – falls der Speicher einmal nicht antwortet
async function aktiv() {
  try { const r = await (await caches.open(META)).match(ZEIGER()); if (r) aktivName = await r.text(); } catch (e) { /* noch kein Zeiger */ }
  if (!aktivName && (await caches.has(BASIS))) aktivName = BASIS;
  return aktivName; // null: noch nichts gespeichert
}
async function aktivSpeicher() { const a = await aktiv(); return a ? caches.open(a) : null; }
const zeitVon = (k) => (k === BASIS ? 0 : +k.slice(BASIS.length + 1) || 0);
// Alle Dateien in einen neuen Speicher – erst wenn alle drin sind, zeigt der Zeiger auf ihn (nie halb alt, halb neu)
async function neuerSpeicher(neu) {
  const name = BASIS + '-' + Date.now(), c = await caches.open(name);
  for (const [f, r] of neu) await c.put(abs(f), r);
  await (await caches.open(META)).put(ZEIGER(), new Response(name, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
  aktivName = name;
  return name;
}
// Ältere Speicher löschen – neuere bleiben (die füllt vielleicht gerade ein anderer Service Worker)
async function aufraeumen() {
  const a = await aktiv(); if (!a) return;
  for (const k of await caches.keys()) {
    if (k === a || k === META) continue;
    if (k !== BASIS && !k.startsWith(BASIS + '-')) { await caches.delete(k); continue; } // fremde Namen aus frühen Versionen
    if (zeitVon(k) < zeitVon(a)) await caches.delete(k);
  }
}

// Jede Datei sofort vollständig lesen: Offene, ungelesene Antworten würden die Verbindungen des Browsers
// blockieren, bis die übrigen Dateien nie mehr ankommen.
async function holen(f) {
  const r = await fetch(abs(f), { cache: 'no-cache' });
  if (!r.ok) throw new Error(f + ': HTTP ' + r.status);
  return new Response(await r.arrayBuffer(), { status: r.status, statusText: r.statusText, headers: r.headers });
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const neu = await Promise.all(FILES.map(async (f) => [f, await holen(f)]));
    await neuerSpeicher(neu);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await aufraeumen();
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
      const c = await aktivSpeicher(), neu = await Promise.all(FILES.map(async (f) => [f, await holen(f)])); // fehlt eine Datei: Abbruch, der alte Stand bleibt
      let anders = !c;
      if (c) for (const [f, r] of neu) {
        const alt = await c.match(abs(f));
        if (!alt || !(await gleich(alt, r.clone()))) { anders = true; break; }
      }
      if (!anders) return;
      await neuerSpeicher(neu);
      await aufraeumen();
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
      const c = await aktivSpeicher(), hit = c ? await c.match(abs('index.html')) : null;
      if (hit) { e.waitUntil(abgleich()); return hit; }
      try { return await fetch(req); } catch (x) { return new Response('Dreiklang ist offline und noch nicht auf diesem Gerät gespeichert.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    })());
    return;
  }
  const key = u.origin + u.pathname;
  if (!ALLE.has(key)) return;
  e.respondWith((async () => {
    const c = await aktivSpeicher(), hit = c ? await c.match(key) : null;
    return hit || fetch(req); // fehlt sie im Speicher: vom Server holen, aber nicht einzeln hineinlegen – sonst mischen sich Versionen
  })());
});

/* ---------- Push ---------- */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Dreiklang', {
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

/* ---------- Version 13: Hintergrund-Sync der Warteschlange ---------- */
function idb() {
  return new Promise((ok) => {
    try {
      const r = indexedDB.open('tagesform', 1);
      r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('warteschlange')) db.createObjectStore('warteschlange', { keyPath: 'id', autoIncrement: true }); };
      r.onsuccess = () => ok(r.result); r.onerror = () => ok(null);
    } catch (e) { ok(null); }
  });
}
const idbAlle = (db) => new Promise((ok) => { const r = db.transaction('warteschlange').objectStore('warteschlange').getAll(); r.onsuccess = () => ok(r.result || []); r.onerror = () => ok([]); });
const idbWeg = (db, id) => new Promise((ok) => { const tx = db.transaction('warteschlange', 'readwrite'); tx.objectStore('warteschlange').delete(id); tx.oncomplete = () => ok(); tx.onerror = () => ok(); });
async function nachsenden() {
  const db = await idb(); if (!db) return;
  const st = await fetch(abs('api/login'), { credentials: 'same-origin', cache: 'no-store' }).then((r) => r.json()).catch(() => null);
  if (!st || !st.angemeldet || !st.uid) return; // nicht angemeldet: die App sendet nach dem Anmelden
  const L = (await idbAlle(db)).filter((x) => x.uid === st.uid).sort((a, b) => a.id - b.id);
  let n = 0;
  for (const x of L) {
    const r = await fetch(abs(x.url.replace(/^\//, '')), { method: x.method, credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x.body) });
    if (r.status === 401) return;
    if (r.status === 429 || r.status >= 500) throw new Error('später noch einmal');
    await idbWeg(db, x.id); n++;
  }
  if (n) (await self.clients.matchAll({ type: 'window' })).forEach((c) => c.postMessage({ typ: 'nachgesendet', n }));
}
self.addEventListener('sync', (e) => { if (e.tag === 'tf-nachsenden') e.waitUntil(nachsenden()); });
