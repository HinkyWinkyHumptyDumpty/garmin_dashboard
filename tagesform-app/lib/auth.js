// Passwortschutz: ein Passwort (APP_PASSWORD), danach ein signiertes Cookie für 180 Tage.
const crypto = require('crypto');

const DAYS = 180;
const secret = () => process.env.AUTH_SECRET || process.env.APP_PASSWORD || '';
const sign = (exp) => crypto.createHmac('sha256', secret()).update('tagesform|' + exp).digest('base64url');

function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }

module.exports = {
  checkPassword(pw) { return !!process.env.APP_PASSWORD && same(pw || '', process.env.APP_PASSWORD); },
  sessionCookie() {
    const exp = Date.now() + DAYS * 864e5;
    return 'tf_session=' + exp + '.' + sign(exp) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + DAYS * 86400;
  },
  clearCookie() { return 'tf_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'; },
  isAuthed(req) {
    if (!secret()) return false;
    const c = cookies(req).tf_session || '';
    const [exp, sig] = c.split('.');
    return !!exp && +exp > Date.now() && !!sig && same(sig, sign(exp));
  },
  isCron(req) { return !!process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET; },
};
