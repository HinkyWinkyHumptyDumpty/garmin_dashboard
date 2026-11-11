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
  function prognose(r, dk) { // → { teile: [{ id, name, s, sub }], gesamt, annahmen: [], ziel: { ... } | null } · dk: gewählte Distanz (Version 26)
    const a = athlet(), S0 = SERIE[r.serie], d = distanzen(r, dk); if (keinePrognose(r, d.k)) return null;
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
    const st = strahl(); if (st) frag.push(st);
    const nl = naechsteListe(); if (nl) frag.push(nl);
    frag.push(ligaKarte(), findenKarte());
    frag.push(el('h2', { class: 'tf-hub-sek', text: 'Rund um dein Rennen' }));
    frag.push(el('div', { class: 'tf-links' },
      zeile('rennen/saison', 'Saison & Rennen', 'i-flag', 'pink', sz ? sz.ziel_name + ' in ' + (sz.ziel_tage === 0 ? 'heute' : nf(sz.ziel_tage) + ' Tagen') : 'Deine Rennen, Phasen und der Countdown'),
      zeile('rennen/rechner', 'Rennrechner', 'i-clock', 'red', 'Splits, Watt, Tempo und Verpflegung'),
      zeile('rennen/renntag', 'Renntag', 'i-print', 'orange', 'Race Card zum Ausdrucken, Packliste'),
      zeile('rennen/schweiss', 'Schweißrate', 'i-drop', 'blue', 'Wie viel du trinken musst')));
    box.replaceChildren(el('div', { class: 'tf-hub tf-rn tf-rn-fokus' }, ...frag));
    ligaPruefen();
  }
  // Saison auf einen Blick: Phasen als Band, Rennen als Marken, du als rosa Punkt bei heute
  function strahl() {
    const sz = (rowsOf('saison') || [])[0], K0 = kommende(); if (!K0.length) return null;
    const ende = K0.reduce((m, r) => (r.datum > m ? r.datum : m), localDate());
    const c = el('article', { class: 'tf-card tf-rn-strahl', id: 'rn-strahl' });
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('pink', 'i-cal'), el('div', null, el('h2', { text: 'Deine Saison auf einen Blick' }), el('div', { class: 'tf-sub', text: K0.length + (K0.length === 1 ? ' Wettkampf' : ' Wettkämpfe') + ' bis ' + MON[+ende.slice(5, 7)] + ' ' + ende.slice(0, 4) }))));
    const box = el('div', { class: 'tf-rn-strahl-c' }); c.appendChild(box);
    const lg = el('div', { class: 'tf-rn-strahl-lg', 'aria-hidden': 'true' },
      el('span', null, el('i', { class: 'a' }), 'Hauptrennen'), el('span', null, el('i', { class: 'b' }), 'wichtig'), el('span', null, el('i', { class: 'c' }), 'Training'), el('span', null, el('i', { class: 'l' }), 'Liga'), el('span', null, el('i', { class: 'du' }), 'du heute'));
    c.appendChild(lg);
    requestAnimationFrame(() => { if (box.isConnected) strahlZeichnen(box, sz, K0, ende); });
    return c;
  }
  function strahlZeichnen(box, sz, K0, ende) {
    box.replaceChildren();
    const DAYMS = 864e5, h = localDate(), t0 = Date.parse(h), t1 = Math.max(Date.parse(ende) + 21 * DAYMS, t0 + 120 * DAYMS);
    const w = Math.max(300, box.clientWidth || 340), H = 150, pad = 14, yB = 96;
    const x = (t) => pad + ((t - t0) / (t1 - t0)) * (w - 2 * pad);
    const sv = svg('svg', { viewBox: '0 0 ' + w + ' ' + H, width: '100%', height: H, class: 'tf-svg tf-rn-strahl-svg', role: 'img', 'aria-label': 'Saison: ' + K0.map((r) => r.name + ' am ' + r.datum_txt).join(', ') }, box);
    // Band: Phasen bis zum Hauptrennen, danach neutral
    svg('rect', { x: pad, y: yB - 5, width: w - 2 * pad, height: 10, rx: 5, fill: 'var(--tf-fill)' }, sv);
    (sz && Array.isArray(sz.phasen) ? sz.phasen : []).forEach((p) => {
      const a = Math.max(t0, Date.parse(p.von)), b = Math.min(t1, Date.parse(p.bis) + DAYMS); if (b <= a) return;
      svg('rect', { x: x(a), y: yB - 5, width: Math.max(2, x(b) - x(a) - 1.5), height: 10, rx: 5, fill: 'var(--tf-' + (PH_FARBE[p.id] || 'gray') + ')', opacity: p.id === sz.phase ? 1 : 0.55 }, sv);
    });
    // Monate
    const m0 = new Date(t0); m0.setUTCDate(1); m0.setUTCMonth(m0.getUTCMonth() + 1);
    for (let m = m0.getTime(), i = 0; m < t1; i++) {
      const d = new Date(m), xm = x(m);
      svg('line', { x1: xm, x2: xm, y1: yB + 9, y2: yB + 13, stroke: 'var(--tf-fg3)', 'stroke-width': 1 }, sv);
      const t = svg('text', { x: xm, y: yB + 27, 'text-anchor': 'middle', class: 'tf-tick' }, sv); t.textContent = MON[d.getUTCMonth() + 1].slice(0, 3);
      if (d.getUTCMonth() === 0) { const j = svg('text', { x: xm, y: yB + 41, 'text-anchor': 'middle', class: 'tf-tick' }, sv); j.textContent = String(d.getUTCFullYear()); }
      d.setUTCMonth(d.getUTCMonth() + 1); m = d.getTime();
    }
    // du heute
    svg('circle', { cx: x(t0), cy: yB, r: 7, fill: 'var(--tf-pink)', stroke: 'var(--tf-card)', 'stroke-width': 3 }, sv);
    // Rennen: Stiel und Marke, eng beieinander abwechselnd hoch und tief
    let letztX = -99, hoch = false;
    const marken = K0.map((r) => ({ r, x: x(Date.parse(r.datum) + DAYMS / 2) }));
    marken.forEach((m) => { hoch = m.x - letztX < 16 ? !hoch : false; m.y = m.r.prio === 'A' ? 44 : hoch ? 50 : 66; letztX = m.x; });
    marken.forEach(({ r, x: xr, y }) => {
      const f = 'var(--tf-' + PRIO_FARBE[r.prio] + ')';
      svg('line', { x1: xr, x2: xr, y1: y + 6, y2: yB - 6, stroke: f, 'stroke-width': 1.5, opacity: 0.55 }, sv);
      const g = svg('g', { class: 'tf-rn-marke', tabindex: '0', role: 'button', 'aria-label': r.name + ', ' + r.datum_txt }, sv);
      if (r.prio === 'A') svg('path', { d: 'M' + xr + ',' + (y - 9) + ' l9,9 -9,9 -9,-9 z', fill: f, stroke: 'var(--tf-card)', 'stroke-width': 2 }, g);
      else if (r.liga) svg('circle', { cx: xr, cy: y, r: 5.5, fill: 'var(--tf-card)', stroke: f, 'stroke-width': 2.5 }, g);
      else svg('circle', { cx: xr, cy: y, r: r.prio === 'B' ? 6 : 4.5, fill: f, stroke: 'var(--tf-card)', 'stroke-width': 2 }, g);
      const auf = () => { const W = (A().raw('wettkaempfe') || []).find((q) => q.id === r.id), rr = streckeVon(W); T.geh(rr ? 'rennen/strecke/' + rr.id : 'rennen/saison'); };
      g.addEventListener('click', auf); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(); } });
    });
    // Beschriftung: das nächste Rennen und das Hauptrennen
    const beschrifte = (m, oben) => {
      const t = svg('text', { x: m.x, y: oben, class: 'tf-rn-strahl-t', 'text-anchor': 'middle' }, sv);
      const n = m.r.name.length > 26 ? m.r.name.slice(0, 25) + '…' : m.r.name;
      t.appendChild(svg('tspan', { 'font-weight': 500 })).textContent = n;
      const t2 = svg('text', { x: m.x, y: oben + 15, class: 'tf-rn-strahl-u', 'text-anchor': 'middle' }, sv); t2.textContent = tageTxt(m.r.in_tagen);
      [t, t2].forEach((tt) => { const bb = tt.getBBox(); if (bb.x < 2) tt.setAttribute('x', m.x + (2 - bb.x)); if (bb.x + bb.width > w - 2) tt.setAttribute('x', m.x - (bb.x + bb.width - w + 2)); });
    };
    const erst = marken[0], haupt = marken.find((m) => m.r.prio === 'A'); // das Hauptrennen immer, das nächste, wenn Platz ist
    if (haupt) beschrifte(haupt, 14);
    if (!haupt || (haupt !== erst && Math.abs(haupt.x - erst.x) > 120)) beschrifte(erst, 14);
  }
  // Die nächsten Wettkämpfe als Liste – der erste groß
  function naechsteListe() {
    const K0 = kommende().slice(0, 5); if (!K0.length) return null;
    const c = el('article', { class: 'tf-card tf-rn-naechste', id: 'rn-naechste' });
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('orange', 'i-flag'), el('div', null, el('h2', { text: 'Als Nächstes' }), el('div', { class: 'tf-sub', text: K0[0].name + ' ' + tageTxt(K0[0].in_tagen) }))));
    const L = el('div', { class: 'tf-rn-wkl' });
    K0.forEach((r, i) => {
      const lt = r.liga ? ligaTag(r.liga) : null, t = new Date(r.datum + 'T12:00:00Z');
      const meta = lt ? lt.L.kurz + ' · ' + lt.t.format + (lt.L.vorlaeufig ? ' · Termin vorläufig' : '') : r.art + ' · ' + PRIO_TXT[r.prio];
      const b = el('button', { type: 'button', class: 'tf-rn-wk' + (i === 0 ? ' erst' : ''), style: '--p:var(--tf-' + PRIO_FARBE[r.prio] + ')' },
        el('span', { class: 'tf-rn-wk-d' }, el('small', { text: WT[t.getUTCDay()] }), el('b', { class: 'num', text: String(t.getUTCDate()) }), el('small', { text: MON[t.getUTCMonth() + 1].slice(0, 3) })),
        el('span', { class: 'tf-rn-wk-t' }, el('b', { text: r.name }), el('small', { text: meta })),
        el('span', { class: 'tf-rn-wk-n num', text: r.in_tagen === 0 ? 'heute' : nf(r.in_tagen) + ' T.' }), svgIco('i-chev'));
      b.addEventListener('click', () => { const W = (A().raw('wettkaempfe') || []).find((q) => q.id === r.id), rr = streckeVon(W); T.geh(rr ? 'rennen/strecke/' + rr.id : 'rennen/saison'); });
      L.appendChild(b);
    });
    c.appendChild(L);
    return c;
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
  let ligaBusy = false, ligaWechsel = false, ligaGeprueft = '';
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
  function ligaKarte() {
    const st = LG(), L = st.id ? LIGA[st.id] : null, h = localDate(), aus = new Set(st.aus || []);
    const c = el('article', { class: 'tf-card tf-rn-liga' + (L ? ' aktiv' : ''), id: 'rn-liga' });
    const drin = L ? L.tage.filter((t) => t.datum && t.datum >= h && !aus.has(t.id)).length : 0;
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('indigo', 'i-shield'), el('div', null, el('h2', { text: L ? L.name : 'Startest du in einer Liga?' }),
      el('div', { class: 'tf-sub', text: L ? drin + (drin === 1 ? ' Renntag' : ' Renntage') + ' in Saison und Trainingsplan · als ' + (st.prio === 'C' ? 'C' : 'B') + '-Rennen' : 'Wähl deine Liga – die Renntage kommen automatisch in deine Saison und deinen Trainingsplan' }))));
    if (!L || ligaWechsel) c.appendChild(pyramide(st));
    if (L) {
      const T0 = el('div', { class: 'tf-lg-tage' });
      L.tage.forEach((t) => {
        const da = t.datum ? new Date(t.datum + 'T12:00:00Z') : null, vorbei = t.datum && t.datum < h;
        const zeile = el('div', { class: 'tf-lg-tag' + (aus.has(t.id) ? ' aus' : '') + (!t.datum ? ' offen' : '') },
          el('span', { class: 'tf-lg-dat' }, el('small', { text: da ? WT[da.getUTCDay()] : '–' }), el('b', { class: 'num', text: da ? String(da.getUTCDate()) : '?' }), el('small', { text: da ? MON[da.getUTCMonth() + 1].slice(0, 3) : 'offen' })),
          el('span', { class: 'tf-lg-was' }, el('b', { text: t.ort }), el('small', { text: t.format + (L.vorlaeufig ? ' · vorläufig, 2026: ' + t.ref : !t.datum ? ' · Termin noch offen' : '') })));
        if (t.datum && !vorbei) {
          const i = el('input', { type: 'checkbox', checked: !aus.has(t.id), 'aria-label': 'Ich starte in ' + t.ort });
          i.addEventListener('change', () => { const a = new Set(LG().aus || []); if (i.checked) a.delete(t.id); else a.add(t.id); ligaSetzen(Object.assign(LG(), { aus: [...a] })); });
          zeile.appendChild(el('label', { class: 'tf-switch tf-lg-sw' }, i, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' })));
        }
        if (t.strecke && BY[t.strecke]) { zeile.classList.add('link'); zeile.querySelector('.tf-lg-was').addEventListener('click', () => T.geh('rennen/strecke/' + t.strecke)); }
        T0.appendChild(zeile);
      });
      c.appendChild(T0);
      const seg = el('div', { class: 'tf-seg tf-lg-prio', role: 'group', 'aria-label': 'Stellenwert der Renntage' });
      [['B', 'B · mit Mini-Taper'], ['C', 'C · aus dem Training']].forEach(([p, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String((st.prio === 'C' ? 'C' : 'B') === p) }, n); b.addEventListener('click', () => ligaSetzen(Object.assign(LG(), { prio: p }))); seg.appendChild(b); });
      c.append(el('div', { class: 'tf-field tf-lg-feld' }, el('span', { text: 'Wie wichtig sind die Renntage?' }), seg));
      c.appendChild(el('p', { class: 'tf-note', text: (L.vorlaeufig ? 'Die DTU hat den Kalender ' + naechstesJahr(1) + ' noch nicht veröffentlicht – bis dahin stehen die Wochenenden der Saison 2026 drin, als vorläufig markiert. Sobald es echte Termine gibt, zieht die App sie nach. ' : 'Termine ' + naechstesJahr(1) + ' laut Bayerischem Triathlon-Verband. ') + 'Abwählen, wenn du an einem Renntag nicht startest. Im Plan: am Renntag nur das Rennen, ' + (st.prio === 'C' ? 'am Vortag nichts Hartes, danach locker.' : 'am Vortag kurz und locker, zwei Tage vorher nichts Hartes, danach locker.') + ' Nach kurzen Rennen bleibt die lange Einheit am Tag danach.' }));
      c.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: L.quelle + ' · Mujika & Padilla, Med Sci Sports Exerc 2003 (Tapering)' })));
      const wb = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, ligaWechsel ? 'Fertig' : 'Liga wechseln'); wb.addEventListener('click', () => { ligaWechsel = !ligaWechsel; renderFokus(); });
      const wi = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-klein' }, 'So plant Dreiklang die Liga'); wi.addEventListener('click', () => T.geh('wissen/liga'));
      c.appendChild(el('div', { class: 'tf-form-actions' }, wb, window.tfWissen && tfWissen.begriff && tfWissen.begriff('liga') ? wi : null));
    }
    return c;
  }
  function pyramide(st) {
    const box = el('div', { class: 'tf-lg-pyr', role: 'group', 'aria-label': 'Liga wählen' });
    PYRAMIDE.forEach(([verband, ...stufen], gi) => {
      box.appendChild(el('small', { class: 'tf-lg-verband', text: verband }));
      stufen.forEach((stufe, si) => {
        const reihe = el('div', { class: 'tf-lg-stufe', style: '--s:' + (gi * 2 + si) });
        stufe.forEach(([id, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(st.id === id), 'data-liga': id }, n); b.addEventListener('click', () => { ligaWechsel = false; ligaSetzen({ id, prio: st.prio || 'B', aus: [] }); }); reihe.appendChild(b); });
        box.appendChild(reihe);
      });
    });
    const keine = el('button', { type: 'button', class: 'tf-lg-keine', 'aria-pressed': String(!st.id) }, 'Keine Liga'); keine.addEventListener('click', () => { ligaWechsel = false; ligaSetzen({ id: null, prio: st.prio || 'B', aus: [] }); });
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
  window.tfRennen = { R, BY, SERIE, GRUPPE, profil, anstiege, prognose, miniProfil, profilChart, distanzen, distListe, distText, titelLand, terminText, zielInfo, zielStrecke, starten, ankuendigungen, meinStart, oeffne: (id, dk) => { STRECKE = id; if (dk) WAHL[id] = dk; T.geh('rennen/strecke/' + id); }, gefiltert, K, MON,
    ligaAus: (id) => { const st = LG(); if (!st.id || !id) return; const a = new Set(st.aus || []); a.add(id); ligaSpeichern(Object.assign(st, { aus: [...a] })); } }; // Version 27: ein gelöschter Renntag bleibt draußen
})();
