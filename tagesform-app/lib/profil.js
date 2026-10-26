// Standardwerte des Athletenprofils. In der App unter „Profil“ änderbar (gespeichert in Redis).
const DEFAULT_PROFIL = {
  name: 'Anton', groesse_cm: 194, gewicht_ref_kg: 80, ftp_ref_w: 310, ftp_genannt_w: 340, hf_max: 197, lthr_lauf: 175, lthr_rad: 177,
  vt1_hf: 155, vt2_hf: 181, vt1_pace_s_km: 252, vt2_pace_s_km: 226, css_s_100m: 92, kadenz_ziel_spm: 170, lauf_rampe_max_pct: 10, schlafbedarf_min: 480,
  zonen_3er: 'Z1 = Garmin-Zonen 1–3 (unter VT1), Z2 = Zone 4 (VT1–VT2), Z3 = Zone 5 (über VT2)',
  rennen_schwimmen_km: 3.8, rennen_rad_km: 180, rennen_lauf_km: 42.195,
  ziel_schwimmen_min: 58, ziel_t1_min: 3, ziel_rad_min: 285, ziel_t2_min: 2, ziel_lauf_min: 186, ziel_gesamt_min: 540,
  rad_if_min: 0.65, rad_if_max: 0.72, cda_m2: 0.26, crr: 0.0035, rad_kg: 10, luftdichte: 1.2, antrieb_eta: 0.976, kh_g_h_min: 90, kh_g_h_max: 120,
  quelle: 'Projektprofil „Mission sub 9“, Garmin-HF-Zonen; CdA, Rollwiderstand und Radgewicht sind Schätzwerte',
};

// Felder, die in der App bearbeitet werden dürfen, mit erlaubtem Bereich
const EDITIERBAR = {
  gewicht_ref_kg: [40, 140], ftp_ref_w: [100, 500], ftp_genannt_w: [100, 500], hf_max: [150, 230], lthr_lauf: [120, 210], lthr_rad: [120, 210],
  vt1_hf: [100, 200], vt2_hf: [120, 215], vt1_pace_s_km: [180, 480], vt2_pace_s_km: [160, 420], css_s_100m: [60, 180], kadenz_ziel_spm: [150, 200],
  schlafbedarf_min: [360, 600], ziel_schwimmen_min: [30, 120], ziel_t1_min: [1, 15], ziel_rad_min: [180, 480], ziel_t2_min: [1, 15], ziel_lauf_min: [120, 360], ziel_gesamt_min: [420, 900],
  rad_if_min: [0.5, 0.9], rad_if_max: [0.5, 0.95], cda_m2: [0.18, 0.4], crr: [0.002, 0.008], rad_kg: [6, 20],
};

module.exports = { DEFAULT_PROFIL, EDITIERBAR };
