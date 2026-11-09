// Garmin-Daten holen.
// Knopf in der App (POST): für den angemeldeten Nutzer, kurzes Zeitbudget, der Rest folgt beim nächsten Aufruf.
// Vercel Cron (GET mit CRON_SECRET): für alle Konten mit Garmin-Schlüssel, je vier gleichzeitig (jeder Schlüssel hat sein
// eigenes Garmin-Limit), danach Morgen-Push. Konten, die die App 30 Tage nicht geöffnet haben, ruhen bis zum nächsten Öffnen.
const auth = require('../lib/auth');
const store = require('../lib/store');
const nutzer = require('../lib/nutzer');
const garmin = require('../lib/garmin');
const push = require('../lib/push');
const { send, body, handler } = require('../lib/http');

// Version 28: Protokoll der letzten 20 Abrufe – wann, woher, Ergebnis, Dauer, Fehler in Klartext (für „Garmin & Daten“)
async function protokoll(db, e) {
  try { const L = (await db.get('data:protokoll')) || []; await db.set('data:protokoll', [e].concat(Array.isArray(L) ? L : []).slice(0, 20)); } catch (x) { /* Protokoll ist nur Beiwerk */ }
}

// Ein Abruf für einen Nutzer, mit Sperre gegen doppelte Läufe
async function abruf(n, db, opt) {
  const schluessel = nutzer.garminLesen(n);
  if (!schluessel) return { fehler: n.garmin ? 'Der gespeicherte Garmin-Schlüssel ist nicht mehr lesbar – bitte unter Profil → Konto neu eintragen.' : 'Noch kein Garmin-Schlüssel – bitte unter Profil → Konto eintragen.', code: 'garmin_fehlt' };
  if (!(await db.lock('lock:refresh', 280))) return { besetzt: true };
  const t0 = Date.now(), quelle = opt.quelle || 'app';
  try {
    const stand = await garmin.refresh({ db, schluessel, full: !!opt.voll, budgetMs: opt.budgetMs });
    await db.del('data:fehler');
    await protokoll(db, { at: new Date().toISOString(), quelle, ok: true, voll: !!stand.voll, s: Math.round((Date.now() - t0) / 1000), tage: stand.tage, einheiten: stand.einheiten, bis: stand.bis, offen: stand.offen || 0, wiederholt: stand.wiederholt || 0, zeitueber: stand.zeitueber || 0 });
    return { stand };
  } catch (e) {
    console.error('Abruf', n.uid, e.message);
    const text = /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(e.message || '') ? 'Garmin ist gerade nicht erreichbar – deine Daten bleiben, wie sie sind. Später noch einmal versuchen.' : e.message; // Version 23: Netzfehler verständlich statt „fetch failed“
    try { await db.set('data:fehler', { at: new Date().toISOString(), text }); } catch (x) { /* Speicher selbst nicht erreichbar */ }
    await protokoll(db, { at: new Date().toISOString(), quelle, ok: false, s: Math.round((Date.now() - t0) / 1000), fehler: String(text || '').slice(0, 200), code: e.code || null });
    return { fehler: text, code: e.code };
  } finally {
    await db.del('lock:refresh');
  }
}

const RUHE_TAGE = 30;

async function cron(res) {
  const t0 = Date.now(), ende = t0 + 270e3;
  const uids = await nutzer.alle();
  const runde = uids.length ? ((await store.incr('cron:runde', 400 * 86400)) || 0) % uids.length : 0; // reihum zuerst dran, falls die Zeit knapp wird
  const reihe = uids.slice(runde).concat(uids.slice(0, runde)), ergebnis = {};
  let i = 0;
  await Promise.all([0, 1, 2, 3].map(async () => {
    while (i < reihe.length) {
      const uid = reihe[i++], rest = ende - Date.now();
      if (rest < 40e3) { ergebnis[uid] = 'keine Zeit mehr'; continue; }
      const n = await nutzer.laden(uid);
      if (!n) { ergebnis[uid] = 'unbekannt'; continue; }
      const db = store.fuer(uid), aktiv = await db.get('aktiv'); // zuletzt in der App (fehlt bei älteren Konten → gilt als aktiv)
      if (aktiv && Date.now() - aktiv > RUHE_TAGE * 864e5) { ergebnis[uid] = 'ruht (App seit über ' + RUHE_TAGE + ' Tagen nicht geöffnet)'; continue; }
      const versuch = async (fn) => { try { return await fn(); } catch (e) { return { fehler: e.message }; } };
      if (!n.garmin) { ergebnis[uid] = { ohne: 'Garmin', woche: await versuch(() => push.woche(db)), abend: await versuch(() => push.abend(db)) }; continue; } // ohne Garmin: Wochenrückblick und Abend-Erinnerung
      const r = await abruf(n, db, { budgetMs: Math.min(150e3, rest - 30e3), quelle: 'auto' });
      let morgen = null, mat = null;
      if (r.stand) { morgen = await versuch(() => push.morgen(db, r.stand)); mat = await versuch(() => push.material(db)); }
      const woche = await versuch(() => push.woche(db)), abend = await versuch(() => push.abend(db)); // Version 24: Abend-Erinnerung (Körper-Check)
      ergebnis[uid] = r.stand ? { tage: r.stand.tage, offen: r.stand.offen, push: morgen, material: mat, woche, abend } : Object.assign({}, r, { woche, abend });
    }
  }));
  send(res, 200, { ok: true, konten: uids.length, sekunden: Math.round((Date.now() - t0) / 1000), ergebnis });
}

const app = handler(async (req, res, ctx) => {
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req);
  const r = await abruf(ctx.nutzer, ctx.db, { voll: !!b.voll, budgetMs: 35e3, quelle: 'app' }); // Browser: unter einer Minute antworten
  if (r.besetzt) return send(res, 409, { fehler: 'Die Aktualisierung läuft schon – gleich noch einmal laden.' });
  if (r.fehler) { // Version 28: das Protokoll gleich mitschicken – „Garmin & Daten“ zeigt den Fehlschlag sofort
    const prot = await ctx.db.get('data:protokoll').catch(() => null);
    return send(res, r.code === 'garmin_fehlt' || r.code === 'garmin_abgelehnt' ? 409 : 502, { fehler: r.fehler, code: r.code || null, protokoll: Array.isArray(prot) ? prot.slice(0, 20) : undefined });
  }
  send(res, 200, { ok: true, stand: r.stand });
});

module.exports = async (req, res) => {
  if (auth.isCron(req)) {
    try { return await cron(res); } catch (e) { console.error(e); return send(res, 500, { fehler: e.message }); }
  }
  return app(req, res);
};
