// Speicher: Upstash Redis über die REST-Schnittstelle (keine Pakete nötig).
// Lokal ohne Redis-Variablen: JSON-Datei (nur für Tests, TF_DEV_STORE=Pfad).
// store.fuer(uid) liefert denselben Speicher mit eigenem Bereich je Nutzer (Schlüssel „u:<uid>:…“).
const fs = require('fs');

const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const DEV = !URL && process.env.TF_DEV_STORE;

async function cmd(args) {
  if (!URL || !TOKEN) throw new Error('Kein Speicher verbunden: In Vercel unter „Storage“ eine Upstash-Redis-Datenbank mit dem Projekt verbinden und neu deployen.');
  const r = await fetch(URL, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error('Speicherfehler: ' + (j.error || 'HTTP ' + r.status));
  return j.result;
}
const dec = (v) => (v == null ? null : JSON.parse(v));

// Test-Speicher: { key: { v, exp } }
function devRead() { try { return JSON.parse(fs.readFileSync(DEV, 'utf8')); } catch (e) { return {}; } }
function devWrite(o) { fs.writeFileSync(DEV, JSON.stringify(o)); }
function devGet(o, key) { const e = o[key]; if (!e) return null; if (e.exp && e.exp < Date.now()) { delete o[key]; return null; } return e.v; }

const roh = {
  connected: () => !!(URL && TOKEN) || !!DEV,
  async get(key) {
    if (DEV) return devGet(devRead(), key);
    return dec(await cmd(['GET', key]));
  },
  async mget(keys) {
    if (DEV) { const o = devRead(); return keys.map((k) => devGet(o, k)); }
    return ((await cmd(['MGET', ...keys])) || []).map(dec);
  },
  async set(key, value, ttlSeconds) {
    if (DEV) { const o = devRead(); o[key] = { v: value, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 }; devWrite(o); return 'OK'; }
    const v = JSON.stringify(value);
    return ttlSeconds ? cmd(['SET', key, v, 'EX', String(Math.max(1, Math.round(ttlSeconds)))]) : cmd(['SET', key, v]);
  },
  async del(key) {
    if (DEV) { const o = devRead(); delete o[key]; devWrite(o); return 1; }
    return cmd(['DEL', key]);
  },
  // true, wenn der Schlüssel neu angelegt wurde (SET NX) – für einmalig erzeugte Werte
  async setnx(key, value) {
    if (DEV) { const o = devRead(); if (devGet(o, key) != null) return false; o[key] = { v: value, exp: 0 }; devWrite(o); return true; }
    return (await cmd(['SET', key, JSON.stringify(value), 'NX'])) === 'OK';
  },
  // true, wenn die Sperre neu gesetzt wurde (SET NX EX)
  async lock(key, ttlSeconds) {
    if (DEV) { const o = devRead(); if (devGet(o, key)) return false; o[key] = { v: 1, exp: Date.now() + ttlSeconds * 1000 }; devWrite(o); return true; }
    return (await cmd(['SET', key, '1', 'NX', 'EX', String(ttlSeconds)])) === 'OK';
  },
  async incr(key, ttlSeconds) {
    if (DEV) { const o = devRead(); const n = (devGet(o, key) || 0) + 1; o[key] = { v: n, exp: o[key] && o[key].exp > Date.now() ? o[key].exp : Date.now() + ttlSeconds * 1000 }; devWrite(o); return n; }
    const n = await cmd(['INCR', key]);
    if (n === 1) await cmd(['EXPIRE', key, String(ttlSeconds)]);
    return n;
  },
  async hset(key, field, value) {
    if (DEV) { const o = devRead(); const h = devGet(o, key) || {}; h[field] = value; o[key] = { v: h, exp: 0 }; devWrite(o); return 1; }
    return cmd(['HSET', key, field, JSON.stringify(value)]);
  },
  async hdel(key, field) {
    if (DEV) { const o = devRead(); const h = devGet(o, key) || {}; delete h[field]; o[key] = { v: h, exp: 0 }; devWrite(o); return 1; }
    return cmd(['HDEL', key, field]);
  },
  async hget(key, field) {
    if (DEV) { const h = devGet(devRead(), key) || {}; return h[field] === undefined ? null : h[field]; }
    return dec(await cmd(['HGET', key, field]));
  },
  async hgetall(key) {
    if (DEV) return devGet(devRead(), key) || {};
    const arr = (await cmd(['HGETALL', key])) || [];
    const out = {};
    for (let i = 0; i < arr.length; i += 2) out[arr[i]] = JSON.parse(arr[i + 1]);
    return out;
  },
  // Alle Schlüssel mit diesem Anfang löschen (Konto löschen); liefert die Anzahl
  async delPrefix(prefix) {
    if (!/^u:[A-Za-z0-9_-]{8,40}:$/.test(prefix)) throw new Error('Ungültiger Bereich.');
    if (DEV) { const o = devRead(); let n = 0; Object.keys(o).forEach((k) => { if (k.startsWith(prefix)) { delete o[k]; n++; } }); devWrite(o); return n; }
    let cursor = '0', n = 0;
    do {
      const [next, keys] = await cmd(['SCAN', cursor, 'MATCH', prefix + '*', 'COUNT', '200']);
      if (keys && keys.length) { await cmd(['DEL', ...keys]); n += keys.length; }
      cursor = String(next);
    } while (cursor !== '0');
    return n;
  },
};

// Bereich eines Nutzers: gleiche Befehle, Schlüssel mit Vorsilbe
function fuer(uid) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(String(uid || ''))) throw new Error('Ungültiger Nutzer.');
  const p = 'u:' + uid + ':';
  return {
    uid, praefix: p, connected: roh.connected,
    get: (k) => roh.get(p + k), mget: (ks) => roh.mget(ks.map((k) => p + k)), set: (k, v, t) => roh.set(p + k, v, t), del: (k) => roh.del(p + k),
    setnx: (k, v) => roh.setnx(p + k, v), lock: (k, t) => roh.lock(p + k, t), incr: (k, t) => roh.incr(p + k, t),
    hset: (k, f, v) => roh.hset(p + k, f, v), hdel: (k, f) => roh.hdel(p + k, f), hget: (k, f) => roh.hget(p + k, f), hgetall: (k) => roh.hgetall(p + k),
    alleLoeschen: () => roh.delPrefix(p),
  };
}

module.exports = Object.assign(roh, { fuer });
