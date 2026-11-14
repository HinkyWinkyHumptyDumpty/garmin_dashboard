/* Dreiklang · Rennen (Version 20)
   Der Bereich für das Ziel: Weltkarte und Kalender mit (seit Version 26) fast 500 Rennen (Ironman, 70.3, Challenge, die größten Marathons und
   Halbmarathons in Deutschland, die World Marathon Majors), je Rennen eine Streckenseite mit Höhenprofil, Fakten, deiner
   Prognose auf genau dieser Strecke (Rennrechner-Modell mit dem Profil) und Pacing je Anstieg – dazu „Als Ziel setzen“.
   Rechnungen: Rad nach Martin et al. 1998 (P·η = ½ρ·CdA·v³ + (Crr·m·g·cosθ + m·g·sinθ)·v) Abschnitt für Abschnitt über das
   Profil; Laufen mit der Faustregel für Steigungen (+3,5 % je 1 % bergauf, −1,8 % je 1 % bergab, Minetti et al. 2002 als
   Grundlage); Hitze nach Ely et al. 2007 (+4 % Lauf, +1 % Rad); Schwimmen nach Gewässer (Meer +4 %, See +2 %, Strömung −10 %)
   und mit Neopren −3 % (Tomikawa et al. 2008). Alles sind Richtwerte – die Ausschreibung des Veranstalters hat das letzte Wort.
   Version 26: rund 490 Rennen – dazu lokale Triathlons von Sprint bis Langdistanz und Ultras. Filter nach Distanz (ein Rennen mit
   mehreren Distanzen zählt bei jeder), Veranstalter (Ironman, Challenge, andere) und Region; der Kalender zeigt je Monat zuerst die
   größten Rennen, der Rest klappt auf. Auf der Streckenseite lässt sich die Distanz wählen (Profil, Prognose, „Als Ziel setzen“).
   Geschätzte Höhenmeter (kleine Rennen ohne Angabe) zählen nicht für Ranglisten und „Passt zu mir“; Ultras und Extrem-Triathlons
   bekommen keine Prognose. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten, DATEN = window.tfRennenDaten;
  if (!T || !S || !DATEN) return;
  const { $, el, svg, nf, rowsOf, svgIco, localDate, col, setMsg, zeile } = T.ui;
  const { R, SERIE, LAND, EUROPA, TAG, MON } = DATEN;
  const LIGA = DATEN.LIGA || {}; // Version 27
  const STD = DATEN.STD || {}, DNAME = DATEN.DNAME || {};
  const A = () => dash.app;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const BY = Object.fromEntries(R.map((r) => [r.id, r]));
  const hms = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const tausend = (n) => nf(Math.round(n));
  // Version 26: Distanzgruppe je Serie, weitere Distanzen beim selben Rennen („auch“) und abweichende Strecken („km“)
  const GRUPPE = { im: 'ld', ch: 'ld', ld: 'ld', im703: 'md', chm: 'md', md: 'md', od: 'od', sd: 'sprint', m: 'm', hm: 'hm', ul: 'ultra' };
  const DACH = ['DE', 'AT', 'CH'];
  const distListe = (r) => [GRUPPE[r.serie]].concat((r.auch || []).filter((d) => d !== GRUPPE[r.serie]));
  const distanzen = (r, dk) => {
    const S0 = SERIE[r.serie], k = dk && distListe(r).includes(dk) ? dk : GRUPPE[r.serie], haupt = k === GRUPPE[r.serie], std = STD[k] || [S0.swim, S0.rad, S0.lauf], x = (r.km && r.km[k]) || null;
    return { swim: x ? x[0] : std[0], rad: x ? x[1] : haupt && r.radKm ? r.radKm : std[1], lauf: x ? x[2] : haupt && r.laufKm ? r.laufKm : std[2], tri: S0.sport === 'tri', k, haupt };
  };
  const distText = (r) => distListe(r).map((d) => DNAME[d] || SERIE[r.serie].kurz).join(' + ');
  const titelLand = (r) => r.ort + ', ' + (LAND[r.land] || r.land);
  const hmText = (r, H) => (r.geschaetzt ? 'ca. ' : '') + nf(H) + ' hm';
  const istUltra = (r) => GRUPPE[r.serie] === 'ultra';
  const keinePrognose = (r, dk) => (dk || GRUPPE[r.serie]) === 'ultra' || (r.tags || []).includes('extrem');
  const WAHL = {}; // gewählte Distanz je Rennen (Streckenseite)
  const kmZahl = (x) => nf(x, Math.round(x * 100) % 10 ? 2 : x % 1 ? 1 : 0); // 0,75 · 42,2 · 180
  const suchLink = (r) => 'https://duckduckgo.com/?q=' + encodeURIComponent(r.name + ' ' + (r.ort || '') + ' ' + naechstesJahr(r.mon));

  /* =====================================================================
     Höhenprofile: nach Streckenbeschreibung (Stützpunkte) oder schematisch aus Höhenmetern und Charakter
     ===================================================================== */
  const seed = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  function interpol(pts, D, n) { // Stützpunkte [[km, m]] → n Punkte, linear mit leichter Glättung
    const out = [];
    for (let i = 0; i <= n; i++) {
      const x = (D * i) / n; let j = 0;
      while (j < pts.length - 2 && pts[j + 1][0] < x) j++;
      const [x0, y0] = pts[j], [x1, y1] = pts[Math.min(j + 1, pts.length - 1)];
      out.push([x, x1 > x0 ? y0 + ((x - x0) * (y1 - y0)) / (x1 - x0) : y0]);
    }
    for (let k = 0; k < 2; k++) for (let i = 1; i < out.length - 1; i++) out[i][1] = (out[i - 1][1] + 2 * out[i][1] + out[i + 1][1]) / 4;
    return out;
  }
  function schema(id, D, H, tags, runden, n, fein, viele) { // schematisch: Hügel als weiche Buckel, Summe der Anstiege = Höhenmeter; fein = viele kleine Wellen; viele = lange Läufe mit vielen Anstiegen (Version 26)
    const z = rng(seed(id + D)), rd = Math.max(1, runden || 1), L = D / rd;
    const art = tags.includes('bergig') ? 'bergig' : tags.includes('huegelig') ? 'huegelig' : tags.includes('wellig') ? 'wellig' : 'flach';
    const K = fein ? [14 + Math.round(z() * 8), 0.02, 0.05] : viele && art !== 'flach' ? [Math.max(6, Math.round(D / 14)) + Math.round(z() * 3), 0.02, 0.05] : art === 'bergig' ? [1 + Math.round(z()), 0.22, 0.36] : art === 'huegelig' ? [3 + Math.round(z() * 2), 0.06, 0.12] : art === 'wellig' ? [5 + Math.round(z() * 3), 0.05, 0.1] : [7 + Math.round(z() * 4), 0.04, 0.08];
    const huegel = [];
    for (let i = 0; i < K[0]; i++) huegel.push({ c: 0.08 + z() * 0.84, l: K[1] + z() * (K[2] - K[1]), g: 0.6 + z() * 0.8 });
    const welle = 0.3 + z() * 0.5, phase = z() * 6.28;
    const hoehe = (x) => { // x in 0..1 der Runde
      let y = 0;
      huegel.forEach((h) => { const t = (x - (h.c - h.l / 2)) / h.l; if (t > 0 && t < 1) y += h.g * (1 - Math.cos(2 * Math.PI * t)) / 2; });
      return y + welle * 0.15 * Math.sin(2 * Math.PI * x * 2 + phase) + 0.05 * Math.sin(2 * Math.PI * x * 7 + phase * 2);
    };
    const roh = [];
    for (let i = 0; i <= n; i++) { const x = (D * i) / n, u = ((x % L) / L + 1) % 1; roh.push([x, hoehe(u)]); }
    for (let k = 0; k < 3; k++) for (let i = 1; i < roh.length - 1; i++) roh[i][1] = (roh[i - 1][1] + 2 * roh[i][1] + roh[i + 1][1]) / 4;
    let auf = 0; for (let i = 1; i < roh.length; i++) auf += Math.max(0, roh[i][1] - roh[i - 1][1]);
    const f = auf > 0 ? H / auf : 0, basis = 20 + z() * 60;
    return roh.map(([x, y]) => [x, basis + y * f]);
  }
  const PC = new Map(); // Version 26: Profile einmal rechnen – Karte, Kalender und Statistik brauchen sie oft
  function profil(r, disz, dk) { // → { pts: [[km, m]], D, H, art: 'beschrieben' | 'schema' }
    const d = distanzen(r, dk), D = disz === 'rad' ? d.rad : d.lauf; if (!D) return null;
    const key = r.id + '|' + disz + '|' + d.k; if (PC.has(key)) return PC.get(key);
    const out = profilNeu(r, disz, d, D); PC.set(key, out); return out;
  }
  function profilNeu(r, disz, d, D) {
    let H = disz === 'rad' ? r.hmRad || 0 : r.hmLauf || 0;
    if (!d.haupt) { const d0 = distanzen(r), D0 = disz === 'rad' ? d0.rad : d0.lauf; if (D0) H = Math.round((H * D) / D0 / 10) * 10; } // andere Distanz: Höhenmeter anteilig
    const n = Math.max(80, Math.min(240, Math.round(D * 2)));
    const hand = d.haupt && r.profil && r.profil[disz], runden = d.haupt ? (disz === 'rad' ? r.radRunden : r.laufRunden) : 1;
    let pts = hand ? interpol(hand, D, n) : schema(r.id + ':' + disz + (d.haupt ? '' : ':' + d.k), D, H, r.tags || [], runden, n, false, disz === 'lauf' && D > 50);
    const ascent = (L) => { let a0 = 0; for (let i = 1; i < L.length; i++) a0 += Math.max(0, L[i][1] - L[i - 1][1]); return a0; };
    if (hand && H > 0) { // große Anstiege wie beschrieben; was an Höhenmetern fehlt, sind kleine Wellen dazwischen
      const fehlt = H - ascent(pts);
      if (fehlt > 0.15 * H) { const W0 = schema(r.id + ':welle:' + disz, D, fehlt, ['flach'], runden, n, true); const mnW = Math.min(...W0.map((p) => p[1])); pts = pts.map(([x, y], i) => [x, y + (W0[i][1] - mnW)]); }
    }
    let maxG = 0; for (let i = 1; i < pts.length; i++) maxG = Math.max(maxG, (pts[i][1] - pts[i - 1][1]) / ((pts[i][0] - pts[i - 1][0]) * 1000));
    return { pts, D, H: H || Math.round(ascent(pts) / 10) * 10, art: hand ? 'beschrieben' : 'schema', maxG, runden };
  }
  // Anstiege im Profil: zusammenhängende Stücke mit mehr als 2 % und genug Höhengewinn
  function anstiege(P, minGain) {
    const out = []; let akt = null;
    for (let i = 1; i < P.pts.length; i++) {
      const [x0, y0] = P.pts[i - 1], [x1, y1] = P.pts[i], g = (y1 - y0) / ((x1 - x0) * 1000);
      if (g > 0.02) { if (!akt) akt = { von: x0, bis: x1, gain: 0, y0 }; akt.bis = x1; akt.gain += y1 - y0; }
      else if (akt) { out.push(akt); akt = null; }
    }
    if (akt) out.push(akt);
    const M = []; // nahe Anstiege zusammenfassen (Lücke unter 1 km)
    out.forEach((a) => { const l = M[M.length - 1]; if (l && a.von - l.bis < 1) { l.bis = a.bis; l.gain += a.gain; } else M.push(Object.assign({}, a)); });
    return M.filter((a) => a.gain >= minGain).map((a) => Object.assign(a, { laenge: a.bis - a.von, pct: a.gain / ((a.bis - a.von) * 1000) * 100 })).sort((x, y) => y.gain - x.gain).slice(0, 5).sort((x, y) => x.von - y.von);
  }

  /* =====================================================================
     Prognose auf dieser Strecke – Rennrechner-Modell mit dem Höhenprofil
     ===================================================================== */
  const mitte = (b) => (b[0] + b[1]) / 2;
  function vAt(p, g, ph) { // Tempo bei Leistung p und Steigung g (Martin et al. 1998)
    const th = Math.atan(g), F = ph.crr * ph.m * 9.81 * Math.cos(th) + ph.m * 9.81 * Math.sin(th), k = 0.5 * ph.rho * ph.cda, P = ph.eta * p;
    let lo = 0.3, hi = 32;
    for (let i = 0; i < 40; i++) { const v = (lo + hi) / 2; if (k * v * v * v + F * v > P) hi = v; else lo = v; }
    return (lo + hi) / 2;
  }
  function radZeit(r, a, P, pacing, watt, ifMax) { // Zeit über das Profil, mit Leistung je Steigung · Version 26: Leistung und Obergrenze als Werte (das Profil ist zwischengespeichert)
    const ph = { cda: +a.cda_m2 || 0.3, crr: +a.crr || 0.004, m: (+a.gewicht_ref_kg || 75) + (+a.rad_kg || 10), rho: +a.luftdichte || 1.2, eta: +a.antrieb_eta || 0.976 };
    const Pmax = (+a.ftp_ref_w || 220) * (ifMax || +a.rad_if_max || 0.75) * 1.08, segs = []; let t = 0, work = 0, p4 = 0; // Obergrenze am Berg aus dem Band der Distanz (Langdistanz: dein Renn-Korridor)
    const wind = (r.tags || []).includes('windig') ? 1.03 : 1, heiss = (r.tags || []).includes('heiss') ? 1.01 : 1;
    for (let i = 1; i < P.pts.length; i++) {
      const [x0, y0] = P.pts[i - 1], [x1, y1] = P.pts[i], dx = (x1 - x0) * 1000, g = (y1 - y0) / dx;
      let p = pacing ? (g > 0.03 ? Math.min(Pmax, watt * 1.08) : g < -0.03 ? watt * 0.6 : watt) : watt;
      let v = vAt(p, g, ph); if (g < -0.04) v = Math.min(v, 17); else v = Math.min(v, 20); // Abfahrten: 61–72 km/h sind genug
      const dt = (dx / v) * wind * heiss;
      segs.push({ km: x1, g, p, v: v / wind, t: t + dt }); t += dt; work += p * dt; p4 += p ** 4 * dt;
    }
    return { t, segs, avg: work / t, np: Math.pow(p4 / t, 0.25), kj: work / 1000 };
  }
  function laufZeit(r, pace, P) { // Faustregel: +3,5 % je 1 % bergauf, −1,8 % je 1 % bergab (höchstens −8 %)
    const heiss = (r.tags || []).includes('heiss') ? 1.04 : 1; let t = 0;
    for (let i = 1; i < P.pts.length; i++) {
      const [x0, y0] = P.pts[i - 1], [x1, y1] = P.pts[i], dx = x1 - x0, g = (y1 - y0) / (dx * 1000);
      const f = g >= 0 ? 1 + 3.5 * g : Math.max(0.92, 1 + 1.8 * g);
      t += pace * dx * f * heiss;
    }
    return t;
  }
  function prognose(r, dk, a2) { // → { teile: [{ id, name, s, sub }], gesamt, annahmen: [], ziel: { ... } | null } · dk: gewählte Distanz (Version 26) · a2: abweichende Athletenwerte (Version 47)
    const a = a2 ? Object.assign({}, athlet(), a2) : athlet(), S0 = SERIE[r.serie], d = distanzen(r, dk); if (keinePrognose(r, d.k)) return null;
    const item = window.tfDistanz ? tfDistanz(S0.sport, d.k) : null; if (!item) return null;
    const tags = r.tags || [], teile = [], annahmen = [];
    const legs = item.legs, swim = legs.find((l) => l.typ === 'swim'), bike = legs.find((l) => l.typ === 'bike'), runs = legs.filter((l) => l.typ === 'run'), t1 = legs.find((l) => l.typ === 't1'), t2 = legs.find((l) => l.typ === 't2');
    if (swim) {
      const css = +a.css_s_100m || 120, pool = css / mitte(swim.band);
      const wasser = tags.includes('strom') ? 0.9 : r.swim === 'meer' ? 1.04 : r.swim === 'see' ? 1.02 : 1.01, neo = swim.neo ? 1 / 1.03 : 1;
      const s = pool * d.swim * 10 * wasser * neo;
      teile.push({ id: 'swim', name: 'Schwimmen', s, sub: kmZahl(d.swim) + ' km · ' + hms(s / (d.swim * 10)) + ' /100 m' });
      annahmen.push('Schwimmen aus deiner CSS (' + hms(css) + ' /100 m)' + (tags.includes('strom') ? ', mit Strömung' : r.swim === 'meer' ? ', im Meer etwas langsamer' : '') + ', mit Neopren');
      if (t1) teile.push({ id: 't1', name: 'Wechsel 1', s: t1.s, sub: '' });
    }
    let radP = null;
    if (bike) {
      const P = profil(r, 'rad', d.k), IF = bike.band === 'profil' ? mitte([+a.rad_if_min || 0.65, +a.rad_if_max || 0.75]) : mitte(bike.band), watt = Math.round((+a.ftp_ref_w || 220) * IF);
      const ifMax = bike.band === 'profil' ? +a.rad_if_max || 0.75 : bike.band[1];
      radP = radZeit(r, a, P, true, watt, ifMax);
      teile.push({ id: 'bike', name: 'Rad', s: radP.t, sub: kmZahl(d.rad) + ' km · ' + Math.round(radP.avg) + ' W Ø · ' + nf((d.rad * 1000) / radP.t * 3.6, 1) + ' km/h', watt, ifMax, np: Math.round(radP.np), P });
      annahmen.push('Rad mit ' + watt + ' W (' + Math.round(IF * 100) + ' % von ' + (a.ftp_ref_w || 220) + ' W FTP), CdA ' + nf(+a.cda_m2 || 0.3, 2) + ' m², ' + (P.art === 'beschrieben' ? 'Profil nach Streckenbeschreibung' : 'schematischem Profil') + (tags.includes('windig') ? ', Wind eingerechnet' : ''));
      if (t2) teile.push({ id: 't2', name: 'Wechsel 2', s: t2.s, sub: '' });
    }
    if (runs.length) {
      const run = runs[runs.length - 1], ref = run.ref === 'vt1' ? +a.vt1_pace_s_km || 330 : +a.vt2_pace_s_km || 290, pace = ref / mitte(run.band);
      const P = profil(r, 'lauf', d.k), s = laufZeit(r, pace, P);
      teile.push({ id: 'run', name: 'Laufen', s, sub: kmZahl(d.lauf) + ' km · ' + hms(s / d.lauf) + ' /km', P });
      annahmen.push('Laufen bei ' + hms(pace) + ' /km aus deinem ' + (run.ref === 'vt1' ? 'VT1' : 'VT2') + '-Tempo' + (P.H > 60 ? ', Anstiege eingerechnet' : '') + (tags.includes('heiss') ? ', Hitze +4 %' : ''));
    }
    const gesamt = teile.reduce((s, x) => s + x.s, 0);
    let ziel = null;
    if (d.k === 'ld' && a.ziel_gesamt_min) ziel = { gesamt: a.ziel_gesamt_min * 60, swim: a.ziel_schwimmen_min * 60, bike: a.ziel_rad_min * 60, run: a.ziel_lauf_min * 60, t1: a.ziel_t1_min * 60, t2: a.ziel_t2_min * 60 };
    // Ist diese Strecke dein eingetragenes Hauptrennen mit Zielzeit, zählt die Zielzeit aus der Saison
    const sz = sicher(zielInfo), zr = sz ? sicher(() => zielStrecke(sz)) : null;
    if (zr && zr.id === r.id && sz.ziel_s > 0 && (!sz.ziel_distanz || sz.ziel_distanz === d.k)) { ziel = Object.assign({}, ziel || {}, { gesamt: sz.ziel_s, quelle: 'saison' }); if (!ziel.swim) { ziel.swim = ziel.bike = ziel.run = ziel.t1 = ziel.t2 = null; } }
    return { teile, gesamt, annahmen, ziel, rad: radP };
  }

  /* =====================================================================
     Diagramm: Höhenprofil als ruhige Fläche mit Anstiegen und Bedeutungsfarbe
     ===================================================================== */
  function profilChart(box, P, o) { // o: { farbe, hoehe, anstiege, einheit, lauf }
    box.replaceChildren();
    const w = Math.max(280, box.clientWidth || 340), h = o.hoehe || 150, pl = 36, pr = 10, pt = 14, pb = 24;
    const xs = d3.scaleLinear().domain([0, P.D]).range([pl, w - pr]);
    const ys = d3.extent(P.pts, (p) => p[1]), span = Math.max(60, (ys[1] - ys[0]) * 1.15), y0 = ys[0] - span * 0.08;
    const yS = d3.scaleLinear().domain([y0, y0 + span]).range([h - pb, pt]);
    const s = svg('svg', { class: 'tf-svg tf-profil', viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h, role: 'img', 'aria-label': 'Höhenprofil, ' + Math.round(P.H) + ' Höhenmeter' }, box);
    yS.ticks(3).forEach((v) => { svg('line', { x1: pl, x2: w - pr, y1: yS(v), y2: yS(v), stroke: col('grid'), 'stroke-width': 1 }, s); const t = svg('text', { x: pl - 6, y: yS(v) + 3, 'text-anchor': 'end', class: 'tf-tick' }, s); t.textContent = Math.round(v); });
    const TX = xs.ticks(w < 340 ? 4 : P.D > 100 ? 6 : 5).filter((v) => v > 0 && v <= P.D * 0.97);
    TX.forEach((v, i) => { const t = svg('text', { x: xs(v), y: h - 6, 'text-anchor': i === TX.length - 1 && xs(v) > w - pr - 24 ? 'end' : 'middle', class: 'tf-tick' }, s); t.textContent = v + (i === TX.length - 1 ? ' km' : ''); });
    const area = d3.area().x((p) => xs(p[0])).y0(h - pb).y1((p) => yS(p[1])).curve(d3.curveMonotoneX), line = d3.line().x((p) => xs(p[0])).y((p) => yS(p[1])).curve(d3.curveMonotoneX);
    const c = col(o.farbe || 'blue');
    svg('path', { d: area(P.pts), fill: c, opacity: 0.14 }, s);
    (o.anstiege || []).forEach((a) => { const seg = P.pts.filter((p) => p[0] >= a.von - 0.01 && p[0] <= a.bis + 0.01); if (seg.length > 1) svg('path', { d: area(seg), fill: col('pink'), opacity: 0.22 }, s); });
    svg('path', { d: line(P.pts), fill: 'none', stroke: c, 'stroke-width': 1.5, 'stroke-linejoin': 'round', pathLength: 1, class: 'tf-zieh' }, s);
    (o.anstiege || []).forEach((a, i) => { const x = xs((a.von + a.bis) / 2), top = Math.max(...P.pts.filter((p) => p[0] >= a.von && p[0] <= a.bis).map((p) => p[1])); svg('circle', { cx: x, cy: yS(top) - 10, r: 7, fill: col('card'), stroke: col('pink'), 'stroke-width': 1 }, s); const t = svg('text', { x, y: yS(top) - 7, 'text-anchor': 'middle', class: 'tf-tick', fill: col('fg') }, s); t.textContent = String(i + 1); });
    const t = svg('text', { x: pl - 6, y: pt - 4, 'text-anchor': 'end', class: 'tf-tick' }, s); t.textContent = 'm';
    return s;
  }
  // kleines Profil ohne Achsen (Listen, Karten, Teilen-Karte)
  function miniProfil(P, w, h, farbe) {
    const xs = d3.scaleLinear().domain([0, P.D]).range([0, w]), ys = d3.extent(P.pts, (p) => p[1]), span = Math.max(P.D * 3.5, (ys[1] - ys[0]) * 1.1);
    const yS = d3.scaleLinear().domain([ys[0] - span * 0.1, ys[0] + span]).range([h, 2]);
    const s = svg('svg', { class: 'tf-mini-profil', viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, 'aria-hidden': 'true' });
    const area = d3.area().x((p) => xs(p[0])).y0(h).y1((p) => yS(p[1])).curve(d3.curveMonotoneX), line = d3.line().x((p) => xs(p[0])).y((p) => yS(p[1])).curve(d3.curveMonotoneX);
    svg('path', { d: area(P.pts), fill: col(farbe || 'blue'), opacity: 0.18 }, s);
    svg('path', { d: line(P.pts), fill: 'none', stroke: col(farbe || 'blue'), 'stroke-width': 1.25 }, s);
    return s;
  }

  /* =====================================================================
     Weltkarte: Land als ruhige Fläche, Rennen als Punkte in Bedeutungsfarbe, dein Ziel in Pink
     ===================================================================== */
  let WELT = null, weltLaden = null;
  function landLaden() {
    if (WELT || weltLaden) return weltLaden || Promise.resolve(WELT);
    weltLaden = fetch('vendor/welt.json', { cache: 'force-cache' }).then((r) => r.json()).then((j) => { WELT = j; return j; }).catch(() => null).finally(() => { weltLaden = null; });
    return weltLaden;
  }
  const K = { modus: 'europa', serie: 'alle', marke: 'alle', region: 'alle', profil: 'alle', wasser: 'alle', monat: 0, passt: false, filterAuf: false, gewaehlt: null, suche: '', kalVoll: false, monatAuf: new Set(), zoomT: null, zoomK: 1 };
  const serieFarbe = (r) => SERIE[r.serie].farbe;
  const PROFIL_TAG = { flach: ['flach'], wellig: ['wellig'], huegelig: ['huegelig'], bergig: ['bergig'] };
  // Version 26: Distanz-Chips (ein Rennen zählt bei jeder seiner Distanzen), Veranstalter im Filterfeld
  const MARKE = { im: ['im', 'im703'], ch: ['ch', 'chm'] };
  const serieOk = (r) => K.serie === 'alle' || distListe(r).includes(K.serie);
  const markeOk = (r) => K.marke === 'alle' || (K.marke === 'andere' ? !MARKE.im.includes(r.serie) && !MARKE.ch.includes(r.serie) : (MARKE[K.marke] || []).includes(r.serie));
  const regionOk = (r) => K.region === 'alle' || (K.region === 'de' ? r.land === 'DE' : K.region === 'dach' ? DACH.includes(r.land) : K.region === 'eu' ? EUROPA.includes(r.land) : !EUROPA.includes(r.land));
  function gefiltert() {
    const q = K.suche.trim().toLowerCase();
    let L = R.filter((r) => serieOk(r) && markeOk(r) && regionOk(r)
      && (K.profil === 'alle' || (r.tags || []).some((t) => PROFIL_TAG[K.profil].includes(t)))
      && (K.wasser === 'alle' || (K.wasser === 'lauf' ? !r.swim : K.wasser === 'fluss' ? ['fluss', 'kanal', 'hafen'].includes(r.swim) : r.swim === K.wasser))
      && (!K.monat || r.mon === K.monat)
      && (!q || (r.name + ' ' + r.ort + ' ' + (LAND[r.land] || '') + ' ' + distText(r)).toLowerCase().includes(q)));
    if (K.passt) { const V = vorteile(L); L = L.filter((r) => V.has(r.id)).sort((x, y) => V.get(y.id).v - V.get(x.id).v).slice(0, 15); }
    return L;
  }
  const filterZahl = () => (K.marke !== 'alle') + (K.profil !== 'alle') + (K.wasser !== 'alle') + (K.monat ? 1 : 0) + (K.passt ? 1 : 0);
  /* „Passt zu mir“ (Version 21): für jede Strecke deine Prognose, verglichen mit dem Mittel der Strecken derselben Distanz.
     Vorteil v > 0 = dort wärst du schneller als typisch (flach, kühl, Neopren, Strömung …), v < 0 = die Strecke kostet dich. */
  let VORT = null, VORT_KEY = '';
  function vorteile(L) {
    const a = athlet() || {}, key = [a.ftp_ref_w, a.gewicht_ref_kg, a.cda_m2, a.css_s_100m, a.vt1_pace_s_km, a.vt2_pace_s_km, L.length].join('|');
    if (VORT && VORT_KEY === key) return VORT;
    const M = new Map(), grp = {};
    L.forEach((r) => { if (r.status || r.geschaetzt) return; const pg = sicher(() => prognose(r)); if (!pg || !pg.gesamt) return; const g = GRUPPE[r.serie]; (grp[g] = grp[g] || []).push([r.id, pg.gesamt]); }); // Version 22: Rennen mit Status fallen aus „Passt zu mir“ · Version 26: ebenso Strecken mit geschätzten Höhenmetern
    Object.values(grp).forEach((G) => { const mittel = G.reduce((x, y) => x + y[1], 0) / G.length; G.forEach(([id, t]) => M.set(id, { v: (mittel - t) / mittel, t, mittel })); });
    VORT = M; VORT_KEY = key; return M;
  }
  function passtSatz() { // ein Satz, warum bestimmte Strecken dir liegen – aus Größe, Gewicht, Watt
    const a = athlet() || {}; if (!a.ftp_ref_w || !a.gewicht_ref_kg) return 'Sortiert nach deiner Prognose: Strecken, auf denen du schneller wärst als im Schnitt der Distanz.';
    const wkg = a.ftp_ref_w / a.gewicht_ref_kg, gross = (a.groesse_cm || 0) >= 185 || a.gewicht_ref_kg >= 82;
    return (wkg < 3.8 || gross ? 'Mit ' + nf(wkg, 1) + ' W/kg' + (gross ? ' und viel Frontfläche' : '') + ' zählt bei dir Watt pro Luftwiderstand mehr als Watt pro Kilo – flache, kühle Strecken liegen dir.' : 'Mit ' + nf(wkg, 1) + ' W/kg kommst du auch bergig gut weg – entscheidend sind Hitze und Wasser.')
      + ' Sortiert nach deiner Prognose gegenüber dem Schnitt der Distanz – gezählt werden Strecken mit Höhenmetern nach Streckenbeschreibung.';
  }
  function karte(box, liste, o) { // o: { modus, ziel, auf(r) }
    box.replaceChildren();
    const w = Math.max(300, box.clientWidth || 360), h = Math.round(w * (o.modus === 'welt' ? (w > 700 ? 0.46 : 0.52) : w > 700 ? 0.6 : 0.78)); // Version 21: am Laptop flacher
    const s = svg('svg', { class: 'tf-karte-svg', viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h, role: 'img', 'aria-label': 'Karte mit ' + liste.length + ' Rennen' }, box);
    let proj;
    if (o.modus === 'welt') proj = d3.geoNaturalEarth1().fitExtent([[4, 4], [w - 4, h - 4]], { type: 'Sphere' });
    else proj = d3.geoConicConformal().parallels([40, 62]).rotate([-10, 0]).fitExtent([[8, 8], [w - 8, h - 8]], { type: 'Polygon', coordinates: [[[-11, 35.5], [-11, 63], [33, 63], [33, 35.5], [-11, 35.5]]] });
    const path = d3.geoPath(proj);
    const root = svg('g', { class: 'tf-karte-root' }, s); // Version 21: alles in einer Ebene, die sich zoomen und schieben lässt
    if (o.modus === 'welt') svg('path', { d: path({ type: 'Sphere' }), class: 'tf-karte-meer' }, root);
    const land = WELT ? topojson.feature(WELT[o.modus], WELT[o.modus].objects.land) : null;
    const g = svg('g', { class: 'tf-karte-land' }, root);
    if (land) svg('path', { d: path(land) }, g);
    svg('path', { d: path(d3.geoGraticule().step([15, 15])()), class: 'tf-karte-netz' }, root);
    if (o.modus === 'europa') { // Rahmen: Ausschnitt
      svg('path', { d: path({ type: 'Polygon', coordinates: [[[-11, 35.5], [-11, 63], [33, 63], [33, 35.5], [-11, 35.5]]] }), class: 'tf-karte-rahmen' }, root);
    }
    const pkt = svg('g', { class: 'tf-karte-punkte' }, root);
    const sichtbar = liste.filter((r) => o.modus === 'welt' || (r.lon > -12 && r.lon < 34 && r.lat > 35 && r.lat < 64));
    const gruppen = new Map(); // gleiche Orte leicht versetzen
    sichtbar.forEach((r) => { const k = r.lat.toFixed(1) + ',' + r.lon.toFixed(1); const n = gruppen.get(k) || 0; gruppen.set(k, n + 1); r._v = n; });
    sichtbar.forEach((r) => {
      const [x0, y0] = proj([r.lon, r.lat]) || [0, 0], x = x0 + (r._v ? Math.cos(r._v * 2.4) * 5 : 0), y = y0 + (r._v ? Math.sin(r._v * 2.4) * 5 : 0);
      const istZiel = o.ziel === r.id, akt = K.gewaehlt === r.id;
      const gr = svg('g', { class: 'tf-karte-p' + (istZiel ? ' ziel' : '') + (akt ? ' akt' : ''), role: 'button', tabindex: 0, 'aria-label': r.name }, pkt);
      svg('circle', { cx: x, cy: y, r: 11, fill: 'transparent', 'data-r': 11 }, gr);
      if (akt || istZiel) svg('circle', { cx: x, cy: y, r: 8, fill: 'none', stroke: col(istZiel ? 'pink' : 'fg'), 'stroke-width': 1.25, opacity: 0.8, 'data-r': 8, 'data-sw': 1.25 }, gr);
      svg('circle', { cx: x, cy: y, r: istZiel ? 4.5 : 3.5, fill: col(istZiel ? 'pink' : serieFarbe(r)), stroke: 'rgba(255,255,255,.85)', 'stroke-width': 1, 'data-r': istZiel ? 4.5 : 3.5, 'data-sw': 1 }, gr);
      const auf = () => { K.gewaehlt = r.id; o.auf(r); };
      gr.addEventListener('click', auf); gr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(); } });
    });
    // Zoom und Schieben: zwei Finger oder Tasten; am Laptop Strg + Mausrad, Ziehen mit der Maus. Punkte bleiben gleich groß.
    const skalieren = (k) => { pkt.querySelectorAll('circle[data-r]').forEach((c) => { c.setAttribute('r', (+c.getAttribute('data-r') / Math.sqrt(k)).toFixed(2)); if (c.hasAttribute('data-sw')) c.setAttribute('stroke-width', (+c.getAttribute('data-sw') / Math.sqrt(k)).toFixed(2)); }); };
    const Z = d3.zoom().scaleExtent([1, 10]).translateExtent([[0, 0], [w, h]]).extent([[0, 0], [w, h]])
      .filter((e) => { if (e.type === 'wheel') return e.ctrlKey || e.metaKey; if (e.type === 'touchstart') return (e.touches && e.touches.length > 1) || K.zoomK > 1; if (e.type === 'dblclick') return false; return !e.button; })
      .on('zoom', (e) => { K.zoomT = e.transform; K.zoomK = e.transform.k; root.setAttribute('transform', e.transform.toString()); skalieren(e.transform.k); box.classList.toggle('gezoomt', e.transform.k > 1.05); });
    const sel = d3.select(s).call(Z);
    if (K.zoomT && K.zoomT.k > 1 && K.zoomModus === o.modus) sel.call(Z.transform, K.zoomT); else { K.zoomT = null; K.zoomK = 1; }
    K.zoomModus = o.modus;
    const kn = el('div', { class: 'tf-karte-zoom', role: 'group', 'aria-label': 'Karte zoomen' });
    [['+', 'Näher ran', () => sel.transition().duration(250).call(Z.scaleBy, 1.7)], ['−', 'Weiter weg', () => sel.transition().duration(250).call(Z.scaleBy, 1 / 1.7)], ['⌂', 'Ganze Karte', () => sel.transition().duration(300).call(Z.transform, d3.zoomIdentity)]].forEach(([t, lab, fn]) => {
      const b = el('button', { type: 'button', 'aria-label': lab, title: lab }, t); b.addEventListener('click', fn); kn.appendChild(b);
    });
    box.appendChild(kn);
    if (!WELT) landLaden().then(() => { if (box.isConnected) karte(box, liste, o); });
    return s;
  }

  /* =====================================================================
     Seite „Rennen“: Ziel, Karte, Kalender, Statistik, Werkzeuge
     ===================================================================== */
  function zielInfo() { const sz = (rowsOf('saison') || [])[0]; return sz && sz.ziel_id ? sz : null; }
  const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9äöü]+/g, ' ').trim();
  function streckeVon(W) { // Kennung aus dem Katalog – oder das Rennen mit demselben Namen (vor Version 20 eingetragen)
    if (!W) return null;
    if (W.strecke && BY[W.strecke]) return BY[W.strecke];
    const n = norm(W.name); if (!n) return null;
    return R.find((r) => norm(r.name) === n) || R.find((r) => n.includes(norm(r.name)) || norm(r.name).includes(n)) || null;
  }
  function zielStrecke(sz) { return streckeVon((A().raw('wettkaempfe') || []).find((x) => x.id === sz.ziel_id)); }
  function hubZiel() {
    const sz = zielInfo(), r = sz ? zielStrecke(sz) : null;
    const c = el('article', { class: 'tf-card tf-rn-ziel' + (r ? ' tf-buehne tf-b-pink' : ''), id: 'rn-ziel' });
    if (!sz) {
      c.append(el('span', { class: 'tf-augenbraue', text: 'Dein Ziel' }), el('h2', { class: 'tf-held-t', text: 'Welches Rennen soll es sein?' }),
        el('p', { class: 'tf-held-f', text: 'Such dir auf der Karte oder im Kalender eine Strecke aus – mit Höhenprofil, deiner Prognose und Pacing. „Als Ziel setzen“ trägt sie in deine Saison ein, und dein Trainingsplan rechnet rückwärts vom Renntag.' }));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-flag'), ' Rennen eintragen'); b.addEventListener('click', () => T.geh('rennen/saison'));
      c.appendChild(el('div', { class: 'tf-form-actions' }, b));
      return c;
    }
    const tg = sz.ziel_tage;
    c.append(el('span', { class: 'tf-augenbraue', text: 'Dein Ziel · ' + (sz.phase_txt || '') }), el('h2', { class: 'tf-held-t', text: sz.ziel_name }),
      el('p', { class: 'tf-held-u', text: (r ? titelLand(r) + ' · ' : '') + sz.ziel_datum_txt + (sz.ziel_s ? ' · Ziel ' + hms(sz.ziel_s) : '') }));
    const z = el('div', { class: 'tf-held-z' }, el('div', null, el('b', { class: 'num', text: tg === 0 ? 'Heute' : nf(tg) }), el('small', { text: tg === 0 ? 'Renntag' : tg === 1 ? 'Tag' : 'Tage' })));
    if (r) { const P = profil(r, 'rad') || profil(r, 'lauf'); z.append(el('div', null, el('b', { class: 'num', text: nf(r.hmRad || r.hmLauf || 0) }), el('small', { text: 'Höhenmeter ' + (r.hmRad ? 'Rad' : 'Lauf') })), el('div', { class: 'tf-rn-ziel-mini' }, miniProfil(P, 320, 72, 'card'))); }
    c.appendChild(z);
    const act = el('div', { class: 'tf-held-aktionen' });
    if (r) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-held-los' }, 'Strecke ansehen'); b.addEventListener('click', () => T.geh('rennen/strecke/' + r.id)); act.appendChild(b); }
    const b2 = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, 'Saison & Phasen'); b2.addEventListener('click', () => T.geh('rennen/saison')); act.appendChild(b2);
    c.appendChild(act);
    return c;
  }
  function chips(liste, akt, setze) {
    return el('div', { class: 'tf-chipset tf-rn-chips', role: 'group' }, ...liste.map(([id, name]) => { const b = el('button', { type: 'button', 'aria-pressed': String(akt === id) }, name); b.addEventListener('click', () => setze(id)); return b; }));
  }
  /* =====================================================================
     Version 27: „Rennen“ beginnt mit deinem nächsten Ziel – Saison auf einen Blick, die nächsten Wettkämpfe, deine Liga.
     Karte, Kalender und Statistik stehen unter „Rennen finden“ (#rennen/finden).
     ===================================================================== */
  const PH_FARBE = { vorbereitung: 'gray', grundlage: 'blue', aufbau: 'orange', spitze: 'red', taper: 'teal', rennwoche: 'mint', rennen: 'pink', uebergang: 'purple' };
  const PRIO_FARBE = { A: 'pink', B: 'orange', C: 'gray' };
  const PRIO_TXT = { A: 'Hauptrennen', B: 'wichtiges Rennen', C: 'Trainingsrennen' };
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const tageTxt = (n) => (n === 0 ? 'heute' : n === 1 ? 'morgen' : 'in ' + nf(n) + ' Tagen');
  function renderHub() { if (T.route() === 'rennen/finden') renderFinden(); else renderFokus(); }
  function kommende() { const sz = (rowsOf('saison') || [])[0]; return sz && Array.isArray(sz.liste) ? sz.liste.filter((r) => r.in_tagen >= 0) : []; }
  const ligaTag = (id) => { for (const [k, L] of Object.entries(LIGA)) { const t = L.tage.find((x) => x.id === id); if (t) return { k, L, t }; } return null; };
  function renderFokus() {
    const box = $('#rennen-hub-box'); if (!box) return;
    const sz = zielInfo();
    const frag = [hubZiel()];
    const sk = saisonKarte(); if (sk) frag.push(sk); // Version 47: Saison zum Darüberfahren, jedes Rennen mit Prognose und Platz
    if (!LG().id) frag.push(ligaKarte()); // Version 47: ist die Liga gewählt, verschwindet die Auswahl – die Renntage stehen in Saison und Plan
    frag.push(findenKarte());
    frag.push(el('h2', { class: 'tf-hub-sek', text: 'Rund um dein Rennen' }));
    frag.push(el('div', { class: 'tf-links' },
      zeile('rennen/saison', 'Saison & Rennen', 'i-flag', 'pink', sz ? sz.ziel_name + ' in ' + (sz.ziel_tage === 0 ? 'heute' : nf(sz.ziel_tage) + ' Tagen') : 'Deine Rennen, Phasen und der Countdown'),
      kommende().length || LG().id ? planZeile() : null,
      zeile('rennen/rechner', 'Rennrechner', 'i-clock', 'red', 'Splits, Watt, Tempo und Verpflegung'),
      zeile('rennen/renntag', 'Renntag', 'i-print', 'orange', 'Race Card zum Ausdrucken, Packliste'),
      zeile('rennen/schweiss', 'Schweißrate', 'i-drop', 'blue', 'Wie viel du trinken musst')));
    box.replaceChildren(el('div', { class: 'tf-hub tf-rn tf-rn-fokus' }, ...frag));
    ligaPruefen();
  }
  function planZeile() { // Version 47: Rennen herausnehmen, Liga und Stellenwert – das geht unter „Plan bearbeiten“
    const hat = window.tfPlan && tfPlan.hat && tfPlan.hat();
    const z = zeile(hat ? 'training/plan' : 'rennen/saison', 'Rennen im Plan', 'i-edit', 'indigo', (LG().id && LIGA[LG().id] ? LIGA[LG().id].kurz + ' · ' : '') + 'Herausnehmen, Liga und Stellenwert – unter „Plan bearbeiten“');
    z.id = 'rn-planzeile';
    if (hat) z.addEventListener('click', () => { if (tfPlan.bearbeiten) tfPlan.bearbeiten(); setTimeout(() => { const b = document.getElementById('plan-rennen'); if (b) b.scrollIntoView({ block: 'start' }); }, 220); }, true);
    return z;
  }
  // Einstieg in die Rennsuche – mit einem kleinen Sternbild aller Rennen in Europa
  function findenKarte() {
    const b = el('button', { type: 'button', class: 'tf-card tf-rn-finden', id: 'rn-finden' });
    const W = 132, H = 84, sv = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'tf-rn-finden-svg', 'aria-hidden': 'true', focusable: 'false' });
    R.forEach((r) => { if (r.lon < -11 || r.lon > 33 || r.lat < 35.5 || r.lat > 63) return; svg('circle', { cx: ((r.lon + 11) / 44) * W, cy: ((63 - r.lat) / 27.5) * H, r: 1.3, fill: 'var(--tf-' + serieFarbe(r) + ')' }, sv); });
    const laender = new Set(R.map((r) => r.land)).size;
    b.append(el('span', { class: 'tf-rn-finden-t' }, el('b', { text: 'Rennen finden' }), el('small', { text: nf(R.length) + ' Rennen in ' + laender + ' Ländern – Karte, Kalender, Filter nach Distanz' })), sv, svgIco('i-chev'));
    b.addEventListener('click', () => T.geh('rennen/finden'));
    return b;
  }

  /* ---------- Version 27: Liga-Modus ----------
     Liga wählen → die Renntage kommen als Wettkämpfe in deine Saison (Stellenwert B oder C), der Trainingsplan legt Vortag,
     Renntag und Tag danach darum. Einzelne Renntage lassen sich abwählen (nicht nominiert, verhindert). Gespeichert in
     rechner.liga = { id, prio, aus: [Renntag-Kennungen] }; die Einträge tragen liga = Kennung des Renntags. */
  const PYRAMIDE = [['DTU', [['bl1', '1. Bundesliga']], [['bl2n', '2. BL Nord'], ['bl2s', '2. BL Süd']]], ['Bayern · BTV', [['rl', 'Regionalliga']], [['bayl', 'Bayernliga']], [['lln', 'LL Nord'], ['lls', 'LL Süd'], ['llf', 'LL Frauen']]]];
  const LG = () => Object.assign({ id: null, prio: 'B', aus: [] }, (A().state.rechner || {}).liga || {});
  let ligaBusy = false, ligaGeprueft = '';
  function ligaSpeichern(neu) {
    const r = Object.assign({}, A().state.rechner || {}); r.liga = neu; A().setRechner(r);
    return A().api('POST', '/api/rechner', { liga: neu }).catch(() => {});
  }
  function ligaWerte(L, t, i, prio) {
    const nr = L.tage.indexOf(t) + 1, doppelt = L.tage.filter((x) => x.ort === t.ort).length > 1; // zwei Rennen am selben Ort: Format dazu
    return { name: (L.kurz + ' · ' + (L.vorlaeufig ? 'Renntag ' + nr : t.ort + (doppelt ? ' · ' + t.format.split(' mit ')[0] : ''))).slice(0, 60), datum: t.datum, sport: 'tri', distanz: t.d, prio,
      notiz: (t.format + ' · ' + L.name + (L.vorlaeufig ? ' · Termin vorläufig (2026: ' + t.ref + ')' : '')).slice(0, 300), strecke: t.strecke && BY[t.strecke] ? t.strecke : null, liga: t.id };
  }
  function ligaSoll() { // → { weg: [Einträge], neu: [[Einträge-Werte, vorhandener Eintrag | null]] }
    const st = LG(), L = st.id ? LIGA[st.id] : null, h = localDate(), aus = new Set(st.aus || []), W = A().raw('wettkaempfe') || [];
    const weg = W.filter((x) => x.liga && x.datum >= h && (!L || !L.tage.some((t) => t.id === x.liga) || aus.has(x.liga)));
    const neu = [];
    if (L) L.tage.forEach((t, i) => {
      if (!t.datum || t.datum < h || aus.has(t.id)) return;
      const soll = ligaWerte(L, t, i, st.prio === 'C' ? 'C' : 'B'), ist = W.find((x) => x.liga === t.id);
      if (ist && ist.datum === soll.datum && ist.prio === soll.prio && ist.name === soll.name && ist.distanz === soll.distanz && (ist.notiz || '') === soll.notiz && (ist.strecke || null) === soll.strecke) return;
      neu.push([soll, ist || null]);
    });
    return { weg, neu };
  }
  async function ligaAbgleich() {
    if (ligaBusy) return 0;
    const { weg, neu } = ligaSoll(); if (!weg.length && !neu.length) return 0;
    ligaBusy = true; let W = (A().raw('wettkaempfe') || []).slice(), n = 0, fehler = null;
    try {
      for (const x of weg) { await A().api('DELETE', '/api/wettkampf?id=' + encodeURIComponent(x.id)); W = W.filter((y) => y.id !== x.id); n++; }
      for (const [soll, ist] of neu) { const j = await A().api('POST', '/api/wettkampf', Object.assign(ist ? { id: ist.id } : {}, soll)); W = W.filter((y) => y.id !== j.row.id).concat([j.row]); n++; }
    } catch (e) { fehler = e; }
    ligaBusy = false;
    if (n) A().patch('wettkaempfe', W.sort((x, y) => (x.datum < y.datum ? -1 : 1)));
    if (fehler && A().toast) A().toast(fehler.message || 'Renntage konnten nicht gespeichert werden');
    return n;
  }
  function ligaPruefen() { // einmal je Datenstand: Termine aus einer neueren App-Version übernehmen
    const st = LG(); if (!st.id) return;
    const k = st.id + '|' + (A().raw('wettkaempfe') || []).length + '|' + (DATEN.VERSION || 0);
    if (ligaGeprueft === k) return; ligaGeprueft = k;
    const { weg, neu } = ligaSoll(); if (weg.length || neu.length) ligaAbgleich();
  }
  async function ligaSetzen(neu) {
    await ligaSpeichern(neu); const n = await ligaAbgleich();
    if (A().toast) A().toast(neu.id ? LIGA[neu.id].kurz + (n ? ' – Renntage in Saison und Plan' : '') : 'Liga-Modus aus');
    T.neu();
  }
  function ligaKarte() { // Version 47: nur noch die Einladung – nach der Wahl verschwindet sie, Verwalten geht unter „Plan bearbeiten“
    const st = LG();
    const c = el('article', { class: 'tf-card tf-rn-liga', id: 'rn-liga' });
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('indigo', 'i-shield'), el('div', null, el('h2', { text: 'Startest du in einer Liga?' }),
      el('div', { class: 'tf-sub', text: 'Wähl deine Liga – die Renntage kommen automatisch in deine Saison und deinen Trainingsplan' }))));
    c.appendChild(pyramide(st));
    return c;
  }
  function pyramide(st) {
    const box = el('div', { class: 'tf-lg-pyr', role: 'group', 'aria-label': 'Liga wählen' });
    PYRAMIDE.forEach(([verband, ...stufen], gi) => {
      box.appendChild(el('small', { class: 'tf-lg-verband', text: verband }));
      stufen.forEach((stufe, si) => {
        const reihe = el('div', { class: 'tf-lg-stufe', style: '--s:' + (gi * 2 + si) });
        stufe.forEach(([id, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(st.id === id), 'data-liga': id }, n); b.addEventListener('click', () => { ligaSetzen({ id, prio: st.prio || 'B', aus: [] }); }); reihe.appendChild(b); });
        box.appendChild(reihe);
      });
    });
    const keine = el('button', { type: 'button', class: 'tf-lg-keine', 'aria-pressed': String(!st.id) }, 'Keine Liga'); keine.addEventListener('click', () => { ligaSetzen({ id: null, prio: st.prio || 'B', aus: [] }); });
    box.appendChild(keine);
    return box;
  }
  function renderFinden() {
    const box = $('#rennen-hub-box'); if (!box) return;
    const sz = zielInfo(), zielR = sz ? zielStrecke(sz) : null, L = gefiltert();
    const frag = [];
    // Karte
    const kk = el('article', { class: 'tf-card tf-rn-karte', id: 'rn-karte' });
    const kopf = el('div', { class: 'tf-card-head' }, S.badge('pink', 'i-flag'), el('div', null, el('h2', { text: 'Rennen weltweit' }), el('div', { class: 'tf-sub', text: L.length + ' Rennen · antippen für die Strecke' })));
    const seg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Ausschnitt' });
    [['europa', 'Europa'], ['welt', 'Welt']].forEach(([id, name]) => { const b = el('button', { type: 'button', 'aria-pressed': String(K.modus === id) }, name); b.addEventListener('click', () => { K.modus = id; renderHub(); }); seg.appendChild(b); });
    const kbox = el('div', { class: 'tf-karte' });
    const info = el('div', { class: 'tf-karte-info', hidden: true });
    const zeige = (r) => {
      info.hidden = false; info.replaceChildren(el('span', { class: 'tf-rn-dot', style: 'background:var(--tf-' + serieFarbe(r) + ')' }), el('div', null, el('b', { text: r.name }), el('small', { text: titelLand(r) + ' · ' + distText(r) + ' · ' + terminText(r) + (r.hmRad ? ' · ' + hmText(r, r.hmRad) + ' Rad' : r.hmLauf ? ' · ' + hmText(r, r.hmLauf) : '') })));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, 'Strecke'); b.addEventListener('click', () => T.geh('rennen/strecke/' + r.id)); info.appendChild(b);
      kbox.querySelectorAll('.tf-karte-p').forEach((g) => g.classList.toggle('akt', g.getAttribute('aria-label') === r.name));
    };
    // Version 21: Serie als Chips, weitere Filter (Profil, Wasser, Monat, Passt zu mir) hinter „Filter“ · Version 26: Distanzen als Chips, Veranstalter im Filterfeld
    const fz = filterZahl();
    const filterKnopf = el('button', { type: 'button', class: 'tf-rn-filterk', 'aria-expanded': String(K.filterAuf), 'aria-pressed': String(fz > 0) }, svgIco('i-sliders'), ' Filter', fz ? el('small', { class: 'num', text: String(fz) }) : null);
    filterKnopf.addEventListener('click', () => { K.filterAuf = !K.filterAuf; renderHub(); });
    const serieChips = chips([['alle', 'Alle'], ['ld', 'Langdistanz'], ['md', 'Mitteldistanz'], ['od', 'Olympisch'], ['sprint', 'Sprint'], ['m', 'Marathon'], ['hm', 'Halbmarathon'], ['ultra', 'Ultra']], K.serie, (v) => { K.serie = v; K.monatAuf.clear(); renderHub(); });
    serieChips.classList.add('tf-rn-chips-serie'); serieChips.appendChild(filterKnopf);
    const panel = el('div', { class: 'tf-rn-filter', hidden: !K.filterAuf });
    if (K.filterAuf) {
      const gruppe = (name, ch) => el('div', { class: 'tf-rn-fg' }, el('small', { text: name }), ch);
      panel.append(
        gruppe('Veranstalter', chips([['alle', 'Alle'], ['im', 'Ironman'], ['ch', 'Challenge'], ['andere', 'Andere']], K.marke, (v) => { K.marke = v; renderHub(); })),
        gruppe('Profil', chips([['alle', 'Alle'], ['flach', 'flach'], ['wellig', 'wellig'], ['huegelig', 'hügelig'], ['bergig', 'bergig']], K.profil, (v) => { K.profil = v; renderHub(); })),
        gruppe('Wasser', chips([['alle', 'Alle'], ['see', 'See'], ['meer', 'Meer'], ['fluss', 'Fluss & Kanal'], ['lauf', 'Nur Laufen']], K.wasser === 'kanal' ? 'fluss' : K.wasser, (v) => { K.wasser = v; renderHub(); })),
        gruppe('Monat', chips([[0, 'Alle'], ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => [m, MON[m].slice(0, 3)])], K.monat, (v) => { K.monat = v; renderHub(); })));
      const pz = el('label', { class: 'tf-switch tf-rn-passt' }, (() => { const i = el('input', { type: 'checkbox', checked: K.passt }); i.addEventListener('change', () => { K.passt = i.checked; renderHub(); }); return i; })(), el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, el('b', { text: 'Passt zu mir' }), el('small', { text: 'Die 15 Strecken mit deiner besten Prognose' })));
      panel.append(pz);
      if (K.passt) panel.append(el('p', { class: 'tf-note', text: passtSatz() }));
      const reset = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, 'Filter zurücksetzen');
      reset.addEventListener('click', () => { Object.assign(K, { marke: 'alle', profil: 'alle', wasser: 'alle', monat: 0, passt: false, serie: 'alle', region: 'alle' }); K.monatAuf.clear(); renderHub(); });
      if (fz || K.serie !== 'alle' || K.region !== 'alle') panel.append(reset);
    }
    kk.append(kopf, serieChips, panel, kbox, el('p', { class: 'tf-karte-tipp', text: 'Zwei Finger: zoomen und schieben · am Laptop Strg + Mausrad' }), info, el('div', { class: 'tf-rn-legende' }, seg,
      el('div', { class: 'tf-legend' }, ...[['pink', 'Langdistanz'], ['orange', 'Mitteldistanz'], ['purple', 'Olympisch & Sprint'], ['mint', 'Marathon'], ['teal', 'Halbmarathon'], ['indigo', 'Ultra']].map(([f, n]) => { const i = el('i'); i.style.background = 'var(--tf-' + f + ')'; return el('span', null, i, n); }))));
    requestAnimationFrame(() => { if (kbox.isConnected) { karte(kbox, L, { modus: K.modus, ziel: zielR ? zielR.id : null, auf: zeige }); if (K.gewaehlt && BY[K.gewaehlt] && L.includes(BY[K.gewaehlt])) zeige(BY[K.gewaehlt]); } });
    // Kalender
    const kal = el('article', { class: 'tf-card tf-rn-kal', id: 'rn-kalender' });
    const such = el('input', { class: 'tf-input', type: 'search', placeholder: 'Rennen oder Ort suchen', value: K.suche, 'aria-label': 'Rennen suchen', enterkeyhint: 'search' });
    let st = null; such.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => { K.suche = such.value; const liste = $('#rn-liste'); if (liste) liste.replaceChildren(...kalenderListe()); const n = $('#rn-kalender .tf-sub'); if (n) n.textContent = gefiltert().length + ' Rennen nach Monat'; }, 200); });
    kal.append(el('div', { class: 'tf-card-head' }, S.badge('blue', 'i-cal'), el('div', null, el('h2', { text: 'Rennen suchen' }), el('div', { class: 'tf-sub', text: L.length + ' Rennen nach Monat' }))),
      el('p', { class: 'tf-caption tf-rn-starthilfe', text: '„Ich starte“ trägt ein Rennen in deine Saison ein – Plan, Kalender und Erinnerungen folgen von selbst.' }),
      chips([['alle', 'Überall'], ['de', 'Deutschland'], ['dach', 'DACH'], ['eu', 'Europa'], ['welt', 'Welt']], K.region, (v) => { K.region = v; K.monatAuf.clear(); renderHub(); }), el('div', { class: 'tf-w-such tf-rn-such' }, svgIco('i-search'), such), el('div', { id: 'rn-liste' }, ...kalenderListe()));
    frag.push(kal, kk); // Version 45: Suche und Liste zuerst, die Karte darunter
    frag.push(statistik(L));
    frag.push(el('p', { class: 'tf-note tf-rn-hinweis', text: 'Gezeigt wird jeweils die nächste Austragung – ab ' + (() => { const nm = (+localDate().slice(5, 7) % 12) + 1; return MON[nm] + ' ' + naechstesJahr(nm); })() + ', zwölf Monate voraus. Der Monat ist der übliche Termin; wo der Veranstalter für ' + naechstesJahr(1) + ' noch keinen Tag veröffentlicht hat, ist er voraussichtlich. Höhenmeter sind Richtwerte nach Streckenbeschreibungen, bei kleineren Rennen aus dem Charakter der Strecke geschätzt („ca.“); Teilnehmerzahlen sind ungefähr. Für die Anmeldung zählt die Ausschreibung des Veranstalters.' }));
    box.replaceChildren(el('div', { class: 'tf-hub tf-rn' }, ...frag));
  }
  const KAL_MONATE = 3; // ohne Suche: die nächsten drei Monate mit Rennen, der Rest hinter einem Knopf
  const PRO_MONAT = 10; // Version 26: je Monat zuerst die zehn größten Rennen, der Rest klappt auf
  const rangfolge = (x, y) => (y.n || 0) - (x.n || 0) || (x.kurz ? 1 : 0) - (y.kurz ? 1 : 0) || x.name.localeCompare(y.name, 'de');
  const listeNeu = () => { const liste = $('#rn-liste'); if (liste) liste.replaceChildren(...kalenderListe()); return liste; };
  // Version 23: nur Rennen in der Zukunft – der laufende Monat gilt als vorbei, also ab nächstem Monat (Dezember 2026, dann 2027)
  const naechstesJahr = (mon) => { const h = localDate(), m = +h.slice(5, 7), y = +h.slice(0, 4); return mon > m ? y : y + 1; };
  const terminText = (r) => { // Version 26: bestätigter Tag, sonst Monat
    if (r.fix && r.datum && r.datum > localDate()) { const [y, m, d] = r.datum.split('-').map(Number); return d + '. ' + MON[m] + ' ' + y; }
    return MON[r.mon] + ' ' + naechstesJahr(r.mon);
  };
  function kalenderListe() {
    const L = gefiltert(), heute = +localDate().slice(5, 7), out = [], voll = K.kalVoll || !!K.suche || K.passt || filterZahl() > 0;
    let versteckt = 0, gezeigt = 0;
    for (let k = 1; k <= 12; k++) {
      const m = ((heute - 1 + k) % 12) + 1, M = L.filter((r) => r.mon === m).sort(rangfolge);
      if (!M.length) continue;
      if (!voll && gezeigt >= KAL_MONATE) { versteckt += M.length; continue; }
      gezeigt++;
      const Z = K.suche || K.monatAuf.has(m) ? M : M.slice(0, PRO_MONAT);
      out.push(el('h3', { class: 'tf-rn-monat', text: MON[m] + ' ' + naechstesJahr(m) + (k === 1 ? ' · nächster Monat' : '') }));
      out.push(el('div', { class: 'tf-links tf-rn-rows' }, ...Z.map(rennZeile)));
      if (Z.length < M.length) {
        const b = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein tf-rn-monat-mehr', 'data-monat': String(m) }, 'Alle ' + M.length + ' Rennen im ' + MON[m]);
        b.addEventListener('click', () => { K.monatAuf.add(m); listeNeu(); }); out.push(b);
      }
    }
    if (!out.length && !versteckt) out.push(el('p', { class: 'tf-empty', text: 'Kein Rennen passt zu Suche und Filter.' }));
    if (versteckt) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-rn-mehr' }, 'Alle Monate anzeigen', el('small', { class: 'num', text: '+' + versteckt }));
      b.addEventListener('click', () => { K.kalVoll = true; listeNeu(); });
      out.push(b);
    } else if (K.kalVoll && !K.suche) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-rn-mehr' }, 'Nur die nächsten Monate');
      b.addEventListener('click', () => { K.kalVoll = false; K.monatAuf.clear(); const liste = listeNeu(); if (liste) liste.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      out.push(b);
    }
    return out;
  }
  function rennZeile(r) {
    const d = distanzen(r), P = profil(r, d.tri ? 'rad' : 'lauf');
    const ultra = istUltra(r) ? ' ' + nf(d.lauf) + ' km' : '';
    const b = el('button', { type: 'button', class: 'tf-zeile tf-rn-zeile', 'data-rennen': r.id },
      el('span', { class: 'tf-rn-zprof' }, miniProfil(P, 64, 28, serieFarbe(r))),
      el('span', { class: 'tf-zeile-t' }, el('b', { text: r.name }), el('small', { text: titelLand(r) + ' · ' + distText(r) + ultra + (d.tri ? ' · ' + hmText(r, r.hmRad) + ' Rad' : ' · ' + hmText(r, r.hmLauf)) + (r.status ? ' · ' + (r.statusKurz || (r.status.indexOf('Nicht im') === 0 ? 'nicht im Kalender 2026' : 'Distanz geändert')) : '') })),
      K.passt && VORT && VORT.get(r.id) ? el('span', { class: 'tf-rn-vorteil num', text: Math.round(Math.abs(VORT.get(r.id).v) * 100) + ' % ' + (VORT.get(r.id).v >= 0 ? 'schneller' : 'langsamer'), title: 'Deine Prognose ' + hms(VORT.get(r.id).t) + ' gegenüber ' + hms(VORT.get(r.id).mittel) + ' im Schnitt der Distanz' }) : null,
      svgIco('i-chev'));
    b.lastChild.classList.add('tf-chev');
    b.addEventListener('click', () => { if (K.serie !== 'alle' && distListe(r).includes(K.serie)) WAHL[r.id] = K.serie; T.geh('rennen/strecke/' + r.id); });
    if (istUltra(r)) return b;
    // Version 45: daneben „Ich starte“ – ein Tipp, und das Rennen steht in Saison, Plan und Kalender
    return el('div', { class: 'tf-rn-zw' }, b, startKnopf(r, K.serie !== 'alle' && distListe(r).includes(K.serie) ? K.serie : undefined));
  }
  function statistik(L) {
    const c = el('article', { class: 'tf-card tf-rn-stat', id: 'rn-statistik' });
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('indigo', 'i-bars'), el('div', null, el('h2', { text: 'Statistik' }), el('div', { class: 'tf-sub', text: 'Wann die Rennen liegen und wie hart die Strecken sind' }))));
    // Rennen je Monat
    const proMonat = Array.from({ length: 12 }, (_, i) => L.filter((r) => r.mon === i + 1).length), max = Math.max(1, ...proMonat), heute = (+localDate().slice(5, 7) % 12) + 1; // Version 23: markiert den nächsten Monat (Kalender beginnt dort)
    c.appendChild(el('div', { class: 'tf-rn-monate' }, ...proMonat.map((n, i) => { const b = el('div', { class: 'tf-rn-mb' + (i + 1 === heute ? ' jetzt' : '') }, el('i', { style: 'height:' + Math.round((100 * n) / max) + '%' }), el('small', { text: MON[i + 1].slice(0, 1) })); b.title = MON[i + 1] + ': ' + n; return b; })));
    // Rangliste: Höhenmeter Rad (Triathlon) und Lauf
    const B = L.filter((r) => !r.geschaetzt); // Version 26: Ranglisten nur mit Höhenmetern nach Streckenbeschreibung
    const tri = B.filter((r) => SERIE[r.serie].sport === 'tri').sort((x, y) => y.hmRad - x.hmRad), lauf = B.filter((r) => SERIE[r.serie].sport === 'lauf' && !istUltra(r)).sort((x, y) => y.hmLauf - x.hmLauf);
    const rang = (titel, liste, feld, einheit) => {
      if (!liste.length) return null;
      const mx = Math.max(1, ...liste.map((r) => r[feld]));
      const ul = el('div', { class: 'tf-rn-rang' }, el('h3', { class: 'tf-h3', text: titel }));
      liste.slice(0, 5).forEach((r) => { const b = el('button', { type: 'button', class: 'tf-rn-rz' }, el('span', { text: r.name }), el('i', null, el('b', { style: 'width:' + Math.round((100 * r[feld]) / mx) + '%' })), el('span', { class: 'num', text: nf(r[feld]) + ' ' + einheit })); b.addEventListener('click', () => T.geh('rennen/strecke/' + r.id)); ul.appendChild(b); });
      return ul;
    };
    const flach = B.filter((r) => SERIE[r.serie].sport === 'tri').sort((x, y) => x.hmRad - y.hmRad);
    c.append(rang('Die härtesten Radstrecken', tri, 'hmRad', 'm'), rang('Die flachsten Langdistanzen', flach.filter((r) => GRUPPE[r.serie] === 'ld'), 'hmRad', 'm'), rang('Läufe mit den meisten Höhenmetern', lauf, 'hmLauf', 'm'));
    const ohne = L.length - B.length;
    if (ohne > 0) c.appendChild(el('p', { class: 'tf-note', text: 'Ranglisten ohne die ' + nf(ohne) + ' Rennen mit geschätzten Höhenmetern.' }));
    return c;
  }

  /* =====================================================================
     Streckenseite
     ===================================================================== */
  let STRECKE = null, disz = 'rad', ZULETZT = null;
  function wahlVon(r) { // Version 26: gewählte Distanz – sonst die deines Ziels bei diesem Rennen, sonst die Hauptdistanz
    const L = distListe(r);
    if (WAHL[r.id] && L.includes(WAHL[r.id])) return WAHL[r.id];
    const sz = zielInfo(), zr = sz ? sicher(() => zielStrecke(sz)) : null;
    if (zr && zr.id === r.id && L.includes(sz.ziel_distanz)) return sz.ziel_distanz;
    return L[0];
  }
  const kmText = (r, k) => { const d = distanzen(r, k); return d.tri ? kmZahl(d.swim) + ' km · ' + kmZahl(d.rad) + ' km · ' + kmZahl(d.lauf) + ' km' : kmZahl(d.lauf) + ' km'; };
  const geoKm = (a, b) => { const f = Math.PI / 180, c = Math.sin(a.lat * f) * Math.sin(b.lat * f) + Math.cos(a.lat * f) * Math.cos(b.lat * f) * Math.cos((b.lon - a.lon) * f); return 6371 * Math.acos(Math.max(-1, Math.min(1, c))); };
  function renderStrecke() {
    const box = $('#rennen-strecke-box'); if (!box) return;
    const R0 = T.routeInfo(T.route()) || {}; if (R0.strecke) STRECKE = R0.strecke;
    const r = STRECKE && BY[STRECKE]; if (!r) { box.replaceChildren(el('p', { class: 'tf-empty', text: 'Diese Strecke kennt Dreiklang nicht.' })); return; }
    const dk = wahlVon(r), d = distanzen(r, dk), S0 = SERIE[r.serie], tags = r.tags || [], sz = zielInfo(), zr = sz ? sicher(() => zielStrecke(sz)) : null, istZiel = !!(zr && zr.id === r.id);
    const DL = distListe(r), ca = r.geschaetzt ? 'ca. ' : '';
    if (ZULETZT !== r.id) { disz = d.tri ? 'rad' : 'lauf'; ZULETZT = r.id; } // Version 26: neue Strecke beginnt mit dem Rad
    T.kopf({ titel: r.name, sub: titelLand(r) });
    const frag = [];
    const PR = d.tri ? profil(r, 'rad', d.k) : null, PL = profil(r, 'lauf', d.k);
    // Bühne
    const hero = el('article', { class: 'tf-card tf-buehne tf-b-' + (S0.sport === 'tri' ? (tags.includes('bergig') ? 'pink' : 'blau') : 'daemmer') + ' tf-rs-hero tf-span2', id: 'rs-hero' });
    hero.append(el('span', { class: 'tf-augenbraue', text: (DL.length > 1 ? distText(r) : d.tri && tags.includes('extrem') ? 'Extrem-Triathlon' : S0.name) + (r.unter ? ' · ' + r.unter : '') + ' · ' + terminText(r) + (istZiel ? ' · dein Ziel' : '') }),
      el('h2', { class: 'tf-held-t', text: r.name }), el('p', { class: 'tf-held-u', text: titelLand(r) }));
    if (DL.length > 1) { // Version 26: Distanz wählen – Zahlen, Profil, Prognose und „Als Ziel setzen“ folgen
      const dw = el('div', { class: 'tf-rs-dist', role: 'group', 'aria-label': 'Distanz' });
      DL.forEach((k) => { const b = el('button', { type: 'button', 'aria-pressed': String(k === d.k), 'data-dist': k }, DNAME[k] || k); b.addEventListener('click', () => { WAHL[r.id] = k; renderStrecke(); }); dw.appendChild(b); });
      hero.appendChild(dw);
    }
    const zahl = (b, t) => el('div', null, el('b', { class: 'num', text: b }), el('small', { text: t }));
    const z = el('div', { class: 'tf-held-z' });
    if (d.tri) z.append(zahl(kmZahl(d.swim), 'km Schwimmen'), zahl(kmZahl(d.rad), 'km Rad · ' + ca + nf(PR ? PR.H : r.hmRad) + ' hm'), zahl(kmZahl(d.lauf), 'km Laufen · ' + ca + nf(PL ? PL.H : r.hmLauf) + ' hm'));
    else { z.append(zahl(kmZahl(d.lauf), 'km'), zahl(nf(PL ? PL.H : r.hmLauf), r.geschaetzt ? 'Höhenmeter, geschätzt' : 'Höhenmeter')); if (r.n) z.append(zahl(r.n >= 1000 ? Math.round(r.n / 1000) + 'k' : nf(r.n), 'Teilnehmer ca.')); else z.classList.add('zwei'); }
    hero.appendChild(z);
    hero.appendChild(el('div', { class: 'tf-chips tf-rs-tags' }, ...tags.filter((t) => TAG[t] && t !== 'meer' && t !== 'fluss').map((t) => el('span', { class: 'tf-chip', text: TAG[t] })), r.swim ? el('span', { class: 'tf-chip', text: { see: 'Seeschwimmen', meer: 'Meerschwimmen', fluss: 'Flussschwimmen', kanal: 'Kanalschwimmen', hafen: 'Hafenschwimmen' }[r.swim] }) : null));
    const akt = el('div', { class: 'tf-held-aktionen' });
    if (d.k !== 'ultra') akt.appendChild(Object.assign(startKnopf(r, d.k, 'tf-btn tf-btn-klein tf-held-los tf-rs-start'), { id: 'rs-start' })); // Version 45
    if (d.k !== 'ultra' && (istZiel || !meinStart(r))) { const zielB = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-held-los', id: 'rs-ziel' }, svgIco('i-flag'), istZiel ? ' Dein Ziel' : ' Als Ziel setzen'); zielB.addEventListener('click', () => (istZiel ? T.geh('rennen/saison') : zielBlatt(r, d.k))); akt.appendChild(zielB); }
    const teilB = el('button', { type: 'button', class: 'tf-btn tf-btn-klein', id: 'rs-teilen' }, svgIco('i-share'), ' Teilen'); teilB.addEventListener('click', () => { if (window.tfTeilen) tfTeilen.rennen(r); });
    akt.appendChild(teilB);
    if (r.url) akt.appendChild(el('a', { class: 'tf-btn tf-btn-klein tf-rs-web', id: 'rs-web', href: r.url, target: '_blank', rel: 'noopener noreferrer' }, svgIco('i-extern'), ' Website')); // Version 22: die Seite des Veranstalters
    else akt.appendChild(el('a', { class: 'tf-btn tf-btn-klein tf-rs-web', id: 'rs-suche', href: suchLink(r), target: '_blank', rel: 'noopener noreferrer' }, svgIco('i-search'), ' Im Netz suchen')); // Version 26: ohne geprüfte Adresse
    if (r.status) hero.appendChild(el('p', { class: 'tf-held-warn tf-rs-status' }, svgIco('i-warn'), el('span', { text: 'Stand November 2026: ' + r.status }))); // Version 22
    if (d.k === 'ultra') hero.appendChild(el('p', { class: 'tf-held-warn tf-rs-ultra' }, svgIco('i-info'), el('span', { text: 'Ultras lassen sich nicht als Ziel eintragen – Trainingsplan und Rennrechner rechnen bis zur Marathondistanz.' })));
    hero.appendChild(akt);
    frag.push(hero);
    // Höhenprofil
    const pk = el('article', { class: 'tf-card tf-span2', id: 'rs-profil' });
    if (!d.tri) disz = 'lauf'; else if (disz === 'lauf' && !PL) disz = 'rad';
    const P = disz === 'rad' && PR ? PR : PL, AN = r.geschaetzt ? [] : anstiege(P, disz === 'rad' ? (d.rad >= 150 ? 60 : 40) : P.D > 60 ? 100 : 15); // Version 26: geschätzte Profile ohne Anstiegsliste
    pk.append(el('div', { class: 'tf-card-head' }, S.badge(disz === 'rad' ? 'orange' : 'mint', disz === 'rad' ? 'i-bike' : 'i-run'), el('div', null, el('h2', { text: 'Höhenprofil ' + (disz === 'rad' ? 'Rad' : 'Laufen') }), el('div', { class: 'tf-sub', text: kmZahl(P.D) + ' km · ' + ca + nf(P.H) + ' Höhenmeter' + (P.runden > 1 ? ' · ' + P.runden + ' Runden' : '') + (AN.length ? ' · ' + AN.length + (AN.length === 1 ? ' Anstieg' : ' Anstiege') : '') }))));
    if (d.tri) { const seg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Disziplin' }); [['rad', 'Rad'], ['lauf', 'Laufen']].forEach(([id, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(disz === id) }, n); b.addEventListener('click', () => { disz = id; renderStrecke(); }); seg.appendChild(b); }); pk.appendChild(seg); }
    const chart = el('div', { class: 'tf-chart tf-rs-chart' }); pk.appendChild(chart);
    requestAnimationFrame(() => { if (chart.isConnected) profilChart(chart, P, { farbe: disz === 'rad' ? 'orange' : 'mint', anstiege: AN, hoehe: 170 }); });
    if (AN.length) pk.appendChild(el('ol', { class: 'tf-rs-anstiege' }, ...AN.map((a) => el('li', null, el('b', { text: 'km ' + nf(a.von, 0) + '–' + nf(a.bis, 0) }), el('span', { text: '+' + Math.round(a.gain) + ' m auf ' + nf(a.laenge, 1) + ' km · Ø ' + nf(a.pct, 1) + ' %' })))));
    pk.appendChild(el('p', { class: 'tf-note', text: (P.art === 'beschrieben' ? 'Profil nach der Streckenbeschreibung – die bekannten Anstiege an ihrer Kilometerposition; die kleinen Wellen dazwischen sind schematisch ergänzt, damit die Summe den veröffentlichten Höhenmetern entspricht.' : r.geschaetzt ? 'Schematisches Profil – die Höhenmeter sind aus dem Charakter der Strecke geschätzt, Lage und Form der Anstiege sind nicht die echten. Die genauen Werte stehen beim Veranstalter.' : 'Schematisches Profil aus den Gesamt-Höhenmetern und dem Charakter der Strecke – Lage und Form der Anstiege sind nicht die echten.') + (d.haupt ? '' : ' Für diese Distanz sind die Höhenmeter anteilig aus der längsten Strecke gerechnet.') }));
    frag.push(pk);
    // Prognose
    const PG = sicher(() => prognose(r, d.k));
    if (PG) {
      const c = el('article', { class: 'tf-card tf-span2', id: 'rs-prognose' });
      c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('pink', 'i-clock'), el('div', null, el('h2', { text: 'Deine Prognose auf dieser Strecke' }), el('div', { class: 'tf-sub', text: (DL.length > 1 ? (DNAME[d.k] || '') + ' · ' : '') + 'Aus deinem Athletenprofil, Abschnitt für Abschnitt über das Profil' }))));
      c.appendChild(el('div', { class: 'tf-rs-gesamt' }, el('b', { class: 'num', text: hms(PG.gesamt) }), el('small', { text: PG.ziel ? 'Dein Ziel ' + hms(PG.ziel.gesamt) + ' · ' + (PG.gesamt <= PG.ziel.gesamt ? nf(Math.round((PG.ziel.gesamt - PG.gesamt) / 60)) + ' min Luft' : nf(Math.round((PG.gesamt - PG.ziel.gesamt) / 60)) + ' min fehlen') : 'Gesamtzeit' })));
      c.appendChild(el('div', { class: 'tf-rs-splits' }, ...PG.teile.filter((t) => !/^t[12]$/.test(t.id)).map((t) => { const zielS = PG.ziel ? PG.ziel[t.id] : null; return el('div', { class: 'tf-rs-split' }, el('small', { text: t.name }), el('b', { class: 'num', text: hms(t.s) }), el('span', { text: t.sub }), zielS ? el('em', { class: 'num', text: (t.s <= zielS ? '−' : '+') + nf(Math.round(Math.abs(t.s - zielS) / 60)) + ' min zum Ziel' }) : null); })));
      { // Version 52: dieselbe Strecke mit deinem Kraft-Effekt – als ruhige Zeile unter den Abschnitten
        const KF = kraftF(), am = kraftA2(KF, 'm'), PK = am ? sicher(() => prognose(r, d.k, am)) : null;
        if (PK && PK.gesamt > 0 && PG.gesamt - PK.gesamt >= 20) c.appendChild(el('p', { class: 'tf-rs-kraft', id: 'rs-kraft' }, el('b', { text: 'Mit Kraft-Effekt: ' }), el('span', { class: 'num', text: hms(PK.gesamt) }), ' – etwa ' + minTxt52(PG.gesamt - PK.gesamt) + ' schneller. Geschätzt aus deinen Gewichten; Watt und Tempo oben bleiben bei deinen gemessenen Werten.'));
      }
      c.appendChild(el('ul', { class: 'tf-rs-annahmen' }, ...PG.annahmen.map((t) => el('li', { text: t })).concat(r.geschaetzt ? [el('li', { text: 'Höhenmeter geschätzt – mit den echten Werten des Veranstalters kann die Zeit deutlich abweichen' })] : [])));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, 'Im Rennrechner feiner einstellen'); b.addEventListener('click', () => T.geh('rennen/rechner'));
      c.appendChild(el('div', { class: 'tf-form-actions' }, b, el('span', { class: 'tf-ich-hint', text: 'Ohne Wind, Wechselzonen-Wege und Verpflegungsstopps – Richtwert, keine Garantie.' })));
      frag.push(c);
      // Pacing je Anstieg
      const radT = PG.teile.find((t) => t.id === 'bike'), laufT = PG.teile.find((t) => t.id === 'run');
      const pc = el('article', { class: 'tf-card tf-span2', id: 'rs-pacing' });
      pc.appendChild(el('div', { class: 'tf-card-head' }, S.badge('orange', 'i-gauge'), el('div', null, el('h2', { text: 'Pacing für diese Strecke' }), el('div', { class: 'tf-sub', text: 'Gleichmäßig fahren, am Berg nur ein wenig mehr – das Modell belohnt Geduld' }))));
      const L = [];
      if (radT) {
        const a = athlet(), AR = r.geschaetzt ? [] : anstiege(radT.P, d.rad >= 150 ? 60 : 40), oben = Math.round(Math.min(radT.watt * 1.08, (+a.ftp_ref_w || 220) * radT.ifMax * 1.08)); // Version 26: nie unter der Leistung im Flachen
        const flachText = 'Flache Strecke: gleichmäßig treten, die Aero-Position halten – hier gewinnt die Disziplin, nicht der Beinschmerz.';
        L.push(el('li', null, el('b', { text: 'Rad: ' + radT.watt + ' W im Flachen (NP ca. ' + radT.np + ' W)' }), el('span', { text: AR.length ? 'An den Anstiegen bis ' + oben + ' W, nie darüber – jedes Watt mehr am Berg kostet beim Laufen. Abfahrten rollen lassen und essen.' : r.geschaetzt && !tags.includes('flach') ? 'An Anstiegen bis ' + oben + ' W, nie darüber – wo sie liegen, zeigt der Streckenplan des Veranstalters. Abfahrten rollen lassen und essen.' : flachText })));
        AR.forEach((x, i) => L.push(el('li', { class: 'tf-rs-pz' }, el('b', { text: 'Anstieg ' + (i + 1) + ' · km ' + nf(x.von, 0) }), el('span', { text: '+' + Math.round(x.gain) + ' m, Ø ' + nf(x.pct, 1) + ' % – bis ' + oben + ' W, oben sofort zurück auf ' + radT.watt + ' W' }))));
        if (tags.includes('windig')) L.push(el('li', null, el('b', { text: 'Wind' }), el('span', { text: 'Gegen den Wind nicht die Watt erhöhen – Position tiefer, Geduld. Mit dem Wind nicht nachlassen.' })));
      }
      if (laufT) {
        const AL = r.geschaetzt ? [] : anstiege(laufT.P, 15), pace = laufT.s / d.lauf;
        L.push(el('li', null, el('b', { text: 'Laufen: ' + hms(pace) + ' /km im Schnitt' }), el('span', { text: d.tri ? 'Die ersten 2 km bewusst 10–15 s langsamer als geplant – die Beine kommen vom Rad. Verpflegung an jeder Station.' : 'Erste Hälfte kontrolliert, zweite Hälfte gleich schnell oder schneller – negative Splits gewinnen Marathons.' })));
        AL.forEach((x, i) => L.push(el('li', { class: 'tf-rs-pz' }, el('b', { text: 'Anstieg ' + (i + 1) + ' · km ' + nf(x.von, 0) }), el('span', { text: '+' + Math.round(x.gain) + ' m – Tempo um ' + Math.round(pace * 3.5 * (x.pct / 100)) + ' s/km zurücknehmen, Schrittlänge kürzer, Frequenz halten' }))));
        if (tags.includes('heiss')) L.push(el('li', null, el('b', { text: 'Hitze' }), el('span', { text: 'Ab 25 °C kostet jedes Grad Zeit – Tempo von Anfang an 3–5 % ruhiger, kühlen an jeder Station (Ely et al. 2007).' })));
      }
      pc.appendChild(el('ul', { class: 'tf-rs-pacing' }, ...L));
      pc.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Martin et al., J Appl Biomech 1998 · Atkinson et al., J Sports Sci 2007 (gleichmäßige gegen variable Leistung) · Abbiss & Laursen, Sports Med 2008 · Minetti et al., J Appl Physiol 2002' })));
      frag.push(pc);
    } else if (keinePrognose(r, d.k)) { // Version 26: Ultras und Extrem-Triathlons – ehrlich ohne Zeit
      frag.push(el('article', { class: 'tf-card tf-span2', id: 'rs-ohne-prognose' }, el('div', { class: 'tf-card-head' }, S.badge('gray', 'i-clock'), el('div', null, el('h2', { text: 'Keine Prognose für diese Strecke' }), el('div', { class: 'tf-sub', text: d.k === 'ultra' ? 'Ultralauf' : 'Extrem-Triathlon' }))),
        el('p', { class: 'tf-rs-note', text: 'Hier entscheiden Gelände, Wetter, Nacht und Verpflegung mehr als Watt und Tempo – eine Zeit aus dem Modell wäre geraten. Orientierung geben die Ergebnislisten der letzten Jahre beim Veranstalter.' })));
    }
    // Fakten
    const fk = el('article', { class: 'tf-card', id: 'rs-fakten' });
    fk.appendChild(el('div', { class: 'tf-card-head' }, S.badge('gray', 'i-info'), el('div', null, el('h2', { text: 'Gut zu wissen' }))));
    fk.appendChild(el('p', { class: 'tf-rs-note', text: r.note }));
    const kv = el('div', { class: 'tf-kv tf-kv-2' },
      el('div', null, el('small', { text: 'Nächste Austragung' }), el('span', { text: terminText(r) }), el('em', { text: r.fix ? 'Termin vom Veranstalter bestätigt' : 'voraussichtlich, nach dem üblichen Termin' })),
      el('div', null, el('small', { text: 'Teilnehmer' }), r.n ? el('span', { class: 'num', text: 'ca. ' + tausend(r.n) }) : el('span', { text: 'keine Angabe' }), el('em', { text: r.n ? 'Einzelstarter, ungefähr' : 'steht beim Veranstalter' })),
      d.tri ? el('div', null, el('small', { text: 'Schwimmen' }), el('span', { text: { see: 'See', meer: 'Meer', fluss: 'Fluss', kanal: 'Kanal', hafen: 'Hafen' }[r.swim] || 'laut Ausschreibung' }), el('em', { text: tags.includes('strom') ? 'mit Strömung' : r.swim ? 'Neopren meist erlaubt' : 'See, Fluss oder Bad' })) : null,
      el('div', null, el('small', { text: 'Charakter' }), el('span', { text: tags.filter((t) => ['flach', 'wellig', 'huegelig', 'bergig'].includes(t)).map((t) => TAG[t]).join(', ') || '–' }), el('em', { text: r.geschaetzt ? 'nach Lage und Region geschätzt' : tags.includes('schnell') ? 'schnelle Strecke' : tags.includes('kult') ? 'Kultrennen' : '' })));
    fk.appendChild(kv);
    if (DL.length > 1) fk.appendChild(el('ul', { class: 'tf-rs-dists' }, ...DL.map((k) => el('li', { class: k === d.k ? 'akt' : '' }, el('b', { text: DNAME[k] || k }), el('span', { class: 'num', text: kmText(r, k) }))))); // Version 26
    if (r.rek) fk.appendChild(el('p', { class: 'tf-note', text: 'Streckenrekord: ' + [r.rek.m, r.rek.w].filter(Boolean).join(' · ') + '.' }));
    if (r.url) fk.appendChild(el('p', { class: 'tf-note tf-rs-link' }, 'Ausschreibung, Termin und Anmeldung: ', el('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer', text: r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') }), ' ↗')); // Version 22
    else fk.appendChild(el('p', { class: 'tf-note tf-rs-link' }, 'Für dieses Rennen hat Dreiklang keine geprüfte Adresse – Ausschreibung, Termin und Anmeldung: ', el('a', { href: suchLink(r), target: '_blank', rel: 'noopener noreferrer', text: 'im Netz suchen' }), ' ↗'));
    frag.push(fk);
    // Ähnliche Strecken – gleiche Distanz, ähnliche Höhenmeter, nah gelegen
    const h0 = d.tri ? r.hmRad : r.hmLauf;
    const aehnlich = R.filter((x) => x.id !== r.id && SERIE[x.serie].sport === S0.sport && distListe(x).includes(d.k)).map((x) => ({ x, d: Math.abs((d.tri ? x.hmRad : x.hmLauf) - h0) + geoKm(x, r) * 0.5 + (x.status ? 400 : 0) })).sort((p, q) => p.d - q.d).slice(0, 4).map((p) => p.x);
    if (aehnlich.length) { const ac = el('article', { class: 'tf-card', id: 'rs-aehnlich' }); ac.append(el('div', { class: 'tf-card-head' }, S.badge('blue', 'i-tausch'), el('div', null, el('h2', { text: 'Ähnliche Strecken' }), el('div', { class: 'tf-sub', text: (DNAME[d.k] || S0.kurz) + ' · ähnliche Höhenmeter, nicht weit weg' }))), el('div', { class: 'tf-links tf-rn-rows' }, ...aehnlich.map(rennZeile))); frag.push(ac); }
    box.replaceChildren(el('div', { class: 'tf-grid tf-rs' }, ...frag));
  }
  // Als Ziel setzen: Datum wählen, dann als A-Rennen eintragen · Version 26: mit der gewählten Distanz
  function zielBlatt(r, dk) {
    const S0 = SERIE[r.serie], d = distanzen(r, dk), heute = localDate(), jahr = +heute.slice(0, 4) + (r.mon > +heute.slice(5, 7) ? 0 : 1);
    const item = window.tfDistanz ? tfDistanz(S0.sport, d.k) : null;
    const tag0 = r.fix && r.datum && r.datum > heute ? r.datum : jahr + '-' + String(r.mon).padStart(2, '0') + '-01';
    const datum = el('input', { class: 'tf-input', type: 'date', value: tag0, min: heute, 'aria-label': 'Renntag' });
    const ziel = el('input', { class: 'tf-input', type: 'text', inputmode: 'numeric', placeholder: 'z. B. 8:59:00', 'aria-label': 'Zielzeit' });
    const PG = sicher(() => prognose(r, d.k)); if (PG) ziel.placeholder = 'z. B. ' + hms(Math.round(PG.gesamt / 60) * 60);
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Als Hauptrennen eintragen');
    ok.addEventListener('click', async () => {
      if (!datum.value) { setMsg(msg, 'Bitte den Renntag wählen.', true); return; }
      let zs = null; if (ziel.value.trim()) { const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(ziel.value.trim()); if (!m) { setMsg(msg, 'Zielzeit als h:mm oder h:mm:ss.', true); return; } zs = +m[1] * 3600 + +m[2] * 60 + (+m[3] || 0); }
      ok.disabled = true; setMsg(msg, 'Speichert …');
      try {
        const j = await A().api('POST', '/api/wettkampf', { name: r.name, datum: datum.value, sport: S0.sport, distanz: d.k, prio: 'A', ziel_s: zs, notiz: titelLand(r) + (distListe(r).length > 1 ? ' · ' + (DNAME[d.k] || '') : ''), strecke: r.id });
        const W = (A().raw('wettkaempfe') || []).filter((w) => w.id !== j.row.id).concat([j.row]).sort((x, y) => (x.datum < y.datum ? -1 : 1));
        A().patch('wettkaempfe', W); if (window.tfWissen) tfWissen.schliessen(); A().toast(r.name + ' ist dein Ziel'); T.neu();
      } catch (e) { setMsg(msg, e.message, true); ok.disabled = false; }
    });
    const box = el('div', { class: 'tf-rm' }, el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: r.name }), el('p', { class: 'tf-rm-sub', text: 'Wird als A-Rennen in deine Saison eingetragen' + (item ? ' – ' + item.lang : '') + ', mit Countdown, Trainingsphasen und Tapering. ' + (r.fix && r.datum ? 'Der Renntag ist vom Veranstalter bestätigt.' : 'Den genauen Renntag findest du in der Ausschreibung; die nächste Austragung ist voraussichtlich im ' + terminText(r) + '.') }),
      el('div', { class: 'tf-sz-f2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Renntag' }), datum), el('label', { class: 'tf-field' }, el('span', { text: 'Zielzeit (optional)' }), ziel)),
      el('div', { class: 'tf-form-actions' }, ok), msg);
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  /* ---------- Version 45: „Ich starte“ – ein Tipp trägt das Rennen in Saison, Plan und Kalender ein ---------- */
  const TAG_MS = 864e5, tagDiff = (a, b) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / TAG_MS);
  const meine = () => A().raw('wettkaempfe') || [];
  const meinStart = (r) => meine().find((w) => w.strecke === r.id && w.datum >= localDate()) || null;
  // Rolle von selbst: das erste Rennen wird dein Hauptrennen; danach zählen lange Rennen als wichtig, kurze als Trainingsrennen
  function autoPrio(dk) {
    const h = localDate();
    if (!meine().some((w) => w.prio === 'A' && w.datum >= h)) return 'A';
    return ['sprint', '5k', '10k'].includes(dk) ? 'C' : 'B';
  }
  const planFolge = (prio, dk) => (prio === 'A' ? 'Dein Trainingsplan läuft jetzt auf diesen Tag zu – mit Tapering davor.'
    : prio === 'B' ? (['ld', 'md', 'm'].includes(dk) ? 'Im Plan: eine Taper-Woche davor und drei ruhige Tage danach.' : 'Im Plan: zwei ruhige Tage davor, am Tag danach locker.')
    : 'Im Plan ersetzt es eine harte Einheit, am Vortag nichts Hartes.');
  async function eintragen(r, dk, datum, prio, alt) {
    const S0 = SERIE[r.serie], d = distanzen(r, dk);
    const j = await A().api('POST', '/api/wettkampf', Object.assign(alt ? { id: alt.id, ziel_s: alt.ziel_s } : {}, { name: r.name.slice(0, 60), datum, sport: S0.sport, distanz: d.k, prio, notiz: titelLand(r) + (distListe(r).length > 1 ? ' · ' + (DNAME[d.k] || '') : ''), strecke: r.id }));
    A().patch('wettkaempfe', meine().filter((w) => w.id !== j.row.id).concat([j.row]).sort((x, y) => (x.datum < y.datum ? -1 : 1)));
    return j.row;
  }
  function starten(r, dk) {
    const d = distanzen(r, dk), heute = localDate();
    if (d.k === 'ultra') { A().toast('Ultras lassen sich noch nicht eintragen'); return; }
    const da = meinStart(r); if (da) { startBlatt(r, d.k, da); return; }
    const prio = autoPrio(d.k);
    const fertig = (row) => { if (window.tfWissen) tfWissen.schliessen(); A().toast('Eingetragen als ' + PRIO_TXT[row.prio] + ' – steht in Plan und Kalender'); T.neu(); };
    if (r.fix && r.datum && r.datum > heute) { eintragen(r, d.k, r.datum, prio).then(fertig).catch((e) => A().toast(e.message)); return; }
    // Renntag nicht bestätigt: nur das Datum fragen
    const jahr = +heute.slice(0, 4) + (r.mon > +heute.slice(5, 7) ? 0 : 1);
    const datum = el('input', { class: 'tf-input', type: 'date', value: jahr + '-' + String(r.mon).padStart(2, '0') + '-01', min: heute, 'aria-label': 'Renntag' });
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'start-ok' }, 'Eintragen');
    ok.addEventListener('click', () => {
      if (!datum.value || datum.value <= heute) { setMsg(msg, 'Bitte den Renntag wählen.', true); return; }
      ok.disabled = true; setMsg(msg, 'Speichert …');
      eintragen(r, d.k, datum.value, prio).then(fertig).catch((e) => { setMsg(msg, e.message, true); ok.disabled = false; });
    });
    const box = el('div', { class: 'tf-rm', id: 'start-blatt' }, el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: r.name }),
      el('p', { class: 'tf-rm-sub', text: 'Wann ist der Start? Der Termin ist noch nicht bestätigt – voraussichtlich im ' + terminText(r) + '. Das Rennen wird als ' + PRIO_TXT[prio] + ' eingetragen. ' + planFolge(prio, d.k) }),
      el('label', { class: 'tf-field' }, el('span', { text: 'Renntag' }), datum), el('div', { class: 'tf-form-actions' }, ok), msg);
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }
  // Schon eingetragen: Rolle ändern oder Teilnahme zurücknehmen
  function startBlatt(r, dk, w) {
    const msg = el('p', { class: 'tf-form-msg', role: 'status' }), n = tagDiff(w.datum, localDate());
    const seg = el('div', { class: 'tf-seg tf-start-rolle', role: 'group', 'aria-label': 'Rolle des Rennens' }, ...[['A', 'Hauptrennen'], ['B', 'Wichtig'], ['C', 'Training']].map(([k, t]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(w.prio === k), 'data-prio': k }, t);
      b.addEventListener('click', () => { if (w.prio === k) return; setMsg(msg, 'Speichert …'); eintragen(r, dk, w.datum, k, w).then((row) => { if (window.tfWissen) tfWissen.schliessen(); A().toast('Jetzt ' + PRIO_TXT[row.prio] + ' – der Plan passt sich an'); T.neu(); }).catch((e) => setMsg(msg, e.message, true)); });
      return b;
    }));
    const weg = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', id: 'start-weg' }, 'Ich starte nicht mehr');
    weg.addEventListener('click', () => { weg.disabled = true; A().api('DELETE', '/api/wettkampf?id=' + encodeURIComponent(w.id)).then(() => { A().patch('wettkaempfe', meine().filter((x) => x.id !== w.id)); if (window.tfWissen) tfWissen.schliessen(); A().toast('Ausgetragen – der Plan ist wieder wie vorher'); T.neu(); }).catch((e) => { setMsg(msg, e.message, true); weg.disabled = false; }); });
    const sais = el('button', { type: 'button', class: 'tf-btn', id: 'start-saison' }, 'Zielzeit und Details'); sais.addEventListener('click', () => { if (window.tfWissen) tfWissen.schliessen(); T.geh('rennen/saison'); });
    const box = el('div', { class: 'tf-rm', id: 'start-blatt' }, el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Du startest: ' + r.name }),
      el('p', { class: 'tf-rm-sub', text: datumLang(w.datum) + (n > 0 ? ' · in ' + nf(n) + (n === 1 ? ' Tag' : ' Tagen') : n === 0 ? ' · heute' : '') + '. ' + planFolge(w.prio, dk) + ' Eine Woche, zwei Tage und einen Tag vorher erinnert dich Dreiklang.' }),
      el('p', { class: 'tf-caption', text: 'Rolle im Plan' }), seg, el('div', { class: 'tf-form-actions' }, sais, weg), msg);
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }
  const datumLang = (d) => new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const startKnopf = (r, dk, cls) => {
    const da = meinStart(r), b = el('button', { type: 'button', class: (cls || 'tf-rn-start') + (da ? ' dabei' : ''), 'data-start': r.id, 'aria-pressed': String(!!da), 'aria-label': (da ? 'Du startest bei ' : 'Ich starte bei ') + r.name }, svgIco(da ? 'i-check' : 'i-plus'), el('span', { text: da ? 'Dabei' : 'Ich starte' }));
    b.addEventListener('click', (e) => { e.stopPropagation(); starten(r, dk); });
    return b;
  };
  // Ankündigungen: eine Woche, zwei Tage und einen Tag vor jedem eingetragenen Rennen
  function ankuendigungen(datum) {
    return meine().map((w) => ({ w, n: tagDiff(w.datum, datum) })).filter((x) => [7, 2, 1].includes(x.n)).map(({ w, n }) => {
      const C = w.prio === 'C', wann = n === 7 ? 'In einer Woche' : n === 2 ? 'Übermorgen' : 'Morgen';
      const text = n === 7 ? (C ? 'Trainingsrennen ohne Tapering – die Woche läuft normal, nur am Vortag nichts Hartes. Anmeldung und Anreise prüfen.' : 'Das Tapering beginnt: weniger Umfang, die Intensität bleibt kurz erhalten. Material durchsehen, Startunterlagen und Anreise klären.')
        : n === 2 ? (C ? 'Heute normal trainieren, morgen nichts Hartes. Material bereitlegen.' : 'Heute kurz und locker. Kohlenhydrate auffüllen, viel trinken und früh schlafen – die vorletzte Nacht zählt am meisten.')
        : (C ? 'Heute nichts Hartes. Tasche packen, Startzeit und Anfahrt prüfen.' : 'Heute 20–30 Minuten locker mit drei, vier kurzen Antritten. Tasche nach der Packliste packen, Rad einchecken, Wecker stellen.');
      return { id: w.id, tage: n, name: w.name, prio: w.prio, strecke: w.strecke || null, titel: wann + ': ' + w.name, text };
    });
  }

  /* ---------- Anmelden ---------- */
  T.seite('rennen-hub', renderHub);
  T.seite('rennen-strecke', renderStrecke);
  T.routen('rennen', (rest) => (rest === 'finden' ? { seite: 'rennen-hub', titel: 'Rennen finden', sub: nf(R.length) + ' Rennen – Karte, Kalender und Statistik', eltern: 'rennen' } : null)); // Version 27
  T.routen('rennen/strecke', (id) => (BY[id] ? { seite: 'rennen-strecke', titel: BY[id].name, sub: titelLand(BY[id]), eltern: 'rennen', strecke: id } : null));
  /* =====================================================================
     Version 47: Saison zum Darüberfahren · Rennen-Blatt (Prognose, Vergleich, Platz) · Rennen im Plan
     Die Saison ist ein Band, das unter einer festen Nadel durchläuft: wischen, ziehen, Pfeiltasten. Jedes Rennen steht als
     Balken darauf – so hoch wie seine Belastung –, dahinter blass die Erholung. Ein Tipp öffnet das Rennen-Blatt:
     Prognose (Stand heute · am Renntag laut Plan · optimistisch), Vergleich mit eigenen Ergebnissen und „Welcher Platz?“.
     ===================================================================== */
  const DAYMS = 864e5;
  const wkZeile = (r) => (A().raw('wettkaempfe') || []).find((q) => q.id === r.id) || r;
  const datumLang47 = (d) => new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const hm47 = (s) => { const m = Math.round(s / 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const zeitTxt = (s) => hms(s);
  /* Prognose für ein eingetragenes Rennen: auf der Strecke aus dem Katalog (mit Höhenprofil), sonst mit dem Rennrechner.
     jetzt = mit deinen Werten von heute · plan = mit den Schwellen, die der Trainingsplan bis zum Renntag erwarten lässt
     (untere Grenze, mit deiner bisherigen Plan-Treue) · opt = obere Grenze, wenn du den Plan vollständig durchziehst. */
  /* Version 52: Kraft-Effekt in der Prognose. Was seit deinem letzten Test an Ökonomie dazukam (aus dem Gym, tfGym.kraftFaktor),
     wird zu abweichenden Athletenwerten: FTP × (1 + Rad), Lauf-Tempo ÷ (1 + Laufen); Schwimmen bleibt. Das gilt nur für die
     Prognose – Vorgaben für Watt und Tempo bleiben bei den gemessenen Werten (kein Rennen auf einer Schätzung). */
  const kraftF = () => (window.tfGym && tfGym.kraftFaktor ? sicher(() => tfGym.kraftFaktor()) : null);
  function kraftA2(F, k) { // k: 'm' (Mitte) | 'lo' | 'hi' → abweichende Werte oder null
    if (!F) return null;
    const a = athlet(), o = {}, r = +F.rad[k] || 0, l = +F.lauf[k] || 0;
    if (+a.ftp_ref_w > 0 && r > 0) o.ftp_ref_w = +a.ftp_ref_w * (1 + r);
    if (l > 0) { if (+a.vt2_pace_s_km > 0) o.vt2_pace_s_km = +a.vt2_pace_s_km / (1 + l); if (+a.vt1_pace_s_km > 0) o.vt1_pace_s_km = +a.vt1_pace_s_km / (1 + l); }
    return Object.keys(o).length ? o : null;
  }
  const minTxt52 = (s) => (s >= 90 ? nf(Math.round(s / 60)) + ' min' : Math.max(10, Math.round(s / 10) * 10) + ' s');
  const PROGC = new Map();
  function prognoseFuer(w, nurJetzt) {
    const KF = kraftF(), kf = KF ? [KF.rad.m, KF.rad.lo, KF.rad.hi, KF.lauf.m, KF.lauf.lo, KF.lauf.hi].map((x) => (+x || 0).toFixed(4)).join(',') : '';
    const a = athlet(), k = [w.id, w.datum, w.sport, w.distanz, w.strecke || '', a.ftp_ref_w, a.css_s_100m, a.vt2_pace_s_km, a.vt1_pace_s_km, a.gewicht_ref_kg, a.cda_m2, nurJetzt ? 1 : 0, localDate(), kf].join('|');
    if (PROGC.has(k)) return PROGC.get(k);
    const r = streckeVon(w) || null, dk = w.distanz;
    const mitStrecke = !!(r && SERIE[r.serie] && SERIE[r.serie].sport === w.sport && !keinePrognose(r, dk));
    const voll = (a2) => (mitStrecke ? sicher(() => prognose(r, dk, a2)) : null);
    const zeit = (a2) => { const P = voll(a2); if (P && P.gesamt > 0) return Math.round(P.gesamt); const t = T.rrPrognose ? sicher(() => T.rrPrognose(w.sport, w.distanz, a2 || {})) : null; return t > 0 ? t : null; };
    const out = { jetzt: zeit(null), basis: mitStrecke ? 'strecke' : 'rechner', r: mitStrecke ? r : null };
    if (out.jetzt && KF) { // Version 52: Stand heute plus Kraft-Effekt – Mitte und Spanne (lo = kleiner Effekt, hi = großer)
      const am = kraftA2(KF, 'm'), m = am ? zeit(am) : null;
      if (m && m < out.jetzt) { const al = kraftA2(KF, 'lo'), ah = kraftA2(KF, 'hi'), lo = al ? zeit(al) : null, hi = ah ? zeit(ah) : null; out.kraft = { m, lo: lo && lo >= m && lo <= out.jetzt ? lo : m, hi: hi && hi <= m ? hi : m, F: KF }; }
    }
    if (!nurJetzt) {
      const SW = window.tfPlan && tfPlan.schwellenAm ? sicher(() => tfPlan.schwellenAm(w.datum)) : null, hat = !!(SW && Object.keys(SW.real).length);
      Object.assign(out, { SW, plan: hat ? zeit(SW.real) : null, opt: hat ? zeit(SW.opt) : null, teile: (voll(hat ? SW.real : null) || {}).teile || null });
      if (out.plan && out.jetzt && out.plan > out.jetzt) out.plan = out.jetzt; if (out.opt && out.plan && out.opt > out.plan) out.opt = out.plan;
    }
    if (PROGC.size > 80) PROGC.clear();
    PROGC.set(k, out); return out;
  }
  /* Belastung eines Rennens: Dauer × Intensität² × 100 (TSS). Die Intensität sinkt mit der Dauer – kurze Rennen nahe der Schwelle,
     eine Langdistanz deutlich darunter (Richtwerte nach Allen & Coggan). Erholung und Tapering aus dem Distanz-Katalog. */
  const IF_DAUER = [[0.75, 1], [1.5, 0.95], [3, 0.9], [5, 0.84], [8, 0.78], [99, 0.72]];
  function rennMin(w) {
    const lt = w.liga ? ligaTag(w.liga) : null; if (lt && lt.t.min) return lt.t.min;
    const P = sicher(() => prognoseFuer(w, true)); if (P && P.jetzt) return P.jetzt / 60;
    const k = w.kat || (window.tfDistanz ? tfDistanz(w.sport, w.distanz) : null), a = athlet();
    if (k && k.legs && k.legs.length) return k.legs.reduce((x, l) => x + (l.typ === 'swim' ? (l.km * 10 * (+a.css_s_100m || 120) * 1.05) / 60 : l.typ === 'bike' ? (l.km / 32) * 60 : l.typ === 'run' ? (l.km * (+a.vt2_pace_s_km || 300) * (l.km > 21 ? 1.15 : l.km > 10 ? 1.05 : 1)) / 60 : (l.s || 0) / 60), 0);
    return 60;
  }
  function rennLast(w) {
    const min = Math.max(10, rennMin(w)), h = min / 60, iF = IF_DAUER.find((x) => h <= x[0])[1], k = w.kat || (window.tfDistanz ? tfDistanz(w.sport, w.distanz) : null) || {};
    return { min: Math.round(min), iF, tss: Math.max(5, Math.round((h * iF * iF * 100) / 5) * 5), erholung: k.erholung || null, taper: k.taper || null };
  }

  /* ---------- Platz im Feld ----------
     Quelle 1: deine eingefügte Ergebnisliste (genau – die Zeiten liegen auf diesem Gerät, im Konto 60 Stützpunkte).
     Quelle 2: Schätzung aus typischen Feldern – Zielzeiten sind annähernd log-normal verteilt; Median je Distanz (Marathon:
     Europa 4:07 h, RunRepeat 2019; Triathlon: übliche Durchschnittszeiten), nach Streckencharakter verschoben. Als Spanne
     ausgegeben, weil kein Feld dem anderen gleicht. Liga-Rennen bekommen keine Schätzung: ihr Feld ist handverlesen. */
  const FELD = { 'tri:ld': [12.3 * 3600, 0.145, 1800, 0.88], 'tri:md': [5.8 * 3600, 0.14, 1500, 0.94], 'tri:od': [2.85 * 3600, 0.145, 400, 0.97], 'tri:sprint': [1.45 * 3600, 0.155, 300, 0.98],
    'lauf:m': [4.12 * 3600, 0.18, 3000, 0.97], 'lauf:hm': [2.05 * 3600, 0.18, 2500, 0.98], 'lauf:10k': [59 * 60, 0.2, 1500, 0.99], 'lauf:5k': [29.5 * 60, 0.21, 800, 0.99] }; // [mittlere Zeit, Streuung (log), Feldgröße, Anteil im Ziel]
  const PHI = (z) => { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp((-z * z) / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; };
  // Umkehrung von PHI (Näherung nach Acklam): der z-Wert zu einem Anteil – für die Stützpunkte des geschätzten Feldes
  const PROBIT = (p) => {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const rand = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    if (p < 0.02425) return rand(Math.sqrt(-2 * Math.log(p)));
    if (p > 1 - 0.02425) return -rand(Math.sqrt(-2 * Math.log(1 - p)));
    const q = p - 0.5, r = q * q;
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  const modellStuetzen = (M) => Array.from({ length: 60 }, (_, i) => M.median * Math.exp(M.sigma * PROBIT((i + 0.5) / 60))); // 60 Stützpunkte gleicher Häufigkeit – wie bei einer echten Liste
  function feldModell(w) {
    if (w.liga) return null;
    const f = FELD[w.sport + ':' + w.distanz]; if (!f) return null;
    const r = streckeVon(w), tags = (r && r.tags) || [];
    let k = tags.includes('bergig') ? 1.08 : tags.includes('huegelig') ? 1.03 : tags.includes('flach') || tags.includes('schnell') ? 0.97 : 1; // Strecke
    if (tags.includes('heiss')) k *= 1.02; if (tags.includes('windig')) k *= 1.01;
    if (tags.includes('wm')) k *= 0.9; else if (tags.includes('em')) k *= 0.97; // Meisterschaften: qualifiziertes oder stärkeres Feld
    const n = r && r.n > 0 ? Math.round((r.n * f[3]) / 10) * 10 : f[2];
    return { median: f[0] * k, sigma: f[1], n, nGenau: !!(r && r.n > 0) };
  }
  function zeitenAus(text) { // Ergebnisliste als Text → sortierte Zielzeiten in Sekunden: je Zeile die größte Zeit (die Gesamtzeit)
    const out = [];
    String(text || '').split(/\r?\n/).forEach((z) => {
      if (/\b(DNF|DNS|DSQ|DQ)\b|aufgegeben|disqual/i.test(z)) return;
      const m = z.match(/\b\d{1,2}:\d{2}:\d{2}\b|\b\d{1,3}:\d{2}\b/g); if (!m) return;
      let best = 0; m.forEach((x) => { const p = x.split(':').map(Number), s = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; if (p[p.length - 1] < 60 && p[p.length - 2] < 60 && s > best) best = s; });
      if (best > 0) out.push(best);
    });
    out.sort((x, y) => x - y);
    const med = out.length ? out[out.length >> 1] : 0; // Zeilen ohne Gesamtzeit (nur eine Teilzeit) fallen heraus
    return out.filter((s) => s >= med * 0.5 && s <= med * 3);
  }
  const stuetzen = (L) => { const n = L.length, q = []; for (let i = 0; i < 60; i++) q.push(L[Math.round((i * (n - 1)) / 59)]); return q; };
  function platzAus(F, t) { // F: { n, q: [60 Stützpunkte] } oder { liste: [alle Zeiten] } → { platz, n }
    if (F.liste && F.liste.length) { let lo = 0, hi = F.liste.length; while (lo < hi) { const m = (lo + hi) >> 1; if (F.liste[m] < t) lo = m + 1; else hi = m; } return { platz: lo + 1, n: F.liste.length, genau: true }; }
    const q = F.q, n = F.n; if (!Array.isArray(q) || q.length < 2 || !(n > 0)) return null;
    if (t <= q[0]) return { platz: 1, n }; if (t > q[q.length - 1]) return { platz: n + 1, n };
    let i = 1; while (i < q.length - 1 && q[i] < t) i++;
    const f = (i - 1 + (q[i] > q[i - 1] ? (t - q[i - 1]) / (q[i] - q[i - 1]) : 0)) / (q.length - 1);
    return { platz: Math.max(1, Math.min(n, Math.round(f * (n - 1)) + 1)), n };
  }
  function platzModell(M, t) { // → { p (Anteil schneller), platz: [von, bis], n }
    const p = (m) => PHI(Math.log(t / m) / M.sigma), pl = (x) => Math.max(1, Math.round(x * M.n) + 1);
    const a = pl(p(M.median * 1.04)), b = pl(p(M.median * 0.96)); // der Median eines Feldes ist auf etwa ±4 % bekannt – daraus die Spanne
    return { p: p(M.median), platz: [Math.min(a, b), Math.max(a, b)], n: M.n };
  }
  const feldKey = (w) => { const r = streckeVon(w); return ((r && r.id) || 'w-' + w.id).slice(0, 30) + ':' + w.distanz; };
  const FELDER = () => (A().state.rechner || {}).felder || {};
  const feldLokalKey = (k) => 'tf:feld:' + ((A().konto && A().konto().uid) || 'x') + ':' + k;
  function feldVon(w) { // gespeicherte Liste: genau, wenn sie auf diesem Gerät liegt
    const k = feldKey(w), f = FELDER()[k]; if (!f || !Array.isArray(f.q)) return null;
    const lokal = (art) => { try { const L = JSON.parse(localStorage.getItem(feldLokalKey(k + art)) || 'null'); return Array.isArray(L) && L.length ? L : null; } catch (e) { return null; } };
    return { k, j: f.j, n: f.n, q: f.q, liste: lokal(''), ak: f.akq ? { n: f.akn, q: f.akq, liste: lokal(':ak') } : null };
  }
  function feldSpeichern(w, liste, jahr, ak) { // ak: true = die Liste ist nur meine Altersklasse
    const k = feldKey(w), alle = Object.assign({}, FELDER()), f = Object.assign({}, alle[k] || {});
    if (ak) { f.akn = liste.length; f.akq = stuetzen(liste); } else { f.n = liste.length; f.q = stuetzen(liste); f.j = jahr; }
    if (!f.q) return false; // erst die Gesamtliste
    f.at = localDate(); alle[k] = f;
    const keys = Object.keys(alle); if (keys.length > 30) keys.sort((x, y) => String(alle[x].at).localeCompare(String(alle[y].at))).slice(0, keys.length - 30).forEach((x) => delete alle[x]);
    try { localStorage.setItem(feldLokalKey(k + (ak ? ':ak' : '')), JSON.stringify(liste)); } catch (e) { /* voll: dann zählen die Stützpunkte */ }
    const r = Object.assign({}, A().state.rechner || {}); r.felder = alle; A().setRechner(r);
    A().api('POST', '/api/rechner', { felder: alle }).catch((e) => { if (A().toast) A().toast('Ergebnisliste nicht im Konto gespeichert: ' + e.message); });
    return true;
  }
  function feldWeg(w) {
    const k = feldKey(w), alle = Object.assign({}, FELDER()); delete alle[k];
    try { localStorage.removeItem(feldLokalKey(k)); localStorage.removeItem(feldLokalKey(k + ':ak')); } catch (e) { /* egal */ }
    const r = Object.assign({}, A().state.rechner || {}); r.felder = alle; A().setRechner(r);
    A().api('POST', '/api/rechner', { felder: Object.keys(alle).length ? alle : null }).catch(() => {});
  }
  // Frühere eigene Ergebnisse über dieselbe Distanz: Multisport-Aufzeichnungen der Uhr (Triathlon), bei Läufen die schnellsten Aufzeichnungen über die Strecke
  function eigeneErgebnisse(w) {
    const k = w.kat || (window.tfDistanz ? tfDistanz(w.sport, w.distanz) : null); if (!k || !k.legs) return [];
    const km = (typ) => k.legs.filter((l) => l.typ === typ).reduce((x, l) => x + l.km, 0), nah = (ist, soll, tol) => soll > 0 && ist > soll * (1 - tol) && ist < soll * (1 + tol);
    const bi = km('bike'), ru = km('run'), out = [];
    if (bi) (rowsOf('rennen') || []).forEach((m) => { if (nah(m.rad_km, bi, 0.15) && (!ru || nah(m.lauf_km, ru, 0.15)) && m.gesamt_s > 0) out.push({ d: m.date, name: m.ort, s: m.gesamt_s }); });
    else if (ru) {
      const E = (A().raw && A().raw('garmin_einheiten')) || [], seit = new Date(Date.now() - 730 * DAYMS).toISOString().slice(0, 10);
      E.forEach((e) => { const d = (+e.dist_m || 0) / 1000; if (/run/.test(e.type || '') && !e.parent_id && e.date >= seit && d >= ru * 0.985 && d <= ru * 1.06 && +e.dur_s > 0) out.push({ d: e.date, name: e.name || 'Lauf', s: Math.round((+e.moving_s || +e.dur_s) * (ru / d)) }); });
      out.sort((x, y) => x.s - y.s); out.splice(3); // die drei schnellsten
    }
    return out.sort((x, y) => (x.d < y.d ? 1 : -1)).slice(0, 4);
  }

  /* ---------- Das Rennen-Blatt ---------- */
  const zeitLesen = (t) => { const p = String(t || '').trim().split(':').map((x) => Number(x.replace(',', '.'))); if (p.some((x) => !isFinite(x) || x < 0)) return null; return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? (p[0] >= 60 || p[1] >= 60 ? null : p[0] * 3600 + p[1] * 60) : null; };
  function rennBlatt(w0, opt) { // opt.zeit: mit dieser Zeit öffnen (aus dem Rennrechner)
    if (!(window.tfWissen && tfWissen.blatt)) return;
    const w = Object.assign({}, w0, { kat: w0.kat || (window.tfDistanz ? tfDistanz(w0.sport, w0.distanz) : null) });
    const r = streckeVon(w), lt = w.liga ? ligaTag(w.liga) : null, tg = Math.round((Date.parse(w.datum) - Date.parse(localDate())) / DAYMS);
    const L = rennLast(w), P = sicher(() => prognoseFuer(w)) || {}, E = sicher(() => eigeneErgebnisse(w)) || [];
    const box = el('div', { class: 'tf-rb', id: 'rennblatt' });
    box.append(el('span', { class: 'tf-augenbraue', text: (lt ? lt.L.kurz + ' · ' + lt.t.format : (w.art || (w.kat && w.kat.name) || '') + ' · ' + PRIO_TXT[w.prio]) }),
      el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: w.name }),
      el('p', { class: 'tf-rb-u', text: datumLang47(w.datum) + ' · ' + (tg === 0 ? 'heute' : tg > 0 ? 'in ' + nf(tg) + (tg === 1 ? ' Tag' : ' Tagen') : 'vorbei') }));
    // Belastung
    box.appendChild(el('div', { class: 'tf-rb-last' },
      el('div', null, el('b', { class: 'num', text: '≈ ' + hm47(L.min * 60) + ' h' }), el('small', { text: 'Dauer' })),
      el('div', null, el('b', { class: 'num', text: '≈ ' + nf(L.tss) }), el('small', { text: 'Belastung (TSS)' })),
      el('div', null, el('b', { class: 'num', text: L.erholung ? '≈ ' + L.erholung + (L.erholung === 1 ? ' Tag' : ' Tage') : '–' }), el('small', { text: 'Erholung danach' }))));
    // Prognose
    const sek = el('section', { class: 'tf-rb-s', id: 'rb-prognose' }, el('h3', { text: 'Deine Prognose' }));
    const werte = [['jetzt', 'Stand heute', P.jetzt, 'mit deinen Werten von heute'], ['kraft', 'Mit Kraft-Effekt', P.kraft ? P.kraft.m : 0, 'Stand heute plus dein Zuwachs aus dem Gym – geschätzt'], ['plan', 'Am Renntag laut Plan', P.plan, P.SW ? 'wenn du so weitertrainierst wie bisher' : ''], ['opt', 'Optimistisch', P.opt, 'wenn du den Plan vollständig durchziehst']].filter((x) => x[2] > 0);
    if (w.ziel_s > 0) werte.push(['ziel', 'Deine Zielzeit', w.ziel_s, 'so eingetragen']);
    if (!P.jetzt) sek.appendChild(el('p', { class: 'tf-note', text: 'Für diese Distanz gibt es keine Rechnung – trag unten eine Zeit ein, dann siehst du den Platz.' }));
    else {
      const lo = Math.min(...werte.map((x) => x[2])), hi = Math.max(...werte.map((x) => x[2])), sp = Math.max(1, hi - lo);
      const G = el('div', { class: 'tf-rb-prog' });
      werte.forEach(([id, n, s, sub]) => { const z = el('button', { type: 'button', class: 'tf-rb-pz', 'data-id': id, 'data-s': String(s), 'aria-label': n + ': ' + zeitTxt(s) + ' – für den Platz übernehmen' }, el('span', { class: 'tf-rb-pn' }, el('b', { text: n }), el('small', { text: sub })), el('b', { class: 'num tf-rb-pt', text: zeitTxt(s) }), el('span', { class: 'tf-rb-pb', 'aria-hidden': 'true' }, el('i', { style: 'width:' + (100 - 62 * ((hi - s) / sp)).toFixed(1) + '%' }))); G.appendChild(z); });
      sek.appendChild(G);
      const SW = P.SW, gew = P.plan && P.jetzt ? P.jetzt - P.plan : 0;
      sek.appendChild(el('p', { class: 'tf-rb-t', text: !SW ? 'Ohne Trainingsplan zeigt Dreiklang nur deinen Stand von heute. Mit einem Plan kommt dazu, was bis zum Renntag zu erwarten ist.'
        : !Object.keys(SW.real).length ? 'Für die Prognose am Renntag fehlen eigene Schwellenwerte (FTP, Lauf-Tempo, CSS) im Athletenprofil – bisher stehen dort Standardwerte.'
        : SW.wochen < 1 ? 'Bis zum Renntag ist es zu kurz für messbare Fortschritte – es zählt, was du jetzt kannst.'
        : 'Bis zum ' + (SW.bisTaper ? 'Beginn des Taperings' : SW.nachPlan ? 'Ende deines Plans' : 'Renntag') + ' sind es ' + nf(Math.round(SW.wochen)) + ' Wochen Training. ' + (gew >= 30 ? 'Das bringt laut Plan etwa ' + (gew >= 3600 ? hm47(gew) + ' h' : Math.round(gew / 60) + ' min') + '.' : '') + (SW.treue != null ? ' Bisher hast du ' + Math.round(SW.treue * 100) + ' % der geplanten Einheiten gemacht.' : '') }));
      if (P.kraft) { // Version 52: was die Zeile „Mit Kraft-Effekt“ bedeutet – und was sie nicht ändert
        const F = P.kraft.F, d = P.jetzt - P.kraft.m, d0 = P.jetzt - P.kraft.lo, d1 = P.jetzt - P.kraft.hi, pz = (x) => nf(100 * x, 1) + ' %';
        const teile = [F.lauf.m >= 0.0005 ? 'Laufen +' + pz(F.lauf.m) : null, w.sport !== 'lauf' && F.rad.m >= 0.0005 ? 'Rad +' + pz(F.rad.m) : null].filter(Boolean).join(', ');
        sek.appendChild(el('p', { class: 'tf-rb-t', id: 'rb-kraft' }, el('b', { text: 'Kraft-Effekt: ' }), 'etwa ' + minTxt52(d) + ' schneller' + (d1 - d0 >= 20 ? ' (Spanne ' + minTxt52(d0) + ' bis ' + minTxt52(d1) + ')' : '') + '. So viel Ökonomie kam nach deinen Gewichten dazu, ' + ((F.seit && (F.seit.lauf || (w.sport !== 'lauf' && F.seit.rad))) ? 'seit du zuletzt getestet hast' : 'seit du sie einträgst') + (teile ? ' – ' + teile : '') + '. Eine Schätzung aus Studien: Deine Vorgaben für Watt und Tempo bleiben bei den gemessenen Werten. Ein neuer Test zeigt, was angekommen ist.'));
      }
      // Keine falsche Sicherheit: stehen im Profil noch Standardwerte, ist die Rechnung nur ein grober Anhalt – das steht dann da
      const stdF = new Set(athlet().standard || []), brauch = w.sport === 'lauf' ? [['vt2_pace_s_km', 'das Lauf-Tempo']] : [['ftp_ref_w', 'die FTP'], ['vt2_pace_s_km', 'das Lauf-Tempo'], ['css_s_100m', 'die CSS']];
      const offenF = brauch.filter(([f]) => stdF.has(f) || !(+athlet()[f] > 0)).map((x) => x[1]);
      if (offenF.length) {
        const pb = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, 'Athletenprofil öffnen'); pb.addEventListener('click', () => { tfWissen.schliessen(); T.geh('profil/athlet'); });
        sek.appendChild(el('div', { class: 'tf-rb-std', id: 'rb-standard' }, el('p', { text: 'Für ' + (offenF.length > 1 ? offenF.slice(0, -1).join(', ') + ' und ' + offenF[offenF.length - 1] : offenF[0]) + (offenF.length === 1 ? ' steht' : ' stehen') + ' im Athletenprofil noch ' + (offenF.length === 1 ? 'ein Standardwert' : 'Standardwerte') + '. Die Prognose ist damit nur ein grober Anhalt – mit deinen eigenen Werten wird sie belastbar.' }), pb));
      }
      if (P.teile && P.teile.length > 1) sek.appendChild(el('div', { class: 'tf-rb-teile' }, ...P.teile.filter((t) => ['swim', 'bike', 'run'].includes(t.id)).map((t) => el('span', null, el('small', { text: t.name }), el('b', { class: 'num', text: zeitTxt(t.s) })))));
      sek.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: (P.basis === 'strecke' ? 'Gerechnet auf dem Profil dieser Strecke' : 'Gerechnet mit dem Rennrechner (flache Strecke)') + ' · Fortschritt nach Trainingsstand und Plan-Treue · Belastung aus Dauer und Intensität · Allen & Coggan, Training and Racing with a Power Meter 2010' + (P.kraft ? ' · Kraft-Effekt: Denadai et al., Sports Med 2017 · Blagrove et al., Sports Med 2018' : '') })));
    }
    box.appendChild(sek);
    // Vergleich mit eigenen Ergebnissen
    if (E.length) {
      const ref = P.plan || P.jetzt, sv = el('section', { class: 'tf-rb-s', id: 'rb-vergleich' }, el('h3', { text: 'Dein Vergleich' }));
      const UL = el('ul', { class: 'tf-rb-erg' });
      E.forEach((e) => { const d = ref ? ref - e.s : null; UL.appendChild(el('li', null, el('span', null, el('b', { text: e.name }), el('small', { text: e.d.slice(8, 10) + '.' + e.d.slice(5, 7) + '.' + e.d.slice(0, 4) })), el('b', { class: 'num', text: zeitTxt(e.s) }), d == null ? null : el('small', { class: 'tf-rb-d ' + (d < 0 ? 'gut' : 'mehr'), text: (d < 0 ? '−' : '+') + (Math.abs(d) >= 3600 ? hm47(Math.abs(d)) + ' h' : Math.max(1, Math.round(Math.abs(d) / 60)) + ' min') }))); });
      sv.append(UL, el('p', { class: 'tf-rb-t', text: (w.sport === 'lauf' ? 'Deine schnellsten Aufzeichnungen über diese Strecke aus zwei Jahren, auf die Renndistanz gerechnet.' : 'Deine Wettkämpfe und Koppeleinheiten über diese Distanz von der Uhr.') + (ref ? ' Daneben der Abstand zur Prognose ' + (P.plan ? 'laut Plan' : 'von heute') + ': Minus heißt, die Prognose ist schneller.' : '') }));
      box.appendChild(sv);
    }
    // Platz
    const platz = platzTeil(w, P, opt && opt.zeit > 0 ? Math.round(opt.zeit) : 0);
    box.appendChild(platz);
    const ruhig = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    sek.addEventListener('click', (e) => { const z = e.target.closest('.tf-rb-pz'); if (!z) return; platz.tfSetze(+z.dataset.s); platz.scrollIntoView({ block: 'start', behavior: ruhig() ? 'auto' : 'smooth' }); }); // eine Prognose antippen = diese Zeit im Feld ansehen
    // Wege
    const akt = el('div', { class: 'tf-form-actions tf-rb-akt' });
    if (r) { const b = el('button', { type: 'button', class: 'tf-btn' }, 'Strecke ansehen'); b.addEventListener('click', () => { tfWissen.schliessen(); T.geh('rennen/strecke/' + r.id); }); akt.appendChild(b); }
    const br = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', id: 'rb-rechner' }, 'Im Rennrechner rechnen'); // öffnet den Rechner gleich auf dieser Distanz
    br.addEventListener('click', () => { tfWissen.schliessen(); if (T.rrWahl && window.tfDistanz && tfDistanz(w.sport, w.distanz)) T.rrWahl(w.sport, w.distanz, w.ziel_s || 0); else T.geh('rennen/rechner'); }); akt.appendChild(br);
    box.appendChild(akt);
    tfWissen.blatt(box);
    if (opt && opt.zeit > 0) requestAnimationFrame(() => platz.scrollIntoView({ block: 'start' }));
  }
  function platzTeil(w, P, zeit0) {
    const sek = el('section', { class: 'tf-rb-s', id: 'rb-platz' }, el('h3', { text: 'Welcher Platz?' }));
    const jahr0 = +w.datum.slice(0, 4) - 1;
    let F = feldVon(w), M = feldModell(w);
    const start = zeit0 || P.plan || P.jetzt || w.ziel_s || (M ? M.median : 3600);
    const lage = el('p', { class: 'tf-rb-quelle', id: 'rb-quelle' }), erg = el('div', { class: 'tf-rb-platz', id: 'rb-erg', role: 'status' });
    const tIn = el('input', { class: 'tf-input tf-rb-zeit num', id: 'rb-zeit', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Zeit (Stunden:Minuten:Sekunden)' });
    const rg = el('input', { type: 'range', class: 'tf-rb-regler', id: 'rb-regler', 'aria-label': 'Zeit verschieben' });
    const chips = el('div', { class: 'tf-chipset tf-rb-chips', role: 'group', 'aria-label': 'Zeit übernehmen' });
    let t = Math.round(start);
    const grenzen = () => { const lo = F ? F.q[0] * 0.97 : M ? M.median * Math.exp(-3 * M.sigma) : t * 0.6, hi = F ? F.q[F.q.length - 1] : M ? M.median * Math.exp(2.2 * M.sigma) : t * 1.6; return [Math.floor(Math.min(lo, t) / 60) * 60, Math.ceil(Math.max(hi, t) / 60) * 60]; };
    const zeigen = (vonRegler) => {
      const [lo, hi] = grenzen(), schritt = hi - lo > 4 * 3600 ? 60 : hi - lo > 3600 ? 30 : 5;
      rg.min = String(lo); rg.max = String(hi); rg.step = String(schritt); if (!vonRegler) rg.value = String(t);
      tIn.value = zeitTxt(t); // immer – auch wenn das Feld noch den Fokus hat (am Handy bleibt er beim Schieben und bei den Chips dort)
      [...chips.children].forEach((b) => b.setAttribute('aria-pressed', String(Math.abs(+b.dataset.s - t) < 1)));
      erg.replaceChildren();
      if (F) {
        const x = platzAus(F, t), a = F.ak ? platzAus(F.ak, t) : null;
        erg.append(el('div', { class: 'tf-rb-pl' }, el('small', { text: 'Gesamt ' + F.j }), el('b', { class: 'num', text: x.platz > x.n ? 'hinter dem Feld' : (x.genau ? '' : '≈ ') + 'Platz ' + nf(x.platz) }), el('span', { text: 'von ' + nf(x.n) + (x.platz <= x.n ? ' · schneller als ' + Math.round(100 * (1 - (x.platz - 1) / x.n)) + ' %' : '') })));
        if (a) erg.append(el('div', { class: 'tf-rb-pl' }, el('small', { text: 'Deine Altersklasse' }), el('b', { class: 'num', text: a.platz > a.n ? 'hinter dem Feld' : (a.genau ? '' : '≈ ') + 'Platz ' + nf(a.platz) }), el('span', { text: 'von ' + nf(a.n) })));
        erg.appendChild(feldStreifen(F.q, t));
      } else if (M) {
        const x = platzModell(M, t);
        erg.append(el('div', { class: 'tf-rb-pl' }, el('small', { text: 'Geschätzt' }), el('b', { class: 'num', text: 'Platz ' + nf(x.platz[0]) + (x.platz[1] > x.platz[0] ? '–' + nf(x.platz[1]) : '') }), el('span', { text: 'von ' + (M.nGenau ? 'rund ' : 'etwa ') + nf(x.n) + ' im Ziel · schneller als etwa ' + Math.min(99, Math.max(1, Math.round(100 * (1 - x.p)))) + ' %' })));
        erg.appendChild(feldStreifen(modellStuetzen(M), t, true));
      } else erg.appendChild(el('p', { class: 'tf-note', text: w.liga ? 'Für Liga-Rennen schätzt Dreiklang keinen Platz – das Feld ist handverlesen und klein. Mit der Ergebnisliste vom letzten Jahr steht hier der genaue Platz.' : 'Für diese Distanz gibt es keine Schätzung. Mit der Ergebnisliste vom letzten Jahr steht hier der genaue Platz.' }));
      lage.textContent = F ? 'Grundlage: deine Ergebnisliste ' + F.j + ' mit ' + nf(F.n) + ' Zeiten' + (F.liste ? '' : ' (auf diesem Gerät liegen nur Stützpunkte – der Platz ist auf etwa ' + Math.max(1, Math.round(F.n / 120)) + ' genau)') + '.'
        : M ? 'Schätzung aus typischen Feldern dieser Distanz' + (M.nGenau ? ' und der Teilnehmerzahl des Rennens' : '') + ' – kein echtes Ergebnis. Für den genauen Platz vom letzten Jahr füg unten die Ergebnisliste ein.' : '';
    };
    const setze = (s, vonRegler) => { if (!(s > 0)) return; t = Math.round(s); zeigen(vonRegler); };
    [['Stand heute', P.jetzt], ['Laut Plan', P.plan], ['Optimistisch', P.opt], ['Zielzeit', w.ziel_s]].filter((x) => x[1] > 0).forEach(([n, s]) => { const b = el('button', { type: 'button', 'data-s': String(Math.round(s)), 'aria-pressed': 'false' }, n); b.addEventListener('click', () => setze(s)); chips.appendChild(b); });
    // Rennrechner: die Zeit, die du dort für diese Distanz ausgerechnet hast (mit deinen Einstellungen) – kommst du von dort, genau diese
    const rs = !zeit0 && T.rrSplits ? sicher(() => T.rrSplits(w.sport, w.distanz)) : null;
    const rr = zeit0 || (rs && rs.eigen ? Math.round(rs.legs.reduce((x, l) => x + (+l.t || 0), 0)) : 0);
    if (rr > 0 && (zeit0 || Math.abs(rr - (P.jetzt || 0)) > 30)) { const b = el('button', { type: 'button', 'data-s': String(rr), 'data-rr': '1', 'aria-pressed': 'false' }, 'Rennrechner'); b.addEventListener('click', () => setze(rr)); chips.appendChild(b); }
    rg.addEventListener('input', () => setze(+rg.value, true));
    tIn.addEventListener('change', () => { const s = zeitLesen(tIn.value); if (s) setze(s); else { tIn.value = zeitTxt(t); if (A().toast) A().toast('Zeit bitte als Stunden:Minuten:Sekunden, zum Beispiel 4:45:00'); } });
    tIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); tIn.blur(); } });
    sek.append(el('p', { class: 'tf-rb-t', text: 'Schieb die Zeit, tipp sie ein oder nimm eine aus der Prognose – darunter steht, wo du damit im Feld gelandet wärst.' }), chips, el('div', { class: 'tf-rb-zeile' }, tIn, rg), erg, lage);
    // Ergebnisliste einfügen
    const ta = el('textarea', { class: 'tf-input tf-rb-ta', id: 'rb-liste', rows: '4', placeholder: 'Ergebnisliste hier einfügen – jede Zeile mit einer Zielzeit, z. B.\n1  Max Muster  M30  8:41:07', 'aria-label': 'Ergebnisliste' });
    const jahr = el('input', { class: 'tf-input tf-rb-jahr num', id: 'rb-jahr', inputmode: 'numeric', value: String(F ? F.j : jahr0), 'aria-label': 'Jahr der Ergebnisliste' });
    const msg = el('span', { class: 'tf-form-msg', role: 'status' });
    const sp = (ak, dazu) => { // dazu: an die gespeicherte Gesamtliste anhängen (Ergebnisseiten mit mehreren Seiten)
      let Ls = zeitenAus(ta.value); const j = Math.round(+jahr.value), neuN = Ls.length;
      if (neuN < (dazu ? 1 : 5)) return void (msg.textContent = 'Darin stehen zu wenige Zeiten (' + neuN + '). Kopier die ganze Tabelle der Ergebnisseite.');
      if (!(j >= 2000 && j <= 2100)) return void (msg.textContent = 'Bitte das Jahr der Liste eintragen.');
      if (dazu) { if (!(F && F.liste)) return void (msg.textContent = 'Anhängen geht nur auf dem Gerät, auf dem die Liste eingefügt wurde.'); Ls = F.liste.concat(Ls).sort((x, y) => x - y); }
      if (!feldSpeichern(w, Ls, dazu ? F.j : j, ak)) return void (msg.textContent = 'Erst die Gesamtliste speichern, dann die Altersklasse.');
      F = feldVon(w); ta.value = '';
      msg.textContent = (dazu ? nf(neuN) + ' Zeiten angehängt – jetzt ' + nf(Ls.length) : nf(Ls.length) + ' Zeiten ' + (ak ? 'deiner Altersklasse ' : '') + 'gespeichert') + ' – schnellste ' + zeitTxt(Ls[0]) + ', mittlere ' + zeitTxt(Ls[Ls.length >> 1]) + '.';
      weg.hidden = false; b3.hidden = !(F && F.liste); zeigen(); };
    const b1 = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', id: 'rb-speichern' }, 'Als Gesamtliste speichern'); b1.addEventListener('click', () => sp(false));
    const b2 = el('button', { type: 'button', class: 'tf-btn', id: 'rb-speichern-ak' }, 'Als meine Altersklasse'); b2.addEventListener('click', () => sp(true));
    const b3 = el('button', { type: 'button', class: 'tf-btn', id: 'rb-anhaengen', hidden: !(F && F.liste) }, 'An die Liste anhängen'); b3.addEventListener('click', () => sp(false, true));
    const weg = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-danger', id: 'rb-weg', hidden: !F }, 'Liste entfernen'); weg.addEventListener('click', () => { feldWeg(w); F = null; weg.hidden = true; b3.hidden = true; msg.textContent = 'Liste entfernt.'; zeigen(); });
    const such = el('a', { class: 'tf-gym-link', href: 'https://duckduckgo.com/?q=' + encodeURIComponent(w.name.replace(/\s*\d{4}\s*$/, '') + ' Ergebnisse ' + jahr0), target: '_blank', rel: 'noopener noreferrer' }, 'Ergebnisse ' + jahr0 + ' suchen');
    sek.appendChild(el('details', { class: 'tf-rb-ein', id: 'rb-ein' }, el('summary', null, 'Ergebnisliste vom letzten Jahr einfügen'),
      el('p', { class: 'tf-rb-t' }, 'Öffne die Ergebnisse des Veranstalters, markier die Tabelle, kopier sie und füg sie hier ein. Dreiklang liest je Zeile die Gesamtzeit und rechnet daraus den genauen Platz für jede Zeit. Namen werden nicht gespeichert. Hat die Ergebnisseite mehrere Seiten: erst die erste speichern, dann die nächsten anhängen. ', such),
      ta, el('div', { class: 'tf-rb-jz' }, el('label', { for: 'rb-jahr', text: 'Jahr' }), jahr), el('div', { class: 'tf-form-actions' }, b1, b2, b3, weg), msg));
    sek.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Schätzung: Zielzeiten annähernd log-normal verteilt, Median je Distanz, nach Streckencharakter verschoben · Andersen, RunRepeat Marathon Statistics 2019 · Andersen, RunRepeat State of Running 2019' })));
    zeigen();
    sek.tfSetze = setze;
    return sek;
  }
  function feldStreifen(q, t, modell) { // das Feld als Streifen: 60 Stützpunkte von schnell nach langsam, deine Zeit als Marke
    const W = 300, H = 44, lo = q[0], hi = q[q.length - 1], x = (s) => 4 + ((Math.max(lo, Math.min(hi, s)) - lo) / Math.max(1, hi - lo)) * (W - 8);
    const sv = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tf-rb-feld', role: 'img', 'aria-label': 'Lage im Feld von schnell (links) nach langsam (rechts)' });
    // Dichte: wie viele Stützpunkte in jedem Abschnitt liegen
    const N = 30, cnt = new Array(N).fill(0); q.forEach((s) => { cnt[Math.min(N - 1, Math.floor(((s - lo) / Math.max(1, hi - lo)) * N))]++; });
    const mx = Math.max(...cnt), bw = (W - 8) / N;
    cnt.forEach((c, i) => { const hh = 3 + 23 * (c / mx); svg('rect', { x: (4 + i * bw + 0.75).toFixed(1), y: (30 - hh).toFixed(1), width: (bw - 1.5).toFixed(1), height: hh.toFixed(1), rx: 1.5, class: 'tf-rb-feld-b' + (4 + (i + 0.5) * bw < x(t) ? ' vor' : '') }, sv); });
    svg('line', { x1: x(t), x2: x(t), y1: 2, y2: 32, class: 'tf-rb-feld-m' }, sv);
    const a = svg('text', { x: 4, y: 42, class: 'tf-tick' }, sv); a.textContent = modell ? hm47(lo) : zeitTxt(lo); // geschätzt: auf die Minute, mehr wäre Scheingenauigkeit
    const b = svg('text', { x: W - 4, y: 42, 'text-anchor': 'end', class: 'tf-tick' }, sv); b.textContent = modell ? hm47(hi) : zeitTxt(hi);
    if (modell) sv.classList.add('modell');
    return sv;
  }

  /* Für den Rennrechner: wo läge die dort gerechnete Zeit im Feld deines nächsten Rennens über diese Distanz?
     Ein Tipp öffnet das Rennen-Blatt mit genau dieser Zeit. */
  function platzZeile(sport, dist, t) {
    if (!(t > 0)) return null;
    const K = kommende().filter((x) => x.sport === sport && x.distanz === dist), r = K.find((x) => !x.liga) || K[0]; if (!r) return null;
    const w = Object.assign({}, r, wkZeile(r)), F = feldVon(w), M = F ? null : feldModell(w);
    let txt = 'Platz im Feld ansehen';
    if (F) { const x = platzAus(F, t); txt = x.platz > x.n ? 'hinter dem Feld von ' + F.j : (x.genau ? '' : '≈ ') + 'Platz ' + nf(x.platz) + ' von ' + nf(x.n) + ' im Feld von ' + F.j; }
    else if (M) { const x = platzModell(M, t); txt = 'etwa Platz ' + nf(x.platz[0]) + (x.platz[1] > x.platz[0] ? '–' + nf(x.platz[1]) : '') + ' von rund ' + nf(x.n) + ' (geschätzt)'; }
    const b = el('button', { type: 'button', class: 'tf-rr-pz', id: 'rr-platz-knopf' }, el('span', { class: 'tf-rr-pz-t' }, el('small', { text: 'Welcher Platz wäre das? · ' + r.name }), el('b', { class: 'num', text: txt })), svgIco('i-chev'));
    b.addEventListener('click', () => rennBlatt(w, { zeit: t }));
    return b;
  }

  /* ---------- Die Saison als Band ----------
     Die ganze Saison steht auf einen Blick da: von heute bis nach dem letzten Rennen, je Rennen ein Balken (Höhe = Belastung),
     dahinter die Erholung, darunter die Phasen. Mit Finger oder Maus darüberfahren bewegt die Nadel – Datum, Phase und das
     nächstliegende Rennen laufen mit. Ein Tipp auf einen Balken öffnet das Rennen-Blatt. */
  function saisonKarte() {
    const sz = (rowsOf('saison') || [])[0], K0 = kommende(); if (!K0.length) return null;
    const h = localDate(), t0 = Date.parse(h), ende = K0.reduce((m, r) => (r.datum > m ? r.datum : m), h);
    const t1 = Math.min(t0 + 540 * DAYMS, Math.max(Date.parse(ende) + 21 * DAYMS, t0 + 90 * DAYMS)), tage = Math.round((t1 - t0) / DAYMS), lg = LG(), LL = lg.id ? LIGA[lg.id] : null;
    const c = el('article', { class: 'tf-card tf-sb', id: 'rn-saison' });
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('pink', 'i-cal'), el('div', null, el('h2', { text: 'Deine Saison' }), el('div', { class: 'tf-sub', text: K0.length + (K0.length === 1 ? ' Wettkampf' : ' Wettkämpfe') + ' bis ' + MON[+ende.slice(5, 7)] + ' ' + ende.slice(0, 4) + (LL ? ' · ' + LL.kurz : '') }))));
    const anz = el('p', { class: 'tf-sb-anz', id: 'sb-anz', 'aria-hidden': 'true' }), band = el('div', { class: 'tf-sb-band' }), nadel = el('i', { class: 'tf-sb-nadel', 'aria-hidden': 'true' });
    const rolle = el('div', { class: 'tf-sb-rolle', id: 'sb-rolle', tabindex: '0', role: 'slider', 'aria-label': 'Saison – mit Finger, Maus oder Pfeiltasten darüberfahren', 'aria-orientation': 'horizontal', 'aria-valuemin': '0', 'aria-valuemax': String(tage) }, band, nadel);
    const fokus = el('div', { class: 'tf-sb-fokus', id: 'sb-fokus', 'aria-live': 'polite' });
    const zur = el('button', { type: 'button', class: 'tf-sb-pf', 'aria-label': 'Voriges Rennen' }, svgIco('i-chev')), vor = el('button', { type: 'button', class: 'tf-sb-pf vor', 'aria-label': 'Nächstes Rennen' }, svgIco('i-chev'));
    c.append(el('div', { class: 'tf-sb-kopf' }, zur, anz, vor), rolle, fokus);
    const LST = K0.filter((r) => Date.parse(r.datum) <= t1).map((r) => ({ r, w: wkZeile(r), L: rennLast(r), t: Date.parse(r.datum) }));
    let W = 320, akt = null, pos = LST.length ? LST[0].t : t0, zieh = null;
    const PAD = 18, H = 132, yB = 96;
    const X = (t) => PAD + ((Math.min(t1, Math.max(t0, t)) - t0) / (t1 - t0)) * (W - 2 * PAD);
    const TvonX = (x) => t0 + ((Math.min(W - PAD, Math.max(PAD, x)) - PAD) / (W - 2 * PAD)) * (t1 - t0);
    const phaseAm = (d) => { const p = sz && Array.isArray(sz.phasen) ? sz.phasen.find((q) => q.von <= d && q.bis >= d) : null; return p ? p.name : ''; };
    const naechst = (t, px) => { let best = null, bd = px; LST.forEach((m) => { const d = Math.abs(X(m.t) - X(t)); if (d < bd) { bd = d; best = m; } }); return best; }; // das Rennen, das höchstens px neben der Stelle liegt
    const oeffne = (m) => rennBlatt(Object.assign({}, m.r, m.w));
    function fokusZeigen(m) {
      if (akt === m) return; akt = m;
      [...band.querySelectorAll('.tf-sb-r')].forEach((b) => b.classList.toggle('an', b.dataset.id === m.r.id));
      if (zieh && navigator.vibrate) { try { navigator.vibrate(6); } catch (e) { /* egal */ } } // ein kurzes Ticken, wenn die Nadel zum nächsten Rennen wechselt
      const r = m.r, lt = r.liga ? ligaTag(r.liga) : null, P = sicher(() => prognoseFuer(m.w.kat ? m.w : Object.assign({}, m.w, { kat: r.kat }))) || {};
      const auf = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-btn-klein', id: 'sb-oeffnen' }, 'Prognose und Platz'); auf.addEventListener('click', () => oeffne(m));
      fokus.replaceChildren(
        el('div', { class: 'tf-sb-fk' }, el('span', { class: 'tf-prio', style: 'background:var(--tf-' + PRIO_FARBE[r.prio] + ')', text: r.liga ? 'L' : r.prio }), el('div', null, el('b', { text: r.name }), el('small', { text: datumLang47(r.datum) + ' · ' + tageTxt(r.in_tagen) + (lt ? ' · ' + lt.t.format : '') }))),
        el('div', { class: 'tf-sb-fw' }, el('span', null, el('small', { text: 'Dauer' }), el('b', { class: 'num', text: '≈ ' + hm47(m.L.min * 60) + ' h' })), el('span', null, el('small', { text: 'Belastung' }), el('b', { class: 'num', text: '≈ ' + nf(m.L.tss) + ' TSS' })), el('span', null, el('small', { text: 'Erholung' }), el('b', { class: 'num', text: m.L.erholung ? '≈ ' + m.L.erholung + ' T.' : '–' }))),
        P.jetzt ? el('p', { class: 'tf-sb-fp' }, 'Prognose: ', el('b', { class: 'num', text: zeitTxt(P.jetzt) }), ' heute', P.plan && P.plan < P.jetzt - 20 ? el('span', null, ' · ', el('b', { class: 'num', text: zeitTxt(P.plan) }), ' laut Plan') : null, P.opt && P.opt < (P.plan || P.jetzt) - 20 ? el('span', null, ' · ', el('b', { class: 'num', text: zeitTxt(P.opt) }), ' optimistisch') : null) : null,
        el('div', { class: 'tf-form-actions' }, auf));
    }
    function lesen() {
      const n = Math.round((pos - t0) / DAYMS), d = new Date(t0 + n * DAYMS).toISOString().slice(0, 10);
      let best = LST[0]; LST.forEach((m) => { if (Math.abs(m.t - pos) < Math.abs(best.t - pos)) best = m; });
      const aufRennen = Math.abs(X(best.t) - X(pos)) < 2.5, tg = aufRennen ? best.r.in_tagen : n, dd = aufRennen ? best.r.datum : d;
      const kurzD = datumLang47(dd).replace(/ \d{4}$/, ''); // zwei feste Zeilen, damit beim Darüberfahren nichts springt
      const z1 = aufRennen ? 'Renntag · ' + kurzD : tg <= 0 ? 'Heute' : kurzD, z2 = [tg > 0 ? 'in ' + nf(tg) + (tg === 1 ? ' Tag' : ' Tagen') : aufRennen ? 'heute' : kurzD, phaseAm(dd)].filter(Boolean).join(' · ');
      anz.replaceChildren(el('b', { text: z1 }), el('span', { text: z2 }));
      rolle.setAttribute('aria-valuenow', String(Math.max(0, tg))); rolle.setAttribute('aria-valuetext', z1 + ', ' + z2 + ' – ' + best.r.name);
      fokusZeigen(best);
    }
    function setze(t, glatt) {
      pos = Math.min(t1, Math.max(t0, t));
      rolle.classList.toggle('glatt', !!glatt);
      nadel.style.transform = 'translateX(' + (X(pos) - 1).toFixed(1) + 'px)';
      lesen();
    }
    function bauen() {
      W = Math.max(240, rolle.clientWidth || 320);
      band.replaceChildren();
      const sv = svg('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, class: 'tf-sb-svg', 'aria-hidden': 'true', focusable: 'false' }, band);
      svg('rect', { x: PAD, y: yB - 4, width: W - 2 * PAD, height: 8, rx: 4, fill: 'var(--tf-fill)' }, sv);
      (sz && Array.isArray(sz.phasen) ? sz.phasen : []).forEach((p) => { const a = Math.max(t0, Date.parse(p.von)), b = Math.min(t1, Date.parse(p.bis) + DAYMS); if (b > a) svg('rect', { x: X(a), y: yB - 4, width: Math.max(2, X(b) - X(a) - 1.5), height: 8, rx: 4, fill: 'var(--tf-' + (PH_FARBE[p.id] || 'gray') + ')', opacity: p.id === sz.phase ? 1 : 0.5 }, sv); });
      // Monate: so viele Beschriftungen, wie Platz haben
      const m0 = new Date(t0); m0.setUTCDate(1); m0.setUTCMonth(m0.getUTCMonth() + 1);
      const monatPx = ((W - 2 * PAD) / tage) * 30.4, jeder = monatPx >= 30 ? 1 : monatPx >= 15 ? 2 : 3; let k = 0;
      for (let m = m0.getTime(); m < t1; k++) { // der Januar bekommt einen längeren Strich – dort wechselt das Jahr
        const d = new Date(m), xm = X(m), jan = d.getUTCMonth() === 0;
        svg('line', { x1: xm, x2: xm, y1: yB + 8, y2: yB + (jan ? 15 : 12), stroke: 'var(--tf-fg3)', 'stroke-width': 1 }, sv);
        if (k % jeder === 0 && xm < W - PAD - 14) { const tx = svg('text', { x: xm + 3, y: yB + 26, class: 'tf-tick' }, sv); tx.textContent = MON[d.getUTCMonth() + 1].slice(0, 3); }
        d.setUTCMonth(d.getUTCMonth() + 1); m = d.getTime();
      }
      const maxT = Math.max(120, ...LST.map((m) => m.L.tss)), bw = LST.length > 8 ? 8 : 10;
      LST.forEach((m) => {
        const xr = X(m.t), f = 'var(--tf-' + PRIO_FARBE[m.r.prio] + ')', hh = 14 + 58 * Math.sqrt(m.L.tss / maxT);
        if (m.L.erholung) svg('rect', { x: xr, y: yB - 4, width: Math.max(3, Math.min(W - PAD, X(m.t + m.L.erholung * DAYMS)) - xr), height: 8, rx: 4, class: 'tf-sb-erh' }, sv);
        svg('rect', { x: xr - bw / 2, y: yB - 8 - hh, width: bw, height: hh, rx: bw / 2, fill: m.r.liga ? 'var(--tf-card)' : f, stroke: f, 'stroke-width': m.r.liga ? 2 : 0 }, sv);
        const b = el('button', { type: 'button', class: 'tf-sb-r', 'data-id': m.r.id, style: 'left:' + (xr - 22).toFixed(1) + 'px;height:' + (hh + 24).toFixed(0) + 'px;top:' + (yB - 16 - hh).toFixed(0) + 'px', 'aria-label': m.r.name + ', ' + datumLang47(m.r.datum) + ', Belastung etwa ' + m.L.tss + ' TSS – öffnen' });
        b.addEventListener('click', (e) => { if (e.detail !== 0) return; setze(m.t, true); oeffne(m); }); // Tastatur; Finger und Maus laufen über die Zeiger-Ereignisse des Bandes
        b.addEventListener('focus', () => setze(m.t, true));
        band.appendChild(b);
      });
      svg('circle', { cx: X(t0), cy: yB, r: 6, fill: 'var(--tf-pink)', stroke: 'var(--tf-card)', 'stroke-width': 3 }, sv);
      akt = null; setze(pos);
    }
    // Darüberfahren: Maus sofort, Finger sobald er sich waagerecht bewegt (senkrecht scrollt weiter die Seite). Loslassen nahe
    // einem Rennen rastet darauf ein; ein Tipp auf einen Balken öffnet das Blatt.
    const xIn = (e) => e.clientX - rolle.getBoundingClientRect().left;
    rolle.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      zieh = { id: e.pointerId, x: e.clientX, bewegt: false, maus: e.pointerType === 'mouse' };
      try { rolle.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
      if (zieh.maus) { rolle.classList.add('zieht'); setze(TvonX(xIn(e))); }
    });
    rolle.addEventListener('pointermove', (e) => {
      if (!zieh || e.pointerId !== zieh.id) return;
      if (!zieh.bewegt && Math.abs(e.clientX - zieh.x) > 5) { zieh.bewegt = true; rolle.classList.add('zieht'); }
      if (zieh.bewegt || zieh.maus) setze(TvonX(xIn(e)));
    });
    const los = (e) => {
      if (!zieh || e.pointerId !== zieh.id) return;
      const war = zieh; zieh = null; rolle.classList.remove('zieht');
      if (e.type === 'pointerup' && !war.bewegt) { const m = naechst(TvonX(xIn(e)), 22); if (m) { setze(m.t, true); oeffne(m); } else setze(TvonX(xIn(e)), true); return; }
      const m = naechst(pos, 14); if (m) setze(m.t, true);
    };
    rolle.addEventListener('pointerup', los); rolle.addEventListener('pointercancel', los);
    const sprung = (dir) => { const L = dir > 0 ? LST.filter((m) => m.t > pos + DAYMS / 2) : LST.filter((m) => m.t < pos - DAYMS / 2).reverse(); if (L.length) setze(L[0].t, true); else if (dir < 0) setze(t0, true); };
    zur.addEventListener('click', () => sprung(-1)); vor.addEventListener('click', () => sprung(1));
    rolle.addEventListener('keydown', (e) => {
      if (e.target !== rolle) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); sprung(e.key === 'ArrowRight' ? 1 : -1); }
      else if (e.key === 'Home') { e.preventDefault(); setze(t0, true); }
      else if (e.key === 'End') { e.preventDefault(); setze(LST[LST.length - 1].t, true); }
      else if ((e.key === 'Enter' || e.key === ' ') && akt) { e.preventDefault(); oeffne(akt); }
    });
    // Liste: alle Rennen, ein Tipp öffnet das Blatt
    const liste = el('div', { class: 'tf-sb-liste', id: 'rn-naechste' });
    K0.forEach((r) => {
      const m = LST.find((x) => x.r === r) || { r, w: wkZeile(r), L: rennLast(r), t: Date.parse(r.datum) };
      const lt = r.liga ? ligaTag(r.liga) : null, d = new Date(r.datum + 'T12:00:00Z');
      const b = el('button', { type: 'button', class: 'tf-rn-wk', style: '--p:var(--tf-' + PRIO_FARBE[r.prio] + ')' },
        el('span', { class: 'tf-rn-wk-d' }, el('small', { text: WT[d.getUTCDay()] }), el('b', { class: 'num', text: String(d.getUTCDate()) }), el('small', { text: MON[d.getUTCMonth() + 1].slice(0, 3) })),
        el('span', { class: 'tf-rn-wk-t' }, el('b', { text: r.name }), el('small', { text: lt ? lt.L.kurz + ' · ' + lt.t.format + (lt.L.vorlaeufig ? ' · Termin vorläufig' : '') : r.art + ' · ' + PRIO_TXT[r.prio] })),
        el('span', { class: 'tf-rn-wk-n num' }, r.in_tagen === 0 ? 'heute' : nf(r.in_tagen) + ' T.', el('small', { text: '≈ ' + nf(m.L.tss) + ' TSS' })), svgIco('i-chev'));
      b.addEventListener('click', () => { setze(m.t, true); oeffne(m); });
      liste.appendChild(b);
    });
    c.append(el('p', { class: 'tf-sb-lg', 'aria-hidden': 'true' }, el('span', null, el('i', { class: 'du' }), 'heute'), el('span', null, el('i', { class: 'b' }), 'Balken = Belastung des Rennens'), LST.some((m) => m.r.liga) ? el('span', null, el('i', { class: 'l' }), 'Liga-Renntag') : null, el('span', null, el('i', { class: 'e' }), 'Erholung danach')), liste);
    requestAnimationFrame(() => { if (!rolle.isConnected) return; bauen(); if (window.ResizeObserver) { let b0 = rolle.clientWidth; new ResizeObserver(() => { if (rolle.isConnected && Math.abs(rolle.clientWidth - b0) > 1) { b0 = rolle.clientWidth; bauen(); } }).observe(rolle); } });
    return c;
  }

  /* ---------- Rennen im Plan (für „Plan bearbeiten“) ---------- */
  function ligaBlatt() {
    if (!(window.tfWissen && tfWissen.blatt)) return;
    const st = LG(), box = el('div', { class: 'tf-rm tf-lg-blatt' }, el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: 'Liga wählen' }), el('p', { class: 'tf-rm-sub', text: 'Die Renntage kommen automatisch in deine Saison und deinen Trainingsplan.' }));
    const py = pyramide(st); py.addEventListener('click', (e) => { if (e.target.closest('button')) setTimeout(() => tfWissen.schliessen(), 0); });
    box.appendChild(py); tfWissen.blatt(box);
  }
  function planBlock() {
    const K0 = kommende(), st = LG(), L = st.id ? LIGA[st.id] : null, h = localDate(); if (!K0.length && !L) return null;
    const sz = (rowsOf('saison') || [])[0];
    const c = el('article', { class: 'tf-card tf-rp', id: 'plan-rennen' });
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('pink', 'i-flag'), el('div', null, el('h2', { text: 'Rennen im Plan' }), el('div', { class: 'tf-sub', text: 'Nimmst du eins heraus, rechnen Plan, Saison und Kalender sofort neu' }))));
    const UL = el('div', { class: 'tf-rp-l' });
    K0.forEach((r) => {
      const lt = r.liga ? ligaTag(r.liga) : null, d = new Date(r.datum + 'T12:00:00Z'), ziel = sz && sz.ziel_id === r.id;
      const z = el('div', { class: 'tf-rp-z', 'data-id': r.id },
        el('span', { class: 'tf-rn-wk-d' }, el('small', { text: WT[d.getUTCDay()] }), el('b', { class: 'num', text: String(d.getUTCDate()) }), el('small', { text: MON[d.getUTCMonth() + 1].slice(0, 3) })),
        el('span', { class: 'tf-rp-t' }, el('b', { text: r.name }), el('small', { text: lt ? lt.L.kurz + ' · ' + lt.t.format : r.art + ' · ' + PRIO_TXT[r.prio] })));
      if (ziel) z.appendChild(el('small', { class: 'tf-rp-ziel', text: 'Ziel des Plans' }));
      else {
        const x = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein tf-rp-x', 'aria-label': r.name + ' aus dem Plan nehmen' }, 'Herausnehmen');
        x.addEventListener('click', async () => {
          x.disabled = true;
          if (r.liga) { const a = new Set(LG().aus || []); a.add(r.liga); await ligaSetzenLeise(Object.assign(LG(), { aus: [...a] })); }
          else { try { await A().api('DELETE', '/api/wettkampf?id=' + encodeURIComponent(r.id)); A().patch('wettkaempfe', (A().raw('wettkaempfe') || []).filter((q) => q.id !== r.id)); } catch (e) { x.disabled = false; return void (A().toast && A().toast(e.message)); } }
          const alt = wkZeile(r);
          if (A().toast) A().toast(r.name + ' ist aus dem Plan', 7000, { text: 'Zurück', fn: async () => {
            if (r.liga) { const a = new Set(LG().aus || []); a.delete(r.liga); await ligaSetzenLeise(Object.assign(LG(), { aus: [...a] })); }
            else { try { const j = await A().api('POST', '/api/wettkampf', { name: alt.name, datum: alt.datum, sport: alt.sport, distanz: alt.distanz, prio: alt.prio, ziel_s: alt.ziel_s || undefined, notiz: alt.notiz || '', strecke: alt.strecke || undefined }); A().patch('wettkaempfe', (A().raw('wettkaempfe') || []).concat([j.row]).sort((p, q) => (p.datum < q.datum ? -1 : 1))); } catch (e) { if (A().toast) A().toast(e.message); } }
            T.neu();
          } });
          T.neu();
        });
        z.appendChild(x);
      }
      UL.appendChild(z);
    });
    if (K0.length) c.appendChild(UL);
    if (L) {
      const aus = L.tage.filter((t) => t.datum && t.datum >= h && (st.aus || []).includes(t.id));
      const seg = el('div', { class: 'tf-seg tf-lg-prio', role: 'group', 'aria-label': 'Stellenwert der Liga-Renntage' });
      [['B', 'B · mit Mini-Taper'], ['C', 'C · aus dem Training']].forEach(([p, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String((st.prio === 'C' ? 'C' : 'B') === p) }, n); b.addEventListener('click', async () => { await ligaSetzenLeise(Object.assign(LG(), { prio: p })); T.neu(); }); seg.appendChild(b); });
      const wb = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein', id: 'rp-liga-wechseln' }, 'Liga wechseln'); wb.addEventListener('click', ligaBlatt);
      const lb = el('div', { class: 'tf-rp-liga', id: 'rp-liga' }, el('div', { class: 'tf-rp-lk' }, el('b', { text: L.name }), wb), el('div', { class: 'tf-field tf-lg-feld' }, el('span', { text: 'Wie wichtig sind die Renntage?' }), seg));
      if (aus.length) { const ch = el('div', { class: 'tf-chipset tf-rp-aus' }); aus.forEach((t) => { const b = el('button', { type: 'button', 'aria-pressed': 'false' }, svgIco('i-plus'), ' ' + t.ort); b.addEventListener('click', async () => { const a = new Set(LG().aus || []); a.delete(t.id); await ligaSetzenLeise(Object.assign(LG(), { aus: [...a] })); T.neu(); }); ch.appendChild(b); }); lb.appendChild(el('div', { class: 'tf-field' }, el('span', { text: 'Herausgenommene Renntage wieder aufnehmen' }), ch)); }
      lb.appendChild(el('p', { class: 'tf-note', text: (L.vorlaeufig ? 'Der Kalender ' + naechstesJahr(1) + ' ist noch nicht veröffentlicht – bis dahin stehen die Wochenenden der Saison 2026 drin, als vorläufig markiert. ' : '') + 'Im Plan: am Renntag nur das Rennen, ' + (st.prio === 'C' ? 'am Vortag nichts Hartes.' : 'zwei Tage davor nichts Hartes, am Vortag eine kurze Einheit mit Antritten.') }));
      c.appendChild(lb);
    } else { const lb = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein', id: 'rp-liga-wechseln' }, 'Liga wählen'); lb.addEventListener('click', ligaBlatt); c.appendChild(el('div', { class: 'tf-form-actions' }, lb)); }
    const mehr = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, svgIco('i-plus'), ' Rennen hinzufügen'); mehr.addEventListener('click', () => T.geh('rennen/finden'));
    c.appendChild(el('div', { class: 'tf-form-actions' }, mehr));
    return c;
  }
  async function ligaSetzenLeise(neu) { await ligaSpeichern(neu); await ligaAbgleich(); }

  function kraftFuer() { // Version 52: das wichtigste kommende Rennen mit seiner Prognose – für „Das hat es gebracht“ im Gym
    const L = kommende().filter((r) => !r.liga), w0 = L.find((r) => r.prio === 'A') || L[0]; if (!w0) return null;
    const w = Object.assign({}, w0, wkZeile(w0)), P = sicher(() => prognoseFuer(w, true));
    return P && P.jetzt ? { id: w.id, name: w.name, datum: w.datum, jetzt: P.jetzt, kraft: P.kraft || null } : null;
  }
  window.tfRennen = { kraftFuer, saisonKarte, rennBlatt, planBlock, ligaBlatt, platzZeile, modellStuetzen, meine: () => kommende().map((r) => ({ id: r.id, name: r.name, datum: r.datum, liga: !!r.liga })), prognoseFuer, rennLast, feldModell, platzModell, platzAus, zeitenAus, stuetzen, eigeneErgebnisse, blattFuer: (id) => { const r = kommende().find((x) => x.id === id); if (r) rennBlatt(Object.assign({}, r, wkZeile(r))); return !!r; }, R, BY, SERIE, GRUPPE, profil, anstiege, prognose, miniProfil, profilChart, distanzen, distListe, distText, titelLand, terminText, zielInfo, zielStrecke, starten, ankuendigungen, meinStart, oeffne: (id, dk) => { STRECKE = id; if (dk) WAHL[id] = dk; T.geh('rennen/strecke/' + id); }, gefiltert, K, MON,
    ligaAus: (id) => { const st = LG(); if (!st.id || !id) return; const a = new Set(st.aus || []); a.add(id); ligaSpeichern(Object.assign(st, { aus: [...a] })); } }; // Version 27: ein gelöschter Renntag bleibt draußen
})();
