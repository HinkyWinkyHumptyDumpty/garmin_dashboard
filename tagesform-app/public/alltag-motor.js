/* Dreiklang · Rechnungen für Alltag und Leistung (Version 8 und 9) – ohne Darstellung.
   Tagesziele (Wasser, Eiweiß, Schritte), Zeitfenster für den Tag, Kohlenhydrate nach Trainingslast, Briefing vor
   Schlüsseleinheiten, Belastung der Beine nach Krafttraining, Schweißrate, Material-Kilometer, Vergleich „mit / ohne“
   und die Wochenbilanz. Läuft im Browser (window.tfAlltagMotor) und auf dem Server (Push, Tests). */
(function (global) {
  'use strict';
  const DAY = 864e5;
  const ms = (s) => Date.parse(s + 'T00:00:00Z');
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const plus = (d, n) => iso(ms(d) + n * DAY);
  const wtag = (d) => (new Date(ms(d)).getUTCDay() + 6) % 7; // 0 = Montag
  const montag = (d) => plus(d, -wtag(d));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const rund = (x, s) => Math.round(x / s) * s;
  const ab = (x, s) => Math.floor(x / s) * s;
  const auf = (x, s) => Math.ceil(x / s) * s;
  const mittel = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);
  const median = (v) => { const x = v.filter((n) => n != null && isFinite(n)).sort((p, q) => p - q); if (!x.length) return null; const h = x.length >> 1; return x.length % 2 ? x[h] : (x[h - 1] + x[h]) / 2; };
  const varianz = (v) => { const m = mittel(v); return v.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, v.length - 1); };
  const uhrzeit = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const minVon = (hhmm) => { const m = /^(\d{1,2}):(\d\d)/.exec(String(hhmm || '')); return m ? +m[1] * 60 + +m[2] : null; };

  /* =====================================================================
     Tagesziele
     ===================================================================== */
  // Wasser: EFSA 2010 – 2,0 l (Frauen) bzw. 2,5 l (Männer) Wasser am Tag, davon etwa ein Fünftel aus dem Essen.
  // Für Training kommt der Schweißverlust dazu: eigene Schweißrate aus Tests, sonst etwa 0,5 l pro Stunde.
  function wasserZiel(o) {
    o = o || {};
    const h = Math.max(0, (+o.trainingMin || 0) / 60), lh = +o.schweissLh > 0 ? +o.schweissLh : 0.5;
    const extra = rund(h * lh * 1000, 100);
    if (+o.eigen > 0) return { ml: Math.round(+o.eigen), basis: Math.round(+o.eigen), extra: 0, quelle: 'eigen' };
    const basis = o.geschlecht === 'w' ? 1600 : o.geschlecht === 'm' ? 2000 : 1800;
    return { ml: rund(basis + extra, 100), basis, extra, quelle: +o.schweissLh > 0 ? 'test' : 'standard' };
  }
  // Eiweiß: Alltag 0,8 g/kg (DGE; ab 65 Jahren 1,0), mit Krafttraining oder viel Ausdauer etwa 1,6 g/kg (Morton et al. 2018)
  function proteinZiel(o) {
    o = o || {};
    const kg = +o.gewicht > 30 ? +o.gewicht : 75;
    if (+o.eigen > 0) return { g: Math.round(+o.eigen), gkg: +(+o.eigen / kg).toFixed(1), quelle: 'eigen' };
    const gkg = o.modus === 'alltag' ? (o.alter >= 65 ? 1.0 : 0.8) : 1.6;
    return { g: rund(gkg * kg, 5), gkg, quelle: o.modus === 'alltag' ? 'alltag' : 'sport' };
  }
  // Schrittziel: fest – oder „dynamisch“: etwas mehr als dein Median der letzten 4 Wochen, an roten Tagen weniger.
  // Gesundheitlich lohnen 6.000–10.000 Schritte am Tag (Paluch et al. 2022) – darum die Grenzen 5.000 bis 12.000.
  function schrittZiel(o) {
    const basis = clamp(Math.round(+o.basis || 8000), 2000, 30000);
    if (!o.dyn) return { ziel: basis, art: 'fest' };
    const v = []; for (let i = 1; i <= 28; i++) { const s = +o.schritte(plus(o.datum, -i)) || 0; if (s > 0) v.push(s); }
    if (v.length < 10) return { ziel: basis, art: 'fest', grund: 'Noch zu wenige Tage mit Schritten – bis dahin gilt dein festes Ziel.' };
    const m = median(v);
    let z = clamp(rund(m + 500, 500), 5000, 12000);
    const rot = o.ampel === 'rot';
    if (rot) z = Math.max(4000, rund(z * 0.8, 500));
    return { ziel: z, art: 'dynamisch', median: Math.round(m), rot };
  }

  /* =====================================================================
     Zeitfenster für den Tag
     ===================================================================== */
  // Schlafenszeit: Aufstehzeit minus Schlafbedarf minus etwa 15 min zum Einschlafen; an roten Tagen 30 min früher.
  // Koffein: bis 8,8 h vor dem Schlafen (Gardiner et al., Sleep Med Rev 2023) · letzte große Mahlzeit 2–3 h vorher
  // (St-Onge et al., Adv Nutr 2016) · Licht dimmen eine Stunde vorher (Chang et al., PNAS 2015) · Tageslicht in der ersten
  // Stunde (Wright et al., Curr Biol 2013) · Konzentration meist am späten Vormittag am besten, Tief nach dem Mittag
  // (Valdez et al. 2012 · Monk, Clin Sports Med 2005).
  function tagesFenster(o) {
    o = o || {};
    const aufMin = o.aufwachMin != null && isFinite(o.aufwachMin) ? Math.round(o.aufwachMin) : 7 * 60;
    const bedarf = clamp(Math.round(+o.schlafbedarfMin || 480), 360, 660);
    const frueher = o.ampel === 'rot' ? 30 : 0;
    // Morgen früher raus (Termin, Montag nach dem Wochenende): die Bettzeit richtet sich nach dem Aufstehen morgen
    const aufMorgen = o.aufMorgenMin != null && isFinite(o.aufMorgenMin) && o.aufMorgenMin < aufMin ? Math.round(o.aufMorgenMin) : aufMin, morgen = aufMin - aufMorgen;
    const bett = aufMorgen + 1440 - bedarf - 15 - frueher; // Minuten ab heute 0 Uhr (über 1440 = nach Mitternacht)
    const basis = {
      auf: aufMin, quelle: o.quelle || (o.aufwachMin != null ? 'eingetragen' : 'standard'), bedarf, frueher, morgen,
      licht: auf(aufMin + 60, 15),
      fokus: [rund(aufMin + 150, 30), rund(aufMin + 330, 30)],
      tief: [rund(aufMin + 390, 30), rund(aufMin + 510, 30)],
    };
    // Version 19: eigene Zeiten – ins Bett (bettMin) und Licht aus (schlafenMin), Minuten ab Mitternacht des Abends
    // (über 1440 = nach Mitternacht). Fehlt eine, folgt sie mit 15 min Abstand. Koffein und Essen richten sich nach dem
    // Einschlafen, Licht dimmen nach dem Zubettgehen. Die Zeiten bleiben, wie du sie gesetzt hast – an roten Tagen oder vor
    // einem frühen Morgen gibt es nur einen Vorschlag (tipp), wenn er mindestens 15 min früher liegt.
    const zeit = (x) => (x != null && x !== '' && isFinite(x) && +x >= 1080 && +x <= 1740 ? Math.round(+x) : null);
    const eB = zeit(o.bettMin), eS = zeit(o.schlafenMin);
    if (eB != null || eS != null) {
      const bettE = eB != null ? eB : eS - 15, schlafenE = Math.max(bettE, eS != null ? eS : eB + 15), b0 = schlafenE - 15;
      const vorschlag = ab(bett, 15), tipp = (frueher || morgen) && vorschlag <= bettE - 15 ? vorschlag : null;
      return Object.assign(basis, { eigen: true, bett: bettE, schlafen: schlafenE, tipp, auto: vorschlag,
        koffein: ab(b0 - 528, 15), essen: ab(b0 - 180, 15), dimmen: ab(Math.min(bettE, b0) - 60, 15) });
    }
    return Object.assign(basis, { eigen: false, bett: ab(bett, 15), schlafen: ab(bett, 15) + 15, tipp: null, auto: ab(bett, 15),
      koffein: ab(bett - 528, 15), essen: ab(bett - 180, 15), dimmen: ab(bett - 60, 15) });
  }
  // Tagestyp für den Alltag: Fokus-Tag, normaler Tag oder Schon-Tag – aus Tune, Schlaf und Check-in
  function tagesTyp(o) {
    o = o || {};
    const bedarf = +o.schlafbedarfMin || 480, sl = o.schlafMin != null ? +o.schlafMin : null;
    let id = o.ampel === 'gruen' ? 'fokus' : o.ampel === 'rot' ? 'schon' : 'normal', grund = '';
    if (sl != null && sl < 0.75 * bedarf && id === 'fokus') { id = 'normal'; grund = 'kurze Nacht'; }
    if (sl != null && sl < 0.6 * bedarf) { id = 'schon'; grund = 'sehr kurze Nacht'; }
    if (o.krank) { id = 'schon'; grund = 'Krankheitsgefühl'; }
    else if (o.stress != null && o.stress <= 2 && id === 'fokus') { id = 'normal'; grund = 'viel Stress'; }
    if (!grund) grund = o.ampel === 'gruen' ? 'Tune grün' : o.ampel === 'rot' ? 'Tune rot' : o.ampel === 'gelb' ? 'Tune gelb' : '';
    return { id, titel: { fokus: 'Fokus-Tag', normal: 'Normaler Tag', schon: 'Schon-Tag' }[id], grund };
  }

  /* =====================================================================
     Kohlenhydrate nach Trainingslast („Fuel for the work required“)
     ===================================================================== */
  // g/kg und Tag nach Thomas, Erdman & Burke (ACSM-Position 2016) bzw. Burke et al. 2011
  const KH_STUFEN = [
    { id: 'leicht', bis: 45, gkg: [3, 5], name: 'Ruhetag oder leichte Bewegung' },
    { id: 'moderat', bis: 90, gkg: [5, 7], name: 'etwa eine Stunde Training' },
    { id: 'hoch', bis: 240, gkg: [6, 10], name: '1,5 bis 4 Stunden Training' },
    { id: 'sehr_hoch', bis: Infinity, gkg: [8, 12], name: 'über 4 Stunden Training' },
  ];
  function khBedarf(o) {
    const kg = +o.gewicht > 30 ? +o.gewicht : 75;
    const min = (o.einheiten || []).reduce((s, e) => s + (e && e.sport !== 'mobil' ? +e.min || 0 : 0), 0);
    const st = KH_STUFEN.find((s) => min < s.bis);
    return { stufe: st.id, name: st.name, gkg: st.gkg.slice(), g: [rund(st.gkg[0] * kg, 10), rund(st.gkg[1] * kg, 10)], minuten: Math.round(min), kg };
  }
  // Schlüsseleinheit: lang, hart und lang genug, Koppeltraining oder Rennen
  function schluessel(e) {
    if (!e) return null;
    if (e.typ === 'rennen') return 'rennen';
    if ((e.sport === 'rad' && e.min >= 150) || (e.sport === 'laufen' && e.min >= 100)) return 'lang';
    if (e.typ === 'koppel' || (e.hart >= 2 && e.min >= 75 && e.sport !== 'schwimmen' && e.sport !== 'kraft')) return 'hart';
    return null;
  }
  // Flaschenrezept: Maltodextrin und Fruktose im Verhältnis 1 : 0,8 (O'Brien et al. 2013, Rowlands et al. 2015)
  function flasche(g) { const malto = rund(g / 1.8, 1); return { g: Math.round(g), malto, frukt: Math.round(g - malto) }; }
  // Briefing vor einer Schlüsseleinheit: heute Abend, morgen früh, unterwegs
  function briefing(o) {
    const e = o.einheit, art = schluessel(e); if (!art) return null;
    const kg = +o.gewicht > 30 ? +o.gewicht : 75, h = e.min / 60, rad = e.sport === 'rad';
    const unterwegs = rad ? [+o.khMin || 60, +o.khMax || 90] : h > 2.5 ? [60, 90] : h >= 1.25 ? [30, 60] : [0, 30];
    const gh = rund((unterwegs[0] + unterwegs[1]) / 2, 5);
    const vorher = art === 'rennen' && h >= 1.5 ? [10, 12] : [7, 10]; // Rennen über 90 min: Carbo-Loading 36–48 h; sonst gut auffüllen
    const fl = Math.min(gh, +o.flascheG > 0 ? +o.flascheG : 60);
    return {
      art, einheit: e, stunden: h, rad,
      abend: { gkg: vorher, g: [rund(vorher[0] * kg, 10), rund(vorher[1] * kg, 10)], loading: art === 'rennen' && h >= 1.5 },
      frueh: { gkg: [1, 2], g: [rund(kg, 10), rund(2 * kg, 10)], vorher: '2–3 h' },
      unterwegs: { gh: unterwegs, ziel: gh, gesamt: rund(gh * Math.max(0, h - 0.25), 10), flasche: flasche(fl), rest: Math.max(0, gh - fl) },
      trinkenMlH: +o.schweissLh > 0 ? rund(Math.min(1000, +o.schweissLh * 1000 * 0.75), 50) : null,
    };
  }

  /* =====================================================================
     Krafttraining und Laufen: Belastung der Beine
     ===================================================================== */
  // Schweres Beintraining verschlechtert Laufökonomie und Leistung bis etwa 48 h (Doma et al., Sports Med 2017).
  // Beinlast = harte Sätze für die Beine × Faktor des Trainingsziels × gefühlte Anstrengung (RPE / 7, ohne Angabe 1).
  const BEINE = ['quad', 'gesaess', 'beinbeuger', 'waden', 'adduktoren', 'abduktoren'];
  const ZIEL_F = { kraft: 1, aufbau: 1, power: 0.8, ausdauer: 0.6, stabil: 0.3 };
  function beinLast(e) {
    const s = (e && e.s) || {}, saetze = BEINE.reduce((x, m) => x + (+s[m] || 0), 0);
    const f = ZIEL_F[e && e.z] != null ? ZIEL_F[e.z] : 0.8, r = e && +e.r >= 1 && +e.r <= 10 ? +e.r / 7 : 1;
    return { saetze, last: +(saetze * f * r).toFixed(1) };
  }
  const HART_LAUF = ['schwelle', 'vo2', 'renntempo', 'fahrtspiel', 'test', 'cruise', 'huegel', 'tempowechsel', 'lang_renn']; // Version 24
  function interferenz(o) { // o: { gym: Log-Einträge, datum, einheiten: geplante Einheiten dieses Tages }
    if (!o || !/^\d{4}-\d\d-\d\d$/.test(o.datum || '')) return null;
    const log = (o.gym || []).filter((e) => e && e.d);
    const summe = (d) => log.filter((e) => e.d === d).reduce((x, e) => { const b = beinLast(e); return { saetze: x.saetze + b.saetze, last: x.last + b.last }; }, { saetze: 0, last: 0 });
    const L0 = summe(o.datum), L1 = summe(plus(o.datum, -1)), L2 = summe(plus(o.datum, -2));
    const lauf = (o.einheiten || []).filter((s) => s && s.sport === 'laufen');
    const hart = lauf.find((s) => s.hart >= 2 || HART_LAUF.includes(s.typ)), lang = lauf.find((s) => s.lang || /^lang/.test(s.typ || ''));
    const quelle = L1.last >= 8 ? ['gestern', L1] : L0.last >= 8 ? ['heute', L0] : L2.last >= 12 ? ['vorgestern', L2] : null;
    if (!quelle || !(hart || lang)) return null;
    return { stufe: hart ? 'warnung' : 'hinweis', wann: quelle[0], saetze: Math.round(quelle[1].saetze), last: +quelle[1].last.toFixed(1), einheit: hart || lang };
  }

  /* =====================================================================
     Schweißrate
     ===================================================================== */
  const BEDINGUNG = { rolle: 'Rolle drinnen', kuehl: 'Draußen kühl (unter 15 °C)', mild: 'Draußen mild (15–25 °C)', hitze: 'Hitze (über 25 °C)' };
  // Verlust = Gewicht vorher − nachher + Getrunkenes − Toilette; Rate = Verlust pro Stunde (Sawka et al., ACSM 2007)
  function schweissRate(t) {
    if (!t || !(+t.min >= 20) || !(+t.vor > 30) || !(+t.nach > 30)) return null;
    const h = +t.min / 60, diff = +t.vor - +t.nach, liter = diff + (+t.ml || 0) / 1000 - (+t.pipi || 0) / 1000;
    const lh = liter / h;
    return { lh: +lh.toFixed(2), liter: +liter.toFixed(2), diffKg: +diff.toFixed(2), pct: +((100 * diff) / +t.vor).toFixed(1), ok: lh >= 0.1 && lh <= 4 };
  }
  function schweissProfil(tests) {
    const L = (tests || []).map((t) => Object.assign({}, t, { r: schweissRate(t) })).filter((t) => t.r && t.r.ok).sort((x, y) => (x.d < y.d ? 1 : -1));
    const je = {};
    Object.keys(BEDINGUNG).forEach((b) => { const v = L.filter((t) => t.b === b).slice(0, 5).map((t) => t.r.lh); if (v.length) je[b] = { lh: +median(v).toFixed(2), n: v.length }; });
    const alle = L.slice(0, 8).map((t) => t.r.lh);
    return { je, gesamt: alle.length ? { lh: +median(alle).toFixed(2), n: alle.length } : null, tests: L };
  }

  /* =====================================================================
     Material: Räder und Laufschuhe
     ===================================================================== */
  const ROLLE = /^(indoor_cycling|virtual_ride)$/, RAD = /(cycling|biking|e_bike|cyclocross)/, TRAIL = /^trail_running$/, LAUF = /^(running|treadmill_running|track_running|indoor_running|virtual_run|street_running|ultra_run)$/;
  function matKat(typ) { typ = typ || ''; return ROLLE.test(typ) ? 'rolle' : RAD.test(typ) ? 'draussen' : TRAIL.test(typ) ? 'trail' : LAUF.test(typ) ? 'strasse' : null; }
  const passt = (it, k) => (it.art === 'rad' ? (k === 'rolle' || k === 'draussen') && (it.wo === 'beides' || it.wo === k || !it.wo) : (k === 'trail' || k === 'strasse') && (it.wo === 'alle' || it.wo === k || !it.wo));
  const startVon = (e) => String(e.start && e.start.length >= 16 ? e.start : e.date + 'T00:00').replace(' ', 'T').slice(0, 16);
  // km je Einheit; Rolle ohne Strecke: etwa 30 km/h aus der Zeit
  function kmVon(e, k) { const km = +e.dist_m > 0 ? +e.dist_m / 1000 : 0; if (km > 0) return { km, geschaetzt: false }; if (k === 'rolle') return { km: ((+e.moving_s || +e.dur_s || 0) / 3600) * 30, geschaetzt: true }; return { km: 0, geschaetzt: false }; }
  function materialStand(o) {
    const M = o.material || {}, items = (M.items || []).filter((it) => it && it.id && (it.art === 'rad' || it.art === 'schuh'));
    const zu = M.zu || {}, heute = o.heute;
    const out = items.map((it) => Object.assign({}, it, { km: +it.km0 || 0, kmRolle: 0, kmDraussen: 0, kmWachs: 0, geschaetzt: false, n: 0, letzte: null }));
    const BY = new Map(out.map((x) => [x.id, x]));
    const ohne = [], einheiten = [];
    (o.einheiten || []).forEach((e) => {
      if (!e || !e.date || e.is_parent || (heute && e.date > heute)) return;
      const k = matKat(e.type); if (!k) return;
      const art = k === 'rolle' || k === 'draussen' ? 'rad' : 'schuh';
      let it = null;
      const fest = zu[String(e.id)];
      if (fest === 'x') it = null;
      else if (fest && BY.has(fest) && BY.get(fest).art === art) it = BY.get(fest);
      else {
        const kand = out.filter((x) => x.art === art && !x.aus && passt(x, k) && (!x.seit || e.date >= x.seit));
        it = kand.sort((x, y) => (x.std ? 0 : 1) - (y.std ? 0 : 1) || String(y.seit || '').localeCompare(String(x.seit || '')))[0] || null;
      }
      const { km, geschaetzt } = kmVon(e, k);
      einheiten.push({ id: String(e.id), date: e.date, start: startVon(e), type: e.type, kat: k, art, km, geschaetzt, item: it ? it.id : null, fest: !!fest });
      if (!it) { if (km > 0) ohne.push(e.id); return; }
      if (it.seit && e.date < it.seit) return;
      it.km += km; it.n++; if (!it.letzte || e.date > it.letzte) it.letzte = e.date;
      if (geschaetzt) it.geschaetzt = true;
      if (k === 'rolle') it.kmRolle += km; else if (k === 'draussen') it.kmDraussen += km;
      if (it.art === 'rad' && (!it.wachs || startVon(e) >= it.wachs)) it.kmWachs += km;
    });
    out.forEach((it) => {
      it.km = Math.round(it.km); it.kmRolle = Math.round(it.kmRolle); it.kmDraussen = Math.round(it.kmDraussen); it.kmWachs = Math.round(it.kmWachs);
      const ziel = +it.ziel > 0 ? +it.ziel : it.art === 'rad' ? 300 : 700;
      it.zielKm = ziel;
      it.anteil = it.art === 'rad' ? it.kmWachs / ziel : it.km / ziel;
      it.faellig = !it.aus && (it.art === 'rad' ? it.anteil >= 1 : it.anteil >= 0.9);
    });
    return { items: out, einheiten: einheiten.sort((x, y) => (x.start < y.start ? 1 : -1)), ohne };
  }

  /* =====================================================================
     Vergleich „mit / ohne“ – Mittelwerte mit 95-%-Intervall (Welch)
     ===================================================================== */
  const T975 = [[1, 12.71], [2, 4.3], [3, 3.18], [4, 2.78], [5, 2.57], [6, 2.45], [7, 2.36], [8, 2.31], [9, 2.26], [10, 2.23], [12, 2.18], [15, 2.13], [20, 2.09], [25, 2.06], [30, 2.04], [40, 2.02], [60, 2.0], [120, 1.98], [1e9, 1.96]];
  function tQuantil(df) { if (!(df >= 1)) return 12.71; for (let i = 1; i < T975.length; i++) if (df <= T975[i][0]) { const [d0, t0] = T975[i - 1], [d1, t1] = T975[i]; return t0 + ((df - d0) * (t1 - t0)) / (d1 - d0); } return 1.96; }
  function vergleich(a, b) {
    if (!a || !b || a.length < 2 || b.length < 2) return null;
    const n1 = a.length, n2 = b.length, m1 = mittel(a), m2 = mittel(b), v1 = varianz(a), v2 = varianz(b);
    const se = Math.sqrt(v1 / n1 + v2 / n2), diff = m1 - m2;
    const df = se > 0 ? (v1 / n1 + v2 / n2) ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1)) : n1 + n2 - 2;
    const t = tQuantil(df), lo = diff - t * se, hi = diff + t * se;
    return { n1, n2, m1, m2, diff, lo, hi, klar: se > 0 && (lo > 0 || hi < 0) };
  }
  // tage: Tage mit Eintrag im Protokoll · hat(d): true / false / null (unbekannt) · wert(d): Messwert der Nacht danach bzw. des nächsten Morgens
  function mitOhne(o) {
    const A = [], B = [];
    (o.tage || []).forEach((d) => { const h = o.hat(d); if (h == null) return; const w = o.wert(d); if (w == null || !isFinite(w)) return; (h ? A : B).push(+w); });
    const min = o.min || 8;
    return { n1: A.length, n2: B.length, genug: A.length >= min && B.length >= min, v: vergleich(A, B) };
  }

  /* =====================================================================
     Wochenbilanz (Montag bis Sonntag)
     ===================================================================== */
  const KAT = [['lauf', /^(running|treadmill_running|trail_running|track_running|indoor_running|virtual_run|ultra_run|street_running)$/], ['rad', /(cycling|biking|virtual_ride|e_bike)/], ['schwimmen', /swimming/], ['kraft', /^(strength_training|hiit|crossfit)$/], ['mobil', /^(yoga|pilates|breathwork|meditation|flexibility_training|stretching|mobility)$/], ['gehen', /^(walking|casual_walking|speed_walking|hiking|indoor_walking)$/]];
  const katVon = (typ) => { for (const [k, re] of KAT) if (re.test(typ || '')) return k; return 'sonst'; };
  function wochenBilanz(o) {
    const m = o.montag, bis = o.bis || plus(m, 6), D = []; for (let i = 0; i < 7; i++) { const d = plus(m, i); if (d <= bis) D.push(d); }
    const imZeitraum = (d) => d >= m && d <= bis, vorWoche = (d) => d >= plus(m, -7) && d < m;
    // Einheiten von der Uhr
    const E = (o.einheiten || []).filter((e) => e && e.date && imZeitraum(e.date) && !e.is_parent && e.type !== 'transition_v2' && (+e.moving_s || +e.dur_s) >= 300);
    const je = {}; let min = 0;
    E.forEach((e) => { const k = katVon(e.type), x = Math.min(360, (+e.moving_s || +e.dur_s) / 60); je[k] = je[k] || { n: 0, min: 0, km: 0 }; je[k].n++; je[k].min += x; je[k].km += (+e.dist_m || 0) / 1000; min += x; });
    // App-Einträge (nur wenn die Uhr an dem Tag nichts Passendes hat)
    const uhrKraft = new Set(E.filter((e) => katVon(e.type) === 'kraft').map((e) => e.date)), uhrMobil = new Set(E.filter((e) => katVon(e.type) === 'mobil').map((e) => e.date));
    const gym = (o.gym || []).filter((e) => e && imZeitraum(e.d)), flow = (o.flow || []).filter((e) => e && imZeitraum(e.d));
    let app = 0, appMin = 0;
    gym.forEach((e) => { if (!uhrKraft.has(e.d)) { app++; appMin += +e.min || 0; } });
    flow.forEach((e) => { if (!uhrMobil.has(e.d)) { app++; appMin += +e.min || 0; } });
    const saetze = gym.reduce((x, e) => x + Object.values(e.s || {}).reduce((y, n) => y + (+n || 0), 0), 0);
    const beine = gym.reduce((x, e) => x + beinLast(e).saetze, 0);
    // Schlaf und Schritte (Uhr), sonst Schlaf aus dem Check-in
    const T = (o.tage || []).filter((r) => r && imZeitraum(r.date));
    const schlafUhr = T.map((r) => +r.sleep_s / 3600).filter((h) => h >= 3 && h <= 13);
    const ck = (o.checkins || []).filter((c) => c && imZeitraum(c.date)), ckVor = (o.checkins || []).filter((c) => c && vorWoche(c.date));
    const schlafCk = ck.map((c) => +c.schlaf_h).filter((h) => h >= 2 && h <= 14);
    const schlaf = schlafUhr.length ? schlafUhr : schlafCk;
    const schritte = T.map((r) => +r.steps).filter((s) => s > 0);
    const summe = (c) => ['schlaf', 'energie', 'muskeln', 'stress', 'stimmung'].reduce((s, k) => s + (+c[k] || 0), 0);
    // Protokoll
    const tb = (o.tagebuch || []).filter((r) => r && imZeitraum(r.date));
    // Ziel je Tag (mit Training mehr Wasser), sonst ein festes Ziel für alle Tage
    const wz = (d) => (o.wasserAm && +o.wasserAm[d]) || +o.wasserZiel || 0, pz = +o.proteinZiel || 0;
    // Plan
    let pg = 0, pe = 0; D.forEach((d) => { const p = o.plan && o.plan[d]; if (p) { pg += p[0]; pe += p[1]; } });
    return {
      montag: m, bis, tage: D.length, fertig: bis >= plus(m, 6),
      einheiten: E.length + app, minuten: Math.round(min + appMin), je, app,
      schlaf_h: schlaf.length ? +mittel(schlaf).toFixed(2) : null, schlaf_n: schlaf.length, schlaf_quelle: schlafUhr.length ? 'uhr' : schlafCk.length ? 'checkin' : null,
      schritte: schritte.length ? Math.round(mittel(schritte)) : null, schritte_n: schritte.length,
      checkins: ck.length, befinden: ck.length ? +mittel(ck.map(summe)).toFixed(1) : null, befinden_vor: ckVor.length ? +mittel(ckVor.map(summe)).toFixed(1) : null,
      gym: gym.length, saetze: Math.round(saetze), beine: Math.round(beine), flow: flow.length, flowMin: flow.reduce((x, e) => x + (+e.min || 0), 0),
      wasser_tage: o.wasserAm || +o.wasserZiel ? tb.filter((r) => wz(r.date) > 0 && +r.w >= wz(r.date)).length : null, protein_tage: pz ? tb.filter((r) => +r.p >= pz).length : null, protokoll_tage: tb.length,
      plan: pg ? [pg, pe] : null,
    };
  }
  // Text für die Mitteilung am Sonntagabend
  function wochenText(b) {
    const hm = (h) => Math.floor(h) + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
    const teile = [];
    if (b.einheiten) teile.push(b.einheiten + (b.einheiten === 1 ? ' Einheit' : ' Einheiten') + (b.minuten >= 30 ? ' · ' + hm(b.minuten / 60) + ' h' : ''));
    if (b.plan) teile.push('Plan ' + b.plan[1] + '/' + b.plan[0]);
    if (b.schlaf_h) teile.push('Schlaf Ø ' + hm(b.schlaf_h) + ' h');
    if (b.schritte) teile.push('Ø ' + String(b.schritte).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Schritte');
    if (b.befinden != null) teile.push('Check-in Ø ' + String(b.befinden).replace('.', ',') + '/25');
    if (!teile.length) return null;
    return { titel: 'Dein Wochenrückblick', text: teile.join(' · ') + ' – tippe für die ganze Woche.', url: '/#heute/woche' };
  }

  /* =====================================================================
     VERSION 9 · Muster in deinen Daten („Was dich beeinflusst“)
     Lag-1: Was du an Tag d tust, gegen den Messwert der Nacht danach bzw. des nächsten Morgens (d + 1).
     Je Paar Welch-t-Test; über alle Paare Benjamini-Hochberg (falsche Funde ≤ 10 %), dazu eine Mindest-Effektgröße.
     ===================================================================== */
  function lnGamma(z) { // Lanczos
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
    z -= 1; let x = c[0]; for (let i = 1; i < 9; i++) x += c[i] / (z + i);
    const t = z + 7.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function betacf(a, b, x) { // Kettenbruch der unvollständigen Betafunktion (Numerical Recipes)
    const FP = 1e-300; let c = 1, d = 1 - ((a + b) * x) / (a + 1); if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m; let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
      aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
    }
    return h;
  }
  function ibeta(x, a, b) { // regularisierte unvollständige Betafunktion I_x(a, b)
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
  const pWert = (t, df) => (isFinite(t) && df > 0 ? ibeta(df / (df + t * t), df / 2, 0.5) : 1); // zweiseitig
  function welch(a, b) {
    const n1 = a.length, n2 = b.length; if (n1 < 2 || n2 < 2) return null;
    const m1 = mittel(a), m2 = mittel(b), v1 = varianz(a), v2 = varianz(b), se2 = v1 / n1 + v2 / n2;
    if (!(se2 > 0)) return null;
    const t = (m1 - m2) / Math.sqrt(se2), df = se2 ** 2 / ((v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1));
    const sp = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2)), J = 1 - 3 / (4 * (n1 + n2) - 9);
    return { n1, n2, m1, m2, diff: m1 - m2, t, df, p: pWert(t, df), g: sp > 0 ? ((m1 - m2) / sp) * J : 0 };
  }
  function bhQ(ps) { // Benjamini-Hochberg: q-Werte in der Reihenfolge der p-Werte
    const n = ps.length, idx = ps.map((p, i) => [p, i]).sort((x, y) => x[0] - y[0]), q = new Array(n);
    let min = 1; for (let k = n - 1; k >= 0; k--) { const [p, i] = idx[k]; min = Math.min(min, (p * n) / (k + 1)); q[i] = min; }
    return q;
  }
  // Messwerte am Morgen danach: [id, Name, Einheit, Nachkommastellen, Richtung (+1 = höher ist besser), Wörter höher/niedriger]
  const EINFLUSS_ZIELE = [
    ['hrv', 'deine HRV', 'ms', 0, 1, ['höher', 'niedriger']],
    ['rhr', 'dein Ruhepuls', 'bpm', 1, -1, ['höher', 'niedriger']],
    ['schlaf', 'deine Schlafdauer', 'h', 1, 1, ['länger', 'kürzer']],
    ['tief', 'dein Tiefschlaf', 'min', 0, 1, ['länger', 'kürzer']],
    ['score', 'dein Tune', '', 0, 1, ['höher', 'niedriger']],
    ['befinden', 'dein Befinden im Check-in', '/25', 1, 1, ['besser', 'schlechter']],
    ['stress', 'deine Entspannung im Check-in', '/5', 1, 1, ['höher', 'niedriger']],
    ['tagstress', 'dein Stress laut Uhr am nächsten Tag', '', 0, -1, ['höher', 'niedriger']],
  ];
  function einfluss(o) {
    const heute = o.heute, zurueck = o.tageZurueck || 120, min = o.min || 8, qMax = o.qMax == null ? 0.1 : o.qMax, gMin = o.gMin == null ? 0.35 : o.gMin;
    const E = new Map((o.erholung || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const C = new Map((o.checkins || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const T = new Map((o.tage || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const TB = new Map((o.tagebuch || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const ckSumme = (c) => ['schlaf', 'energie', 'muskeln', 'stress', 'stimmung'].reduce((s, k) => s + (+c[k] || 0), 0);
    const zielWert = {
      hrv: (d) => { const e = E.get(d); return e && +e.hrv > 0 ? +e.hrv : null; },
      rhr: (d) => { const e = E.get(d), c = C.get(d); return e && +e.rhr > 0 ? +e.rhr : c && +c.puls > 0 ? +c.puls : null; },
      schlaf: (d) => { const e = E.get(d), c = C.get(d); return e && e.schlaf_h != null ? +e.schlaf_h : c && +c.schlaf_h > 0 ? +c.schlaf_h : null; },
      tief: (d) => { const e = E.get(d); return e && e.tief_h != null && e.schlaf_h != null ? Math.round(+e.tief_h * 60) : null; },
      score: (d) => { const e = E.get(d); return e && e.score != null ? +e.score : null; },
      befinden: (d) => { const c = C.get(d); return c && c.schlaf ? ckSumme(c) : null; },
      stress: (d) => { const c = C.get(d); return c && +c.stress > 0 ? +c.stress : null; },
      tagstress: (d) => { const t = T.get(d); return t && +t.stress_avg > 0 ? +t.stress_avg : null; },
    };
    // Training je Tag aus den Einheiten der Uhr
    const trainMin = new Map(), hartMin = new Map();
    (o.einheiten || []).forEach((e) => {
      if (!e || !e.date || e.is_parent) return;
      const m = (+e.moving_s || +e.dur_s || 0) / 60; if (m < 5) return;
      trainMin.set(e.date, (trainMin.get(e.date) || 0) + Math.min(m, 360));
      hartMin.set(e.date, (hartMin.get(e.date) || 0) + ((+e.z4_s || 0) + (+e.z5_s || 0)) / 60);
    });
    const gymBeine = new Map(); (o.gym || []).forEach((g) => { if (g && g.d) gymBeine.set(g.d, (gymBeine.get(g.d) || 0) + beinLast(g).last); });
    const flowTage = new Set((o.flow || []).filter((f) => f && f.d).map((f) => f.d));
    const von = plus(heute, -zurueck), tage = []; for (let d = von; d < heute; d = plus(d, 1)) tage.push(d);
    const uhr = (min2) => uhrzeit(min2).replace(/^0/, '');
    const stopp = o.koffeinStopp != null ? o.koffeinStopp : null;
    const schritte = (d) => { const t = T.get(d); return t && +t.steps > 0 ? +t.steps : null; };
    const sMed = median(tage.map(schritte).filter((x) => x != null));
    const bett = (d) => { const e = E.get(plus(d, 1)); return e && e.start_h != null ? +e.start_h : null; };
    const bMed = median(tage.map(bett).filter((x) => x != null));
    const garminTag = (d) => T.has(d) || trainMin.has(d);
    const zielWasser = (d) => (o.wasserAm && +o.wasserAm[d]) || +o.wasserZiel || 0;
    // Einflussgrößen: true / false / null (unbekannt – zählt nicht)
    const F = [];
    if (stopp != null) F.push({ id: 'koffein_spaet', kurz: 'Koffein nach ' + uhr(stopp), gegen: 'Koffein nur bis ' + uhr(stopp), satz: 'Nach Tagen mit Koffein nach ' + uhr(stopp), hat: (d) => { const r = TB.get(d); return r ? (r.k || []).some((t) => minVon(t) > stopp) : null; } });
    F.push({ id: 'koffein_viel', kurz: '3 oder mehr Kaffee', gegen: 'Höchstens 2 Kaffee', satz: 'Nach Tagen mit 3 oder mehr Kaffee', hat: (d) => { const r = TB.get(d); return r ? (r.k || []).length >= 3 : null; } });
    F.push({ id: 'wasser', kurz: 'Trinkziel erreicht', satz: 'Nach Tagen mit erreichtem Trinkziel', hat: (d) => { const r = TB.get(d); return r && zielWasser(d) ? (+r.w || 0) >= zielWasser(d) : null; } });
    if (+o.proteinZiel > 0) F.push({ id: 'protein', kurz: 'Eiweißziel erreicht', satz: 'Nach Tagen mit erreichtem Eiweißziel', hat: (d) => { const r = TB.get(d); return r ? (+r.p || 0) >= +o.proteinZiel : null; } });
    (o.stack || []).forEach((it) => F.push({ id: 'stack:' + it.id, kurz: it.n, satz: 'Nach Tagen mit „' + it.n + '“', hat: (d) => { const r = TB.get(d); return r ? !!(r.s && +r.s[it.id]) : null; } }));
    F.push({ id: 'voll', kurz: 'Vollgepackter Tag', gegen: 'Ruhigerer Tag', satz: 'Nach vollgepackten Tagen', hat: (d) => { const r = TB.get(d); return r && +r.v >= 1 ? +r.v === 3 : null; } });
    if (sMed) F.push({ id: 'schritte', kurz: 'Mehr als ' + Math.round(sMed / 100) * 100 + ' Schritte', satz: 'An Tagen mit mehr als ' + Math.round(sMed / 100) * 100 + ' Schritten (dein Median)', hat: (d) => { const s2 = schritte(d); return s2 == null ? null : s2 > sMed; } });
    F.push({ id: 'hart', training: true, satz: 'Nach Tagen mit mindestens 15 harten Minuten (Pulszone 4–5)', hat: (d) => (garminTag(d) ? (hartMin.get(d) || 0) >= 15 : null) });
    F.push({ id: 'lang', training: true, satz: 'Nach Tagen mit 90 Minuten Training oder mehr', hat: (d) => (garminTag(d) ? (trainMin.get(d) || 0) >= 90 : null) });
    if (gymBeine.size) F.push({ id: 'beine', training: true, satz: 'Nach schwerem Beintraining im Gym', hat: (d) => (garminTag(d) || TB.has(d) ? (gymBeine.get(d) || 0) >= 8 : null) });
    if (flowTage.size) F.push({ id: 'flow', kurz: 'Pilates, Yoga oder Kurz-Routine', satz: 'Nach Tagen mit Pilates, Yoga oder einer Kurz-Routine', hat: (d) => (garminTag(d) || TB.has(d) ? flowTage.has(d) : null) });
    if (bMed != null) F.push({ id: 'spaet_bett', kurz: 'Nach ' + uhr(((bMed + 0.75) % 24) * 60) + ' ins Bett', gegen: 'Vor ' + uhr(((bMed + 0.75) % 24) * 60) + ' ins Bett', satz: 'Nach Abenden, an denen du später als ' + uhr(((bMed + 0.75) % 24) * 60) + ' ins Bett gingst,', hat: (d) => { const b = bett(d); return b == null ? null : b > bMed + 0.75; } });
    F.push({ id: 'stress_morgen', kurz: 'Gestresster Morgen', satz: 'Nach Tagen, an denen du morgens gestresst warst (Check-in 1–2),', hat: (d) => { const c = C.get(d); return c && +c.stress > 0 ? +c.stress <= 2 : null; } });
    // Version 10: Ursachen-Tags aus dem Check-in am Morgen danach („Was war gestern?“)
    const tagStart = (o.checkins || []).filter((c) => c && c.date && Array.isArray(c.tags)).map((c) => c.date).sort()[0] || null;
    if (tagStart) CK_TAGS.forEach(([id, name, gegen]) => F.push({ id: 'tag:' + id, kurz: name, gegen, satz: 'Nach Tagen mit „' + name + '“', hat: (d) => { const c = C.get(plus(d, 1)); if (!c || plus(d, 1) < tagStart) return null; return Array.isArray(c.tags) && c.tags.includes(id); } }));
    // Tests – Version 13: Training, volle Tage, späte Abende, Alkohol und Stress wirken oft erst zeitversetzt.
    // Für sie zusätzlich Lag 2 (der Morgen nach der zweiten Nacht) gegen HRV, Ruhepuls, Tune und Befinden.
    const LAG2 = new Set(['hart', 'lang', 'beine', 'voll', 'spaet_bett', 'tag:alkohol', 'tag:stress']), LAG2_ZIELE = new Set(['hrv', 'rhr', 'score', 'befinden']);
    const tests = [];
    F.forEach((f) => {
      EINFLUSS_ZIELE.forEach(([zid, name, einheit, dez, richtung, woerter]) => {
        if ((f.id === 'stress_morgen' || f.id === 'tag:stress') && zid === 'stress') return; // derselbe Fragebogen – zu eng verwandt
        [1, 2].forEach((lag) => {
          if (lag === 2 && !(LAG2.has(f.id) && LAG2_ZIELE.has(zid))) return;
          const A = [], B = [];
          tage.forEach((d) => { const h = f.hat(d); if (h == null) return; const w = zielWert[zid](plus(d, lag)); if (w == null || !isFinite(w)) return; (h ? A : B).push(w); });
          if (A.length < min || B.length < min) return;
          const r = welch(A, B); if (!r) return;
          tests.push(Object.assign(r, { faktor: f.id, satz: f.satz, kurz: f.kurz || null, gegen: f.gegen || null, training: !!f.training, ziel: zid, name, einheit, dez, richtung, woerter, lag }));
        });
      });
    });
    const q = bhQ(tests.map((t) => t.p)); // Benjamini-Hochberg über alle Vergleiche – auch die mit Lag 2
    tests.forEach((t, i) => { t.q = q[i]; t.pct = t.m2 ? (100 * t.diff) / Math.abs(t.m2) : null; t.gut = Math.sign(t.diff) * t.richtung > 0; });
    let funde = tests.filter((t) => t.q <= qMax && Math.abs(t.g) >= gMin).sort((x, y) => Math.abs(y.g) - Math.abs(x.g));
    // Wirkt etwas schon am ersten Morgen und noch am zweiten, zählt es einmal – mit dem Hinweis, dass es anhält
    funde.filter((t) => t.lag === 2).forEach((t) => { const eins = funde.find((x) => x.lag === 1 && x.faktor === t.faktor && x.ziel === t.ziel && Math.sign(x.diff) === Math.sign(t.diff)); if (eins) { eins.auch2 = true; t.weg = true; } });
    funde = funde.filter((t) => !t.weg);
    const mitDaten = tage.filter((d) => EINFLUSS_ZIELE.some(([zid]) => zielWert[zid](plus(d, 1)) != null)).length;
    return { tage: mitDaten, getestet: tests.length, funde, faktoren: F.map((f) => f.id) };
  }
  // Satz für einen Fund, z. B. „Nach Tagen mit Koffein nach 16:45 war am nächsten Morgen dein Tiefschlaf im Schnitt kürzer: 52 statt 61 min (−14 %).“
  function einflussText(f, nf) {
    const z = (x) => (nf ? nf(x, f.dez) : (+x).toFixed(f.dez));
    const u = f.einheit ? (f.einheit.charAt(0) === '/' ? f.einheit : ' ' + f.einheit) : '';
    const wort = f.diff > 0 ? f.woerter[0] : f.woerter[1], pct = f.pct == null ? '' : ' (' + (f.pct > 0 ? '+' : '−') + Math.abs(Math.round(f.pct)) + ' %)';
    return f.satz + (f.lag === 2 ? ' war zwei Nächte später ' : ' war am nächsten Morgen ') + f.name + ' im Schnitt ' + wort + ': ' + z(f.m1) + u + ' statt ' + z(f.m2) + u + pct + '.' + (f.auch2 ? ' Das hielt auch noch eine Nacht länger an.' : '');
  }

  /* =====================================================================
     Frühwarnung: Ruhepuls hoch, HRV tief, Atemfrequenz hoch – oft schon vor den ersten Beschwerden
     (Mishra et al. 2020, Quer et al. 2021, Miller et al. 2020). Krankheitsgefühl im Check-in zählt immer.
     ===================================================================== */
  function fruehwarnung(o) {
    const E = new Map((o.erholung || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const C = new Map((o.checkins || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const G = new Map((o.gefuehl || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    function signale(d) {
      const e = E.get(d), c = C.get(d), s = [], w = {};
      if (e) {
        if (e.rhr != null && e.rhr_basis != null && (e.rhr - e.rhr_basis >= 5 || (e.z_rhr != null && e.z_rhr <= -1.5 && e.rhr - e.rhr_basis >= 3))) { s.push('puls'); w.puls = Math.round(e.rhr - e.rhr_basis); } // z_rhr: positiv = niedriger Puls
        if (e.z_hrv != null && e.z_hrv <= -1.5) { s.push('hrv'); w.hrv = e.hrv_delta_pct; }
        if (e.atem_delta != null && e.atem_delta >= 1) { s.push('atem'); w.atem = e.atem_delta; }
      } else {
        const g = G.get(d);
        if (g && g.puls != null && g.puls_basis != null && g.puls - g.puls_basis >= 5) { s.push('puls'); w.puls = Math.round(g.puls - g.puls_basis); }
      }
      if (c && c.krank) s.push('krank');
      return { s, w };
    }
    const koerper = (x) => x.s.filter((k) => k !== 'krank');
    function stufeAm(d) {
      const s0 = signale(d), s1 = signale(plus(d, -1)), s2 = signale(plus(d, -2)), k0 = koerper(s0), k1 = koerper(s1), k2 = koerper(s2);
      let stufe = null;
      if (s0.s.includes('krank') || k0.length >= 3 || (k0.length >= 2 && k1.length >= 2)) stufe = 'warnung';
      else if (k0.length >= 2 || k0.some((x) => k1.includes(x) && k2.includes(x))) stufe = 'achtung';
      return { stufe, signale: s0.s, werte: s0.w, datum: d };
    }
    const heute = o.heute, letzte = E.has(heute) || C.has(heute) || G.has(heute) ? heute : plus(heute, -1);
    const jetzt = stufeAm(letzte);
    const verlauf = {}; // Datum → 'warnung' | 'achtung' (für den Schutz der Wochenserie)
    for (let d = plus(heute, -(o.tageZurueck || 60)); d <= heute; d = plus(d, 1)) { const x = stufeAm(d); if (x.stufe) verlauf[d] = x.stufe; }
    return Object.assign(jetzt, { verlauf });
  }

  /* =====================================================================
     Social Jetlag: Schlafmitte an freien Tagen gegen Werktage (Wittmann et al. 2006)
     ===================================================================== */
  function socialJetlag(o) {
    const heute = o.heute, L = (o.erholung || []).filter((r) => r && r.date > plus(heute, -29) && r.date <= heute && r.start_h != null && r.ende_h != null);
    const mitte = (r) => (+r.start_h + +r.ende_h) / 2;
    const frei = L.filter((r) => wtag(r.date) >= 5), werk = L.filter((r) => wtag(r.date) <= 4); // aufgewacht am Samstag/Sonntag = Nacht nach Freitag/Samstag
    if (frei.length < 3 || werk.length < 6) return null;
    const sjl = median(frei.map(mitte)) - median(werk.map(mitte));
    const zuMin = (h) => Math.round((((h % 24) + 24) % 24) * 60);
    return { sjl_h: +sjl.toFixed(2), werkAuf: zuMin(median(werk.map((r) => +r.ende_h))), freiAuf: zuMin(median(frei.map((r) => +r.ende_h))), werkBett: zuMin(median(werk.map((r) => +r.start_h))), freiBett: zuMin(median(frei.map((r) => +r.start_h))), nFrei: frei.length, nWerk: werk.length };
  }

  /* =====================================================================
     Wichtiger Termin: 7-Tage-Fahrplan (Schlaf, Aufstehzeit, Training)
     Früher aufstehen in Schritten von 30 min pro Tag (Burgess et al. 2003); Schlaf und Regelmäßigkeit vor
     Prüfungen (Okano et al. 2019); kurz bewegen vorher (Chang et al. 2012); Training reduzieren (Bosquet et al. 2007).
     ===================================================================== */
  const TERMIN_ART = { pruefung: ['Prüfung', 120], praesentation: ['Präsentation', 120], tour: ['Bergtour', 90], wettkampf: ['Wettkampf', 150], reise: ['Reise', 90], sonst: ['Termin', 120] };
  const uhrK = (m) => uhrzeit(m).replace(/^0/, ''); // 6:30 statt 06:30
  function terminPlan(o) {
    const t = o.termin; if (!t || !/^\d{4}-\d\d-\d\d$/.test(t.d || '')) return null;
    const k = Math.round((ms(t.d) - ms(o.heute)) / DAY); if (k < 0 || k > 60) return null;
    const art = TERMIN_ART[t.art] ? t.art : 'sonst', [name, vorlauf] = TERMIN_ART[art];
    const aufMin = o.aufMin != null ? o.aufMin : 420, bedarf = o.bedarfMin || 480;
    const beginn = minVon(t.t), noetig = beginn != null ? beginn - vorlauf : null;
    // Früher aufstehen in Schritten (30 min pro Tag; wurde der Termin kurzfristig eingetragen, größere Schritte über die
    // verbleibenden Tage). Am Termintag zählt der Wecker. Die Schrittweite hängt am Eintragsdatum, damit der Plan stabil bleibt.
    const frueher = noetig != null ? Math.max(0, aufMin - noetig) : 0;
    const vorTage = /^\d{4}-\d\d-\d\d$/.test(t.e || '') ? Math.max(1, Math.round((ms(t.d) - ms(t.e)) / DAY)) : 7;
    const schrittMin = frueher > 20 ? Math.max(30, Math.ceil(frueher / Math.min(6, vorTage) / 5) * 5) : 0, schritte = schrittMin ? Math.ceil(frueher / schrittMin) : 0;
    const aufAm = (kk) => (!schritte || kk >= schritte ? aufMin : kk <= 0 ? noetig : Math.max(noetig, aufMin - schrittMin * (schritte - kk)));
    const aufHeute = aufAm(k), aufMorgen = k > 0 ? aufAm(k - 1) : aufMin;
    const bettHeute = ab(aufMorgen + 1440 - bedarf - 15, 15);
    const startIn = schritte ? k - schritte + 1 : null; // in wie vielen Tagen das frühere Aufstehen beginnt (0 = heute)
    const T = [];
    if (k > 7) return { k, art, name, schritte, schrittMin, noetig, aufMin, aufHeute, aufMorgen, bettHeute, tipps: [], phase: 'spaeter' };
    if (k >= 3) {
      const proTag = 'jeden Tag ' + schrittMin + ' Minuten früher aufstehen';
      T.push(['i-sun', schritte ? (startIn <= 0 ? proTag.charAt(0).toUpperCase() + proTag.slice(1) : 'Ab ' + (startIn === 1 ? 'morgen' : startIn === 2 ? 'übermorgen' : 'in ' + startIn + ' Tagen') + ' ' + proTag) + ' – am Termintag um ' + uhrK(noetig) + '. Morgens gleich ans Licht, abends früher dimmen.' + (schrittMin > 30 ? ' Große Schritte sind anstrengend – Licht direkt nach dem Aufstehen hilft am meisten.' : '') : 'Jeden Tag etwa zur gleichen Zeit aufstehen und ins Bett gehen – auch am Wochenende.']);
      T.push(['i-bolt', art === 'wettkampf' ? 'Das Training wird jetzt weniger – halte dich an deinen Plan, keine Extra-Einheiten.' : 'Bewegung wie gewohnt, aber nichts Neues oder Extremes.']);
      if (art === 'pruefung') T.push(['i-brain', 'Lernen in Blöcken mit Pausen – und nicht die Nächte durchmachen: Schlaf festigt, was du gelernt hast.']);
      if (art === 'praesentation') T.push(['i-brain', 'Einmal laut durchsprechen, am besten zur Uhrzeit des Termins.']);
      if (art === 'tour') T.push(['i-mountain', 'Ausrüstung prüfen und eingelaufene Schuhe nehmen; die letzte lange Tour spätestens 4–5 Tage vorher.']);
      if (art === 'reise') T.push(['i-sun', 'Bei Zeitverschiebung nach Osten: schon jetzt etwas früher ins Bett und morgens raus ins Licht.']);
    } else if (k === 2) {
      T.push(['i-bolt', 'Keine harten oder neuen Einheiten mehr – locker bewegen tut gut.']);
      T.push(['i-moon', 'Schlaf hat Vorrang: heute um ' + uhrK(bettHeute) + ' ins Bett' + (aufMorgen < aufMin ? ', morgen um ' + uhrK(aufMorgen) + ' aufstehen.' : '.')]);
    } else if (k === 1) {
      T.push(['i-walk', '20–30 Minuten locker bewegen, dann ausruhen.']);
      T.push(['i-list', art === 'tour' ? 'Rucksack packen, Wetter und Route prüfen, Essen und Getränke bereitlegen.' : art === 'wettkampf' ? 'Sachen packen (Packliste unter Renntag), Anreise planen.' : 'Unterlagen und Weg vorbereiten, damit morgen nichts hektisch wird.']);
      if (art === 'tour' || art === 'wettkampf') T.push(['i-food', 'Kohlenhydratreich essen und genug trinken.']);
      T.push(['i-moon', 'Um ' + uhrK(bettHeute) + ' ins Bett' + (aufMorgen < aufMin ? ' (Wecker ' + uhrK(aufMorgen) + ')' : '') + '. Schlecht schlafen in der letzten Nacht ist häufig und kein Grund zur Sorge – deshalb zählen die Nächte davor.']);
    } else {
      T.push(['i-coffee', 'Frühstück und Kaffee wie gewohnt – heute nichts Neues ausprobieren.']);
      if (art === 'pruefung' || art === 'praesentation') T.push(['i-walk', 'Wenn es passt: vorher 10–20 Minuten zügig gehen – das macht wach und konzentriert.']);
      if (art === 'tour') T.push(['i-drop', 'Früh los, regelmäßig essen und trinken, Pausen einplanen.']);
      if (art === 'wettkampf') T.push(['i-flag', 'Halte dich an deinen Plan aus Briefing und Race Card.']);
    }
    return { k, art, name, schritte, schrittMin, noetig, aufMin, aufHeute, aufMorgen, bettHeute, tipps: T, phase: k === 0 ? 'heute' : k <= 2 ? 'kurz' : 'vorher' };
  }

  /* =====================================================================
     Wetter für den Tag (Open-Meteo): Licht, Regen, Hitze, UV, Glätte
     ===================================================================== */
  function wetterTipps(w, o) {
    o = o || {};
    if (!w || !w.hourly || !Array.isArray(w.hourly.time)) return null;
    const heute = o.heute, H = w.hourly, idx = H.time.map((t, i) => [t, i]).filter(([t]) => String(t).slice(0, 10) === heute).map(([, i]) => i);
    if (!idx.length) return null;
    const std = (i) => +String(H.time[i]).slice(11, 13), wert = (k, i) => (H[k] && H[k][i] != null ? +H[k][i] : null);
    const temps = idx.map((i) => wert('temperature_2m', i)).filter((x) => x != null), gefuehlt = idx.map((i) => wert('apparent_temperature', i)).filter((x) => x != null);
    const tmax = temps.length ? Math.max(...temps) : null, tmin = temps.length ? Math.min(...temps) : null, gmax = gefuehlt.length ? Math.max(...gefuehlt) : tmax;
    const uv = Math.max(0, ...idx.map((i) => wert('uv_index', i) || 0));
    const aufStd = Math.floor((o.aufMin != null ? o.aufMin : 420) / 60);
    const morgen = idx.filter((i) => std(i) >= aufStd && std(i) <= aufStd + 2), wolken = mittel(morgen.map((i) => wert('cloud_cover', i)).filter((x) => x != null));
    const regenStd = idx.filter((i) => std(i) >= Math.max(7, aufStd) && std(i) <= 21 && (wert('precipitation_probability', i) || 0) >= 60).map(std);
    const chips = [], tipps = [];
    if (tmax != null) chips.push(['i-sun', Math.round(tmin) + '–' + Math.round(tmax) + ' °C']);
    if (regenStd.length) chips.push(['i-drop', 'Regen ab ' + regenStd[0] + ' Uhr']);
    if (uv >= 3) chips.push(['i-shield', 'UV ' + Math.round(uv)]);
    if (wolken != null) tipps.push(['i-sun', wolken < 50 ? 'Morgens sonnig – geh in der ersten Stunde nach dem Aufstehen 10 Minuten raus.' : 'Morgens bewölkt – draußen ist es trotzdem viel heller als drinnen: 10 Minuten raus lohnen sich.']);
    if (regenStd.length) tipps.push(['i-drop', regenStd[0] <= aufStd + 1 ? 'Regen am Morgen – statt Spaziergang eine Kurz-Routine drinnen und später kurz raus.' : 'Regen ab ' + regenStd[0] + ' Uhr – Spaziergang oder Training davor einplanen.']);
    const hitze = (gmax != null && gmax >= 27) || (tmax != null && tmax >= 25);
    if (hitze) tipps.push(['i-flame', 'Hitze (bis ' + Math.round(tmax) + ' °C): harte Einheiten in den Morgen oder Abend legen, mehr trinken, Tempo nach Gefühl und Puls statt nach Uhr.']);
    if (uv >= 6) tipps.push(['i-shield', 'UV-Index ' + Math.round(uv) + ': zwischen 11 und 16 Uhr Sonnenschutz, Kappe und Sonnenbrille.']);
    else if (uv >= 3) tipps.push(['i-shield', 'UV-Index ' + Math.round(uv) + ': mittags Sonnenschutz.']);
    if (tmin != null && tmin <= 1) tipps.push(['i-alert', 'Frost möglich – beim Laufen und Radfahren auf Glätte achten, drinnen aufwärmen.']);
    return { tmax, tmin, gmax, uv, wolken, regenAb: regenStd.length ? regenStd[0] : null, hitze, chips, tipps };
  }

  /* =====================================================================
     Fokus-Block: Länge nach Tagestyp (Pausen gegen Ermüdung: Albulescu et al. 2022)
     ===================================================================== */
  function fokusBlock(typ) {
    if (typ === 'fokus') return { arbeit: 50, pause: 10, runden: 2 };
    if (typ === 'schon') return { arbeit: 25, pause: 5, runden: 2 };
    return { arbeit: 25, pause: 5, runden: 3 };
  }

  /* =====================================================================
     Grundlagen-Trend: Effizienz (Tempo bzw. Watt pro Herzschlag) der letzten 6 Wochen gegen die 6 davor
     ===================================================================== */
  function efTrend(rows, heute, art) {
    const R = (rows || []).filter((r) => r && r.date && +r.ef > 0 && r.date <= heute);
    const A = R.filter((r) => r.date > plus(heute, -42)), B = R.filter((r) => r.date <= plus(heute, -42) && r.date > plus(heute, -84));
    if (A.length < 4 || B.length < 4) return null;
    const mA = median(A.map((r) => +r.ef)), mB = median(B.map((r) => +r.ef)), pct = mA / mB - 1;
    const out = { pct: +(100 * pct).toFixed(1), nA: A.length, nB: B.length };
    if (art === 'lauf') { const p = median(A.map((r) => +r.tempo_s).filter((x) => x > 0)); if (p) out.sek = Math.round(p * pct); } // bei gleichem Puls: heutiges Tempo gegen damals
    if (art === 'rad') { const np = median(B.map((r) => +r.np).filter((x) => x > 0)); if (np) out.watt = Math.round(np * pct); }
    return out;
  }

  /* =====================================================================
     VERSION 10 · Trends, Rückblicke, Top 3, Nachmittagstief, Wiedereinstieg und Mini-Experimente
     ===================================================================== */
  // Ursachen-Tags im Morgen-Check-in („Was war gestern?“): [Kennung, Name, gute Gegenrichtung für die Top 3 oder null]
  const CK_TAGS = [
    ['spaet_essen', 'Spät gegessen', 'Früh zu Abend gegessen'], ['bildschirm', 'Viel Bildschirm am Abend', 'Wenig Bildschirm am Abend'],
    ['alkohol', 'Alkohol', 'Kein Alkohol'], ['stress', 'Stressiger Tag', null], ['reise', 'Reisetag', null], ['spaet_sport', 'Spät trainiert', 'Nicht spät trainiert'],
    ['draussen', 'Viel draußen', null], ['gespraech', 'Gutes Gespräch', null], ['entspannt', 'Bewusst entspannt', null], ['unruhig', 'Unruhige Nacht (Lärm, Hitze)', null],
  ];
  // „Was bringt mir am meisten?“ – die stärksten guten Zusammenhänge aus einfluss(), je Gewohnheit einer.
  // Was schadet, zählt in seiner guten Gegenrichtung („Vor 23:30 ins Bett“); Training selbst ist keine Gewohnheit zum Weglassen.
  function top3(res, n) {
    if (!res || !Array.isArray(res.funde)) return [];
    const best = new Map();
    res.funde.forEach((f) => {
      if (f.training) return;
      const label = f.gut ? f.kurz : f.gegen; if (!label) return;
      const basis = f.gut ? f.m2 : f.m1, besser = f.gut ? f.m1 : f.m2;
      const pct = basis ? (100 * (besser - basis)) / Math.abs(basis) : null;
      const alt = best.get(f.faktor);
      if (!alt || Math.abs(f.g) > Math.abs(alt.g)) best.set(f.faktor, { faktor: f.faktor, label, ziel: f.ziel, name: f.name, einheit: f.einheit, dez: f.dez, g: f.g, pct, wert: besser, statt: basis });
    });
    return [...best.values()].sort((a, b) => Math.abs(b.g) - Math.abs(a.g)).slice(0, n || 3);
  }
  // Trend wie in Apple Health: die letzten 4 Wochen gegen die Monate davor (bis ein halbes Jahr zurück).
  // Ein Pfeil erscheint erst, wenn der Unterschied größer ist als das übliche Auf und Ab (¼ Standardabweichung) und mindestens 2 %.
  function trend(werte, heute, o) {
    o = o || {};
    const kurz = o.kurz || 28, lang = o.lang || 182;
    const V = (werte || []).filter((x) => x && x.date && x.date <= heute && x.v != null && isFinite(+x.v));
    const K = V.filter((x) => x.date > plus(heute, -kurz)).map((x) => +x.v), L = V.filter((x) => x.date > plus(heute, -lang) && x.date <= plus(heute, -kurz)).map((x) => +x.v);
    if (K.length < (o.minK || 10) || L.length < (o.minL || 30)) return null;
    const mK = mittel(K), mL = mittel(L), sd = L.length > 1 ? Math.sqrt(varianz(L)) : 0, diff = mK - mL, pct = mL ? (100 * diff) / Math.abs(mL) : 0;
    const richtung = Math.abs(diff) < Math.max(o.minAbs || 0, 0.25 * sd) || Math.abs(pct) < (o.minPct == null ? 2 : o.minPct) ? 0 : Math.sign(diff);
    return { kurz: mK, lang: mL, diff, pct, richtung, nK: K.length, nL: L.length };
  }
  // Zeitraum gegen den gleich langen davor (für den Rückblick über 30, 90 oder 365 Tage)
  function zeitraum(werte, heute, tage, o) {
    o = o || {};
    const V = (werte || []).filter((x) => x && x.date && x.date <= heute && x.v != null && isFinite(+x.v));
    const A = V.filter((x) => x.date > plus(heute, -tage)).map((x) => +x.v), B = V.filter((x) => x.date <= plus(heute, -tage) && x.date > plus(heute, -2 * tage)).map((x) => +x.v);
    const min = o.min || Math.max(3, Math.round(tage / 6));
    const a = A.length >= min ? mittel(A) : null, b = B.length >= min ? mittel(B) : null;
    if (a == null) return null;
    const out = { a, b, nA: A.length, nB: B.length, summeA: A.reduce((x, y) => x + y, 0), summeB: B.reduce((x, y) => x + y, 0) };
    if (b != null) {
      const sd = B.length > 1 ? Math.sqrt(varianz(B)) : 0;
      out.diff = a - b; out.pct = b ? (100 * (a - b)) / Math.abs(b) : 0;
      out.richtung = Math.abs(out.diff) < Math.max(o.minAbs || 0, 0.2 * sd) || Math.abs(out.pct) < (o.minPct == null ? 2 : o.minPct) ? 0 : Math.sign(out.diff);
    }
    return out;
  }
  // Wochen-Summen (Montag → Wert) aus Tageswerten
  function wochen(werte) {
    const W = new Map();
    (werte || []).forEach((x) => { if (!x || !x.date || x.v == null || !isFinite(+x.v)) return; const m = montag(x.date); W.set(m, (W.get(m) || 0) + +x.v); });
    return W;
  }
  // Rückblicke wie in Apple Fotos: besondere Momente der letzten Wochen, das Wichtigste zuerst.
  // o: { heute, einheiten: [{ date, min, km }], tagesform: [{ date, v }], schritte: [{ date, v }] }
  function momente(o) {
    const heute = o.heute, M2 = [], E = (o.einheiten || []).filter((e) => e && e.date && e.date <= heute);
    const mo = montag(heute), monat = heute.slice(0, 7);
    // 1. stärkste Woche bisher (Trainingsstunden), wenn sie 2–8 Wochen zurückliegt
    const W = wochen(E.map((e) => ({ date: e.date, v: e.min || 0 })));
    const voll = [...W.entries()].filter(([m]) => m < mo);
    if (voll.length >= 8) {
      const [bm, bv] = voll.reduce((x, y) => (y[1] > x[1] ? y : x));
      const vor = Math.round((Date.parse(mo) - Date.parse(bm)) / (7 * DAY));
      if (vor >= 2 && vor <= 8 && bv >= 120) M2.push({ id: 'staerkste:' + bm, prio: 3, titel: 'Vor ' + vor + ' Wochen hattest du deine bisher stärkste Woche', text: Math.floor(bv / 60) + ':' + String(Math.round(bv % 60)).padStart(2, '0') + ' h Training in der Woche ab ' + +bm.slice(8, 10) + '.' + +bm.slice(5, 7) + '.', icon: 'i-flame', farbe: 'orange' });
    }
    // 2. Einheiten in diesem Monat gegen den ganzen Vormonat – bei runden Zahlen
    const vm = (() => { const d = new Date(Date.parse(monat + '-01T00:00:00Z')); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); })();
    const nM = E.filter((e) => e.date.slice(0, 7) === monat).length, nV = E.filter((e) => e.date.slice(0, 7) === vm).length;
    if (nM >= 5 && nM % 5 === 0) M2.push({ id: 'monat:' + monat + ':' + nM, prio: nV && nM >= 2 * nV ? 4 : 2, titel: 'Deine ' + nM + '. Einheit in diesem Monat', text: nV ? (nM >= 2 * nV ? 'Doppelt so viele wie im ganzen Vormonat (' + nV + ').' : nM > nV ? 'Schon mehr als im ganzen Vormonat (' + nV + ').' : 'Im Vormonat waren es ' + nV + '.') : 'Stark – bleib dran.', icon: 'i-star', farbe: 'pink' });
    // 3. beste Erholungswoche der letzten 8 Wochen (Ø Tune), wenn es die letzte volle Woche war
    const TF = (o.tagesform || []).filter((x) => x && x.date && x.v != null);
    const wf = new Map(); TF.forEach((x) => { const m = montag(x.date); if (m >= plus(mo, -56) && m < mo) { const w = wf.get(m) || []; w.push(+x.v); wf.set(m, w); } });
    const wfS = [...wf.entries()].filter(([, v]) => v.length >= 5).map(([m, v]) => [m, mittel(v)]);
    if (wfS.length >= 4) { const [bm, bv] = wfS.reduce((x, y) => (y[1] > x[1] ? y : x)); if (bm === plus(mo, -7)) M2.push({ id: 'erholung:' + bm, prio: 3, titel: 'Letzte Woche war deine erholteste seit zwei Monaten', text: 'Tune im Schnitt ' + Math.round(bv) + ' – was hat dir gutgetan?', icon: 'i-moon', farbe: 'indigo' }); }
    // 4. Schritte: diese Woche schon mehr als in jeder der letzten 8 Wochen
    const SW = wochen(o.schritte || []), jetzt = SW.get(mo) || 0, frueher = [...SW.entries()].filter(([m]) => m < mo && m >= plus(mo, -56)).map(([, v]) => v);
    if (frueher.length >= 6 && jetzt > Math.max(...frueher) && jetzt >= 30000) M2.push({ id: 'schritte:' + mo, prio: 2, titel: 'So viele Schritte wie seit Wochen nicht', text: 'Diese Woche schon ' + String(Math.round(jetzt)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' – mehr als in jeder der letzten ' + frueher.length + ' Wochen.', icon: 'i-steps', farbe: 'green' });
    // 5. Monatsrückblick in der ersten Woche des neuen Monats
    if (+heute.slice(8, 10) <= 7 && E.some((e) => e.date.slice(0, 7) === vm)) M2.push({ id: 'story:' + vm, prio: 5, story: vm, titel: 'Dein ' + MONATE[+vm.slice(5, 7) - 1] + ' ist fertig', text: 'Ein ruhiger Rückblick auf deine Einheiten, Kraft, Erholung und Quests.', icon: 'i-karten', farbe: 'blue' });
    return M2.sort((a, b) => b.prio - a.prio);
  }
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  // Monats- oder Jahresbilanz für die Story. o: { von, bis, einheiten: [{ date, min, km, kat }], tagesform, schritte, hrv, rhr, quests, kraft: [{ name, vorher, nachher }] }
  function bilanz(o) {
    const imZeit = (x) => x && x.date >= o.von && x.date <= o.bis;
    const E = (o.einheiten || []).filter(imZeit), minS = E.reduce((s, e) => s + (+e.min || 0), 0), km = E.reduce((s, e) => s + (+e.km || 0), 0);
    const je = {}; E.forEach((e) => { je[e.kat] = (je[e.kat] || 0) + 1; });
    const W = wochen(E.map((e) => ({ date: e.date, v: e.min || 0 })));
    const top = [...W.entries()].reduce((x, y) => (!x || y[1] > x[1] ? y : x), null);
    const mitt = (L) => { const v = (L || []).filter(imZeit).map((x) => +x.v).filter(isFinite); return v.length ? mittel(v) : null; };
    const TF = (o.tagesform || []).filter(imZeit), wf = new Map(); TF.forEach((x) => { const m = montag(x.date); const w = wf.get(m) || []; w.push(+x.v); wf.set(m, w); });
    const erholt = [...wf.entries()].filter(([, v]) => v.length >= 4).map(([m, v]) => [m, mittel(v)]).reduce((x, y) => (!x || y[1] > x[1] ? y : x), null);
    const S = (o.schritte || []).filter(imZeit);
    return {
      einheiten: E.length, minuten: Math.round(minS), km: Math.round(km), je, staerksteWoche: top ? { montag: top[0], min: Math.round(top[1]) } : null,
      tagesform: mitt(o.tagesform), hrv: mitt(o.hrv), rhr: mitt(o.rhr), erholteWoche: erholt ? { montag: erholt[0], wert: Math.round(erholt[1]) } : null,
      schritte: S.length ? Math.round(S.reduce((s, x) => s + +x.v, 0)) : null, schritteTag: S.length ? Math.round(S.reduce((s, x) => s + +x.v, 0) / S.length) : null,
      quests: o.quests == null ? null : o.quests, kraft: (o.kraft || []).filter((k) => k && k.vorher > 0 && k.nachher > k.vorher * 1.01).sort((a, b) => b.nachher / b.vorher - a.nachher / a.vorher).slice(0, 3),
    };
  }
  // Nachmittagstief: Power-Nap oder kurzer Spaziergang? Kurze Nickerchen (10–20 min) machen am wachsten, ohne die Nacht
  // zu stören, wenn sie früh genug liegen (Brooks & Lack, Sleep 2006 · Milner & Cote, J Sleep Res 2009); sonst bringt
  // ein flotter Spaziergang von 10 Minuten mehr Energie als ein Snack (Thayer, J Pers Soc Psychol 1987).
  // o: { jetztMin, schlafH, bedarfH, schuld7H, bettMin, koffeinMin }
  function nachmittagstief(o) {
    const t = o.jetztMin; if (t == null || t < 12 * 60 + 30 || t > 18 * 60) return null;
    const bett = o.bettMin != null ? (o.bettMin < 12 * 60 ? o.bettMin + 1440 : o.bettMin) : 23 * 60;
    const fehlt = (o.bedarfH != null && o.schlafH != null ? o.bedarfH - o.schlafH : 0), schuld = o.schuld7H || 0;
    const napOk = t <= 15 * 60 + 30 && bett - (t + 20) >= 6.5 * 60; // spätestens 15:30 und gut 6½ Stunden vor dem Schlafen
    const muede = fehlt >= 0.75 || schuld >= 3;
    const kaffee = o.koffeinMin != null && t < o.koffeinMin;
    if (napOk && muede) return { art: 'nap', min: 20, grund: fehlt >= 0.75 ? 'Letzte Nacht fehlten dir etwa ' + Math.round(fehlt * 60) + ' Minuten Schlaf.' : 'In den letzten 7 Nächten fehlen dir zusammen etwa ' + Math.round(schuld) + ' Stunden Schlaf.', kaffee };
    return { art: 'gehen', min: 10, grund: !napOk ? (t > 15 * 60 + 30 ? 'Für ein Nickerchen ist es jetzt schon spät – es würde deinen Schlaf heute Nacht stören.' : 'Ein Nickerchen würde zu nah an deiner Schlafenszeit liegen.') : 'Du hast genug geschlafen – Bewegung und Tageslicht wecken jetzt besser als ein Nickerchen.', kaffee };
  }
  // Wiedereinstieg nach Krankheit in Stufen (in Anlehnung an Elliott et al., Br J Sports Med 2020, und den IOC-Konsens,
  // Schwellnus et al., Br J Sports Med 2022). Jede Stufe mindestens einen Tag, nur ohne Beschwerden weiter.
  const RUECKKEHR = [
    { name: 'Erholen', tage: 1, text: 'Spazierengehen und lockere Mobilität, höchstens 15–20 Minuten. Kein Training mit Puls.', max: 20, rpe: 2 },
    { name: 'Ganz locker', tage: 2, text: 'Bis 30 Minuten ganz locker – du kannst dich dabei mühelos unterhalten.', max: 30, rpe: 3 },
    { name: 'Locker und länger', tage: 2, text: 'Normale lockere Einheiten bis 60 Minuten, leichtes Krafttraining. Noch keine Intervalle.', max: 60, rpe: 4 },
    { name: 'Wieder etwas Tempo', tage: 2, text: 'Kurze zügige Abschnitte sind wieder drin – hart erst, wenn Ruhepuls und HRV zurück in deinem Normal sind.', max: 90, rpe: 6 },
  ];
  function rueckkehr(p, heute) { // p: { seit, art, gesund: Datum oder null, zurueck: Anzahl Stufen zurück }
    if (!p || !p.seit) return null;
    if (!p.gesund) return { phase: p.art === 'angeschlagen' ? 'angeschlagen' : 'pause', tage: Math.max(1, Math.round((Date.parse(heute) - Date.parse(p.seit)) / DAY) + 1) };
    const seit = Math.max(0, Math.round((Date.parse(heute) - Date.parse(p.gesund)) / DAY));
    let rest = seit, i = 0;
    while (i < RUECKKEHR.length && rest >= RUECKKEHR[i].tage) { rest -= RUECKKEHR[i].tage; i++; }
    i = Math.max(0, i - (+p.zurueck || 0));
    if (i >= RUECKKEHR.length) return { phase: 'fertig', stufe: RUECKKEHR.length, tage: seit };
    return Object.assign({ phase: 'rueckkehr', stufe: i, von: RUECKKEHR.length, tage: seit }, RUECKKEHR[i]);
  }
  // Mini-Experiment (N = 1): die Experiment-Tage gegen die 14 Tage davor – jeweils der Morgen danach.
  // Mit 7 Tagen ist das ein Hinweis, kein Beweis: „deutlich“ erst ab großer Effektstärke (Hedges g ≥ 0,8) und p < 0,1.
  function experimentVergleich(o) { // o: { start, tage: [Daten mit erledigt], erholung, checkins }
    if (!o || !o.start || !Array.isArray(o.tage) || !o.tage.length) return null;
    const E = new Map((o.erholung || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const C = new Map((o.checkins || []).filter((r) => r && r.date).map((r) => [r.date, r]));
    const ck = (c) => (c && c.schlaf ? ['schlaf', 'energie', 'muskeln', 'stress', 'stimmung'].reduce((s, k) => s + (+c[k] || 0), 0) : null);
    const ZIELE = [['schlaf', 'Schlafdauer', 'h', 1, 1, (d) => { const e = E.get(d); return e && e.schlaf_h != null ? +e.schlaf_h : null; }],
      ['hrv', 'HRV', 'ms', 0, 1, (d) => { const e = E.get(d); return e && +e.hrv > 0 ? +e.hrv : null; }],
      ['rhr', 'Ruhepuls', 'bpm', 1, -1, (d) => { const e = E.get(d); return e && +e.rhr > 0 ? +e.rhr : null; }],
      ['score', 'Tune', '', 0, 1, (d) => { const e = E.get(d); return e && e.score != null ? +e.score : null; }],
      ['befinden', 'Befinden im Check-in', '/25', 1, 1, (d) => ck(C.get(d))]];
    const vorher = []; for (let i = 1; i <= 14; i++) vorher.push(plus(o.start, -i));
    return ZIELE.map(([id, name, einheit, dez, richtung, wert]) => {
      const A = o.tage.map((d) => wert(plus(d, 1))).filter((x) => x != null), B = vorher.map((d) => wert(plus(d, 1))).filter((x) => x != null);
      if (A.length < 3 || B.length < 5) return { id, name, einheit, dez, richtung, nA: A.length, nB: B.length, zuWenig: true };
      const r = welch(A, B) || { m1: mittel(A), m2: mittel(B), diff: mittel(A) - mittel(B), g: 0, p: 1 };
      return { id, name, einheit, dez, richtung, nA: A.length, nB: B.length, m1: r.m1, m2: r.m2, diff: r.diff, g: r.g, p: r.p, gut: Math.sign(r.diff) * richtung > 0, deutlich: Math.abs(r.g) >= 0.8 && r.p < 0.1 };
    });
  }

  /* =====================================================================
     VERSION 13 · Belastung steuern: geplante Last je Einheit, Bein- gegen Kreislauf-Last, Formprognose,
     Überlastungs-Wächter und Glykogen im Rennen
     ===================================================================== */
  // Geschätzte Intensität (IF) einer geplanten Einheit je Sportart und Typ – daraus TSS = Stunden × IF² × 100 (Coggan)
  const PLAN_IF = {
    laufen: { locker: 0.68, steiger: 0.7, laufgehen: 0.55, fahrtspiel: 0.78, schwelle: 0.84, vo2: 0.84, renntempo: 0.82, lang: 0.7, koppel: 0.78, opener: 0.66, test: 0.92, regeneration: 0.6, lauf_abc: 0.68, progressiv: 0.77, huegel: 0.86, cruise: 0.84, tempowechsel: 0.82, lang_renn: 0.76, lang_progressiv: 0.74 },
    rad: { locker: 0.62, kadenz: 0.65, kadenz_q: 0.66, sweetspot: 0.8, schwelle: 0.83, vo2: 0.8, renntempo: 0.78, lang: 0.68, opener: 0.62, test: 0.88, regeneration: 0.55, tempo: 0.74, berg: 0.8, ueber_unter: 0.85, aero: 0.77, sprint: 0.72, lang_renn: 0.74, lang_berg: 0.71 },
    schwimmen: { technik: 0.65, locker: 0.65, css: 0.82, ausdauer: 0.72, lang: 0.7, sprint: 0.8, opener: 0.6, test: 0.85, zugkraft: 0.72, freiwasser: 0.7, beine: 0.62, pyramide: 0.82, rennsim: 0.8, tempowechsel: 0.78 }, // Version 24: neue Einheiten
  };
  // Welcher Teil der Last die Beine und den Stützapparat trifft: Laufen voll (Aufprall), Rad kaum, Schwimmen nicht
  const BEIN_ANTEIL = { laufen: 1, rad: 0.15, schwimmen: 0 };
  // o: { kraftZiel: 'kraft'|'aufbau'|'power'|'stabil', spez: true (lange Einheit mit Renntempo), beinAnteil: für Rennen mit mehreren Disziplinen }
  // Version 15 (eigene Einheiten): if = feste Intensität (locker/mittel/hart), tssH = Kraft-TSS pro Stunde
  function einheitLast(s, o) {
    o = o || {};
    if (!s || !(+s.min > 0)) return { tss: 0, bein: 0, kreis: 0, if: null };
    const h = +s.min / 60;
    if (s.sport === 'kraft') { // schweres Krafttraining belastet vor allem die Muskulatur – Beine je nach Workout
      const beine = { kraft_unten: 0.9, kraft_lauf: 0.9, kraft_ganz: 0.5, kraft_oben: 0.05, kraft_rumpf: 0.2, kraft_explosiv: 0.95, kraft_schwimm: 0.1, kraft_rad: 0.85, kraft_erhalt: 0.3 }[s.typ], f = { stabil: 0.3, power: 0.8 }[o.kraftZiel] || 1;
      const tss = o.tssH != null ? h * o.tssH : h * 45 * (o.kraftZiel === 'stabil' ? 0.5 : 1);
      return { tss: Math.round(tss), bein: Math.round(+s.min * (beine == null ? 0.5 : beine) * f), kreis: Math.round(tss * 0.5), if: null };
    }
    if (s.sport === 'mobil') return { tss: Math.round(h * 15), bein: 0, kreis: Math.round(h * 8), if: null };
    let IF = o.if != null ? o.if : s.typ === 'rennen' ? (h > 8 ? 0.7 : h > 4 ? 0.77 : h > 2 ? 0.84 : h > 1 ? 0.9 : 0.97) : ((PLAN_IF[s.sport] || {})[s.typ]) || 0.68;
    if (s.typ === 'lang' && o.spez) IF += 0.04;
    const tss = h * IF * IF * 100, anteil = o.beinAnteil != null ? o.beinAnteil : BEIN_ANTEIL[s.sport] != null ? BEIN_ANTEIL[s.sport] : 0.5;
    return { tss: Math.round(tss), bein: Math.round(tss * anteil), kreis: Math.round(tss), if: +IF.toFixed(2) };
  }

  // Bein- gegen Kreislauf-Last je Tag, akut (7 Tage) gegen chronisch (28 Tage), exponentiell gewichtet (Williams et al., Br J
  // Sports Med 2017). Bein: Lauf-TSS × 1, Rad-TSS × 0,15, Sonstiges × 0,5, harte Beinsätze im Gym × 4 (schwere Beintage
  // wirken 24–48 h nach, Doma et al., Sports Med 2017), Garmin-Kraft ohne Gym-Eintrag zur Hälfte. Kreislauf: TSS der
  // Ausdauer, Kraft zur Hälfte. Mit plan: geplante Tage nach heute (für die Prognose).
  const BEIN_SATZ = 4;
  function lastKanaele(o) {
    const heute = o.heute, tage = o.tage || 120, von = plus(heute, -(tage - 1));
    const B = new Map(), K = new Map(), gymTag = new Map(), add = (m, d, v) => { if (v > 0) m.set(d, (m.get(d) || 0) + v); };
    (o.gym || []).forEach((g) => { if (g && /^\d{4}-\d\d-\d\d$/.test(g.d || '') && g.d <= heute) gymTag.set(g.d, (gymTag.get(g.d) || 0) + beinLast(g).last); });
    (o.belastung || []).forEach((b) => {
      if (!b || !/^\d{4}-\d\d-\d\d$/.test(b.date || '') || b.date > heute || b.sport === 'wechsel') return;
      const t = +b.tss || 0; if (!(t > 0)) return;
      if (b.sport === 'kraft') { add(K, b.date, t * 0.5); if (!gymTag.has(b.date)) add(B, b.date, t * 0.5); return; }
      add(K, b.date, t);
      add(B, b.date, t * (b.bein_anteil != null ? +b.bein_anteil : b.sport === 'run' ? 1 : b.sport === 'bike' ? 0.15 : b.sport === 'swim' ? 0 : 0.5)); // Version 16: eigene Einheiten bringen ihren Anteil mit
    });
    gymTag.forEach((v, d) => add(B, d, v * BEIN_SATZ));
    let bis = heute;
    (o.plan || []).forEach((p) => { if (p && p.date > heute) { add(B, p.date, +p.bein || 0); add(K, p.date, +p.kreis || 0); if (p.date > bis) bis = p.date; } });
    let first = von; [B, K].forEach((m) => m.forEach((_, d) => { if (d < first) first = d; }));
    if (first < plus(von, -365)) first = plus(von, -365);
    const seed = (m) => { let s = 0; for (let i = 0; i < 28; i++) s += m.get(plus(first, i)) || 0; return s / 28; };
    let b7 = seed(B), b28 = b7, k7 = seed(K), k28 = k7;
    const l7 = 2 / 8, l28 = 2 / 29, rows = [];
    for (let d = first; d <= bis; d = plus(d, 1)) {
      const b = B.get(d) || 0, k = K.get(d) || 0;
      b7 += l7 * (b - b7); b28 += l28 * (b - b28); k7 += l7 * (k - k7); k28 += l28 * (k - k28);
      if (d >= von) rows.push({ date: d, bein: Math.round(b), kreis: Math.round(k), bein_acwr: b28 >= 4 ? +(b7 / b28).toFixed(2) : null, kreis_acwr: k28 >= 8 ? +(k7 / k28).toFixed(2) : null, geplant: d > heute });
    }
    const jetzt = rows.filter((r) => r.date <= heute).pop() || null;
    return { rows, jetzt, deutung: kanalDeutung(jetzt) };
  }
  function kanalDeutung(r) {
    if (!r || r.bein_acwr == null || r.kreis_acwr == null) return null;
    const b = r.bein_acwr, k = r.kreis_acwr, stufe = (x) => (x > 1.5 ? 'rot' : 'gelb');
    if (b > 1.3 && b - k >= 0.15) return { art: 'bein', stufe: stufe(b) };
    if (k > 1.3 && k - b >= 0.15) return { art: 'kreis', stufe: stufe(k) };
    if (b > 1.3 && k > 1.3) return { art: 'beide', stufe: stufe(Math.max(b, k)) };
    if (b < 0.8 && k < 0.8) return { art: 'frisch', stufe: 'blau' };
    return { art: 'ok', stufe: 'gruen' };
  }

  // Formprognose (Banister): Fitness (42 Tage) und Ermüdung (7 Tage) vom letzten bekannten Stand mit der geplanten
  // Tageslast weitergerechnet; Form eines Tages = Fitness − Ermüdung des Vortags – wie in der App sonst auch.
  function formPrognose(o) { // o: { start: { date, ctl, atl }, last: { 'YYYY-MM-DD': TSS }, bis }
    if (!o || !o.start || !/^\d{4}-\d\d-\d\d$/.test(o.start.date || '') || !(+o.start.ctl >= 0) || !(+o.start.atl >= 0)) return [];
    const kC = 1 - Math.exp(-1 / 42), kA = 1 - Math.exp(-1 / 7), L = o.last || {};
    let ctl = +o.start.ctl, atl = +o.start.atl;
    const out = [];
    for (let d = plus(o.start.date, 1); d <= o.bis; d = plus(d, 1)) {
      const tss = +L[d] || 0, tsb = ctl - atl;
      ctl += kC * (tss - ctl); atl += kA * (tss - atl);
      out.push({ date: d, tss: Math.round(tss), ctl: +ctl.toFixed(1), atl: +atl.toFixed(1), tsb: +tsb.toFixed(1) });
    }
    return out;
  }

  // Überlastungs-Wächter: Tune drei Tage in Folge gesunken (zusammen mindestens 10 Punkte, zuletzt unter deinem
  // Median der letzten 4 Wochen) – und gleichzeitig hohe Last: ACWR ab 1,2, Form unter −15 oder die letzten 7 Tage über
  // 1,2× deinem Wochenschnitt. Dann lieber jetzt einen Entlastungstag als später eine Woche
  // (Meeusen et al., Med Sci Sports Exerc 2013 · Plews et al., IJSPP 2012).
  function ueberlastung(o) {
    const heute = o.heute;
    const S = (o.erholung || []).filter((r) => r && /^\d{4}-\d\d-\d\d$/.test(r.date || '') && r.date <= heute && r.score != null && isFinite(+r.score)).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (S.length < 10) return null;
    const L = S.slice(-4);
    if (L[3].date < plus(heute, -1)) return null;
    for (let i = 1; i < 4; i++) if (L[i].date !== plus(L[i - 1].date, 1) || +L[i].score >= +L[i - 1].score) return null;
    const abfall = +L[0].score - +L[3].score;
    const med = median(S.filter((r) => r.date > plus(L[3].date, -29) && r.date < L[1].date).map((r) => +r.score));
    if (abfall < 10 || (med != null && +L[3].score >= med)) return null;
    const P = (o.pmc || []).filter((r) => r && r.date && r.date <= L[3].date), p = P[P.length - 1] || {};
    const summe = (n) => P.filter((r) => r.date > plus(L[3].date, -n)).reduce((x, r) => x + (+r.tss || 0), 0);
    const s7 = summe(7), s28 = summe(28);
    const hoch = (p.acwr != null && +p.acwr >= 1.2) || (p.tsb != null && +p.tsb <= -15) || (s28 >= 150 && s7 >= 1.2 * (s28 / 4));
    if (!hoch) return null;
    return { von: L[0].date, bis: L[3].date, werte: L.map((r) => Math.round(+r.score)), abfall: Math.round(abfall), median: med == null ? null : Math.round(med), acwr: p.acwr != null ? +p.acwr : null, tsb: p.tsb != null ? Math.round(+p.tsb) : null, s7: Math.round(s7), schnitt7: Math.round(s28 / 4) };
  }

  // Kohlenhydrat-Anteil am Energieumsatz nach Intensität (grob nach Romijn et al., Am J Physiol 1993 · van Loon et al., J Physiol 2001)
  const KH_ANTEIL = [[0.4, 0.3], [0.55, 0.42], [0.65, 0.52], [0.72, 0.58], [0.78, 0.64], [0.85, 0.72], [0.92, 0.8], [1.05, 0.9]];
  function khAnteil(intens) {
    const x = +intens || 0.6, P = KH_ANTEIL;
    if (x <= P[0][0]) return P[0][1];
    for (let i = 1; i < P.length; i++) if (x <= P[i][0]) return P[i - 1][1] + ((x - P[i - 1][0]) / (P[i][0] - P[i - 1][0])) * (P[i][1] - P[i - 1][1]);
    return P[P.length - 1][1];
  }
  // Glykogen im Rennen, Minute für Minute: Speicher (Muskel ≈ 7 g/kg nach Carb-Loading + Leber ≈ 90 g) minus verbrannte
  // Kohlenhydrate plus verwertete Aufnahme – höchstens ~90 g/h (Glukose + Fruktose; Jeukendrup, Sports Med 2014).
  // Eine grobe Schätzung zum Planen, keine Messung.
  // o: { abschnitte: [{ typ, sek, kcalH, intens }], aufnahme: [{ t: Minute ab Start, g }], raten: [{ von, bis, gh }], kg, speicherG, exoMax }
  function rennVerlauf(o) {
    const A = (o && o.abschnitte || []).filter((a) => a && +a.sek > 0), kg = +o.kg > 30 ? +o.kg : 75, exoMax = +o.exoMax > 0 ? +o.exoMax : 90;
    const start = +o.speicherG > 0 ? +o.speicherG : Math.round(kg * 7 + 90);
    const T = Math.max(1, Math.round(A.reduce((x, a) => x + +a.sek, 0) / 60));
    const ein = new Array(T + 1).fill(0);
    (o.aufnahme || []).forEach((x) => { if (x && +x.g > 0) ein[Math.max(0, Math.min(T, Math.round(+x.t)))] += +x.g; });
    (o.raten || []).forEach((r) => { if (r && +r.gh > 0) for (let m = Math.max(0, Math.round(r.von)); m < Math.min(T, Math.round(r.bis)); m++) ein[m] += +r.gh / 60; });
    // Unter einem Viertel des Speichers kann der Muskel ihn nicht mehr im selben Tempo nutzen: Der Körper weicht auf Fett
    // aus, das geplante Tempo ist dann kaum noch zu halten („Mann mit dem Hammer“). Ab dort zählt die Kurve langsamer.
    const knapp = start * 0.25;
    let glyk = start, gegessen = 0, verbraucht = 0, darm = 0, verwertet = 0, li = 0, ende = A.length ? A[0].sek / 60 : T, unter = null;
    const P = [];
    for (let m = 0; m <= T; m++) {
      while (li < A.length - 1 && m >= ende) { li++; ende += A[li].sek / 60; }
      const a = A[li] || { kcalH: 600, intens: 0.6 }, khH = (+a.kcalH * khAnteil(a.intens)) / 4.1;
      darm += ein[m]; gegessen += ein[m];
      const exo = Math.min(darm, exoMax / 60, khH / 60); darm -= exo; verwertet += exo;
      const bedarf = khH / 60 - exo, nutz = glyk < knapp ? bedarf * (0.35 + (0.65 * glyk) / knapp) : bedarf;
      glyk = Math.max(0, glyk - nutz); verbraucht += exo + nutz;
      if (unter == null && glyk < knapp) unter = m;
      P.push({ m, leg: li, glyk: Math.round(glyk), pct: Math.round((100 * glyk) / start), gegessen: Math.round(gegessen), verbraucht: Math.round(verbraucht), verwertet: Math.round(verwertet), khH: Math.round(khH) });
    }
    const tief = P.reduce((mn, x) => (x.glyk < mn.glyk ? x : mn), P[0]);
    return { start, T, punkte: P, tief, ende: P[P.length - 1], unter25: unter };
  }

  /* ---------- Version 16: Leistungsprognose zum Renntag ----------
     Wie viel FTP, Schwellentempo und CSS bis zum Rennen typischerweise wachsen – als Spanne, nicht als Versprechen.
     Je trainierter, desto kleiner der Zuwachs (Jones & Carter, Sports Med 2000; Bacon et al., PLoS One 2013; Laursen &
     Jenkins, Sports Med 2002). Der Zuwachs flacht ab: Anteil = 1 − e^(−Wochen/12), gerechnet vom Planstart bis zum Beginn
     des Taperings. Untere Grenze: Zuwachs × Plan-Treue der letzten 4 Wochen (÷ 0,9, zwischen 0,3 und 1); obere: fast alles
     klappt. Tempo-Werte (Sekunden je Strecke) werden um denselben Anteil schneller: Tempo ÷ (1 + Zuwachs). */
  const PROG = {
    einsteiger: { ftp: [0.08, 0.18], lauf: [0.05, 0.12], css: [0.04, 0.10] },
    fortgeschritten: { ftp: [0.04, 0.09], lauf: [0.03, 0.07], css: [0.02, 0.06] },
    ambitioniert: { ftp: [0.015, 0.05], lauf: [0.01, 0.04], css: [0.01, 0.03] },
  };
  const PROG_TAU = 12;
  function leistungsPrognose(o) {
    // o: { niveau, start (Planstart), heute, ende (Beginn Tapering oder Renntag), treue (0–1 oder null),
    //      werte: { ftp|lauf|css: { jetzt, tempo, basis?, seit? } }, tests: { ftp|lauf|css: Datum } }
    if (!o || !/^\d{4}-\d\d-\d\d$/.test(o.start || '') || !/^\d{4}-\d\d-\d\d$/.test(o.ende || '') || !/^\d{4}-\d\d-\d\d$/.test(o.heute || '')) return null;
    const C = PROG[o.niveau] || PROG.fortgeschritten, f = (w) => 1 - Math.exp(-Math.max(0, w) / PROG_TAU);
    const wo = (a, b) => (Date.parse(b) - Date.parse(a)) / (7 * DAY);
    const T = Math.max(0, wo(o.start, o.ende)), e = Math.min(T, Math.max(0, wo(o.start, o.heute)));
    const q = o.treue == null || !isFinite(o.treue) ? 1 : Math.max(0.3, Math.min(1, o.treue / 0.9));
    const werte = {};
    Object.keys(o.werte || {}).forEach((k) => {
      const v = o.werte[k], cap = C[k]; if (!v || !cap || !(+v.jetzt > 0)) return;
      const an = (x, g) => (v.tempo ? x / (1 + g) : x * (1 + g)), besser = (a, b) => (v.tempo ? a < b : a > b);
      const rest = Math.max(0, f(T) - f(e)), g = [cap[0] * q * rest, cap[1] * rest];
      const r = { jetzt: +v.jetzt, tempo: !!v.tempo, gewinn: g, ziel: [an(+v.jetzt, g[0]), an(+v.jetzt, g[1])] };
      if (+v.basis > 0 && v.seit && v.seit >= o.start && v.seit <= o.heute) { // nach Planstart neu gemessen: im erwarteten Bereich?
        const ew = f(Math.min(T, wo(o.start, v.seit))), erw = [an(+v.basis, cap[0] * q * ew), an(+v.basis, cap[1] * ew)];
        r.stand = { basis: +v.basis, seit: v.seit, erw, lage: besser(+v.jetzt, erw[1]) ? 'drueber' : besser(erw[0], +v.jetzt) ? 'drunter' : 'im' };
      }
      const t = o.tests && o.tests[k];
      if (t && t > o.heute && t <= o.ende) { const ft = Math.max(0, f(Math.min(T, wo(o.start, t))) - f(e)); r.test = { datum: t, wert: [an(+v.jetzt, cap[0] * q * ft), an(+v.jetzt, cap[1] * ft)] }; }
      werte[k] = r;
    });
    return { werte, wochen: T, vergangen: e, rest: Math.max(0, T - e), treue: o.treue == null ? null : o.treue, q };
  }

  /* ---------- Version 52: Kraft-Effekt – was dein Krafttraining für Rad und Laufen erwarten lässt ----------
     Schweres Krafttraining verbessert die Ökonomie: beim Laufen im Mittel um etwa 4 % (Denadai et al., Sports Med 2017;
     2–8 % bei Blagrove et al., Sports Med 2018), beim Radfahren um knapp 5 % (Sunde et al., J Strength Cond Res 2010) –
     auch bei Triathleten (Millet et al., Med Sci Sports Exerc 2002; Luckin-Baldwin et al., Int J Sports Physiol Perform 2021)
     und noch nach 90 Minuten Belastung (Zanini et al., Med Sci Sports Exerc 2025). Die Studien trainierten zweimal pro
     Woche über 8 bis 26 Wochen; einmal pro Woche hält das Erreichte (Rønnestad et al., Eur J Appl Physiol 2010), acht
     Wochen ohne Kraft kosten es wieder (Rønnestad et al., Int J Sports Physiol Perform 2016).
     Das Modell verlangt beides – mehr Kraft und Regelmäßigkeit:
       Anteil einer Einheit  wirksame Bein-Sätze ÷ 4, höchstens 1. Schwer (bis 8 Wiederholungen mit Gewicht) zählt voll,
                             9–12 zu 0,7, 13–20 zu 0,4, mehr zu 0,2, ohne Gewicht 0,3; Sprünge zählen fürs Laufen voll
       Woche                 S = min(1, Summe der Anteile ÷ 2)
       Reiz                  R ← R + 0,12 · S · (1 − R) − 0,15 · max(0, 1 − 2 S) · R      (0 … 1; die laufende Woche baut nicht ab)
       Kraftzuwachs          x = Beinkraft-Index − 1: geschätztes Maximum gegen den eigenen Anker, Höchstwert aus 12 Wochen
       Effekt                Kappe · min(R, 1 − e^(−x ÷ 0,25))   Kappe: Laufen 6 %, Rad 4 % · Spanne × 0,5 bis × 1,5
     Mit 10 Wochen, zweimal pro Woche und 25 % mehr Kraft ergibt das 3,8 % (Laufen) – die Mitte der Studien.
     Eine Schätzung aus Gruppenmitteln, kein Messwert: Der nächste Leistungstest ersetzt sie (o.seit). */
  const KRAFT = { auf: 0.12, ab: 0.15, tau: 0.25, soll: 4, kappe: { rad: 0.04, lauf: 0.06 }, hoch: { rad: 0.06, lauf: 0.08 }, band: [0.5, 1.5], wochenMax: 104, zFenster: 12 };
  const kraftLast = (s) => (s.sprung ? 1 : !(+s.kg > 0) ? 0.3 : +s.wdh <= 8 ? 1 : +s.wdh <= 12 ? 0.7 : +s.wdh <= 20 ? 0.4 : 0.2);
  function kraftAnteil(saetze) { // saetze: [{ w: [Rad, Laufen] (wie stark die Übung die Beine trifft, 0–1), kg, wdh, sprung }] → Anteil der Einheit je Disziplin
    let rad = 0, lauf = 0, n = 0;
    (saetze || []).forEach((s) => {
      if (!s || !Array.isArray(s.w) || !(+s.wdh > 0)) return;
      const f = kraftLast(s); rad += f * (+s.w[0] || 0); lauf += f * (+s.w[1] || 0); n++;
    });
    return { n, satzRad: rad, satzLauf: lauf, rad: Math.min(1, rad / KRAFT.soll), lauf: Math.min(1, lauf / KRAFT.soll) };
  }
  function kraftEffekt(o) {
    // o: { wochen: [{ mo (Montag), rad, lauf (Summe der Anteile), idx (Beinkraft-Index oder null) }], heute, seit: { rad, lauf } (seit wann der Schwellenwert gilt) }
    const TAG = (x) => typeof x === 'string' && /^\d{4}-\d\d-\d\d$/.test(x);
    const null3 = () => ({ m: 0, lo: 0, hi: 0 });
    const leer = { n: 0, reiz: { rad: 0, lauf: 0 }, index: 1, zuwachs: 0, effekt: { rad: null3(), lauf: null3() }, seit: { rad: null3(), lauf: null3() }, woche: { rad: 0, lauf: 0 }, wochen: [], ruht: 0 };
    if (!o || !TAG(o.heute)) return leer;
    const mo0 = montag(o.heute), W = (o.wochen || []).filter((w) => w && TAG(w.mo) && w.mo <= mo0).sort((a, b) => (a.mo < b.mo ? -1 : 1));
    if (!W.length) return leer;
    const wo = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / (7 * DAY));
    let start = W[0].mo; if (wo(start, mo0) + 1 > KRAFT.wochenMax) start = plus(mo0, -7 * (KRAFT.wochenMax - 1));
    const n = wo(start, mo0) + 1, je = new Map(W.map((w) => [w.mo, w])), R = { rad: 0, lauf: 0 }, F = [], g = (x) => 1 - Math.exp(-Math.max(0, x) / KRAFT.tau);
    for (let i = 0; i < n; i++) {
      const mo = plus(start, 7 * i), w = je.get(mo) || {}, laufend = mo === mo0, idx = +w.idx > 0 ? +w.idx : null;
      ['rad', 'lauf'].forEach((d) => { const S = Math.min(1, Math.max(0, +w[d] || 0) / 2); R[d] = Math.max(0, Math.min(1, R[d] + KRAFT.auf * S * (1 - R[d]) - (laufend ? 0 : KRAFT.ab * Math.max(0, 1 - 2 * S) * R[d]))); });
      let z = 1; for (let j = Math.max(0, i - KRAFT.zFenster + 1); j < i; j++) if (F[j].idx != null) z = Math.max(z, F[j].idx);
      if (idx != null) z = Math.max(z, idx);
      F.push({ mo, rad: +w.rad || 0, lauf: +w.lauf || 0, idx, z, R: { rad: R.rad, lauf: R.lauf } });
    }
    const eff = (f, d) => { const m = KRAFT.kappe[d] * Math.min(f.R[d], g(f.z - 1)); return { m, lo: m * KRAFT.band[0], hi: Math.min(KRAFT.hoch[d], m * KRAFT.band[1]) }; };
    const jetzt = F[F.length - 1], out = { n: W.length, reiz: { rad: jetzt.R.rad, lauf: jetzt.R.lauf }, index: jetzt.z, zuwachs: jetzt.z - 1, effekt: { rad: eff(jetzt, 'rad'), lauf: eff(jetzt, 'lauf') }, seit: {}, woche: { rad: jetzt.rad, lauf: jetzt.lauf } };
    // In die Prognose gehört nur, was seit dem letzten Test dazukam – alles davor steckt schon im gemessenen Schwellenwert
    ['rad', 'lauf'].forEach((d) => {
      const t = o.seit && TAG(o.seit[d]) ? o.seit[d] : null, e1 = out.effekt[d];
      const k = t ? wo(start, montag(t)) - 1 : -1, e0 = k >= 0 ? eff(F[Math.min(k, F.length - 1)], d) : null3(); // Stand am Ende der Woche vor dem Test
      const m = Math.max(0, e1.m - e0.m);
      out.seit[d] = { m, lo: m * KRAFT.band[0], hi: Math.min(KRAFT.hoch[d], m * KRAFT.band[1]), davor: e0.m };
    });
    let ruht = 0; for (let i = F.length - 1; i >= 0 && !(F[i].rad > 0 || F[i].lauf > 0); i--) ruht++; // Wochen in Folge ohne wirksame Einheit (die laufende zählt mit)
    out.ruht = ruht;
    out.wochen = F.slice(-12).map((f) => ({ mo: f.mo, rad: f.rad, lauf: f.lauf, idx: f.idx, reiz: f.R }));
    return out;
  }

  const motor = { CK_TAGS, top3, trend, zeitraum, wochen, momente, MONATE, bilanz, nachmittagstief, RUECKKEHR, rueckkehr, experimentVergleich, DAY, plus, montag, wtag, uhrzeit, minVon, median, wasserZiel, proteinZiel, schrittZiel, tagesFenster, tagesTyp, KH_STUFEN, khBedarf, schluessel, flasche, briefing, BEINE, beinLast, interferenz, BEDINGUNG, schweissRate, schweissProfil, matKat, materialStand, vergleich, mitOhne, wochenBilanz, wochenText, katVon, welch, bhQ, pWert, einfluss, einflussText, EINFLUSS_ZIELE, fruehwarnung, socialJetlag, TERMIN_ART, terminPlan, wetterTipps, fokusBlock, efTrend,
    PLAN_IF, einheitLast, lastKanaele, kanalDeutung, formPrognose, ueberlastung, khAnteil, rennVerlauf, PROG, leistungsPrognose, KRAFT, kraftAnteil, kraftEffekt };
  if (typeof module === 'object' && module && module.exports) module.exports = motor;
  else global.tfAlltagMotor = motor;
})(typeof window !== 'undefined' ? window : this);
