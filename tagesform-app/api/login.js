// Konto & Anmeldung.
// GET → Status · POST { aktion: 'anmelden' | 'registrieren' | 'zuruecksetzen', … } · DELETE → abmelden
// Neue Konten: Das erste Konto ist frei. Danach nur mit EINLADUNGSCODE – oder für alle, wenn REGISTRIERUNG=offen
// und die Betreiberangaben für die Datenschutzerklärung gesetzt sind (BETREIBER_NAME, BETREIBER_KONTAKT).
// Jede Registrierung braucht die ausdrückliche Einwilligung in die Verarbeitung der Gesundheitsdaten.
const auth = require('../lib/auth');
const store = require('../lib/store');
const nutzer = require('../lib/nutzer');
const { betreiber, DATENSCHUTZ_VERSION } = require('../lib/betreiber');
const { send, body, handler, ip } = require('../lib/http');

const code = () => String(process.env.EINLADUNGSCODE || '').trim();
const offen = () => /^(offen|ja|true|1)$/i.test(String(process.env.REGISTRIERUNG || '').trim());
const proTag = () => Math.max(1, Math.min(1000, parseInt(process.env.REG_MAX_TAG, 10) || 50)); // neue Konten pro Tag, Schutz vor Massenanmeldungen
const tagKey = () => 'reg:tag:' + new Date().toISOString().slice(0, 10);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// 'code' | 'offen' | 'erstes' (noch kein Konto) | 'zu'
async function modus() {
  if (code()) return 'code';
  if (offen() && betreiber().vollstaendig) return 'offen';
  if (!store.connected()) return 'erstes';
  return (await nutzer.alle()).length ? 'zu' : 'erstes';
}
// Warum die Registrierung zu bleibt, obwohl sie offen sein soll – Hinweis für den Betreiber
const hinweis = () => (!code() && offen() && !betreiber().vollstaendig ? 'betreiber' : null);

// Zu viele Versuche pro IP bzw. E-Mail bremsen (nur mit verbundenem Speicher)
async function gebremst(schluessel, max, sek) {
  if (!store.connected()) return false;
  return ((await store.get(schluessel)) || 0) >= max ? true : (await store.incr(schluessel, sek), false);
}
// Nur zählen, was zählt: Tippfehler im Formular sollen niemanden aussperren
const voll = async (schluessel, max) => store.connected() && ((await store.get(schluessel)) || 0) >= max;
const zaehle = (schluessel, sek) => store.incr(schluessel, sek);

