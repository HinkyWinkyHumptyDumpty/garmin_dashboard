/* Tagesform · Rechnungen für Alltag und Leistung (Version 8) – ohne Darstellung.
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
    const bett = aufMin + 1440 - bedarf - 15 - frueher; // Minuten ab heute 0 Uhr (über 1440 = nach Mitternacht)
    return {
      auf: aufMin, quelle: o.quelle || (o.aufwachMin != null ? 'eingetragen' : 'standard'), bedarf, frueher,
      licht: auf(aufMin + 60, 15),
      fokus: [rund(aufMin + 150, 30), rund(aufMin + 330, 30)],
      tief: [rund(aufMin + 390, 30), rund(aufMin + 510, 30)],
      koffein: ab(bett - 528, 15), essen: ab(bett - 180, 15), dimmen: ab(bett - 60, 15), bett: ab(bett, 15),
    };
  }
  // Tagestyp für den Alltag: Fokus-Tag, normaler Tag oder Schon-Tag – aus Tagesform, Schlaf und Check-in
  function tagesTyp(o) {
    o = o || {};
    const bedarf = +o.schlafbedarfMin || 480, sl = o.schlafMin != null ? +o.schlafMin : null;
    let id = o.ampel === 'gruen' ? 'fokus' : o.ampel === 'rot' ? 'schon' : 'normal', grund = '';
    if (sl != null && sl < 0.75 * bedarf && id === 'fokus') { id = 'normal'; grund = 'kurze Nacht'; }
    if (sl != null && sl < 0.6 * bedarf) { id = 'schon'; grund = 'sehr kurze Nacht'; }
    if (o.krank) { id = 'schon'; grund = 'Krankheitsgefühl'; }
    else if (o.stress != null && o.stress <= 2 && id === 'fokus') { id = 'normal'; grund = 'viel Stress'; }
    if (!grund) grund = o.ampel === 'gruen' ? 'Tagesform grün' : o.ampel === 'rot' ? 'Tagesform rot' : o.ampel === 'gelb' ? 'Tagesform gelb' : '';
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
  const HART_LAUF = ['schwelle', 'vo2', 'renntempo', 'fahrtspiel', 'test'];
  function interferenz(o) { // o: { gym: Log-Einträge, datum, einheiten: geplante Einheiten dieses Tages }
    const log = (o.gym || []).filter((e) => e && e.d);
    const summe = (d) => log.filter((e) => e.d === d).reduce((x, e) => { const b = beinLast(e); return { saetze: x.saetze + b.saetze, last: x.last + b.last }; }, { saetze: 0, last: 0 });
    const L0 = summe(o.datum), L1 = summe(plus(o.datum, -1)), L2 = summe(plus(o.datum, -2));
    const lauf = (o.einheiten || []).filter((s) => s && s.sport === 'laufen');
    const hart = lauf.find((s) => s.hart >= 2 || HART_LAUF.includes(s.typ)), lang = lauf.find((s) => s.typ === 'lang');
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

  const motor = { DAY, plus, montag, wtag, uhrzeit, minVon, median, wasserZiel, proteinZiel, schrittZiel, tagesFenster, tagesTyp, KH_STUFEN, khBedarf, schluessel, flasche, briefing, BEINE, beinLast, interferenz, BEDINGUNG, schweissRate, schweissProfil, matKat, materialStand, vergleich, mitOhne, wochenBilanz, wochenText, katVon };
  if (typeof module === 'object' && module && module.exports) module.exports = motor;
  else global.tfAlltagMotor = motor;
})(typeof window !== 'undefined' ? window : this);
