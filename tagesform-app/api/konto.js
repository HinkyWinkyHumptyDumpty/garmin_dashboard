// Eigenes Konto verwalten.
// GET → Übersicht · GET ?export=1 → alle eigenen Daten als JSON-Datei (Auskunft und Datenübertragbarkeit, Art. 15 und 20 DSGVO)
// · POST { aktion: 'garmin', schluessel } prüft und speichert den Garmin-Schlüssel (leer = entfernen)
// · { aktion: 'passwort', alt, neu } · { aktion: 'notfallcode', passwort } · { aktion: 'loeschen', passwort } löscht Konto und alle Daten
// · POST ?kalender=1 (Formular, Feld ics) → die Kalenderdatei als text/calendar zurück (Version 12, nichts wird gespeichert)
// Version 59 – Coach: GET ?coach=1 → Coaches, offene Einladungen, Athleten · POST { aktion: 'rolle', rolle: 'athlet' | 'coach' }
// · Athlet: 'coach_einladen' { rechte }, 'coach_einladung_weg' { id }, 'coach_rechte' { coach, rechte }, 'coach_entfernen' { coach },
//   'tipp_gelesen' { id | alle: true }, 'tipp_antwort' { id, text }, 'tipp_loeschen' { id }
// · Coach: 'coach_beitreten' { code, versprechen: true }, 'athlet_entfernen' { athlet }, 'tipp' { athlet, art, text, bezug },
//   'tipp_weg' { athlet, id }, 'antworten_gesehen' { athlet }, 'coach_name' { name } (so sehen ihn seine Athleten; leer = E-Mail)
const auth = require('../lib/auth');
const nutzer = require('../lib/nutzer');
const garmin = require('../lib/garmin');
const { laden } = require('../lib/daten');
const push = require('../lib/push');
const store = require('../lib/store');
const { send, body, handler, query, ip } = require('../lib/http');

async function export_(ctx) {
  const n = ctx.nutzer, d = await laden(ctx.db), ds = Object.assign({}, d.datasets);
  delete ds.methoden; delete ds.athlet; // Beschreibungstexte der App und daraus Berechnetes, keine gespeicherten Daten
  const [profil, analysen, serien, push, kal] = await Promise.all([ctx.db.get('profil'), ctx.db.hgetall('analyse'), ctx.db.hgetall('serie'), ctx.db.hgetall('push:abos'), ctx.db.get('kalender')]);
  return {
    hinweis: 'Alle Daten, die Dreiklang zu deinem Konto gespeichert hat. Passwort, Notfall-Code und Garmin-Zugang stehen nur als Prüf- bzw. verschlüsselter Wert in der Datenbank und sind hier nicht enthalten.',
    exportiert_am: new Date().toISOString(),
    konto: { email: n.email, angelegt: n.angelegt, einwilligung: n.einwilligung || null, garmin_verbunden: !!n.garmin, garmin_seit: n.garmin_seit || null },
    profil: profil || null, profilbild: d.avatar || null, rechner: d.rechner, stand: d.stand,
    daten: Object.assign(ds, { analysen: Object.values(analysen), einheiten_verlauf: serien }),
    mitteilungen: Object.values(push || {}).map((a) => ({ geraet: a.geraet || 'Gerät', seit: a.seit || a.at || null })),
    kalender_abo: kal ? { stand: kal.stand, termine: kal.n, hinweis: 'Kalenderdatei des Abos (Version 21); der Abo-Link steht in der App unter Plan → In Kalender.' } : null,
    coach: await (async () => { // Version 59: Coaches mit Freigaben, offene Einladungen, eigene Athleten, Tipps vom Coach
      const u = await nutzer.coachUebersicht(n);
      return { rolle: u.rolle, meine_coaches: u.coaches, offene_einladungen: u.einladungen, meine_athleten: u.athleten.map((a) => ({ name: a.name, seit: a.seit, rechte: a.rechte })), tipps_erhalten: await nutzer.tippsFuer(n.uid) };
    })(),
  };
}

// Version 12: Formularfeld lesen (application/x-www-form-urlencoded) – für den Kalender-Export vom iPhone
async function formFeld(req, feld) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body[feld];
  let raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
  if (!raw) { const teile = []; let n = 0; for await (const c of req) { teile.push(c); n += c.length; if (n > 600000) break; } raw = Buffer.concat(teile).toString('utf8'); }
  return new URLSearchParams(raw).get(feld);
}

