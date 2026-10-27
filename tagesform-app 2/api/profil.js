// Profilwerte ändern (POST {feld: wert}); nur freigegebene Felder in sinnvollen Grenzen.
// { bestaetigt: true } markiert das Profil als geprüft, { zuruecksetzen: true } geht auf Standard + Vorschläge aus Garmin zurück.
const { EDITIERBAR, AUSWAHL, SPORTARTEN, profilFuer } = require('../lib/profil');
const { send, body, handler } = require('../lib/http');

async function antwort(db, eigen) {
  const [gewicht, einheiten, zonen] = await db.mget(['data:garmin_gewicht', 'data:garmin_einheiten', 'data:garmin_hf_zonen']);
  return profilFuer({ garmin_gewicht: gewicht || [], garmin_einheiten: einheiten || [], garmin_hf_zonen: zonen || [] }, eigen);
}

module.exports = handler(async (req, res, ctx) => {
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const db = ctx.db, b = await body(req), cur = (await db.get('profil')) || {};
  if (b.zuruecksetzen === true) { await db.set('profil', {}); return send(res, 200, { ok: true, profil: await antwort(db, {}) }); }
  for (const [k, v] of Object.entries(b)) {
    if (k === 'bestaetigt') continue;
    if (AUSWAHL[k]) { // feste Auswahl, null = zurück auf „keine Angabe“
      if (v !== null && !AUSWAHL[k].includes(v)) return send(res, 400, { fehler: 'Ungültige Auswahl: ' + k });
      cur[k] = v; continue;
    }
    if (k === 'sportarten') {
      if (!Array.isArray(v) || v.some((x) => !SPORTARTEN.includes(x))) return send(res, 400, { fehler: 'Ungültige Sportarten.' });
      cur.sportarten = SPORTARTEN.filter((x) => v.includes(x)); continue;
    }
    if (k === 'geburtsjahr' && v === null) { delete cur.geburtsjahr; continue; }
    const lim = EDITIERBAR[k];
    if (!lim) return send(res, 400, { fehler: 'Feld nicht änderbar: ' + k });
    const n = +v;
    if (!isFinite(n) || n < lim[0] || n > lim[1]) return send(res, 400, { fehler: 'Wert außerhalb des Bereichs ' + lim[0] + '–' + lim[1] + ': ' + k });
    cur[k] = n;
  }
  const persoenlich = Object.keys(b).every((k) => k === 'sportarten' || k === 'geburtsjahr' || AUSWAHL[k]);
  if (!persoenlich) cur.bestaetigt = true; // wer die Leistungswerte speichert, hat das Profil geprüft
  const merged = await antwort(db, cur);
  if (merged.rad_if_min >= merged.rad_if_max) return send(res, 400, { fehler: 'Der Korridor braucht eine Untergrenze unter der Obergrenze.' });
  if (merged.vt1_hf >= merged.vt2_hf) return send(res, 400, { fehler: 'VT1 muss unter VT2 liegen.' });
  if (merged.kh_g_h_min >= merged.kh_g_h_max) return send(res, 400, { fehler: 'Das Kohlenhydrat-Ziel braucht eine Untergrenze unter der Obergrenze.' });
  await db.set('profil', cur);
  send(res, 200, { ok: true, profil: merged });
});