module.exports = handler(async (req, res, ctx) => {
  if (req.method === 'GET') {
    return send(res, 200, {
      angemeldet: !!ctx, uid: ctx ? ctx.uid : null, email: ctx ? ctx.nutzer.email : null, garmin: !!(ctx && ctx.nutzer.garmin), garmin_seit: ctx ? ctx.nutzer.garmin_seit : null,
      registrierung: await modus(), registrierung_hinweis: hinweis(), bereit: auth.bereit() && store.connected(), speicher: store.connected(), auth_secret: auth.bereit(), auth_schwach: auth.schwach(), cron_secret: String(process.env.CRON_SECRET || '').length >= 16,
      betreiber: (({ name, kontakt, anschrift }) => ({ name, kontakt, anschrift }))(betreiber()), datenschutz: DATENSCHUTZ_VERSION,
    });
  }
  if (req.method === 'DELETE') return send(res, 200, { ok: true }, { 'Set-Cookie': auth.clearCookie() });
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  if (!auth.bereit()) return send(res, 500, { fehler: auth.schwach() ? 'AUTH_SECRET in Vercel ist zu leicht zu erraten – bitte durch eine zufällige Zeichenfolge ersetzen.' : 'In Vercel fehlt noch die Variable AUTH_SECRET (mindestens 32 zufällige Zeichen).' });
  if (!store.connected()) return send(res, 500, { fehler: 'Kein Speicher verbunden – in Vercel unter „Storage“ Upstash verbinden.' });
  const b = await body(req), aktion = b.aktion || 'anmelden', wer = ip(req);

  if (aktion === 'registrieren') {
    if (await voll('reg:ip:' + wer, 6)) return send(res, 429, { fehler: 'Zu viele neue Konten oder falsche Codes von hier – bitte in einer Stunde noch einmal.' });
    if (String(b.website || '').trim()) { await zaehle('reg:ip:' + wer, 3600); await pause(400); return send(res, 400, { fehler: 'Das Konto konnte nicht angelegt werden.' }); } // unsichtbares Feld: füllen nur Roboter aus
    const m = await modus();
    if (m === 'zu') return send(res, 403, { fehler: 'Auf dieser Seite können keine neuen Konten angelegt werden. Richte dir deine eigene Kopie ein – die Anleitung steht unten.', code: 'zu' });
    if (m === 'code' && String(b.code || '').trim() !== code()) { await zaehle('reg:ip:' + wer, 3600); await pause(400); return send(res, 403, { fehler: 'Der Einladungscode stimmt nicht.' }); }
    if (b.einwilligung !== true) return send(res, 400, { fehler: 'Bitte bestätige die Einwilligung – ohne sie darf Tagesform deine Gesundheitsdaten nicht verarbeiten.', code: 'einwilligung' });
    if (m !== 'erstes' && (await voll(tagKey(), proTag()))) return send(res, 429, { fehler: 'Heute wurden hier schon sehr viele Konten angelegt – bitte morgen noch einmal.' });
    if (m === 'erstes' && !(await store.lock('reg:erstes', 30))) return send(res, 409, { fehler: 'Gerade wird schon ein Konto angelegt – bitte kurz warten und die Seite neu laden.' });
    try {
      const { nutzer: n, notfallcode } = await nutzer.anlegen(b.email, b.passwort, { einwilligung: { version: DATENSCHUTZ_VERSION, at: new Date().toISOString() } });
      await zaehle('reg:ip:' + wer, 3600);
      if (m !== 'erstes') await zaehle(tagKey(), 2 * 86400);
      return send(res, 200, { ok: true, uid: n.uid, email: n.email, notfallcode }, { 'Set-Cookie': auth.sessionCookie(n) });
    } catch (e) { if (m === 'erstes') await store.del('reg:erstes'); return send(res, 400, { fehler: e.message }); }
  }

  if (aktion === 'zuruecksetzen') {
    if (await gebremst('reset:ip:' + wer, 8, 900)) return send(res, 429, { fehler: 'Zu viele Versuche – bitte in 15 Minuten noch einmal.' });
    try {
      const r = await nutzer.zuruecksetzen(b.email, b.notfallcode, b.passwort);
      if (!r) { await pause(400); return send(res, 401, { fehler: 'E-Mail oder Notfall-Code stimmen nicht.' }); }
      return send(res, 200, { ok: true, uid: r.nutzer.uid, email: r.nutzer.email, garmin: !!r.nutzer.garmin, notfallcode: r.notfallcode }, { 'Set-Cookie': auth.sessionCookie(r.nutzer) });
    } catch (e) { return send(res, 400, { fehler: e.message }); }
  }

  // anmelden
  const mail = nutzer.normMail(b.email);
  if (await gebremst('login:ip:' + wer, 20, 900) || await gebremst('login:mail:' + mail, 8, 900)) return send(res, 429, { fehler: 'Zu viele Versuche – bitte in 15 Minuten noch einmal.' });
  const n = await nutzer.anmelden(mail, String(b.passwort || ''));
  if (!n) { await pause(400); return send(res, 401, { fehler: 'E-Mail oder Passwort stimmen nicht.' }); }
  await store.del('login:mail:' + mail);
  send(res, 200, { ok: true, uid: n.uid, email: n.email, garmin: !!n.garmin }, { 'Set-Cookie': auth.sessionCookie(n) });
}, { open: true });