/* Version 59: Coach – Einladen, Freigaben, Beitreten, Tipps. Mitteilungen gehen nur an Geräte, auf denen Mitteilungen
   eingeschaltet sind, und nennen keinen Inhalt (der steht erst in der App, hinter der Anmeldung). */
const zuViel = (text) => Object.assign(new Error(text), { status: 429, code: 'zu_viele' });
async function mitteilen(uid, m) { try { await push.anAlle(store.fuer(uid), m); } catch (e) { console.error('Coach-Mitteilung', e.message); } }
const COACH = {
  async rolle(n, b) { return { ok: true, rolle: await nutzer.rolleSetzen(n, b.rolle) }; },
  async coach_name(n, b) { return { ok: true, name: await nutzer.coachNameSetzen(n, b.name) }; }, // so sehen ihn seine Athleten
  async coach_einladen(n, b) {
    if ((await store.fuer(n.uid).incr('coach:einladen', 3600)) > 20) throw zuViel('Zu viele Einladungen in kurzer Zeit – bitte in einer Stunde noch einmal.');
    const e = await nutzer.coachEinladen(n, b.rechte);
    return { ok: true, einladung: { id: e.id, code: e.code, bis: new Date(e.bis).toISOString(), rechte: e.rechte } };
  },
  async coach_einladung_weg(n, b) { return { ok: await nutzer.coachEinladungWeg(n, b.id) }; },
  async coach_rechte(n, b) {
    const c = await nutzer.coachRechte(n, String(b.coach || ''), b.rechte);
    if (!c) throw Object.assign(new Error('Diesen Coach gibt es in deinem Konto nicht mehr.'), { status: 404 });
    return { ok: true, rechte: c.rechte };
  },
  async coach_entfernen(n, b) { return { ok: await nutzer.coachTrennen(n.uid, String(b.coach || '')) }; },
  async coach_beitreten(n, b, req) {
    if (b.versprechen !== true) throw Object.assign(new Error('Bitte bestätige, dass du die Daten nur für das Coaching nutzt und nicht weitergibst.'), { code: 'versprechen' });
    if ((await store.fuer(n.uid).incr('coach:versuche', 900)) > 8 || (await store.incr('coach:ip:' + ip(req), 900)) > 20) throw zuViel('Zu viele Versuche – bitte in 15 Minuten noch einmal.');
    const r = await nutzer.coachEinloesen(n, String(b.code || ''));
    await store.fuer(n.uid).del('coach:versuche');
    return { ok: true, athlet: r.athlet, name: r.name };
  },
  async athlet_entfernen(n, b) { return { ok: await nutzer.coachTrennen(String(b.athlet || ''), n.uid) }; },
  async tipp(n, b) {
    const athlet = String(b.athlet || ''), t = await nutzer.tippSchreiben(n, athlet, b);
    await mitteilen(athlet, { title: 'Neuer Tipp von ' + t.von_name, body: 'Dein Coach hat dir etwas geschickt – tippe zum Lesen.', url: './#heute', tag: 'coach' });
    return { ok: true, tipp: t };
  },
  async tipp_weg(n, b) { return { ok: await nutzer.tippWeg(n, String(b.athlet || ''), b.id) }; },
  async antworten_gesehen(n, b) { return { ok: true, n: await nutzer.antwortenGesehen(n, String(b.athlet || '')) }; },
  async tipp_gelesen(n, b) { return { ok: true, n: await nutzer.tippGelesen(n, b.alle === true ? true : String(b.id || '')) }; },
  async tipp_antwort(n, b) {
    const t = await nutzer.tippAntwort(n, b.id, b.text);
    if (await nutzer.coachZugriff(t.von, n.uid)) await mitteilen(t.von, { title: (await nutzer.nameVon(n)) + ' hat geantwortet', body: 'Tippe zum Lesen.', url: './#tipps', tag: 'coach' });
    return { ok: true, tipp: t };
  },
  async tipp_loeschen(n, b) { return { ok: await nutzer.tippLoeschen(n, b.id) }; },
};

