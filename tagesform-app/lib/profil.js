// Athletenprofil. Neue Konten starten mit neutralen Standardwerten; nach dem ersten Garmin-Abruf kommen
// Vorschläge aus den eigenen Daten dazu (Gewicht, Pulszonen, FTP). Was jemand selbst speichert, gilt immer.
const STANDARD_PROFIL = {
  name: '', groesse_cm: null, geburtsjahr: null, geschlecht: null, sportarten: null, gewicht_ref_kg: 75, ftp_ref_w: 220, ftp_genannt_w: 220, hf_max: 190, lthr_lauf: 170, lthr_rad: 165,
  vt1_hf: 145, vt2_hf: 170, vt1_pace_s_km: 330, vt2_pace_s_km: 290, css_s_100m: 120, kadenz_ziel_spm: 170, lauf_rampe_max_pct: 10, schlafbedarf_min: 480, schritte_ziel: 8000,
  zonen_3er: 'Z1 = Garmin-Zonen 1–3 (unter VT1), Z2 = Zone 4 (VT1–VT2), Z3 = Zone 5 (über VT2)',
  rennen_schwimmen_km: 3.8, rennen_rad_km: 180, rennen_lauf_km: 42.195,
  ziel_schwimmen_min: 75, ziel_t1_min: 5, ziel_rad_min: 360, ziel_t2_min: 4, ziel_lauf_min: 270, ziel_gesamt_min: 720,
  rad_if_min: 0.65, rad_if_max: 0.75, cda_m2: 0.3, crr: 0.004, rad_kg: 10, luftdichte: 1.2, antrieb_eta: 0.976, kh_g_h_min: 60, kh_g_h_max: 90,
  quelle: 'Standardwerte und Vorschläge aus deinen Garmin-Daten – im Profil anpassen',
};

// Felder, die in der App bearbeitet werden dürfen, mit erlaubtem Bereich
const EDITIERBAR = {
  groesse_cm: [130, 230], geburtsjahr: [1920, new Date().getFullYear() - 10], gewicht_ref_kg: [35, 160], ftp_ref_w: [80, 550], ftp_genannt_w: [80, 550], hf_max: [140, 230], lthr_lauf: [110, 215], lthr_rad: [110, 215],
  vt1_hf: [90, 205], vt2_hf: [110, 220], vt1_pace_s_km: [180, 600], vt2_pace_s_km: [150, 540], css_s_100m: [55, 240], kadenz_ziel_spm: [140, 200], lauf_rampe_max_pct: [5, 30],
  schlafbedarf_min: [300, 660], ziel_schwimmen_min: [25, 150], ziel_t1_min: [1, 20], ziel_rad_min: [150, 600], ziel_t2_min: [1, 20], ziel_lauf_min: [100, 480], ziel_gesamt_min: [420, 1020],
  rad_if_min: [0.5, 0.9], rad_if_max: [0.5, 0.95], cda_m2: [0.17, 0.45], crr: [0.002, 0.008], rad_kg: [5, 25], kh_g_h_min: [20, 150], kh_g_h_max: [30, 160],
};

// Vorschläge aus Garmin: letztes Gewicht, Pulszonen (VT1 ≈ Beginn Zone 4, VT2 ≈ Beginn Zone 5), FTP ≈ 95 % der besten 20 min
function vorschlag(d) {
  const v = {};
  const G = (d.garmin_gewicht || []).filter((r) => +r.kg > 30).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (G.length) v.gewicht_ref_kg = Math.round(+G[G.length - 1].kg * 2) / 2;
  const Z = d.garmin_hf_zonen || [], lauf = Z.find((z) => z.sport === 'RUNNING') || Z.find((z) => z.sport === 'DEFAULT') || Z[0], rad = Z.find((z) => z.sport === 'CYCLING');
  if (lauf) {
    if (lauf.hf_max >= 140) v.hf_max = lauf.hf_max;
    if (lauf.lthr >= 110) v.lthr_lauf = lauf.lthr;
    if (lauf.z4 >= 90 && lauf.z5 > lauf.z4) { v.vt1_hf = lauf.z4; v.vt2_hf = lauf.z5; }
  }
  if (rad && rad.lthr >= 110) v.lthr_rad = rad.lthr;
  const seit = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const p20 = Math.max(0, ...(d.garmin_einheiten || []).filter((e) => e.date >= seit).map((e) => +e.p1200 || 0));
  if (p20 >= 100) v.ftp_ref_w = v.ftp_genannt_w = Math.round((0.95 * p20) / 5) * 5;
  return v;
}

// Gültiges Profil: Standard < Vorschlag aus Garmin < eigene Werte
function profilFuer(d, eigen) {
  const e = eigen || {}, v = vorschlag(d || {});
  const p = Object.assign({}, STANDARD_PROFIL, v, e);
  p.bestaetigt = !!e.bestaetigt;
  p.aus_garmin = Object.keys(v).filter((k) => e[k] == null);
  p.standard = Object.keys(EDITIERBAR).filter((k) => v[k] == null && e[k] == null); // noch allgemeine Startwerte
  return p;
}

// Nicht-numerische Felder mit festen Werten
const AUSWAHL = { geschlecht: ['m', 'w', 'd'], wissen: ['einsteiger', 'fortgeschritten', 'profi'] }; // wissen: wie ausführlich die App erklärt
const SPORTARTEN = ['schwimmen', 'rad', 'laufen', 'gym'];
// Persönliches ohne Einfluss auf die Leistungswerte (setzt das Profil nicht auf „geprüft“)
const PERSOENLICH = { schritte_ziel: [2000, 30000] };

module.exports = { STANDARD_PROFIL, EDITIERBAR, AUSWAHL, SPORTARTEN, PERSOENLICH, vorschlag, profilFuer };
