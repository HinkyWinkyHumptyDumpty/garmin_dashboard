// Profilwerte ändern (POST {feld: wert}); nur freigegebene Felder in sinnvollen Grenzen.
// { bestaetigt: true } markiert das Profil als geprüft, { zuruecksetzen: true } geht auf Standard + Vorschläge aus Garmin zurück.
// Persönliches: { name } (Anzeigename, höchstens 30 Zeichen, null löscht), { schritte_ziel }, { modus }, { aufstehen_min },
// { schritte_dyn }, { wasser_ml }, { protein_g } (null = wieder automatisch),
// { bild: 'data:image/jpeg;base64,…' } eigenes Profilbild (klein, im Browser verkleinert; null löscht).
// Version 13: Ändern sich Schwellen (FTP, CSS, Schwellenpuls, VT1/VT2, Maximalpuls), entsteht ein Eintrag im Verlauf
// profil.schwellen [{ ab, w }] – ab heute oder ab { gueltig_ab } (bis 365 Tage zurück); { schwelle_weg: Datum } entfernt einen.
const { EDITIERBAR, AUSWAHL, SPORTARTEN, PERSOENLICH, SCHWELLEN, SCHWELLEN_MAX, profilFuer } = require('../lib/profil');
const { send, body, handler } = require('../lib/http');

async function antwort(db, eigen) {
  const [gewicht, einheiten, zonen] = await db.mget(['data:garmin_gewicht', 'data:garmin_einheiten', 'data:garmin_hf_zonen']);
  return profilFuer({ garmin_gewicht: gewicht || [], garmin_einheiten: einheiten || [], garmin_hf_zonen: zonen || [] }, eigen);
}

const BILD = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
function bildPruefen(v) { // nur echte, kleine JPEG-, PNG- oder WebP-Bilder
  const m = typeof v === 'string' && v.length <= 72000 ? BILD.exec(v) : null;
  if (!m) return false;
  const b = Buffer.from(m[2], 'base64');
  if (b.length < 100 || b.length > 52000) return false;
  const typ = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? 'jpeg'
    : b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'png'
    : b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP' ? 'webp' : null;
  return typ === m[1];
}
const PERS_KEYS = new Set(['sportarten', 'geburtsjahr', 'name', 'bild', 'schritte_ziel', 'aufstehen_min', 'schritte_dyn', 'wasser_ml', 'protein_g']);
const BLEIBT = ['name', 'schritte_ziel', 'geburtsjahr', 'geschlecht', 'sportarten', 'wissen', 'modus', 'aufstehen_min', 'schritte_dyn', 'wasser_ml', 'protein_g'];

