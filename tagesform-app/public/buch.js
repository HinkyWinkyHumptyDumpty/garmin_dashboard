/* Dreiklang · Trainingsbuch (Version 26)
   Alle vergangenen Einheiten mit ihrer Analyse. Oben Zeitraum und Sportart, darunter:
   1. Deine Wochen (bis 12 Wochen): jede Woche eine Zeile, jede Einheit ein Punkt in der Farbe ihrer Sportart, Größe nach
      Belastung; offene Ringe = geplant, aber nicht gemacht, gestrichelt = kommt diese Woche noch. Ab einem Jahr die
      Skyline: Stunden je Woche nach Sportart. Antippen springt zur Woche in der Liste.
   2. Im Zeitraum: Einheiten, Zeit, Belastung, Strecke – gegen den gleich langen Zeitraum davor; Anteil der Sportarten;
      wie viel vom Plan erledigt ist.
   3. Entwicklung: aerobe Effizienz über die Zeit – Meter pro Herzschlag in lockeren, flachen Läufen, Watt pro Herzschlag
      in ruhigen Ausfahrten, Tempo pro 100 m im Becken; Punkte und gleitender Median. Antippen öffnet die Einheit.
   4. Höhepunkte: längste, härteste, weiteste, schnellste Einheit und die stärkste Woche.
   5. Alle Einheiten: nach Wochen und Tagen – oder nach Belastung, Dauer, Strecke sortiert –, mit Suche.
   Jede Einheit öffnet ihre Analyse (#training/buch/<id>, einheit.js). Die Auswahl merkt sich der Browser (nur Bequemlichkeit). */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svg, svgIco, nf, iso, toDay, DAY, localDate, col, mmss, hm, plot, line, dots, hoverTime, kv, monday, kwOf } = T.ui;
  const X = () => window.tfEinheit;
  const kart = (o) => window.tfSeiten.karte(o);
  const sicher = (fn, ersatz) => { try { return fn(); } catch (e) { console.error(e); return ersatz === undefined ? null : ersatz; } };
  const plus = (d, n) => iso(toDay(d).getTime() + n * DAY);
  const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
  const tagLang = (d) => WT[toDay(d).getUTCDay()] + ' ' + +d.slice(8, 10) + '. ' + MON[+d.slice(5, 7) - 1];
  const monatJahr = (d) => MON[+d.slice(5, 7) - 1] + ' ' + d.slice(0, 4);
  const sg = (x, d) => (x == null || !isFinite(x) ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '±') + nf(Math.abs(x), d || 0));
  const stunden = (min) => hm(min / 60); // 6:12
  const spanne = (mo) => { const so = plus(mo, 6), a = +mo.slice(8, 10), b = +so.slice(8, 10); return mo.slice(5, 7) === so.slice(5, 7) ? a + '.–' + b + '. ' + MON[+so.slice(5, 7) - 1] : a + '. ' + MON[+mo.slice(5, 7) - 1] + '–' + b + '. ' + MON[+so.slice(5, 7) - 1]; };
  const median = (v) => { const x = v.filter((n) => n != null && isFinite(n)).sort((p, q) => p - q); return x.length ? x[x.length >> 1] : null; };

  /* ---------- Auswahl ---------- */
  const ZEIT = [['4w', '4 Wochen', 4], ['12w', '12 Wochen', 12], ['jahr', 'Jahr', 52], ['alles', 'Alles', 0]];
  const SORT = [['neu', 'Neueste'], ['hart', 'Härteste'], ['lang', 'Längste'], ['weit', 'Weiteste']];
  const SPORTE = [['alle', 'Alle'], ['run', 'Laufen'], ['bike', 'Rad'], ['swim', 'Schwimmen'], ['kraft', 'Kraft'], ['other', 'Sonstiges']];
  const Z = { zeit: '12w', sport: 'alle', sort: 'neu', q: '', n: 4, flach: 20, ent: null };
  try {
    const g = JSON.parse(localStorage.getItem('tf:buch') || '{}');
    if (ZEIT.some((x) => x[0] === g.zeit)) Z.zeit = g.zeit;
    if (SPORTE.some((x) => x[0] === g.sport)) Z.sport = g.sport;
    if (SORT.some((x) => x[0] === g.sort)) Z.sort = g.sort;
  } catch (e) { /* ohne Speicher geht es auch */ }
  const merken = () => { try { localStorage.setItem('tf:buch', JSON.stringify({ zeit: Z.zeit, sport: Z.sport, sort: Z.sort })); } catch (e) { /* egal */ } };
  const SP = (s) => (X().SPORT[s] || X().SPORT.other);
  const PLAN_FARBE = { laufen: 'mint', rad: 'orange', schwimmen: 'blue', kraft: 'purple', mobil: 'teal' };
  const PLAN_SPORT = { laufen: 'run', rad: 'bike', schwimmen: 'swim', kraft: 'kraft', mobil: 'other' };

  function grenzen() { // ganze Kalenderwochen bis heute; davor ein gleich langer Zeitraum zum Vergleich
    const h = localDate(), mo = monday(h), z = ZEIT.find((x) => x[0] === Z.zeit) || ZEIT[1], L = X().alle();
    const erst = L.reduce((m, b) => (b.date < m ? b.date : m), h);
    const von = z[2] ? plus(mo, -(z[2] - 1) * 7) : monday(erst), tage = Math.round((toDay(h) - toDay(von)) / DAY) + 1;
    return { von, bis: h, tage, z, erst, vorVon: z[2] ? plus(von, -tage) : null, vorBis: z[2] ? plus(von, -1) : null };
  }
  const passtSport = (b) => Z.sport === 'alle' || b.sport === Z.sport;
  const nameVon = (b) => { const G = X().roh(b.id); return ((G && G.name) || b.name || '') + ' ' + SP(b.sport).name; };
  function auswahl(g, mitSuche) {
    const q = mitSuche ? Z.q.trim().toLowerCase() : '';
    return X().alle().filter((b) => b.date >= g.von && b.date <= g.bis && passtSport(b) && (!q || nameVon(b).toLowerCase().includes(q)));
  }
  function tagPlan(d) { const P = window.tfPlan, st = P && P.tagStatus ? sicher(() => P.tagStatus(d)) : null; return st && st.imPlan ? st.einheiten.filter((e) => !e.rennen) : []; }
  const nachWoche = (L) => { const M = new Map(); L.forEach((b) => { const mo = monday(b.date); if (!M.has(mo)) M.set(mo, []); M.get(mo).push(b); }); return M; };

  /* ---------- Filter ---------- */
  function filterLeiste(g) {
    const zeit = el('div', { class: 'tf-seg tf-bu-zeit', role: 'group', 'aria-label': 'Zeitraum' });
    ZEIT.forEach(([k, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(Z.zeit === k) }, n); b.addEventListener('click', () => { Z.zeit = k; Z.n = 4; Z.flach = 20; merken(); render(); }); zeit.appendChild(b); });
    const imZeitraum = X().alle().filter((b) => b.date >= g.von && b.date <= g.bis), zahl = (s) => (s === 'alle' ? imZeitraum.length : imZeitraum.filter((b) => b.sport === s).length);
    const sport = el('div', { class: 'tf-seg tf-bu-sport', role: 'group', 'aria-label': 'Sportart' });
    SPORTE.filter(([k]) => k === 'alle' || k === Z.sport || zahl(k) > 0).forEach(([k, n]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(Z.sport === k) }, k === 'alle' ? null : el('i', { style: 'background:var(--tf-' + SP(k).farbe + ')' }), n, el('small', { class: 'tnum', text: String(zahl(k)) }));
      b.addEventListener('click', () => { Z.sport = k; Z.n = 4; Z.flach = 20; Z.ent = null; merken(); render(); });
      sport.appendChild(b);
    });
    return el('div', { class: 'tf-bu-filter' }, zeit, sport);
  }

  /* ---------- 1. Deine Wochen: die Partitur ---------- */
  const groesse = (tss) => Math.round(Math.max(6, Math.min(18, 6 + 12 * Math.sqrt((+tss || 0) / 200))));
  function wochenZeile(mo, L, o) { // eine Woche: sieben Tage, jede Einheit ein Punkt; o.still = nur Bild (für die Übersicht)
    const heute = localDate(), tage = [];
    let min = 0, n = 0;
    for (let k = 0; k < 7; k++) {
      const d = plus(mo, k), ist = L.filter((b) => b.date === d), punkte = [];
      ist.sort((x, y) => X().zeitpunkt(x).localeCompare(X().zeitpunkt(y))).forEach((b) => { min += X().minuten(b); n++; punkte.push(el('i', { class: 'tf-bu-p', style: '--c:var(--tf-' + SP(b.sport).farbe + ');--r:' + groesse(b.tss) + 'px', title: SP(b.sport).name + ' · ' + X().dauer(X().minuten(b)) + ' · ' + Math.round(b.tss || 0) + ' TSS' })); });
      tagPlan(d).forEach((e) => { // geplant, aber nicht (oder noch nicht) gemacht
        if (e.ok || (Z.sport !== 'alle' && PLAN_SPORT[e.sport] !== Z.sport)) return;
        punkte.push(el('i', { class: 'tf-bu-p ' + (d < heute ? 'offen' : 'bald'), style: '--c:var(--tf-' + (PLAN_FARBE[e.sport] || 'gray') + ');--r:10px', title: e.titel + ' · ' + e.min + ' min · ' + (d < heute ? 'nicht gemacht' : 'geplant') }));
      });
      tage.push(el('span', { class: 'tf-bu-d' + (d === heute ? ' heute' : '') + (d > heute ? ' spaeter' : '') }, ...punkte));
    }
    const kids = [el('span', { class: 'tf-bu-kw tnum', text: 'KW ' + kwOf(mo) }), ...tage, el('span', { class: 'tf-bu-sum tnum', text: min ? stunden(min) : '–' })];
    const label = 'KW ' + kwOf(mo) + ', ' + spanne(mo) + ': ' + (n === 1 ? '1 Einheit' : n + ' Einheiten') + (min ? ', ' + stunden(min) + ' Stunden' : '');
    if (o && o.still) return el('div', { class: 'tf-bu-w', role: 'img', 'aria-label': label }, ...kids);
    const b = el('button', { type: 'button', class: 'tf-bu-w', 'aria-label': label + ' – in der Liste zeigen' }, ...kids);
    b.addEventListener('click', () => zeigeWoche(mo));
    return b;
  }
  function legende(L, ohnePlan) {
    const da = [...new Set(L.map((b) => b.sport))];
    return el('div', { class: 'tf-bu-leg' }, ...da.map((s) => el('span', null, el('i', { style: 'background:var(--tf-' + SP(s).farbe + ')' }), SP(s).name)),
      ohnePlan ? null : el('span', null, el('i', { class: 'offen' }), 'geplant, nicht gemacht'), ohnePlan ? null : el('span', null, el('i', { class: 'bald' }), 'kommt noch'));
  }
  function partitur(g, L) {
    const wochen = []; for (let mo = monday(g.bis); mo >= g.von; mo = plus(mo, -7)) wochen.push(mo);
    const c = kart({ id: 'karte-buch-wochen', cls: 'tf-bu-part', farbe: 'mint', icon: 'i-cal', titel: 'Deine Wochen', sub: 'Jeder Punkt eine Einheit – je größer, desto mehr Belastung' });
    const kopf = el('div', { class: 'tf-bu-w tf-bu-kopf', 'aria-hidden': 'true' }, el('span'), ...['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((t) => el('span', { text: t })), el('span', { text: 'h' }));
    c.append(el('div', { class: 'tf-bu-raster' }, kopf, ...wochen.map((mo) => wochenZeile(mo, L))), legende(L));
    return c;
  }

  /* ---------- 1b. Ab einem Jahr: die Skyline ---------- */
  function skyline(g, L) {
    const wochen = []; for (let mo = monday(g.von); mo <= monday(g.bis); mo = plus(mo, 7)) wochen.push(mo);
    const S = ['run', 'bike', 'swim', 'kraft', 'other'], W = nachWoche(L);
    const daten = wochen.map((mo) => { const r = { mo, s: {}, tot: 0 }; (W.get(mo) || []).forEach((b) => { const m = X().minuten(b); r.s[b.sport] = (r.s[b.sport] || 0) + m; r.tot += m; }); return r; });
    const Wd = 340, Hh = 156, pl = 4, pr = 34, pt = 12, pb = 22, max = Math.max(120, ...daten.map((r) => r.tot)), bw = (Wd - pl - pr) / daten.length;
    const y = (v) => pt + (Hh - pt - pb) * (1 - v / max);
    const sv = svg('svg', { class: 'tf-svg tf-bu-sky', viewBox: '0 0 ' + Wd + ' ' + Hh, width: '100%', height: Hh, role: 'img', 'aria-label': 'Trainingsstunden je Woche nach Sportart, ' + daten.length + ' Wochen' });
    const schritt = max > 1800 ? 600 : max > 900 ? 300 : max > 480 ? 240 : 120; // höchstens vier Linien
    for (let v = schritt; v <= max; v += schritt) { const yy = y(v); svg('line', { x1: pl, x2: Wd - pr + 4, y1: yy, y2: yy, class: 'tf-gridline' }, sv); const t = svg('text', { x: Wd - pr + 8, y: yy + 3.5, class: 'tf-tick' }, sv); t.textContent = v / 60 + ' h'; }
    const heute = monday(localDate());
    daten.forEach((r, i) => {
      let y0 = Hh - pb; const x = pl + i * bw + bw * 0.14, w = Math.max(1.5, bw * 0.72);
      S.forEach((s) => { const v = r.s[s]; if (!v) return; const hh = (Hh - pt - pb) * (v / max); svg('rect', { x: x.toFixed(1), y: (y0 - hh).toFixed(1), width: w.toFixed(1), height: Math.max(0.8, hh).toFixed(1), fill: col(SP(s).farbe), rx: Math.min(1.5, w / 2) }, sv); y0 -= hh; });
      if (r.mo === heute) svg('circle', { cx: (x + w / 2).toFixed(1), cy: Hh - pb + 6, r: 2.6, fill: col('pink') }, sv);
      const neuerMonat = i === 0 || r.mo.slice(5, 7) !== daten[i - 1].mo.slice(5, 7);
      if (neuerMonat && [1, 4, 7, 10].includes(+r.mo.slice(5, 7)) && i < daten.length - 2) { const t = svg('text', { x: (x + w / 2).toFixed(1), y: Hh - 4, 'text-anchor': i === 0 ? 'start' : 'middle', class: 'tf-tick' }, sv); t.textContent = MON[+r.mo.slice(5, 7) - 1] + (r.mo.slice(5, 7) === '01' ? ' ' + r.mo.slice(2, 4) : ''); }
      const ziel = svg('rect', { x: (pl + i * bw).toFixed(1), y: 0, width: bw.toFixed(1), height: Hh, fill: 'transparent', class: 'tf-bu-sky-z', role: 'button', tabindex: '-1', 'aria-label': 'KW ' + kwOf(r.mo) + ': ' + stunden(r.tot) + ' Stunden' }, sv);
      ziel.addEventListener('click', () => zeigeWoche(r.mo));
    });
    const mittel = daten.reduce((x, r) => x + r.tot, 0) / Math.max(1, g.tage / 7);
    const c = kart({ id: 'karte-buch-wochen', cls: 'tf-bu-part', farbe: 'mint', icon: 'i-bars', titel: Z.zeit === 'jahr' ? 'Dein Jahr' : 'Alle Wochen', sub: 'Stunden je Woche · Ø ' + stunden(mittel) + ' h · Antippen zeigt die Woche' });
    c.append(el('div', { class: 'tf-chart' }, sv), legende(L, true));
    return c;
  }

  /* ---------- 2. Im Zeitraum ---------- */
  function summen(g, L) {
    const agg = (A) => ({ n: A.length, min: A.reduce((x, b) => x + X().minuten(b), 0), tss: A.reduce((x, b) => x + (+b.tss || 0), 0), km: A.reduce((x, b) => x + (+b.km || 0), 0) });
    const V = g.vorVon ? X().alle().filter((b) => b.date >= g.vorVon && b.date <= g.vorBis && passtSport(b)) : null, a = agg(L), v = V ? agg(V) : null;
    const chip = (x, y, f) => (y == null ? null : { c: 'gray', label: (x - y >= 0 ? '+' : '−') + f(Math.abs(x - y)) });
    const c = kart({ id: 'karte-buch-summe', cls: 'tf-bu-summe', farbe: 'blue', icon: 'i-bars', titel: 'Im Zeitraum', sub: g.z[2] ? g.z[1] + ' · Chips: gegen ' + (Z.zeit === 'jahr' ? 'das Jahr' : 'die ' + g.z[1]) + ' davor' : 'Seit ' + monatJahr(g.erst) });
    const R = [
      ['Einheiten', nf(a.n), '', v ? chip(a.n, v.n, (x) => nf(x)) : null],
      ['Trainingszeit', stunden(a.min), 'h', v ? chip(a.min, v.min, (x) => stunden(x) + ' h') : null],
      ['Belastung', nf(Math.round(a.tss)), 'TSS', v ? chip(a.tss, v.tss, (x) => nf(Math.round(x))) : null],
      ['Ø pro Woche', stunden(a.min / Math.max(1, g.tage / 7)), 'h', null],
    ];
    if (['run', 'bike', 'swim'].includes(Z.sport)) R.push(['Strecke', nf(a.km, Z.sport === 'bike' ? 0 : 1), 'km', v ? chip(a.km, v.km, (x) => nf(x, Z.sport === 'bike' ? 0 : 1) + ' km') : null]);
    const kvb = el('div', { class: 'tf-kv tf-ei-kv' }); kv(kvb, R); c.appendChild(kvb);
    if (Z.sport === 'alle' && a.min > 0) { // Anteile der Sportarten
      const S = ['run', 'bike', 'swim', 'kraft', 'other'].map((s) => ({ s, m: L.filter((b) => b.sport === s).reduce((x, b) => x + X().minuten(b), 0) })).filter((x) => x.m > 0);
      const bar = el('div', { class: 'tf-bu-mix gross', role: 'img', 'aria-label': S.map((x) => SP(x.s).name + ' ' + stunden(x.m) + ' h').join(', ') });
      S.forEach((x) => { const i = el('i', { style: 'background:var(--tf-' + SP(x.s).farbe + ')' }); i.style.flex = x.m + ' 1 0'; bar.appendChild(i); });
      c.append(el('div', { class: 'tf-ei-drei-k' }, el('span', { text: 'Sportarten' }), el('small', { text: 'nach Zeit' })), bar,
        el('div', { class: 'tf-bu-leg' }, ...S.map((x) => el('span', null, el('i', { style: 'background:var(--tf-' + SP(x.s).farbe + ')' }), SP(x.s).name + ' ', el('b', { class: 'num', text: stunden(x.m) + ' h' })))));
    }
    const P = planBilanz(g);
    if (P && P.n) c.appendChild(el('p', { class: 'tf-ei-zeile' }, el('i', { style: 'background:var(--tf-' + (P.ok / P.n >= 0.8 ? 'green' : P.ok / P.n >= 0.6 ? 'yellow' : 'orange') + ')' }), el('b', { text: 'Plan: ' }), el('span', { text: P.ok + ' von ' + P.n + ' geplanten Einheiten erledigt (' + Math.round((100 * P.ok) / P.n) + ' %)' + (Z.sport === 'alle' ? '' : ' – nur ' + SP(Z.sport).name) + '.' })));
    return c;
  }
  function planBilanz(g) { // geplante Einheiten im Zeitraum bis heute: wie viele erledigt
    if (!window.tfPlan || !tfPlan.tagStatus) return null;
    const h = localDate(); let n = 0, ok = 0;
    for (let d = g.tage > 371 ? plus(h, -370) : g.von; d <= h; d = plus(d, 1)) {
      tagPlan(d).forEach((e) => { if (Z.sport !== 'alle' && PLAN_SPORT[e.sport] !== Z.sport) return; if (d === h && !e.ok) return; n++; if (e.ok) ok++; });
    }
    return { n, ok };
  }

  /* ---------- 3. Entwicklung: aerobe Effizienz ---------- */
  const flach = (G) => !(G && +G.elev_m > 0 && +G.dist_m > 0) || G.elev_m / (G.dist_m / 1000) <= 15;
  const ENT = {
    run: { titel: 'Meter pro Herzschlag', sub: 'lockere, flache Läufe ab 20 min', besser: 1, fmt: (v) => nf(v, 2), u: 'm',
      wert: (F) => X().effizienz(F.G, 'run'), passt: (F) => F.B.sport === 'run' && F.min >= 20 && flach(F.G) && ((A) => A && A.lo >= 0.7)(X().anteile(F)) },
    bike: { titel: 'Watt pro Herzschlag', sub: 'ruhige Ausfahrten ab 45 min mit Leistung', besser: 1, fmt: (v) => nf(v, 2), u: 'W',
      wert: (F) => X().effizienz(F.G, 'bike'), passt: (F) => F.B.sport === 'bike' && F.min >= 45 && (F.B.if == null || F.B.if <= 0.8) },
    swim: { titel: 'Tempo pro 100 m', sub: 'im Becken ab 1.000 m', besser: -1, fmt: mmss, u: '/100 m',
      wert: (F) => X().tempoSchwimm(F.G), passt: (F) => F.B.sport === 'swim' && F.G && F.G.type === 'lap_swimming' && +F.G.dist_m >= 1000 },
  };
  function entPunkte(s, g) {
    const D = ENT[s];
    return X().alle().filter((b) => b.sport === s && b.date >= g.von && b.date <= g.bis && String(b.id).indexOf('eigen:') !== 0)
      .map((b) => X().leicht(b)).filter((F) => F.G && D.passt(F)).map((F) => ({ id: F.id, date: F.B.date, t: toDay(F.B.date), v: D.wert(F) })).filter((r) => r.v != null && isFinite(r.v) && r.v > 0)
      .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  }
  function entwicklung(g) {
    const kand = ['run', 'bike', 'swim'].filter((s) => Z.sport === 'alle' || Z.sport === s).map((s) => ({ s, P: entPunkte(s, g) })).filter((x) => x.P.length >= 4);
    if (!kand.length) {
      if (!['run', 'bike', 'swim'].includes(Z.sport)) return null;
      const c = kart({ id: 'karte-buch-ent', cls: 'tf-bu-ent', farbe: SP(Z.sport).farbe, icon: 'i-pfeil', titel: 'Entwicklung', sub: ENT[Z.sport].titel });
      c.appendChild(el('p', { class: 'tf-note', text: 'Noch zu wenige passende Einheiten (' + ENT[Z.sport].sub + ') in diesem Zeitraum – ab vier zeigt sich ein Verlauf. Ein längerer Zeitraum hilft.' }));
      return c;
    }
    const wahl = kand.find((x) => x.s === Z.ent) || kand.slice().sort((x, y) => y.P.length - x.P.length)[0], D = ENT[wahl.s], P0 = wahl.P;
    const c = kart({ id: 'karte-buch-ent', cls: 'tf-bu-ent', farbe: SP(wahl.s).farbe, icon: 'i-pfeil', titel: 'Entwicklung', sub: D.titel + ' · ' + D.sub });
    if (kand.length > 1) {
      const seg = el('div', { class: 'tf-seg tf-ei-seg', role: 'group', 'aria-label': 'Sportart der Entwicklung' });
      kand.forEach((k) => { const b = el('button', { type: 'button', 'aria-pressed': String(k.s === wahl.s) }, SP(k.s).name); b.addEventListener('click', () => { Z.ent = k.s; const neu = sicher(() => entwicklung(g)); if (neu) c.replaceWith(neu); }); seg.appendChild(b); });
      c.appendChild(seg);
    }
    // gleitender Median über fünf Einheiten: einzelne Ausreißer (Hitze, Wind, müde Beine) verschwinden
    const R = P0.map((r, i) => Object.assign({}, r, { m: median(P0.slice(Math.max(0, i - 4), i + 1).map((x) => x.v)) }));
    if (R.length >= 6) {
      const k = Math.max(2, Math.floor(R.length / 3)), a = median(R.slice(0, k).map((r) => r.v)), b = median(R.slice(-k).map((r) => r.v));
      const d = D.besser > 0 ? (b / a - 1) * 100 : a - b, gut = d >= (D.besser > 0 ? 2 : 1.5), schlecht = d <= -(D.besser > 0 ? 2 : 1.5);
      const txt = D.besser > 0 ? sg(d, 0) + ' % ' + D.titel + ' gegen den Anfang des Zeitraums' : (d >= 0 ? nf(d, 0) + ' s pro 100 m schneller' : nf(-d, 0) + ' s pro 100 m langsamer') + ' als am Anfang des Zeitraums';
      c.appendChild(el('p', { class: 'tf-ei-reiz' }, el('i', { style: 'background:var(--tf-' + (gut ? 'green' : schlecht ? 'orange' : 'gray') + ')' }), el('span', null, el('b', { text: (gut ? (D.besser > 0 ? 'Effizienter geworden' : 'Schneller geworden') : schlecht ? (D.besser > 0 ? 'Weniger effizient' : 'Langsamer geworden') : 'Stabil') + ' ' }), txt + '.')));
    }
    const box = el('div', { class: 'tf-chart tf-bu-ent-c', style: 'min-height:190px' });
    c.appendChild(box);
    requestAnimationFrame(() => sicher(() => {
      const V = R.map((r) => r.v), lo = Math.min(...V), hi = Math.max(...V), pad = (hi - lo || hi * 0.05 || 1) * 0.12;
      const P = plot(box, { h: 190, x: [toDay(g.von), toDay(g.bis)], y: [lo - pad, hi + pad], yinvert: D.besser < 0, ny: 4, yfmt: D.fmt, label: D.titel + ' über die Zeit – jede Einheit ein Punkt, die Linie der gleitende Median' });
      dots(P, R, (r) => r.t, (r) => r.v, col('fg3'), 3.6, 0.7);
      const RL = []; R.forEach((r, i) => { if (i && (r.t - R[i - 1].t) / DAY > 28) RL.push({ t: new Date((+r.t + +R[i - 1].t) / 2), m: null }); RL.push(r); }); // über Pausen keine Linie
      line(P, RL, (r) => r.t, (r) => r.m, col(SP(wahl.s).farbe), 2.6);
      hoverTime(box, P, R, (r) => r.t, (r) => tagLang(r.date), (r) => [{ label: D.titel, value: D.fmt(r.v) + ' ' + D.u, color: col('fg3') }, { label: 'gleitend über 5', value: D.fmt(r.m) + ' ' + D.u, color: col(SP(wahl.s).farbe) }], [{ y: (r) => r.v, color: col('pink') }]);
      const ov = P.s.lastElementChild; // die Fläche für Zeigen und Antippen: Antippen öffnet die Einheit
      if (ov) ov.addEventListener('click', (ev) => { const bb = P.s.getBoundingClientRect(), x = (ev.clientX - bb.left) * (P.w / bb.width), t = +P.xs.invert(x); let best = null; R.forEach((r) => { if (!best || Math.abs(+r.t - t) < Math.abs(+best.t - t)) best = r; }); if (best) T.geh('training/buch/' + best.id); });
    }));
    const erkl = { run: 'Mehr Meter pro Herzschlag bei lockeren, flachen Läufen heißt: dein Motor wird sparsamer.', bike: 'Mehr Watt pro Herzschlag bei ruhigen Ausfahrten heißt: dieselbe Leistung kostet dich weniger.', swim: 'Schnelleres Tempo im Becken bei vergleichbaren Einheiten – Technik und Form zusammen.' }[wahl.s];
    c.appendChild(el('p', { class: 'tf-note', text: erkl + ' Hitze, Wind und müde Beine drücken einzelne Punkte – auf die Linie kommt es an. Antippen öffnet die Einheit.' }));
    c.appendChild(el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: 'Allen & Coggan 2010 · Friel, The Triathlete’s Training Bible 2016' })));
    if (window.tfWissen && tfWissen.begriff && tfWissen.begriff('effizienz') && wahl.s !== 'swim') { const w = el('button', { type: 'button', class: 'tf-gym-link tf-ei-wissen' }, svgIco('i-book'), ' Aerobe Effizienz im Wissen'); w.addEventListener('click', () => tfWissen.zeige('effizienz')); c.appendChild(w); }
    return c;
  }

  /* ---------- 4. Höhepunkte ---------- */
  function hoehepunkte(g, L) {
    if (L.length < 3) return null;
    const H = [], best = (f, klein) => L.reduce((m, b) => { const v = f(b); if (v == null || !isFinite(v) || v <= 0) return m; return !m || (klein ? v < f(m) : v > f(m)) ? b : m; }, null);
    const zeile = (icon, farbe, titel, wert, sub, fn) => { const b = el('button', { type: 'button', class: 'tf-bu-h', style: '--c:var(--tf-' + farbe + ')' }, el('span', { class: 'tf-ht-i' }, svgIco(icon)), el('span', { class: 'tf-bu-h-t' }, el('b', { text: titel }), el('small', { text: sub })), el('span', { class: 'tf-bu-h-w num', text: wert })); b.addEventListener('click', fn); return b; };
    const zuEinheit = (b) => () => T.geh('training/buch/' + b.id);
    const sub = (b) => tagLang(b.date) + (Z.sport === 'alle' ? ' · ' + SP(b.sport).name : '');
    const lang = best((b) => X().minuten(b)); if (lang) H.push(zeile(SP(lang.sport).icon, SP(lang.sport).farbe, 'Längste Einheit', X().dauer(X().minuten(lang)), sub(lang), zuEinheit(lang)));
    const hart = best((b) => +b.tss || 0); if (hart && hart !== lang) H.push(zeile(SP(hart.sport).icon, SP(hart.sport).farbe, 'Härteste Einheit', Math.round(hart.tss) + ' TSS', sub(hart), zuEinheit(hart)));
    else if (hart) H.push(zeile('i-flame', SP(hart.sport).farbe, 'Härteste Einheit', Math.round(hart.tss) + ' TSS', 'dieselbe wie die längste', zuEinheit(hart)));
    if (['run', 'bike', 'swim'].includes(Z.sport)) {
      const weit = best((b) => +b.km || 0); if (weit) H.push(zeile('i-pin', SP(weit.sport).farbe, 'Weiteste', X().kmText(X().leicht(weit)), sub(weit), zuEinheit(weit)));
      if (Z.sport === 'run') { const f = (b) => { const G = X().roh(b.id); return G && +G.dist_m >= 5000 ? X().tempoLauf(G) : null; }, s = best(f, true); if (s) H.push(zeile('i-bolt', 'mint', 'Schnellster Lauf ab 5 km', mmss(f(s)) + ' /km', sub(s), zuEinheit(s))); }
      if (Z.sport === 'bike') { const f = (b) => { const G = X().roh(b.id); return G ? +G.p1200 || null : null; }, s = best(f); if (s) H.push(zeile('i-bolt', 'orange', 'Beste 20 Minuten', f(s) + ' W', sub(s), zuEinheit(s))); }
      if (Z.sport === 'swim') { const f = (b) => { const G = X().roh(b.id); return G ? +G.fs400 || null : null; }, s = best(f, true); if (s) H.push(zeile('i-bolt', 'blue', 'Schnellste 400 m', mmss(f(s)), sub(s), zuEinheit(s))); }
    }
    const W = [...nachWoche(L)].map(([mo, A]) => ({ mo, min: A.reduce((x, b) => x + X().minuten(b), 0), n: A.length })).sort((x, y) => y.min - x.min)[0];
    if (W && W.min) H.push(zeile('i-bars', 'gray', 'Stärkste Woche', stunden(W.min) + ' h', 'KW ' + kwOf(W.mo) + ' · ' + spanne(W.mo) + ' · ' + W.n + ' Einheiten', () => zeigeWoche(W.mo)));
    if (!H.length) return null;
    const c = kart({ id: 'karte-buch-hoch', cls: 'tf-bu-hoch', farbe: 'gold', icon: 'i-medal', titel: 'Höhepunkte', sub: 'Im gewählten Zeitraum' + (Z.sport === 'alle' ? '' : ' · ' + SP(Z.sport).name) });
    c.appendChild(el('div', { class: 'tf-bu-hl' }, ...H));
    return c;
  }

  /* ---------- 5. Alle Einheiten ---------- */
  let suchT = null;
  function listeKarte(g) {
    const c = kart({ id: 'karte-buch-liste', cls: 'tf-bu-liste', farbe: 'gray', icon: 'i-list', titel: 'Alle Einheiten', sub: '' });
    const such = el('input', { type: 'search', class: 'tf-bu-such', placeholder: 'Suchen, z. B. Intervalle', 'aria-label': 'Einheiten suchen', enterkeyhint: 'search' });
    such.value = Z.q;
    such.addEventListener('input', () => { clearTimeout(suchT); suchT = setTimeout(() => { Z.q = such.value; Z.n = 4; Z.flach = 20; koerper(); }, 220); });
    const sort = el('div', { class: 'tf-seg tf-bu-sort', role: 'group', 'aria-label': 'Sortieren nach' });
    const body = el('div', { class: 'tf-bu-body' });
    const koerper = () => sicher(() => listeFuellen(g, body, c));
    SORT.forEach(([k, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(Z.sort === k) }, n); b.addEventListener('click', () => { Z.sort = k; Z.flach = 20; merken(); sort.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); koerper(); }); sort.appendChild(b); });
    c.append(el('div', { class: 'tf-bu-such-z' }, el('span', { class: 'tf-bu-such-i' }, svgIco('i-search')), such), sort, body);
    koerper();
    return c;
  }
  function listeFuellen(g, body, c) {
    const L = auswahl(g, true), sub = c.querySelector('.tf-sub') || c.querySelector('.tf-card-head div');
    const zahl = (L.length === 1 ? '1 Einheit' : nf(L.length) + ' Einheiten') + (Z.q.trim() ? ' zu „' + Z.q.trim() + '“' : ' im Zeitraum');
    if (sub && sub.classList.contains('tf-sub')) sub.textContent = zahl; else { const h = c.querySelector('.tf-card-head h2'); if (h && h.parentNode) h.parentNode.appendChild(el('div', { class: 'tf-sub', text: zahl })); }
    if (!L.length) { body.replaceChildren(el('p', { class: 'tf-empty', text: Z.q.trim() ? 'Keine Einheit passt zu „' + Z.q.trim() + '“ – anderer Begriff oder längerer Zeitraum?' : 'In diesem Zeitraum keine Einheit' + (Z.sport === 'alle' ? '' : ' dieser Sportart') + '.' })); return; }
    const kids = [];
    if (Z.sort === 'neu') {
      const W = [...nachWoche(L)].sort((x, y) => (x[0] < y[0] ? 1 : -1));
      W.slice(0, Z.n).forEach(([mo, A]) => {
        const min = A.reduce((x, b) => x + X().minuten(b), 0), tss = A.reduce((x, b) => x + (+b.tss || 0), 0);
        const S = ['run', 'bike', 'swim', 'kraft', 'other'].map((s) => ({ s, m: A.filter((b) => b.sport === s).reduce((x, b) => x + X().minuten(b), 0) })).filter((x) => x.m > 0);
        const mix = el('div', { class: 'tf-bu-mix', 'aria-hidden': 'true' }); S.forEach((x) => { const i = el('i', { style: 'background:var(--tf-' + SP(x.s).farbe + ')' }); i.style.flex = x.m + ' 1 0'; mix.appendChild(i); });
        let planTxt = null;
        if (!Z.q.trim()) { let n = 0, ok = 0; const h = localDate(); for (let k = 0; k < 7; k++) { const d = plus(mo, k); if (d > h) break; tagPlan(d).forEach((e) => { if (Z.sport !== 'alle' && PLAN_SPORT[e.sport] !== Z.sport) return; if (d === h && !e.ok) return; n++; if (e.ok) ok++; }); } if (n) planTxt = 'Plan ' + ok + ' von ' + n; }
        kids.push(el('section', { class: 'tf-bu-wo', id: 'bu-w-' + mo, 'aria-label': 'KW ' + kwOf(mo) },
          el('div', { class: 'tf-bu-wk' }, el('b', { text: 'KW ' + kwOf(mo) }), el('span', { text: spanne(mo) }), el('span', { class: 'tf-bu-wk-s tnum', text: stunden(min) + ' h · ' + Math.round(tss) + ' TSS' })),
          mix, planTxt ? el('small', { class: 'tf-bu-wk-p', text: planTxt }) : null,
          ...tageIn(A)));
      });
      if (W.length > Z.n) { const m = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-bu-mehr' }, 'Ältere Wochen zeigen (' + (W.length - Z.n) + ')'); m.addEventListener('click', () => { Z.n += 4; listeFuellen(g, body, c); }); kids.push(m); }
    } else {
      const key = { hart: (b) => +b.tss || 0, lang: (b) => X().minuten(b), weit: (b) => +b.km || 0 }[Z.sort];
      const A = L.filter((b) => key(b) > 0).sort((x, y) => key(y) - key(x));
      if (!A.length) kids.push(el('p', { class: 'tf-empty', text: 'Keine Einheit mit Strecke in dieser Auswahl.' }));
      kids.push(el('div', { class: 'tf-ht-liste' }, ...A.slice(0, Z.flach).map((b) => kachelVon(b, true))));
      if (A.length > Z.flach) { const m = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-bu-mehr' }, 'Mehr zeigen (' + (A.length - Z.flach) + ')'); m.addEventListener('click', () => { Z.flach += 20; listeFuellen(g, body, c); }); kids.push(m); }
    }
    body.replaceChildren(...kids);
  }
  function tageIn(A) { // innerhalb der Woche: neuester Tag oben, am Tag in Uhrzeit-Reihenfolge
    const tage = [...new Set(A.map((b) => b.date))].sort().reverse();
    return tage.map((d) => el('div', { class: 'tf-bu-tag' }, el('div', { class: 'tf-bu-tag-k' }, el('span', { text: tagLang(d) }), d === localDate() ? el('small', { text: 'heute' }) : null),
      el('div', { class: 'tf-ht-liste' }, ...A.filter((b) => b.date === d).sort((x, y) => X().zeitpunkt(x).localeCompare(X().zeitpunkt(y))).map((b) => kachelVon(b, false)))));
  }
  function kachelVon(b, mitDatum) {
    const E = X().holen(b.id); if (!E) return el('span');
    const meta = mitDatum ? [tagLang(b.date), X().dauer(E.min), X().kmText(E)] : [E.zeit, X().dauer(E.min), X().kmText(E)];
    return X().kachel(E, null, { meta, ziel: 'training/buch/', lazy: true });
  }
  function zeigeWoche(mo) { // aus Partitur, Skyline oder Höhepunkten: die Woche in der Liste zeigen
    Z.sort = 'neu'; Z.q = '';
    const g = grenzen(), W = [...nachWoche(auswahl(g, false))].map(([m]) => m).sort().reverse(), i = W.indexOf(mo);
    if (i >= Z.n) Z.n = i + 1;
    render();
    requestAnimationFrame(() => { const z = document.getElementById('bu-w-' + mo) || document.getElementById('karte-buch-liste'); if (z) z.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  /* ---------- Seite ---------- */
  const BREIT = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
  function render() {
    const box = $('#buch-box'); if (!box) return;
    if (!X() || !X().alle) { box.replaceChildren(el('p', { class: 'tf-empty', text: 'Das Trainingsbuch lädt …' })); return; }
    const Lalle = X().alle();
    if (!Lalle.length) { T.kopf({ titel: 'Trainingsbuch', sub: 'Alle Einheiten mit Analyse' }); box.replaceChildren(el('p', { class: 'tf-empty', text: 'Noch keine Einheiten – sobald deine Uhr Einheiten liefert, stehen sie hier mit Analyse.' })); return; }
    const g = grenzen(), L = auswahl(g, false);
    T.kopf({ titel: 'Trainingsbuch', sub: nf(Lalle.length) + ' Einheiten seit ' + monatJahr(g.erst) });
    const filter = filterLeiste(g), wochen = sicher(() => (g.z[2] && g.z[2] <= 12 ? partitur(g, L) : skyline(g, L))), summe = sicher(() => summen(g, L));
    const ent = sicher(() => entwicklung(g)), hoch = sicher(() => hoehepunkte(g, L)), liste = sicher(() => listeKarte(g));
    if (BREIT && BREIT.matches) { // Laptop: zwei Spalten, die Liste über die ganze Breite
      box.replaceChildren(el('div', { class: 'tf-bu' }, filter, el('div', { class: 'tf-bu-sp' }, ...[wochen, ent].filter(Boolean)), el('div', { class: 'tf-bu-sp' }, ...[summe, hoch].filter(Boolean)), ...(liste ? [liste] : [])));
    } else box.replaceChildren(el('div', { class: 'tf-bu' }, filter, ...[wochen, summe, ent, hoch, liste].filter(Boolean)));
  }
  if (BREIT && BREIT.addEventListener) BREIT.addEventListener('change', () => { if (T.route() === 'training/buch') sicher(render); });

  /* ---------- Übersicht Training: das Trainingsbuch auf einen Blick ---------- */
  function hubKarte() {
    if (!X() || !X().alle) return null;
    const L = X().alle(); if (!L.length) return null;
    const h = localDate(), erst = L.reduce((m, b) => (b.date < m ? b.date : m), h), mo = monday(h);
    const c = kart({ id: 'karte-buch', cls: 'tf-bu-hub', farbe: 'mint', icon: 'i-list', titel: 'Trainingsbuch', sub: nf(L.length) + ' Einheiten seit ' + monatJahr(erst) + ' – jede mit Analyse' });
    const vier = [0, 1, 2, 3].map((k) => plus(mo, -7 * k)), L4 = L.filter((b) => b.date >= vier[3]);
    const alt = Z.sport; Z.sport = 'alle'; // die Übersicht zeigt immer alles
    const raster = el('div', { class: 'tf-bu-raster klein' }, el('div', { class: 'tf-bu-w tf-bu-kopf', 'aria-hidden': 'true' }, el('span'), ...['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((t) => el('span', { text: t })), el('span', { text: 'h' })), ...vier.map((m) => wochenZeile(m, L4, { still: true })));
    Z.sport = alt;
    const auf = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-bu-hub-auf' }, svgIco('i-list'), ' Alle Einheiten ansehen');
    c.append(raster, el('div', { class: 'tf-ei-akt' }, auf));
    c.addEventListener('click', () => T.geh('training/buch'));
    return c;
  }
  function zeige(o) { // von außen: z. B. „Alle Läufe im Trainingsbuch“
    if (o && o.sport && SPORTE.some((x) => x[0] === o.sport)) { Z.sport = o.sport; Z.ent = null; }
    Z.sort = 'neu'; Z.q = ''; Z.n = 4; merken();
    T.geh('training/buch');
  }
  T.seite('buch', render);
  { const b = $('#check-buch'); if (b) b.addEventListener('click', () => zeige({ sport: 'alle' })); } // Einheiten-Check → Trainingsbuch
  window.tfBuch = { render, hubKarte, zeige };
})();
