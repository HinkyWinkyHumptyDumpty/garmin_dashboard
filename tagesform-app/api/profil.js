// Profilwerte ändern (POST {feld: wert}); nur freigegebene Felder in sinnvollen Grenzen
const store = require('../lib/store');
const { DEFAULT_PROFIL, EDITIERBAR } = require('../lib/profil');
const { send, body, handler } = require('../lib/http');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const b = await body(req), cur = (await store.get('profil')) || {};
  for (const [k, v] of Object.entries(b)) {
    if (k === 'zuruecksetzen' && v === true) { await store.set('profil', {}); return send(res, 200, { ok: true, profil: DEFAULT_PROFIL }); }
    const lim = EDITIERBAR[k];
    if (!lim) return send(res, 400, { fehler: 'Feld nicht änderbar: ' + k });
    const n = +v;
    if (!isFinite(n) || n < lim[0] || n > lim[1]) return send(res, 400, { fehler: 'Wert außerhalb des Bereichs ' + lim[0] + '–' + lim[1] + ': ' + k });
    cur[k] = n;
  }
  const merged = Object.assign({}, DEFAULT_PROFIL, cur);
  if (merged.rad_if_min >= merged.rad_if_max) return send(res, 400, { fehler: 'Der Korridor braucht eine Untergrenze unter der Obergrenze.' });
  if (merged.vt1_hf >= merged.vt2_hf) return send(res, 400, { fehler: 'VT1 muss unter VT2 liegen.' });
  await store.set('profil', cur);
  send(res, 200, { ok: true, profil: merged });
});
