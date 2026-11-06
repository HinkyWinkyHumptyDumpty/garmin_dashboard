/* Dreiklang · Rennen (Version 20)
   Der Bereich für das Ziel: Weltkarte und Kalender mit rund 130 Rennen (Ironman, 70.3, Challenge, die größten Marathons und
   Halbmarathons in Deutschland, die World Marathon Majors), je Rennen eine Streckenseite mit Höhenprofil, Fakten, deiner
   Prognose auf genau dieser Strecke (Rennrechner-Modell mit dem Profil) und Pacing je Anstieg – dazu „Als Ziel setzen“.
   Rechnungen: Rad nach Martin et al. 1998 (P·η = ½ρ·CdA·v³ + (Crr·m·g·cosθ + m·g·sinθ)·v) Abschnitt für Abschnitt über das
   Profil; Laufen mit der Faustregel für Steigungen (+3,5 % je 1 % bergauf, −1,8 % je 1 % bergab, Minetti et al. 2002 als
   Grundlage); Hitze nach Ely et al. 2007 (+4 % Lauf, +1 % Rad); Schwimmen nach Gewässer (Meer +4 %, See +2 %, Strömung −10 %)
   und mit Neopren −3 % (Tomikawa et al. 2008). Alles sind Richtwerte – die Ausschreibung des Veranstalters hat das letzte Wort. */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten, DATEN = window.tfRennenDaten;
  if (!T || !S || !DATEN) return;
  const { $, el, svg, nf, rowsOf, svgIco, localDate, col, setMsg, zeile } = T.ui;
  const { R, SERIE, LAND, EUROPA, TAG, MON } = DATEN;
  const A = () => dash.app;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const BY = Object.fromEntries(R.map((r) => [r.id, r]));
  const hms = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const tausend = (n) => nf(Math.round(n));
  const distanzen = (r) => { const S0 = SERIE[r.serie]; return { swim: S0.swim, rad: r.radKm || S0.rad, lauf: S0.lauf, tri: S0.sport === 'tri' }; };
  const titelLand = (r) => r.ort + ', ' + (LAND[r.land] || r.land);

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
  function schema(id, D, H, tags, runden, n, fein) { // schematisch: Hügel als weiche Buckel, Summe der Anstiege = Höhenmeter; fein = viele kleine Wellen
    const z = rng(seed(id + D)), rd = Math.max(1, runden || 1), L = D / rd;
    const art = tags.includes('bergig') ? 'bergig' : tags.includes('huegelig') ? 'huegelig' : tags.includes('wellig') ? 'wellig' : 'flach';
    const K = fein ? [14 + Math.round(z() * 8), 0.02, 0.05] : art === 'bergig' ? [1 + Math.round(z()), 0.22, 0.36] : art === 'huegelig' ? [3 + Math.round(z() * 2), 0.06, 0.12] : art === 'wellig' ? [5 + Math.round(z() * 3), 0.05, 0.1] : [7 + Math.round(z() * 4), 0.04, 0.08];
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
  function profil(r, disz) { // → { pts: [[km, m]], D, H, art: 'beschrieben' | 'schema' }
    const d = distanzen(r), D = disz === 'rad' ? d.rad : d.lauf; if (!D) return null;
    const H = disz === 'rad' ? r.hmRad || 0 : r.hmLauf || 0, n = Math.max(80, Math.min(240, Math.round(D * 2)));
    const hand = r.profil && r.profil[disz];
    let pts = hand ? interpol(hand, D, n) : schema(r.id + ':' + disz, D, H, r.tags || [], disz === 'rad' ? r.radRunden : r.laufRunden, n);
    const ascent = (L) => { let a0 = 0; for (let i = 1; i < L.length; i++) a0 += Math.max(0, L[i][1] - L[i - 1][1]); return a0; };
    if (hand && H > 0) { // große Anstiege wie beschrieben; was an Höhenmetern fehlt, sind kleine Wellen dazwischen
      const fehlt = H - ascent(pts);
      if (fehlt > 0.15 * H) { const W0 = schema(r.id + ':welle:' + disz, D, fehlt, ['flach'], disz === 'rad' ? r.radRunden : r.laufRunden, n, true); const mnW = Math.min(...W0.map((p) => p[1])); pts = pts.map(([x, y], i) => [x, y + (W0[i][1] - mnW)]); }
    }
    let maxG = 0; for (let i = 1; i < pts.length; i++) maxG = Math.max(maxG, (pts[i][1] - pts[i - 1][1]) / ((pts[i][0] - pts[i - 1][0]) * 1000));
    return { pts, D, H: H || Math.round(ascent(pts) / 10) * 10, art: hand ? 'beschrieben' : 'schema', maxG };
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
  function radZeit(r, a, P, pacing) { // Zeit über das Profil, mit Leistung je Steigung
    const ph = { cda: +a.cda_m2 || 0.3, crr: +a.crr || 0.004, m: (+a.gewicht_ref_kg || 75) + (+a.rad_kg || 10), rho: +a.luftdichte || 1.2, eta: +a.antrieb_eta || 0.976 };
    const Pmax = (+a.ftp_ref_w || 220) * (+a.rad_if_max || 0.75) * 1.08, segs = []; let t = 0, work = 0, p4 = 0;
    const wind = (r.tags || []).includes('windig') ? 1.03 : 1, heiss = (r.tags || []).includes('heiss') ? 1.01 : 1;
    for (let i = 1; i < P.pts.length; i++) {
      const [x0, y0] = P.pts[i - 1], [x1, y1] = P.pts[i], dx = (x1 - x0) * 1000, g = (y1 - y0) / dx;
      let p = pacing ? (g > 0.03 ? Math.min(Pmax, P.watt * 1.08) : g < -0.03 ? P.watt * 0.6 : P.watt) : P.watt;
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
  function prognose(r) { // → { teile: [{ id, name, s, sub }], gesamt, annahmen: [], ziel: { ... } | null }
    const a = athlet(), S0 = SERIE[r.serie], item = window.tfDistanz ? tfDistanz(S0.sport, S0.dist) : null; if (!item) return null;
    const d = distanzen(r), tags = r.tags || [], teile = [], annahmen = [];
    const legs = item.legs, swim = legs.find((l) => l.typ === 'swim'), bike = legs.find((l) => l.typ === 'bike'), runs = legs.filter((l) => l.typ === 'run'), t1 = legs.find((l) => l.typ === 't1'), t2 = legs.find((l) => l.typ === 't2');
    if (swim) {
      const css = +a.css_s_100m || 120, pool = css / mitte(swim.band);
      const wasser = tags.includes('strom') ? 0.9 : r.swim === 'meer' ? 1.04 : r.swim === 'see' ? 1.02 : 1.01, neo = swim.neo ? 1 / 1.03 : 1;
      const s = pool * d.swim * 10 * wasser * neo;
      teile.push({ id: 'swim', name: 'Schwimmen', s, sub: nf(d.swim, 1) + ' km · ' + hms(s / (d.swim * 10)) + ' /100 m' });
      annahmen.push('Schwimmen aus deiner CSS (' + hms(css) + ' /100 m)' + (tags.includes('strom') ? ', mit Strömung' : r.swim === 'meer' ? ', im Meer etwas langsamer' : '') + ', mit Neopren');
      if (t1) teile.push({ id: 't1', name: 'Wechsel 1', s: t1.s, sub: '' });
    }
    let radP = null;
    if (bike) {
      const P = profil(r, 'rad'), IF = bike.band === 'profil' ? mitte([+a.rad_if_min || 0.65, +a.rad_if_max || 0.75]) : mitte(bike.band), watt = Math.round((+a.ftp_ref_w || 220) * IF);
      P.watt = watt; radP = radZeit(r, a, P, true);
      teile.push({ id: 'bike', name: 'Rad', s: radP.t, sub: nf(d.rad) + ' km · ' + Math.round(radP.avg) + ' W Ø · ' + nf((d.rad * 1000) / radP.t * 3.6, 1) + ' km/h', watt, np: Math.round(radP.np), P });
      annahmen.push('Rad mit ' + watt + ' W (' + Math.round(IF * 100) + ' % von ' + (a.ftp_ref_w || 220) + ' W FTP), CdA ' + nf(+a.cda_m2 || 0.3, 2) + ' m², ' + (P.art === 'beschrieben' ? 'Profil nach Streckenbeschreibung' : 'schematischem Profil') + (tags.includes('windig') ? ', Wind eingerechnet' : ''));
      if (t2) teile.push({ id: 't2', name: 'Wechsel 2', s: t2.s, sub: '' });
    }
    if (runs.length) {
      const run = runs[runs.length - 1], ref = run.ref === 'vt1' ? +a.vt1_pace_s_km || 330 : +a.vt2_pace_s_km || 290, pace = ref / mitte(run.band);
      const P = profil(r, 'lauf'), s = laufZeit(r, pace, P);
      teile.push({ id: 'run', name: 'Laufen', s, sub: nf(d.lauf, 1) + ' km · ' + hms(s / d.lauf) + ' /km', P });
      annahmen.push('Laufen bei ' + hms(pace) + ' /km aus deinem ' + (run.ref === 'vt1' ? 'VT1' : 'VT2') + '-Tempo' + (P.H > 60 ? ', Anstiege eingerechnet' : '') + (tags.includes('heiss') ? ', Hitze +4 %' : ''));
    }
    const gesamt = teile.reduce((s, x) => s + x.s, 0);
    let ziel = null;
    if (S0.dist === 'ld' && a.ziel_gesamt_min) ziel = { gesamt: a.ziel_gesamt_min * 60, swim: a.ziel_schwimmen_min * 60, bike: a.ziel_rad_min * 60, run: a.ziel_lauf_min * 60, t1: a.ziel_t1_min * 60, t2: a.ziel_t2_min * 60 };
    // Ist diese Strecke dein eingetragenes Hauptrennen mit Zielzeit, zählt die Zielzeit aus der Saison
    const sz = sicher(zielInfo), zr = sz ? sicher(() => zielStrecke(sz)) : null;
    if (zr && zr.id === r.id && sz.ziel_s > 0) { ziel = Object.assign({}, ziel || {}, { gesamt: sz.ziel_s, quelle: 'saison' }); if (!ziel.swim) { ziel.swim = ziel.bike = ziel.run = ziel.t1 = ziel.t2 = null; } }
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
  const K = { modus: 'europa', serie: 'alle', region: 'alle', gewaehlt: null, suche: '', kalVoll: false };
  const serieFarbe = (r) => SERIE[r.serie].farbe;
  function gefiltert() {
    const q = K.suche.trim().toLowerCase();
    return R.filter((r) => (K.serie === 'alle' || (K.serie === 'ld' ? ['im', 'ch'].includes(r.serie) : K.serie === 'md' ? ['im703', 'chm'].includes(r.serie) : r.serie === K.serie))
      && (K.region === 'alle' || (K.region === 'de' ? r.land === 'DE' : K.region === 'eu' ? EUROPA.includes(r.land) : !EUROPA.includes(r.land)))
      && (!q || (r.name + ' ' + r.ort + ' ' + (LAND[r.land] || '')).toLowerCase().includes(q)));
  }
  function karte(box, liste, o) { // o: { modus, ziel, auf(r) }
    box.replaceChildren();
    const w = Math.max(300, box.clientWidth || 360), h = Math.round(w * (o.modus === 'welt' ? 0.52 : 0.78));
    const s = svg('svg', { class: 'tf-karte-svg', viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h, role: 'img', 'aria-label': 'Karte mit ' + liste.length + ' Rennen' }, box);
    let proj;
    if (o.modus === 'welt') proj = d3.geoNaturalEarth1().fitExtent([[4, 4], [w - 4, h - 4]], { type: 'Sphere' });
    else proj = d3.geoConicConformal().parallels([40, 62]).rotate([-10, 0]).fitExtent([[8, 8], [w - 8, h - 8]], { type: 'Polygon', coordinates: [[[-11, 35.5], [-11, 63], [33, 63], [33, 35.5], [-11, 35.5]]] });
    const path = d3.geoPath(proj);
    if (o.modus === 'welt') svg('path', { d: path({ type: 'Sphere' }), class: 'tf-karte-meer' }, s);
    const land = WELT ? topojson.feature(WELT[o.modus], WELT[o.modus].objects.land) : null;
    const g = svg('g', { class: 'tf-karte-land' }, s);
    if (land) svg('path', { d: path(land) }, g);
    svg('path', { d: path(d3.geoGraticule().step([15, 15])()), class: 'tf-karte-netz' }, s);
    if (o.modus === 'europa') { // Rahmen: Ausschnitt
      svg('path', { d: path({ type: 'Polygon', coordinates: [[[-11, 35.5], [-11, 63], [33, 63], [33, 35.5], [-11, 35.5]]] }), class: 'tf-karte-rahmen' }, s);
    }
    const pkt = svg('g', { class: 'tf-karte-punkte' }, s);
    const sichtbar = liste.filter((r) => o.modus === 'welt' || (r.lon > -12 && r.lon < 34 && r.lat > 35 && r.lat < 64));
    const gruppen = new Map(); // gleiche Orte leicht versetzen
    sichtbar.forEach((r) => { const k = r.lat.toFixed(1) + ',' + r.lon.toFixed(1); const n = gruppen.get(k) || 0; gruppen.set(k, n + 1); r._v = n; });
    sichtbar.forEach((r) => {
      const [x0, y0] = proj([r.lon, r.lat]) || [0, 0], x = x0 + (r._v ? Math.cos(r._v * 2.4) * 5 : 0), y = y0 + (r._v ? Math.sin(r._v * 2.4) * 5 : 0);
      const istZiel = o.ziel === r.id, akt = K.gewaehlt === r.id;
      const gr = svg('g', { class: 'tf-karte-p' + (istZiel ? ' ziel' : '') + (akt ? ' akt' : ''), role: 'button', tabindex: 0, 'aria-label': r.name }, pkt);
      svg('circle', { cx: x, cy: y, r: 11, fill: 'transparent' }, gr);
      if (akt || istZiel) svg('circle', { cx: x, cy: y, r: 8, fill: 'none', stroke: col(istZiel ? 'pink' : 'fg'), 'stroke-width': 1.25, opacity: 0.8 }, gr);
      svg('circle', { cx: x, cy: y, r: istZiel ? 4.5 : 3.5, fill: col(istZiel ? 'pink' : serieFarbe(r)), stroke: 'rgba(255,255,255,.85)', 'stroke-width': 1 }, gr);
      const auf = () => { K.gewaehlt = r.id; o.auf(r); };
      gr.addEventListener('click', auf); gr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(); } });
    });
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
    if (r) { const P = profil(r, 'rad') || profil(r, 'lauf'); z.append(el('div', null, el('b', { class: 'num', text: nf(r.hmRad || r.hmLauf || 0) }), el('small', { text: 'Höhenmeter ' + (r.hmRad ? 'Rad' : 'Lauf') })), el('div', { class: 'tf-rn-ziel-mini' }, miniProfil(P, 120, 36, 'card'))); }
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
  function renderHub() {
    const box = $('#rennen-hub-box'); if (!box) return;
    const sz = zielInfo(), zielR = sz ? zielStrecke(sz) : null, L = gefiltert();
    const frag = [hubZiel()];
    // Karte
    const kk = el('article', { class: 'tf-card tf-rn-karte', id: 'rn-karte' });
    const kopf = el('div', { class: 'tf-card-head' }, S.badge('pink', 'i-flag'), el('div', null, el('h2', { text: 'Rennen weltweit' }), el('div', { class: 'tf-sub', text: L.length + ' Rennen · antippen für die Strecke' })));
    const seg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Ausschnitt' });
    [['europa', 'Europa'], ['welt', 'Welt']].forEach(([id, name]) => { const b = el('button', { type: 'button', 'aria-pressed': String(K.modus === id) }, name); b.addEventListener('click', () => { K.modus = id; renderHub(); }); seg.appendChild(b); });
    const kbox = el('div', { class: 'tf-karte' });
    const info = el('div', { class: 'tf-karte-info', hidden: true });
    const zeige = (r) => {
      info.hidden = false; info.replaceChildren(el('span', { class: 'tf-rn-dot', style: 'background:var(--tf-' + serieFarbe(r) + ')' }), el('div', null, el('b', { text: r.name }), el('small', { text: titelLand(r) + ' · ' + MON[r.mon] + (r.hmRad ? ' · ' + nf(r.hmRad) + ' hm Rad' : r.hmLauf ? ' · ' + nf(r.hmLauf) + ' hm' : '') })));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, 'Strecke'); b.addEventListener('click', () => T.geh('rennen/strecke/' + r.id)); info.appendChild(b);
      kbox.querySelectorAll('.tf-karte-p').forEach((g) => g.classList.toggle('akt', g.getAttribute('aria-label') === r.name));
    };
    kk.append(kopf, chips([['alle', 'Alle'], ['ld', 'Langdistanz'], ['md', 'Mitteldistanz'], ['m', 'Marathon'], ['hm', 'Halbmarathon']], K.serie, (v) => { K.serie = v; renderHub(); }), kbox, info, el('div', { class: 'tf-rn-legende' }, seg,
      el('div', { class: 'tf-legend' }, ...[['pink', 'Langdistanz'], ['orange', 'Mitteldistanz'], ['mint', 'Marathon'], ['teal', 'Halbmarathon']].map(([f, n]) => { const i = el('i'); i.style.background = 'var(--tf-' + f + ')'; return el('span', null, i, n); }))));
    frag.push(kk);
    requestAnimationFrame(() => { if (kbox.isConnected) { karte(kbox, L, { modus: K.modus, ziel: zielR ? zielR.id : null, auf: zeige }); if (K.gewaehlt && BY[K.gewaehlt] && L.includes(BY[K.gewaehlt])) zeige(BY[K.gewaehlt]); } });
    // Kalender
    const kal = el('article', { class: 'tf-card tf-rn-kal', id: 'rn-kalender' });
    const such = el('input', { class: 'tf-input', type: 'search', placeholder: 'Rennen oder Ort suchen', value: K.suche, 'aria-label': 'Rennen suchen', enterkeyhint: 'search' });
    let st = null; such.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => { K.suche = such.value; const liste = $('#rn-liste'); if (liste) liste.replaceChildren(...kalenderListe()); const n = $('#rn-kalender .tf-sub'); if (n) n.textContent = gefiltert().length + ' Rennen nach Monat'; }, 200); });
    kal.append(el('div', { class: 'tf-card-head' }, S.badge('blue', 'i-cal'), el('div', null, el('h2', { text: 'Kalender' }), el('div', { class: 'tf-sub', text: L.length + ' Rennen nach Monat' }))),
      chips([['alle', 'Überall'], ['de', 'Deutschland'], ['eu', 'Europa'], ['welt', 'Welt']], K.region, (v) => { K.region = v; renderHub(); }), el('div', { class: 'tf-w-such tf-rn-such' }, svgIco('i-search'), such), el('div', { id: 'rn-liste' }, ...kalenderListe()));
    frag.push(kal);
    frag.push(statistik(L));
    // Werkzeuge rund ums Rennen
    frag.push(el('h2', { class: 'tf-hub-sek', text: 'Rund um dein Rennen' }));
    frag.push(el('div', { class: 'tf-links' },
      zeile('rennen/saison', 'Saison & Rennen', 'i-flag', 'pink', sz ? sz.ziel_name + ' in ' + (sz.ziel_tage === 0 ? 'heute' : nf(sz.ziel_tage) + ' Tagen') : 'Deine Rennen, Phasen und der Countdown'),
      zeile('rennen/rechner', 'Rennrechner', 'i-clock', 'red', 'Splits, Watt, Tempo und Verpflegung'),
      zeile('rennen/renntag', 'Renntag', 'i-print', 'orange', 'Race Card zum Ausdrucken, Packliste'),
      zeile('rennen/schweiss', 'Schweißrate', 'i-drop', 'blue', 'Wie viel du trinken musst')));
    frag.push(el('p', { class: 'tf-note tf-rn-hinweis', text: 'Termine wechseln jedes Jahr, Höhenmeter sind Richtwerte nach Streckenbeschreibungen der Veranstalter, Teilnehmerzahlen ungefähr. Für die Anmeldung zählt die Ausschreibung des Veranstalters.' }));
    box.replaceChildren(el('div', { class: 'tf-hub tf-rn' }, ...frag));
  }
  const KAL_MONATE = 3; // ohne Suche: die nächsten drei Monate mit Rennen, der Rest hinter einem Knopf
  function kalenderListe() {
    const L = gefiltert(), heute = +localDate().slice(5, 7), out = [], voll = K.kalVoll || !!K.suche;
    let versteckt = 0, gezeigt = 0;
    for (let k = 0; k < 12; k++) {
      const m = ((heute - 1 + k) % 12) + 1, M = L.filter((r) => r.mon === m).sort((x, y) => (y.n || 0) - (x.n || 0));
      if (!M.length) continue;
      if (!voll && gezeigt >= KAL_MONATE) { versteckt += M.length; continue; }
      gezeigt++;
      out.push(el('h3', { class: 'tf-rn-monat', text: MON[m] + (k === 0 ? ' · jetzt' : '') }));
      out.push(el('div', { class: 'tf-links tf-rn-rows' }, ...M.map(rennZeile)));
    }
    if (!out.length && !versteckt) out.push(el('p', { class: 'tf-empty', text: 'Kein Rennen passt zu Suche und Filter.' }));
    if (versteckt) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-rn-mehr' }, 'Alle Monate anzeigen', el('small', { class: 'num', text: '+' + versteckt }));
      b.addEventListener('click', () => { K.kalVoll = true; const liste = $('#rn-liste'); if (liste) liste.replaceChildren(...kalenderListe()); });
      out.push(b);
    } else if (K.kalVoll && !K.suche) {
      const b = el('button', { type: 'button', class: 'tf-btn tf-rn-mehr' }, 'Nur die nächsten Monate');
      b.addEventListener('click', () => { K.kalVoll = false; const liste = $('#rn-liste'); if (liste) liste.replaceChildren(...kalenderListe()); liste && liste.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      out.push(b);
    }
    return out;
  }
  function rennZeile(r) {
    const d = distanzen(r), P = profil(r, d.tri ? 'rad' : 'lauf');
    const b = el('button', { type: 'button', class: 'tf-zeile tf-rn-zeile', 'data-rennen': r.id },
      el('span', { class: 'tf-rn-zprof' }, miniProfil(P, 64, 28, serieFarbe(r))),
      el('span', { class: 'tf-zeile-t' }, el('b', { text: r.name }), el('small', { text: titelLand(r) + ' · ' + SERIE[r.serie].kurz + (d.tri ? ' · ' + nf(r.hmRad) + ' hm Rad' : ' · ' + nf(r.hmLauf) + ' hm') })),
      svgIco('i-chev'));
    b.lastChild.classList.add('tf-chev');
    b.addEventListener('click', () => T.geh('rennen/strecke/' + r.id));
    return b;
  }
  function statistik(L) {
    const c = el('article', { class: 'tf-card tf-rn-stat', id: 'rn-statistik' });
    c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('indigo', 'i-bars'), el('div', null, el('h2', { text: 'Statistik' }), el('div', { class: 'tf-sub', text: 'Wann die Rennen liegen und wie hart die Strecken sind' }))));
    // Rennen je Monat
    const proMonat = Array.from({ length: 12 }, (_, i) => L.filter((r) => r.mon === i + 1).length), max = Math.max(1, ...proMonat), heute = +localDate().slice(5, 7);
    c.appendChild(el('div', { class: 'tf-rn-monate' }, ...proMonat.map((n, i) => { const b = el('div', { class: 'tf-rn-mb' + (i + 1 === heute ? ' jetzt' : '') }, el('i', { style: 'height:' + Math.round((100 * n) / max) + '%' }), el('small', { text: MON[i + 1].slice(0, 1) })); b.title = MON[i + 1] + ': ' + n; return b; })));
    // Rangliste: Höhenmeter Rad (Triathlon) und Lauf
    const tri = L.filter((r) => SERIE[r.serie].sport === 'tri').sort((x, y) => y.hmRad - x.hmRad), lauf = L.filter((r) => SERIE[r.serie].sport === 'lauf').sort((x, y) => y.hmLauf - x.hmLauf);
    const rang = (titel, liste, feld, einheit) => {
      if (!liste.length) return null;
      const mx = Math.max(1, ...liste.map((r) => r[feld]));
      const ul = el('div', { class: 'tf-rn-rang' }, el('h3', { class: 'tf-h3', text: titel }));
      liste.slice(0, 5).forEach((r) => { const b = el('button', { type: 'button', class: 'tf-rn-rz' }, el('span', { text: r.name }), el('i', null, el('b', { style: 'width:' + Math.round((100 * r[feld]) / mx) + '%' })), el('span', { class: 'num', text: nf(r[feld]) + ' ' + einheit })); b.addEventListener('click', () => T.geh('rennen/strecke/' + r.id)); ul.appendChild(b); });
      return ul;
    };
    const flach = L.filter((r) => SERIE[r.serie].sport === 'tri').sort((x, y) => x.hmRad - y.hmRad);
    c.append(rang('Die härtesten Radstrecken', tri, 'hmRad', 'm'), rang('Die flachsten Langdistanzen', flach.filter((r) => ['im', 'ch'].includes(r.serie)), 'hmRad', 'm'), rang('Läufe mit den meisten Höhenmetern', lauf, 'hmLauf', 'm'));
    return c;
  }

  /* =====================================================================
     Streckenseite
     ===================================================================== */
  let STRECKE = null, disz = 'rad';
  function renderStrecke() {
    const box = $('#rennen-strecke-box'); if (!box) return;
    const R0 = T.routeInfo(T.route()) || {}; if (R0.strecke) STRECKE = R0.strecke;
    const r = STRECKE && BY[STRECKE]; if (!r) { box.replaceChildren(el('p', { class: 'tf-empty', text: 'Diese Strecke kennt Dreiklang nicht.' })); return; }
    const d = distanzen(r), S0 = SERIE[r.serie], tags = r.tags || [], sz = zielInfo(), istZiel = !!(sz && zielStrecke(sz) && zielStrecke(sz).id === r.id);
    T.kopf({ titel: r.name, sub: titelLand(r) });
    const frag = [];
    // Bühne
    const hero = el('article', { class: 'tf-card tf-buehne tf-b-' + (S0.sport === 'tri' ? (tags.includes('bergig') ? 'pink' : 'blau') : 'daemmer') + ' tf-rs-hero', id: 'rs-hero' });
    hero.append(el('span', { class: 'tf-augenbraue', text: S0.name + (r.unter ? ' · ' + r.unter : '') + ' · ' + MON[r.mon] + (istZiel ? ' · dein Ziel' : '') }),
      el('h2', { class: 'tf-held-t', text: r.name }), el('p', { class: 'tf-held-u', text: titelLand(r) }));
    const z = el('div', { class: 'tf-held-z' });
    if (d.tri) z.append(el('div', null, el('b', { class: 'num', text: nf(d.swim, 1) }), el('small', { text: 'km Schwimmen' })), el('div', null, el('b', { class: 'num', text: nf(d.rad) }), el('small', { text: 'km Rad · ' + nf(r.hmRad) + ' hm' })), el('div', null, el('b', { class: 'num', text: nf(d.lauf, 1) }), el('small', { text: 'km Laufen · ' + nf(r.hmLauf) + ' hm' })));
    else z.append(el('div', null, el('b', { class: 'num', text: nf(d.lauf, 1) }), el('small', { text: 'km' })), el('div', null, el('b', { class: 'num', text: nf(r.hmLauf) }), el('small', { text: 'Höhenmeter' })), el('div', null, el('b', { class: 'num', text: r.n >= 1000 ? Math.round(r.n / 1000) + 'k' : nf(r.n) }), el('small', { text: 'Teilnehmer ca.' })));
    hero.appendChild(z);
    hero.appendChild(el('div', { class: 'tf-chips tf-rs-tags' }, ...tags.filter((t) => TAG[t] && t !== 'meer' && t !== 'fluss').map((t) => el('span', { class: 'tf-chip', text: TAG[t] })), r.swim ? el('span', { class: 'tf-chip', text: { see: 'Seeschwimmen', meer: 'Meerschwimmen', fluss: 'Flussschwimmen', kanal: 'Kanalschwimmen', hafen: 'Hafenschwimmen' }[r.swim] }) : null));
    const akt = el('div', { class: 'tf-held-aktionen' });
    const zielB = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-held-los', id: 'rs-ziel' }, svgIco('i-flag'), istZiel ? ' Dein Ziel' : ' Als Ziel setzen'); zielB.addEventListener('click', () => (istZiel ? T.geh('rennen/saison') : zielBlatt(r)));
    const teilB = el('button', { type: 'button', class: 'tf-btn tf-btn-klein', id: 'rs-teilen' }, svgIco('i-share'), ' Teilen'); teilB.addEventListener('click', () => { if (window.tfTeilen) tfTeilen.rennen(r); });
    akt.append(zielB, teilB); hero.appendChild(akt);
    frag.push(hero);
    // Höhenprofil
    const pk = el('article', { class: 'tf-card tf-span2', id: 'rs-profil' });
    const PR = d.tri ? profil(r, 'rad') : null, PL = profil(r, 'lauf');
    if (!d.tri) disz = 'lauf'; else if (disz === 'lauf' && !PL) disz = 'rad';
    const P = disz === 'rad' && PR ? PR : PL, AN = anstiege(P, disz === 'rad' ? (d.rad >= 150 ? 60 : 40) : 15);
    pk.append(el('div', { class: 'tf-card-head' }, S.badge(disz === 'rad' ? 'orange' : 'mint', disz === 'rad' ? 'i-bike' : 'i-run'), el('div', null, el('h2', { text: 'Höhenprofil ' + (disz === 'rad' ? 'Rad' : 'Laufen') }), el('div', { class: 'tf-sub', text: nf(P.D, P.D % 1 ? 1 : 0) + ' km · ' + nf(P.H) + ' Höhenmeter' + ((disz === 'rad' ? r.radRunden : r.laufRunden) > 1 ? ' · ' + (disz === 'rad' ? r.radRunden : r.laufRunden) + ' Runden' : '') + (AN.length ? ' · ' + AN.length + (AN.length === 1 ? ' Anstieg' : ' Anstiege') : '') }))));
    if (d.tri) { const seg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Disziplin' }); [['rad', 'Rad'], ['lauf', 'Laufen']].forEach(([id, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(disz === id) }, n); b.addEventListener('click', () => { disz = id; renderStrecke(); }); seg.appendChild(b); }); pk.appendChild(seg); }
    const chart = el('div', { class: 'tf-chart tf-rs-chart' }); pk.appendChild(chart);
    requestAnimationFrame(() => { if (chart.isConnected) profilChart(chart, P, { farbe: disz === 'rad' ? 'orange' : 'mint', anstiege: AN, hoehe: 170 }); });
    if (AN.length) pk.appendChild(el('ol', { class: 'tf-rs-anstiege' }, ...AN.map((a) => el('li', null, el('b', { text: 'km ' + nf(a.von, 0) + '–' + nf(a.bis, 0) }), el('span', { text: '+' + Math.round(a.gain) + ' m auf ' + nf(a.laenge, 1) + ' km · Ø ' + nf(a.pct, 1) + ' %' })))));
    pk.appendChild(el('p', { class: 'tf-note', text: P.art === 'beschrieben' ? 'Profil nach der Streckenbeschreibung – die bekannten Anstiege an ihrer Kilometerposition; die kleinen Wellen dazwischen sind schematisch ergänzt, damit die Summe den veröffentlichten Höhenmetern entspricht.' : 'Schematisches Profil aus den Gesamt-Höhenmetern und dem Charakter der Strecke – Lage und Form der Anstiege sind nicht die echten.' }));
    frag.push(pk);
    // Prognose
    const PG = sicher(() => prognose(r));
    if (PG) {
      const c = el('article', { class: 'tf-card tf-span2', id: 'rs-prognose' });
      c.appendChild(el('div', { class: 'tf-card-head' }, S.badge('pink', 'i-clock'), el('div', null, el('h2', { text: 'Deine Prognose auf dieser Strecke' }), el('div', { class: 'tf-sub', text: 'Aus deinem Athletenprofil, Abschnitt für Abschnitt über das Profil' }))));
      c.appendChild(el('div', { class: 'tf-rs-gesamt' }, el('b', { class: 'num', text: hms(PG.gesamt) }), el('small', { text: PG.ziel ? 'Dein Ziel ' + hms(PG.ziel.gesamt) + ' · ' + (PG.gesamt <= PG.ziel.gesamt ? nf(Math.round((PG.ziel.gesamt - PG.gesamt) / 60)) + ' min Luft' : nf(Math.round((PG.gesamt - PG.ziel.gesamt) / 60)) + ' min fehlen') : 'Gesamtzeit' })));
      c.appendChild(el('div', { class: 'tf-rs-splits' }, ...PG.teile.filter((t) => !/^t[12]$/.test(t.id)).map((t) => { const zielS = PG.ziel ? PG.ziel[t.id] : null; return el('div', { class: 'tf-rs-split' }, el('small', { text: t.name }), el('b', { class: 'num', text: hms(t.s) }), el('span', { text: t.sub }), zielS ? el('em', { class: 'num', text: (t.s <= zielS ? '−' : '+') + nf(Math.round(Math.abs(t.s - zielS) / 60)) + ' min zum Ziel' }) : null); })));
      c.appendChild(el('ul', { class: 'tf-rs-annahmen' }, ...PG.annahmen.map((t) => el('li', { text: t }))));
      const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, 'Im Rennrechner feiner einstellen'); b.addEventListener('click', () => T.geh('rennen/rechner'));
      c.appendChild(el('div', { class: 'tf-form-actions' }, b, el('span', { class: 'tf-ich-hint', text: 'Ohne Wind, Wechselzonen-Wege und Verpflegungsstopps – Richtwert, keine Garantie.' })));
      frag.push(c);
      // Pacing je Anstieg
      const radT = PG.teile.find((t) => t.id === 'bike'), laufT = PG.teile.find((t) => t.id === 'run');
      const pc = el('article', { class: 'tf-card tf-span2', id: 'rs-pacing' });
      pc.appendChild(el('div', { class: 'tf-card-head' }, S.badge('orange', 'i-gauge'), el('div', null, el('h2', { text: 'Pacing für diese Strecke' }), el('div', { class: 'tf-sub', text: 'Gleichmäßig fahren, am Berg nur ein wenig mehr – das Modell belohnt Geduld' }))));
      const L = [];
      if (radT) {
        const a = athlet(), AR = anstiege(radT.P, d.rad >= 150 ? 60 : 40), oben = Math.min(Math.round(radT.watt * 1.08), Math.round((+a.ftp_ref_w || 220) * (+a.rad_if_max || 0.75)));
        L.push(el('li', null, el('b', { text: 'Rad: ' + radT.watt + ' W im Flachen (NP ca. ' + radT.np + ' W)' }), el('span', { text: AR.length ? 'An den Anstiegen bis ' + oben + ' W, nie darüber – jedes Watt mehr am Berg kostet beim Laufen. Abfahrten rollen lassen und essen.' : 'Flache Strecke: gleichmäßig treten, die Aero-Position halten – hier gewinnt die Disziplin, nicht der Beinschmerz.' })));
        AR.forEach((x, i) => L.push(el('li', { class: 'tf-rs-pz' }, el('b', { text: 'Anstieg ' + (i + 1) + ' · km ' + nf(x.von, 0) }), el('span', { text: '+' + Math.round(x.gain) + ' m, Ø ' + nf(x.pct, 1) + ' % – bis ' + oben + ' W, oben sofort zurück auf ' + radT.watt + ' W' }))));
        if (tags.includes('windig')) L.push(el('li', null, el('b', { text: 'Wind' }), el('span', { text: 'Gegen den Wind nicht die Watt erhöhen – Position tiefer, Geduld. Mit dem Wind nicht nachlassen.' })));
      }
      if (laufT) {
        const AL = anstiege(laufT.P, 15), pace = laufT.s / d.lauf;
        L.push(el('li', null, el('b', { text: 'Laufen: ' + hms(pace) + ' /km im Schnitt' }), el('span', { text: d.tri ? 'Die ersten 2 km bewusst 10–15 s langsamer als geplant – die Beine kommen vom Rad. Verpflegung an jeder Station.' : 'Erste Hälfte kontrolliert, zweite Hälfte gleich schnell oder schneller – negative Splits gewinnen Marathons.' })));
        AL.forEach((x, i) => L.push(el('li', { class: 'tf-rs-pz' }, el('b', { text: 'Anstieg ' + (i + 1) + ' · km ' + nf(x.von, 0) }), el('span', { text: '+' + Math.round(x.gain) + ' m – Tempo um ' + Math.round(pace * 3.5 * (x.pct / 100)) + ' s/km zurücknehmen, Schrittlänge kürzer, Frequenz halten' }))));
        if (tags.includes('heiss')) L.push(el('li', null, el('b', { text: 'Hitze' }), el('span', { text: 'Ab 25 °C kostet jedes Grad Zeit – Tempo von Anfang an 3–5 % ruhiger, kühlen an jeder Station (Ely et al. 2007).' })));
      }
      pc.appendChild(el('ul', { class: 'tf-rs-pacing' }, ...L));
      pc.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Martin et al., J Appl Biomech 1998 · Atkinson et al., J Sports Sci 2007 (gleichmäßige gegen variable Leistung) · Abbiss & Laursen, Sports Med 2008 · Minetti et al., J Appl Physiol 2002' })));
      frag.push(pc);
    }
    // Fakten
    const fk = el('article', { class: 'tf-card', id: 'rs-fakten' });
    fk.appendChild(el('div', { class: 'tf-card-head' }, S.badge('gray', 'i-info'), el('div', null, el('h2', { text: 'Gut zu wissen' }))));
    fk.appendChild(el('p', { class: 'tf-rs-note', text: r.note }));
    const kv = el('div', { class: 'tf-kv tf-kv-2' },
      el('div', null, el('small', { text: 'Termin' }), el('span', { text: 'meist im ' + MON[r.mon] }), el('em', { text: 'wechselt jedes Jahr' })),
      el('div', null, el('small', { text: 'Teilnehmer' }), el('span', { class: 'num', text: 'ca. ' + tausend(r.n) }), el('em', { text: 'Einzelstarter, ungefähr' })),
      d.tri ? el('div', null, el('small', { text: 'Schwimmen' }), el('span', { text: { see: 'See', meer: 'Meer', fluss: 'Fluss', kanal: 'Kanal', hafen: 'Hafen' }[r.swim] || '–' }), el('em', { text: tags.includes('strom') ? 'mit Strömung' : 'Neopren meist erlaubt' })) : null,
      el('div', null, el('small', { text: 'Charakter' }), el('span', { text: tags.filter((t) => ['flach', 'wellig', 'huegelig', 'bergig'].includes(t)).map((t) => TAG[t]).join(', ') || '–' }), el('em', { text: tags.includes('schnell') ? 'schnelle Strecke' : tags.includes('kult') ? 'Kultrennen' : '' })));
    fk.appendChild(kv);
    if (r.rek) fk.appendChild(el('p', { class: 'tf-note', text: 'Streckenrekord: ' + [r.rek.m, r.rek.w].filter(Boolean).join(' · ') + '.' }));
    frag.push(fk);
    // Ähnliche Strecken
    const aehnlich = R.filter((x) => x.id !== r.id && SERIE[x.serie].sport === S0.sport && SERIE[x.serie].dist === S0.dist).map((x) => ({ x, d: Math.abs((x.hmRad || x.hmLauf) - (r.hmRad || r.hmLauf)) + (x.land === r.land ? 0 : 200) })).sort((p, q) => p.d - q.d).slice(0, 4).map((p) => p.x);
    if (aehnlich.length) { const ac = el('article', { class: 'tf-card', id: 'rs-aehnlich' }); ac.append(el('div', { class: 'tf-card-head' }, S.badge('blue', 'i-tausch'), el('div', null, el('h2', { text: 'Ähnliche Strecken' }))), el('div', { class: 'tf-links tf-rn-rows' }, ...aehnlich.map(rennZeile))); frag.push(ac); }
    box.replaceChildren(el('div', { class: 'tf-grid tf-rs' }, ...frag));
  }
  // Als Ziel setzen: Datum wählen, dann als A-Rennen eintragen
  function zielBlatt(r) {
    const S0 = SERIE[r.serie], heute = localDate(), jahr = +heute.slice(0, 4) + (r.mon > +heute.slice(5, 7) ? 0 : 1);
    const datum = el('input', { class: 'tf-input', type: 'date', value: jahr + '-' + String(r.mon).padStart(2, '0') + '-01', min: heute, 'aria-label': 'Renntag' });
    const ziel = el('input', { class: 'tf-input', type: 'text', inputmode: 'numeric', placeholder: 'z. B. 8:59:00', 'aria-label': 'Zielzeit' });
    const PG = sicher(() => prognose(r)); if (PG) ziel.placeholder = 'z. B. ' + hms(Math.round(PG.gesamt / 60) * 60);
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const ok = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Als Hauptrennen eintragen');
    ok.addEventListener('click', async () => {
      if (!datum.value) { setMsg(msg, 'Bitte den Renntag wählen.', true); return; }
      let zs = null; if (ziel.value.trim()) { const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(ziel.value.trim()); if (!m) { setMsg(msg, 'Zielzeit als h:mm oder h:mm:ss.', true); return; } zs = +m[1] * 3600 + +m[2] * 60 + (+m[3] || 0); }
      ok.disabled = true; setMsg(msg, 'Speichert …');
      try {
        const j = await A().api('POST', '/api/wettkampf', { name: r.name, datum: datum.value, sport: S0.sport, distanz: S0.dist, prio: 'A', ziel_s: zs, notiz: titelLand(r), strecke: r.id });
        const W = (A().raw('wettkaempfe') || []).filter((w) => w.id !== j.row.id).concat([j.row]).sort((x, y) => (x.datum < y.datum ? -1 : 1));
        A().patch('wettkaempfe', W); if (window.tfWissen) tfWissen.schliessen(); A().toast(r.name + ' ist dein Ziel'); T.neu();
      } catch (e) { setMsg(msg, e.message, true); ok.disabled = false; }
    });
    const box = el('div', { class: 'tf-rm' }, el('h2', { class: 'tf-rm-t', id: 'sheet-titel', text: r.name }), el('p', { class: 'tf-rm-sub', text: 'Wird als A-Rennen in deine Saison eingetragen – mit Countdown, Trainingsphasen und Tapering. Den genauen Renntag findest du in der Ausschreibung; meist ist es der ' + MON[r.mon] + '.' }),
      el('div', { class: 'tf-sz-f2' }, el('label', { class: 'tf-field' }, el('span', { text: 'Renntag' }), datum), el('label', { class: 'tf-field' }, el('span', { text: 'Zielzeit (optional)' }), ziel)),
      el('div', { class: 'tf-form-actions' }, ok), msg);
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  /* ---------- Anmelden ---------- */
  T.seite('rennen-hub', renderHub);
  T.seite('rennen-strecke', renderStrecke);
  T.routen('rennen/strecke', (id) => (BY[id] ? { seite: 'rennen-strecke', titel: BY[id].name, sub: titelLand(BY[id]), eltern: 'rennen', strecke: id } : null));
  window.tfRennen = { R, BY, SERIE, profil, anstiege, prognose, miniProfil, profilChart, distanzen, titelLand, zielInfo, zielStrecke, oeffne: (id) => { STRECKE = id; T.geh('rennen/strecke/' + id); }, gefiltert, K, MON };
})();