module.exports = handler(async (req, res, ctx) => {
  if (req.method !== 'POST') return send(res, 405, { fehler: 'Methode nicht erlaubt.' });
  const db = ctx.db, b = await body(req), cur = (await db.get('profil')) || {};
  if (b.zuruecksetzen === true) { // Leistungswerte zurück auf Standard; Name, Fokus und persönliche Ziele bleiben
    const bleibt = {}; BLEIBT.forEach((k) => { if (cur[k] != null) bleibt[k] = cur[k]; });
    await db.set('profil', bleibt); return send(res, 200, { ok: true, profil: await antwort(db, bleibt) });
  }
  // Version 13: { schwelle_weg: 'YYYY-MM-DD' } nimmt einen Eintrag aus dem Verlauf deiner Schwellen (nicht den Anfang)
  if (typeof b.schwelle_weg === 'string') {
    const L = Array.isArray(cur.schwellen) ? cur.schwellen : [];
    cur.schwellen = L.filter((x, i) => i === 0 || !x || x.ab !== b.schwelle_weg);
    if (cur.schwellen.length < 2) delete cur.schwellen; // nur noch der Anfang: kein Verlauf mehr nötig
    await db.set('profil', cur); return send(res, 200, { ok: true, profil: await antwort(db, cur) });
  }
  const vorher = await antwort(db, cur); // Werte vor dieser Änderung (für den Verlauf der Schwellen)
  let bild; // undefined = unverändert, null = löschen, sonst neues Bild
  for (const [k, v] of Object.entries(b)) {
    if (k === 'bestaetigt' || k === 'gueltig_ab') continue;
    if (k === 'bild') {
      if (v === null) { bild = null; continue; }
      if (!bildPruefen(v)) return send(res, 400, { fehler: 'Das Bild konnte nicht gespeichert werden – bitte ein JPEG, PNG oder WebP wählen.' });
      bild = v; continue;
    }
    if (k === 'name') {
      if (v === null || v === '') { delete cur.name; continue; }
      const n = String(v).normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
      if (!n || n.length > 30) return send(res, 400, { fehler: 'Der Name darf höchstens 30 Zeichen haben.' });
      cur.name = n; continue;
    }
    if (PERSOENLICH[k]) {
      if (v === null) { delete cur[k]; continue; }
      const n = Math.round(+v), lim = PERSOENLICH[k];
      if (!isFinite(n) || n < lim[0] || n > lim[1]) return send(res, 400, { fehler: 'Wert außerhalb des Bereichs ' + lim[0] + '–' + lim[1] + ': ' + k });
      cur[k] = n; continue;
    }
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
  const persoenlich = Object.keys(b).every((k) => PERS_KEYS.has(k) || AUSWAHL[k]);
  if (!persoenlich) cur.bestaetigt = true; // wer die Leistungswerte speichert, hat das Profil geprüft
  const merged = await antwort(db, cur);
  if (merged.rad_if_min >= merged.rad_if_max) return send(res, 400, { fehler: 'Der Korridor braucht eine Untergrenze unter der Obergrenze.' });
  if (merged.vt1_hf >= merged.vt2_hf) return send(res, 400, { fehler: 'VT1 muss unter VT2 liegen.' });
  if (merged.kh_g_h_min >= merged.kh_g_h_max) return send(res, 400, { fehler: 'Das Kohlenhydrat-Ziel braucht eine Untergrenze unter der Obergrenze.' });
  // Version 13: geänderte Schwellen mit Datum merken – alte Einheiten behalten ihre Werte von damals
  const geaendert = SCHWELLEN.filter((k) => k in b && +vorher[k] !== +merged[k]);
  if (geaendert.length) {
    const heute = new Date().toISOString().slice(0, 10), frueh = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const ab = typeof b.gueltig_ab === 'string' && /^\d{4}-\d\d-\d\d$/.test(b.gueltig_ab) && !isNaN(Date.parse(b.gueltig_ab)) && b.gueltig_ab >= frueh && b.gueltig_ab <= heute ? b.gueltig_ab : heute;
    const bild2 = (p) => { const w = {}; SCHWELLEN.forEach((k) => { if (p[k] != null) w[k] = +p[k]; }); return w; };
    let L = Array.isArray(cur.schwellen) ? cur.schwellen.filter((x) => x && /^\d{4}-\d\d-\d\d$/.test(x.ab || '') && x.w) : [];
    if (!L.length) L.push({ ab: '2000-01-01', w: bild2(vorher) }); // was bis dahin galt
    L.forEach((x) => { if (x.ab > ab) geaendert.forEach((k) => { x.w[k] = +merged[k]; }); }); // spätere Einträge kennen den neuen Wert auch
    L = L.filter((x) => x.ab !== ab).concat([{ ab, w: bild2(merged) }]).sort((x, y) => (x.ab < y.ab ? -1 : 1));
    if (L.length > SCHWELLEN_MAX) L = [L[0]].concat(L.slice(-(SCHWELLEN_MAX - 1)));
    cur.schwellen = L;
  }
  await db.set('profil', cur);
  if (bild === null) await db.del('avatar'); else if (bild) await db.set('avatar', bild);
  send(res, 200, Object.assign({ ok: true, profil: geaendert.length ? await antwort(db, cur) : merged }, bild !== undefined ? { avatar: bild } : {}));
});
