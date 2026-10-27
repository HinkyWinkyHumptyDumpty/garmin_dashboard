// Sitzung: signiertes Cookie mit Nutzer-ID, Ablauf (180 Tage) und Passwort-Version.
// Ändert sich das Passwort, sind alle älteren Sitzungen ungültig.
const crypto = require('crypto');

const DAYS = 180;
const secret = () => process.env.AUTH_SECRET || '';
const sign = (uid, exp, pwv) => crypto.createHmac('sha256', secret()).update('tagesform|' + uid + '|' + exp + '|' + pwv).digest('base64url');

function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
// AUTH_SECRET muss zufällig sein: mind. 32 Zeichen, mind. zwei Zeichenarten, mind. 12 verschiedene Zeichen
// (fängt Offensichtliches wie „123456…“ ab – aus ihm entstehen Sitzungen und der Schlüssel für die Garmin-Schlüssel)
function stark(s) {
  if (s.length < 32) return false;
  const arten = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(s)).length;
  return arten >= 2 && new Set(s).size >= 12;
}
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }

module.exports = {
  bereit: () => stark(secret()),
  schwach: () => secret().length > 0 && !stark(secret()),
  sessionCookie(n) {
    const exp = Date.now() + DAYS * 864e5, pwv = n.pwv || 1;
    return 'tf_session=' + [n.uid, exp, pwv, sign(n.uid, exp, pwv)].join('.') + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + DAYS * 86400;
  },
  clearCookie() { return 'tf_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'; },
  // { uid, pwv } bei gültiger Signatur, sonst null (ob es den Nutzer noch gibt, prüft lib/http)
  sitzung(req) {
    if (!stark(secret())) return null;
    const [uid, exp, pwv, sig] = (cookies(req).tf_session || '').split('.');
    if (!uid || !exp || !pwv || !sig || !(+exp > Date.now())) return null;
    return same(sig, sign(uid, exp, pwv)) ? { uid, pwv: +pwv } : null;
  },
  isCron(req) { const c = process.env.CRON_SECRET || ''; return c.length >= 16 && same(req.headers.authorization || '', 'Bearer ' + c); },
};