module.exports = handler(async (req, res, ctx) => {
  // Version 12: POST ?kalender=1 { ics } → dieselbe Kalenderdatei als text/calendar zurück, damit iOS „Alle hinzufügen“ zeigt.
  // Ohne Anmeldung erreichbar, weil iOS das Formular aus der Home-Bildschirm-App in einem eigenen Browserfenster ohne die
  // Sitzung der App öffnet. Fremde Seiten blockt die Ursprungsprüfung (nur Formulare von Dreiklang selbst); nichts wird
  // gespeichert, und es kommt nur zurück, was eine kleine, gültige Kalenderdatei ohne HTML ist.
  if (req.method === 'POST' && query(req).get('kalender')) {
    const t = String((await formFeld(req, 'ics')) || '');
    if (t.length < 60 || t.length > 400000 || !/^BEGIN:VCALENDAR\r?\n/.test(t) || !/\r?\nEND:VCALENDAR\s*$/.test(t) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(t) || /<\s*\/?\s*(script|html|body|iframe)/i.test(t)) return send(res, 400, { fehler: 'Das ist keine gültige Kalenderdatei.' }); // eslint-disable-line no-control-regex -- Steuerzeichen absichtlich prüfen
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="dreiklang-training.ics"');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.end(t);
  }
  if (!ctx) return send(res, 401, { fehler: 'Bitte anmelden.' }, { 'Set-Cookie': auth.clearCookie() });
  const n = ctx.nutzer;
  if (req.method === 'GET' && query(req).get('export')) {
    return send(res, 200, await export_(ctx), { 'Content-Disposition': 'attachment; filename="dreiklang-daten-' + new Date().toISOString().slice(0, 10) + '.json"' });
  }
  if (req.method === 'GET' && query(req).get('coach')) return send(res, 200, await nutzer.coachUebersicht(n)); // Version 59
  if (req.method === 'GET') return send(res, 200, { email: n.email, angelegt: n.angelegt, garmin: !!n.garmin, garmin_lesbar: !!nutzer.garminLesen(n), garmin_seit: n.garmin_seit, rolle: n.rolle || 'athlet' });
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req);

  if (b.aktion === 'garmin') {
    const s = String(b.schluessel || '').trim();
    if (!s) { await nutzer.garminSetzen(n, null); await ctx.db.del('garmin:token'); return send(res, 200, { ok: true, garmin: false }); }
    if (s.length < 20 || s.length > 600 || /\s/.test(s)) return send(res, 400, { fehler: 'Das sieht nicht nach einem Garmin-API-Schlüssel aus – bitte vollständig kopieren (er beginnt meist mit „GCDC_“).' });
    if (((await ctx.db.incr('garmin:pruefungen', 600)) || 0) > 8) return send(res, 429, { fehler: 'Zu viele Versuche – bitte in 10 Minuten noch einmal.' });
    try { await garmin.pruefeSchluessel(s); } catch (e) { return send(res, e.code ? 400 : 502, { fehler: e.message }); }
    await nutzer.garminSetzen(n, s);
    await ctx.db.del('garmin:token');
    return send(res, 200, { ok: true, garmin: true, garmin_seit: n.garmin_seit });
  }

  if (b.aktion === 'passwort') {
    try { const m = await nutzer.passwortAendern(n, String(b.alt || ''), String(b.neu || '')); return send(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie(m) }); }
    catch (e) { return send(res, 400, { fehler: e.message }); }
  }

  if (b.aktion === 'notfallcode') {
    if (!(await nutzer.passt(String(b.passwort || ''), n.pw))) return send(res, 403, { fehler: 'Das Passwort stimmt nicht.' }); // 403, nicht 401: die Sitzung selbst ist gültig
    return send(res, 200, { ok: true, notfallcode: await nutzer.neuerNotfallcode(n) });
  }

  // Version 59: Coach und Athlet
  if (COACH[b.aktion]) {
    try { return send(res, 200, await COACH[b.aktion](n, b, req)); }
    catch (e) { return send(res, e.status || (e.code === 'kein_zugriff' ? 403 : e.code === 'zu_viele' ? 429 : 400), { fehler: e.message, code: e.code || null }); }
  }

  if (b.aktion === 'loeschen') {
    if (!(await nutzer.passt(String(b.passwort || ''), n.pw))) return send(res, 403, { fehler: 'Das Passwort stimmt nicht.' }); // 403, nicht 401: die Sitzung selbst ist gültig
    const anzahl = await nutzer.loeschen(n);
    return send(res, 200, { ok: true, geloescht: anzahl }, { 'Set-Cookie': auth.clearCookie() });
  }

  send(res, 400, { fehler: 'Unbekannte Aktion.' });
}, { open: true }); // Version 12: Anmeldung wird oben selbst geprüft (außer für das Kalender-Echo)
