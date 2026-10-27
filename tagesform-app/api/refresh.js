// Garmin-Daten holen.
// Knopf in der App (POST): für den angemeldeten Nutzer, kurzes Zeitbudget, der Rest folgt beim nächsten Aufruf.
// Vercel Cron (GET mit CRON_SECRET): für alle Konten mit Garmin-Schlüssel, je zwei gleichzeitig, danach Morgen-Push.
const auth = require('../lib/auth');
const store = require('../lib/store');
const nutzer = require('../lib/nutzer');
const garmin = require('../lib/garmin');
const push = require('../lib/push');
const { send, body, handler } = require('../lib/http');

// Ein Abruf für einen Nutzer, mit Sperre gegen doppelte Läufe
async function abruf(n, db, opt) {
  const schluessel = nutzer.garminLesen(n);
  if (!schluessel) return { fehler: n.garmin ? 'Der gespeicherte Garmin-Schlüssel ist nicht mehr lesbar – bitte unter Profil → Konto neu eintragen.' : 'Noch kein Garmin-Schlüssel – bitte unter Profil → Konto eintragen.', code: 'garmin_fehlt' };
  if (!(await db.lock('lock:refresh', 280))) return { besetzt: true };
  try {
    const stand = await garmin.refresh({ db, schluessel, full: !!opt.voll, budgetMs: opt.budgetMs });
    await db.del('data:fehler');
    return { stand };
  } catch (e) {
    console.error('Abruf', n.uid, e.message);
    try { await db.set('data:fehler', { at: new Date().toISOString(), text: e.message }); } catch (x) { /* Speicher selbst nicht erreichbar */ }
    return { fehler: e.message, code: e.code };
  } finally {
    await db.del('lock:refresh');
  }
}

async function cron(res) {
  const t0 = Date.now(), ende = t0 + 270e3;
  const uids = await nutzer.alle();
  const runde = uids.length ? ((await store.incr('cron:runde', 400 * 86400)) || 0) % uids.length : 0; // reihum zuerst dran, falls die Zeit knapp wird
  const reihe = uids.slice(runde).concat(uids.slice(0, runde)), ergebnis = {};
  let i = 0;
  await Promise.all([0, 1].map(async () => {
    while (i < reihe.length) {
      const uid = reihe[i++], rest = ende - Date.now();
      if (rest < 40e3) { ergebnis[uid] = 'keine Zeit mehr'; continue; }
      const n = await nutzer.laden(uid);
      if (!n || !n.garmin) { ergebnis[uid] = 'ohne Garmin'; continue; }
      const db = store.fuer(uid), r = await abruf(n, db, { budgetMs: Math.min(150e3, rest - 30e3) });
      let morgen = null;
      if (r.stand) { try { morgen = await push.morgen(db, r.stand); } catch (e) { morgen = { fehler: e.message }; } }
      ergebnis[uid] = r.stand ? { tage: r.stand.tage, offen: r.stand.offen, push: morgen } : r;
    }
  }));
  send(res, 200, { ok: true, konten: uids.length, sekunden: Math.round((Date.now() - t0) / 1000), ergebnis });
}

const app = handler(async (req, res, ctx) => {
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req);
  const r = await abruf(ctx.nutzer, ctx.db, { voll: !!b.voll, budgetMs: 35e3 }); // Browser: unter einer Minute antworten
  if (r.besetzt) return send(res, 409, { fehler: 'Die Aktualisierung läuft schon – gleich noch einmal laden.' });
  if (r.fehler) return send(res, r.code === 'garmin_fehlt' || r.code === 'garmin_abgelehnt' ? 409 : 502, { fehler: r.fehler, code: r.code || null });
  send(res, 200, { ok: true, stand: r.stand });
});

module.exports = async (req, res) => {
  if (auth.isCron(req)) {
    try { return await cron(res); } catch (e) { console.error(e); return send(res, 500, { fehler: e.message }); }
  }
  return app(req, res);
};
