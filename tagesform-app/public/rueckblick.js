/* Tagesform · Rückblick (Version 10)
   Trend-Pfeile wie in Apple Health (letzte 4 Wochen gegen die Monate davor), die Seite „Deine Trends“ mit 30, 90 und
   365 Tagen, die Rückblicke-Kachel auf Heute (besondere Momente) und der Monats- und Jahresrückblick als ruhige Story.
   Die Rechnungen stehen in alltag-motor.js (trend, zeitraum, momente, bilanz). */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, nf, localDate, rowsOf, svgIco, hm } = T.ui;
  const A = () => dash.app;
  const M = () => window.tfAlltagMotor;
  const sicher = (fn) => { try { return fn(); } catch (e) { console.error(e); return null; } };
  const lsLesen = (k, std) => { try { const v = localStorage.getItem(k); return v == null ? std : JSON.parse(v); } catch (e) { return std; } };
  const lsSchreiben = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* egal */ } };
  const mmss = (s) => { s = Math.round(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const MEMO = new Map();
  function merk(key, teile, fn) { const m = MEMO.get(key); if (m && m.teile.every((x, i) => x === teile[i])) return m.r; const r = fn(); MEMO.set(key, { teile, r }); return r; }

  /* ---------- Datenreihen ---------- */
  function reihen() {
    const E = rowsOf('erholung') || [], TG = A().raw('garmin_tage') || [], EH = A().raw('garmin_einheiten') || [], K = M().katVon;
    return merk('reihen', [E, TG, EH, A().state.rechner], () => {
      const r = (L, f) => L.map((x) => ({ date: x.date, v: f(x) })).filter((x) => x.date && x.v != null && isFinite(x.v));
      const sport = EH.filter((e) => e && e.date && !e.is_parent && ['lauf', 'rad', 'schwimmen', 'kraft', 'mobil'].includes(K(e.type)) && (+e.moving_s || +e.dur_s) >= 300 && (+e.moving_s || +e.dur_s) < 16 * 3600);
      const einheiten = sport.map((e) => ({ date: e.date, min: Math.min(360, (+e.moving_s || +e.dur_s) / 60), km: (+e.dist_m || 0) / 1000, kat: K(e.type) }));
      // Gym und Pilates & Yoga aus der App, wenn die Uhr an dem Tag nichts Passendes aufgezeichnet hat
      const rc = A().state.rechner || {}, uhrKraft = new Set(einheiten.filter((e) => e.kat === 'kraft').map((e) => e.date)), uhrMobil = new Set(einheiten.filter((e) => e.kat === 'mobil').map((e) => e.date));
      ((rc.gym && rc.gym.log) || []).forEach((g) => { if (g && g.d && !uhrKraft.has(g.d)) einheiten.push({ date: g.d, min: Math.min(180, +g.min || 0), km: 0, kat: 'kraft' }); });
      ((rc.flow && rc.flow.log) || []).forEach((f) => { if (f && f.d && !uhrMobil.has(f.d)) einheiten.push({ date: f.d, min: Math.min(180, +f.min || 0), km: 0, kat: 'mobil' }); });
      return {
        puls: r(E, (x) => (+x.rhr > 0 ? +x.rhr : null)), hrv: r(E, (x) => (+x.hrv > 0 ? +x.hrv : null)), schlaf: r(E, (x) => (x.schlaf_h != null && +x.schlaf_h > 1 ? +x.schlaf_h : null)),
        tagesform: r(E, (x) => (x.score != null ? +x.score : null)), schritte: r(TG, (x) => (+x.steps > 0 ? +x.steps : null)), stress: r(TG, (x) => (+x.stress_avg > 0 ? +x.stress_avg : null)),
        tempo: sport.filter((e) => K(e.type) === 'lauf' && +e.dist_m >= 3000 && +e.moving_s > 0).map((e) => ({ date: e.date, v: +e.moving_s / (+e.dist_m / 1000) })).filter((x) => x.v > 150 && x.v < 900),
        rad: sport.filter((e) => K(e.type) === 'rad' && +e.np_w > 0 && +e.moving_s >= 1800).map((e) => ({ date: e.date, v: +e.np_w })),
        einheiten,
      };
    });
  }
  // [Kennung, Name, Format, gut = +1 höher besser / −1 niedriger besser, Mindestanzahl kurz/lang, Seite]
  const fmtWert = { bpm: (x) => nf(x) + ' bpm', ms: (x) => nf(x) + ' ms', h: (x) => hm(x) + ' h', n: (x) => nf(Math.round(x / 10) * 10), pace: (x) => mmss(x) + ' /km', w: (x) => nf(x) + ' W', pz: (x) => nf(x) };
  const TRENDS = [
    ['puls', 'Ruhepuls', 'bpm', -1, [10, 30], 'gesundheit/puls', 'i-heart', 'pink'],
    ['hrv', 'HRV', 'ms', 1, [10, 30], 'gesundheit/hrv', 'i-wave', 'purple'],
    ['schlaf', 'Schlafdauer', 'h', 1, [10, 30], 'gesundheit/schlaf', 'i-moon', 'indigo'],
    ['schritte', 'Schritte am Tag', 'n', 1, [10, 30], 'gesundheit/aktivitaet', 'i-steps', 'green'],
    ['tagesform', 'Tagesform', 'pz', 1, [10, 30], 'heute/tagesform', 'i-ring', 'blue'],
    ['tempo', 'Lauftempo', 'pace', -1, [3, 6], 'training/laufen', 'i-run', 'mint'],
    ['rad', 'Rad-Leistung (NP)', 'w', 1, [3, 6], 'training/rad', 'i-bike', 'orange'],
  ];
  function trends() {
    const R = reihen(), h = localDate();
    return merk('trends', [R, h], () => {
      const L = TRENDS.map(([id, name, f, gut, [minK, minL], ziel, icon, farbe]) => {
        const t = M().trend(R[id], h, { minK, minL }); if (!t) return null;
        return Object.assign(t, { id, name, f, gut, ziel, icon, farbe, besser: t.richtung === 0 ? null : t.richtung * gut > 0 });
      }).filter(Boolean);
      const k = kraftTrend(); if (k) L.push(k);
      return L;
    });
  }
  // Kraft: geschätztes Maximum der Grundübungen in den letzten 4 Wochen gegen die Einheiten davor (aus dem Gym-Verlauf)
  function kraftTrend() {
    const V = sicher(() => (window.tfGym && tfGym.verlauf ? tfGym.verlauf() : null)); if (!V || !V.v) return null;
    const h = localDate(), grenze = M().plus(h, -28), alt = M().plus(h, -182), anteile = [];
    Object.entries(V.v).forEach(([id, arr]) => {
      if (!Array.isArray(arr)) return;
      const P = []; for (let i = 0; i + 1 < arr.length; i += 2) P.push([arr[i], +arr[i + 1]]);
      const K = P.filter((x) => x[0] > grenze).map((x) => x[1]), L = P.filter((x) => x[0] <= grenze && x[0] > alt).map((x) => x[1]);
      if (K.length && L.length) anteile.push(Math.max(...K) / (L.reduce((a, b) => a + b, 0) / L.length) - 1);
    });
    if (!anteile.length) return null;
    const pct = (100 * anteile.reduce((a, b) => a + b, 0)) / anteile.length;
    return { id: 'kraft', name: 'Kraft', f: 'pct', gut: 1, ziel: 'training/gym', icon: 'i-dumbbell', farbe: 'purple', kurz: pct, lang: 0, diff: pct, pct, richtung: Math.abs(pct) < 2 ? 0 : Math.sign(pct), besser: Math.abs(pct) < 2 ? null : pct > 0, n: anteile.length };
  }
  const pfeil = (t) => { const s = el('span', { class: 'tf-trend ' + (t.richtung === 0 ? 'gleich' : t.besser ? 'gut' : 'schlecht') + (t.richtung < 0 ? ' runter' : t.richtung > 0 ? ' hoch' : ''), title: trendSatz(t) }, svgIco(t.richtung === 0 ? 'i-minus' : 'i-pfeil')); s.setAttribute('aria-label', trendSatz(t)); return s; };
  function trendSatz(t) {
    if (t.id === 'kraft') return t.richtung === 0 ? 'Kraft: stabil' : 'Kraft: ' + (t.pct > 0 ? '+' : '−') + nf(Math.abs(t.pct), 0) + ' % in den letzten 4 Wochen';
    const f = fmtWert[t.f] || ((x) => nf(x));
    if (t.richtung === 0) return t.name + ': stabil bei ' + f(t.kurz);
    const wort = t.id === 'tempo' ? (t.diff < 0 ? 'schneller' : 'langsamer') : t.diff > 0 ? (t.id === 'schlaf' ? 'länger' : 'höher') : t.id === 'schlaf' ? 'kürzer' : 'niedriger';
    if (t.f === 'pace') { const s = Math.round(Math.abs(t.diff)); return t.name + ': ' + wort + ' (' + f(t.kurz) + ', ' + (s < 60 ? s + ' s' : mmss(s) + ' min') + ' pro km)'; }
    const um = t.f === 'h' ? Math.round(Math.abs(t.diff) * 60) + ' min' : (fmtWert[t.f] || ((x) => nf(x)))(Math.abs(t.diff));
    return t.name + ': ' + wort + ' (' + f(t.kurz) + ', ' + um + ' Unterschied)';
  }

  /* ---------- Pfeile an den Werten (Gesundheitsbild, Laufen, Rad, Kraft) ---------- */
  const GB = { hrv: 'hrv', puls: 'puls', schlaf: 'schlaf', schritte: 'schritte' };
  function pfeileGesundheit() {
    const L = trends(), by = Object.fromEntries(L.map((t) => [t.id, t]));
    $$('#gesundheit-hub .tf-gb-w[data-w]').forEach((b) => {
      const t = by[GB[b.dataset.w]], v = b.querySelector('.tf-gb-v'); if (!v) return;
      const alt = v.querySelector('.tf-trend'); if (alt) alt.remove();
      if (t) v.appendChild(pfeil(t));
    });
  }

  /* ---------- Seite „Deine Trends“ ---------- */
  let SPANNE = 30;
  const SPANNEN = [[30, '30 Tage'], [90, '90 Tage'], [365, '365 Tage']];
  const ZR = [ // Zeitraum-Vergleich: [Kennung, Name, Format, gut, Satzteil]
    ['puls', 'Ruhepuls', 'bpm', -1, 'Dein Ruhepuls'], ['hrv', 'HRV', 'ms', 1, 'Deine HRV'], ['schlaf', 'Schlafdauer', 'h', 1, 'Du hast im Schnitt'],
    ['tagesform', 'Tagesform', 'pz', 1, 'Deine Tagesform'], ['schritte', 'Schritte', 'n', 1, 'Du bist im Schnitt'], ['stress', 'Stress laut Uhr', 'pz', -1, 'Dein Stress lag im Schnitt'],
  ];
  function zeitraumSatz(id, z, tage) {
    const f = fmtWert[ZR.find((x) => x[0] === id)[2]] || ((x) => nf(x)), vor = tage === 365 ? 'im Jahr davor' : 'in den ' + tage + ' Tagen davor';
    if (z.b == null) return 'Im Schnitt ' + f(z.a) + ' – zum Vergleich fehlen noch Daten ' + vor + '.';
    const d = Math.abs(z.diff);
    if (id === 'puls') return z.richtung === 0 ? 'Dein Ruhepuls ist stabil geblieben: ' + f(z.a) + '.' : 'Dein Ruhepuls ist im Vergleich ' + vor + ' um ' + nf(d, d < 10 ? 1 : 0) + (Math.round(d) === 1 ? ' Schlag ' : ' Schläge ') + (z.diff < 0 ? 'gesunken' : 'gestiegen') + ' – auf ' + f(z.a) + '.';
    if (id === 'schlaf') return z.richtung === 0 ? 'Du hast so lange geschlafen wie ' + vor + ': ' + f(z.a) + ' pro Nacht.' : 'Du hast pro Nacht ' + Math.round(d * 60) + ' Minuten ' + (z.diff > 0 ? 'länger' : 'kürzer') + ' geschlafen als ' + vor + ' (' + f(z.a) + ').';
    if (id === 'schritte') return z.richtung === 0 ? 'Etwa so viele Schritte wie ' + vor + ': ' + f(z.a) + ' am Tag.' : 'Du bist am Tag ' + nf(Math.round(d / 10) * 10) + ' Schritte ' + (z.diff > 0 ? 'mehr' : 'weniger') + ' gegangen als ' + vor + ' (' + f(z.a) + ').';
    const name = ZR.find((x) => x[0] === id)[4];
    return z.richtung === 0 ? name + ' blieb stabil bei ' + f(z.a) + '.' : name + ' war ' + (z.diff > 0 ? 'höher' : 'niedriger') + ' als ' + vor + ': ' + f(z.a) + ' statt ' + f(z.b) + '.';
  }
  // Beständigste Gewohnheit im Zeitraum: Anteil der Tage (Check-in, Trinkziel, Schrittziel, Schlaf ≥ 7 h, Training pro Woche)
  function bestaendig(tage) {
    const h = localDate(), von = M().plus(h, -tage + 1), R = reihen(), alle = [];
    const inZ = (d) => d >= von && d <= h;
    const ck = (A().raw('checkins') || []).filter((c) => c && inZ(c.date)).length;
    if (ck) alle.push(['Check-in am Morgen', ck / tage, 'an ' + ck + ' von ' + tage + ' Tagen']);
    const ziel = sicher(() => (window.tfGesund && tfGesund.schrittZiel ? tfGesund.schrittZiel() : null)) || 8000;
    const st = R.schritte.filter((x) => inZ(x.date)); if (st.length >= tage / 3) { const n = st.filter((x) => x.v >= ziel).length; alle.push(['Schrittziel geschafft', n / st.length, 'an ' + n + ' von ' + st.length + ' Tagen']); }
    const sl = R.schlaf.filter((x) => inZ(x.date)); if (sl.length >= tage / 3) { const n = sl.filter((x) => x.v >= 7).length; alle.push(['Mindestens 7 Stunden geschlafen', n / sl.length, 'in ' + n + ' von ' + sl.length + ' Nächten']); }
    const tb = (A().raw('tagebuch') || []).filter((x) => x && inZ(x.date));
    if (tb.length >= 5 && window.tfAlltag && tfAlltag.ziele) { const n = tb.filter((x) => (+x.w || 0) >= tfAlltag.ziele(x.date).w.ml).length; alle.push(['Trinkziel erreicht', n / tb.length, 'an ' + n + ' von ' + tb.length + ' notierten Tagen']); }
    const W = M().wochen(R.einheiten.filter((e) => inZ(e.date)).map((e) => ({ date: e.date, v: 1 }))), wN = Math.max(1, Math.floor(tage / 7));
    const aktiv = [...W.values()].filter((n) => n >= 2).length; if (wN >= 2) alle.push(['Mindestens 2 Einheiten pro Woche', Math.min(1, aktiv / wN), 'in ' + aktiv + ' von ' + wN + ' Wochen']);
    return alle.filter((x) => x[1] >= 0.5).sort((a, b) => b[1] - a[1])[0] || null;
  }
  // Version 11: ab wann ein Vergleich möglich ist – sobald genug Werte älter als der Zeitraum sind (gleiche Mindestzahl wie zeitraum())
  function vergleichAb(werte, h, tage) {
    const min = Math.max(3, Math.round(tage / 6)), V = (werte || []).filter((x) => x && x.date > M().plus(h, -2 * tage) && x.date <= h).map((x) => x.date).sort();
    if (V.length < min) return '';
    const d = M().plus(V[min - 1], tage); if (d <= h) return '';
    return 'Vergleich ab ' + (+d.slice(8, 10)) + '. ' + M().MONATE[+d.slice(5, 7) - 1] + (d.slice(0, 4) !== h.slice(0, 4) ? ' ' + d.slice(0, 4) : ''); // der Zeitraum steht schon in der Überschrift
  }
  // Version 11: Fortschritt bis zu den ersten Trend-Pfeilen (10 Nächte aus den letzten 4 Wochen, 30 aus den Monaten davor)
  function trendFortschritt(R, h) {
    if (T.ohne() || !S.fortschritt) return el('p', { class: 'tf-note', text: 'Trend-Pfeile entstehen aus den Nächten deiner Uhr – mit Garmin kommen Schlaf, HRV und Ruhepuls automatisch dazu.' });
    const st = ['hrv', 'puls', 'schlaf'].map((id) => {
      const V = (R[id] || []).filter((x) => x.date <= h), k = V.filter((x) => x.date > M().plus(h, -28)).length, l = V.filter((x) => x.date <= M().plus(h, -28) && x.date > M().plus(h, -182)).length;
      return Math.min(k, 10) + Math.min(l, 30);
    }), ist = Math.max(0, ...st);
    return S.fortschritt({ ist, soll: 40, text: S.noch(40 - ist, 'Nacht', 'Nächte') + ' mit Uhr, bis deine ersten Trend-Pfeile erscheinen.', sub: nf(ist) + ' von 40 Nächten · 10 aus den letzten 4 Wochen, 30 aus den Monaten davor' });
  }
  function renderTrends() {
    const box = $('#trends-box'); if (!box) return;
    const R = reihen(), h = localDate(), frag = [];
    const sg = el('div', { class: 'tf-seg tf-tr-spanne', role: 'group', 'aria-label': 'Zeitraum' });
    SPANNEN.forEach(([t, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(t === SPANNE) }, n); b.addEventListener('click', () => { SPANNE = t; renderTrends(); }); sg.appendChild(b); });
    frag.push(el('div', { class: 'tf-filter' }, sg));
    // Zusammenfassung des Zeitraums
    const zeilen = [];
    const E = R.einheiten.filter((e) => e.date > M().plus(h, -SPANNE)), E0 = R.einheiten.filter((e) => e.date <= M().plus(h, -SPANNE) && e.date > M().plus(h, -2 * SPANNE));
    if (E.length || E0.length) {
      const minA = E.reduce((s, e) => s + e.min, 0), minB = E0.reduce((s, e) => s + e.min, 0);
      const stunden = (m) => (m >= 6000 ? nf(Math.round(m / 60)) : hm(m / 60)) + ' h'; // ab 100 Stunden ganze Stunden
      zeilen.push(['i-flame', 'orange', 'Training', E.length + (E.length === 1 ? ' Einheit' : ' Einheiten') + ' · ' + stunden(minA), E0.length ? (minA > minB * 1.05 ? 'Mehr als ' : minA < minB * 0.95 ? 'Weniger als ' : 'Etwa so viel wie ') + (SPANNE === 365 ? 'im Jahr davor' : 'in den ' + SPANNE + ' Tagen davor') + ' (' + E0.length + (E0.length === 1 ? ' Einheit, ' : ' Einheiten, ') + stunden(minB) + ').' : '', !E0.length ? null : minA > minB * 1.05 ? 1 : minA < minB * 0.95 ? -1 : 0, 1]);
    }
    ZR.forEach(([id, name, f, gut]) => {
      const z = M().zeitraum(R[id], h, SPANNE); if (!z) return;
      const t = TRENDS.find((x) => x[0] === id) || [];
      zeilen.push([t[6] || 'i-wave', t[7] || 'blue', name, (fmtWert[f] || ((x) => nf(x)))(z.a), z.b == null ? vergleichAb(R[id], h, SPANNE) : zeitraumSatz(id, z, SPANNE), z.b == null ? null : z.richtung || 0, gut]);
    });
    if (zeilen.length) {
      const L = el('div', { class: 'tf-links tf-tr-liste' });
      zeilen.forEach(([icon, farbe, name, wert, satz, richtung, gut]) => {
        const zustand = !richtung ? 'gleich' : richtung * gut > 0 ? 'gut' : 'schlecht';
        const pf = richtung == null ? null : el('span', { class: 'tf-trend ' + zustand + (richtung < 0 ? ' runter' : richtung > 0 ? ' hoch' : '') }, svgIco(richtung ? 'i-pfeil' : 'i-minus'));
        L.appendChild(el('div', { class: 'tf-zeile tf-tr-z' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + farbe + ')' }, svgIco(icon)),
          el('span', { class: 'tf-zeile-t' }, el('b', null, name + ' ', el('span', { class: 'tf-tr-wert num', text: wert }), pf), satz ? el('small', { class: 'tf-tr-satz', text: satz }) : null)));
      });
      const ohneVergleich = zeilen.filter((z) => z[5] == null).length;
      frag.push(el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Die letzten ' + (SPANNE === 365 ? '365 Tage' : SPANNE + ' Tage'), el('small', { text: ohneVergleich === zeilen.length ? 'Dein Schnitt – zum Vergleich fehlen noch Daten ' + (SPANNE === 365 ? 'aus dem Jahr davor' : 'aus den ' + SPANNE + ' Tagen davor') : 'Gegen ' + (SPANNE === 365 ? 'das Jahr davor' : 'die ' + SPANNE + ' Tage davor') + (ohneVergleich ? ' · ohne Pfeil: noch zu wenige Daten davor' : '') })), L);
    } else frag.push(el('p', { class: 'tf-empty', text: T.ohne() ? 'Noch keine Daten für diesen Zeitraum. Sobald du Einheiten im Gym oder bei Pilates & Yoga speicherst, füllt sich dein Rückblick.' : 'Noch keine Daten für diesen Zeitraum. Mit jeder Nacht und jeder Einheit von deiner Uhr füllt sich dein Rückblick.' }));
    const g = bestaendig(SPANNE);
    if (g) frag.push(el('article', { class: 'tf-card tf-tr-gewohnheit' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-pink)' }, svgIco('i-star')), el('div', null, el('small', { text: 'Deine beständigste Gewohnheit' }), el('b', { text: g[0] }), el('p', { text: g[2] + ' – ' + Math.round(g[1] * 100) + ' %.' }))));
    // Trend-Pfeile: 4 Wochen gegen das Halbjahr
    const TL = trends();
    if (TL.length) {
      const L = el('div', { class: 'tf-links tf-tr-liste' });
      TL.forEach((t) => {
        const b = el('button', { type: 'button', class: 'tf-zeile tf-tr-z' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + t.farbe + ')' }, svgIco(t.icon)),
          el('span', { class: 'tf-zeile-t' }, el('b', null, t.name + ' ', pfeil(t)), el('small', { class: 'tf-tr-satz', text: trendLang(t) })), svgIco('i-chev'));
        b.lastChild.classList.add('tf-chev');
        b.addEventListener('click', () => T.geh(t.ziel));
        L.appendChild(b);
      });
      frag.push(el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Trend', el('small', { text: 'Letzte 4 Wochen gegen die Monate davor' })), L);
    } else frag.push(el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Trend', el('small', { text: 'Letzte 4 Wochen gegen die Monate davor' })), trendFortschritt(R, h));
    frag.push(el('p', { class: 'tf-note', text: 'Ein Pfeil erscheint erst, wenn sich ein Wert stärker verändert als sein übliches Auf und Ab – so bleibt es ruhig und ohne täglichen Alarm. Grün heißt: in die gute Richtung.' }));
    const story = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-karten'), ' Monatsrückblick ansehen');
    story.addEventListener('click', () => storyOeffnen(vormonat(h)));
    const jahr = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Jahresrückblick ' + h.slice(0, 4));
    jahr.addEventListener('click', () => storyOeffnen(h.slice(0, 4)));
    frag.push(el('div', { class: 'tf-form-actions' }, story, jahr));
    box.replaceChildren(el('div', { class: 'tf-hub' }, ...frag));
  }
  function trendLang(t) {
    if (t.id === 'kraft') return t.richtung === 0 ? 'Deine Kraftwerte sind stabil.' : 'Deine Grundübungen sind im Schnitt ' + nf(Math.abs(t.pct), 0) + ' % ' + (t.pct > 0 ? 'stärker' : 'schwächer') + ' als in den Einheiten davor.';
    const f = fmtWert[t.f] || ((x) => nf(x));
    if (t.richtung === 0) return 'Stabil: ' + f(t.kurz) + ' – wie in den Monaten davor.';
    if (t.id === 'tempo') return (t.diff < 0 ? 'Schneller' : 'Langsamer') + ': ' + f(t.kurz) + ' statt ' + f(t.lang) + '.';
    return (t.diff > 0 ? 'Höher' : 'Niedriger') + ': ' + f(t.kurz) + ' statt ' + f(t.lang) + ' (' + (t.pct > 0 ? '+' : '−') + nf(Math.abs(t.pct), 0) + ' %).';
  }
  function kurz() { // für die Kachel im Gesundheit-Hub
    const L = trends().filter((t) => t.richtung !== 0);
    if (!L.length) return trends().length ? { wert: 'Alles stabil', txt: true, sub: 'Letzte 4 Wochen gegen die Monate davor' } : null;
    const g = L.filter((t) => t.besser).length;
    return { wert: L.length + (L.length === 1 ? ' Trend' : ' Trends'), sub: g + ' in die gute Richtung · ' + L.slice(0, 2).map((t) => t.name).join(', ') };
  }

  /* ---------- Rückblicke-Kachel auf Heute ---------- */
  function heuteRueckblick() {
    const box = $('#home-rueckblick'); if (!box) return;
    const R = reihen(), h = localDate();
    const L = sicher(() => M().momente({ heute: h, einheiten: R.einheiten, tagesform: R.tagesform, schritte: R.schritte })) || [];
    const weg = lsLesen('tf:rueckblick-weg', []);
    const m = L.find((x) => !weg.includes(x.id));
    if (!m) { box.replaceChildren(); return; }
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Ausblenden' }, svgIco('i-x'));
    x.addEventListener('click', () => { lsSchreiben('tf:rueckblick-weg', weg.concat([m.id]).slice(-40)); heuteRueckblick(); });
    const kids = [el('span', { class: 'tf-badge', style: '--c:var(--tf-' + m.farbe + ')' }, svgIco(m.icon)), el('div', null, el('small', { class: 'tf-rb-k', text: 'Rückblick' }), el('b', { text: m.titel }), el('p', { text: m.text }))];
    if (m.story) { const s = el('button', { type: 'button', class: 'tf-btn tf-btn-klein tf-btn-primary' }, svgIco('i-karten'), ' Ansehen'); s.addEventListener('click', () => storyOeffnen(m.story)); kids[1].appendChild(el('div', { class: 'tf-form-actions' }, s)); }
    box.replaceChildren(el('article', { class: 'tf-card tf-hinweis tf-rb' }, ...kids, x));
  }

  /* ---------- Monats- und Jahresrückblick als Story ---------- */
  const vormonat = (h) => { const d = new Date(Date.parse(h.slice(0, 7) + '-01T00:00:00Z')); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
  function zeitVon(k) { // '2026-10' → Monat · '2026' → Jahr
    if (/^\d{4}$/.test(k)) return { von: k + '-01-01', bis: k + '-12-31', name: 'Dein Jahr ' + k, kurz: k, jahr: true };
    const [y, m] = k.split('-').map(Number), bis = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    return { von: k + '-01', bis, name: 'Dein ' + M().MONATE[m - 1], kurz: M().MONATE[m - 1] + ' ' + y, jahr: false };
  }
  function storyKarten(k) {
    const Z = zeitVon(k), R = reihen(), h = localDate(), bis = Z.bis < h ? Z.bis : h;
    const SP = sicher(() => (window.tfSpiel && tfSpiel.stand ? tfSpiel.stand() : null));
    const monate = SP && SP.monate ? Object.entries(SP.monate).filter(([m]) => m >= Z.von.slice(0, 7) && m <= bis.slice(0, 7)) : [];
    const quests = monate.length ? monate.reduce((s, [, v]) => s + (+v.q || 0), 0) : null, xp = monate.length ? monate.reduce((s, [, v]) => s + (+v.x || 0), 0) : null;
    const V = sicher(() => (window.tfGym && tfGym.verlauf ? tfGym.verlauf() : null)), kraft = [];
    if (V && V.v) Object.entries(V.v).forEach(([id, arr]) => {
      const P = []; for (let i = 0; i + 1 < arr.length; i += 2) P.push([arr[i], +arr[i + 1]]);
      const vor = P.filter((x) => x[0] < Z.von), drin = P.filter((x) => x[0] >= Z.von && x[0] <= bis);
      if (drin.length && (vor.length || drin.length >= 2)) kraft.push({ name: V.namen[id] || id, vorher: vor.length ? vor[vor.length - 1][1] : drin[0][1], nachher: Math.max(...drin.map((x) => x[1])) });
    });
    const B = M().bilanz({ von: Z.von, bis, einheiten: R.einheiten, tagesform: R.tagesform, schritte: R.schritte, hrv: R.hrv, rhr: R.puls, quests, kraft });
    const KATN = { lauf: ['Lauf', 'Läufe'], rad: ['Radeinheit', 'Radeinheiten'], schwimmen: ['Schwimmeinheit', 'Schwimmeinheiten'], kraft: ['Krafteinheit', 'Krafteinheiten'], mobil: ['Einheit Pilates & Yoga', 'Einheiten Pilates & Yoga'] };
    const kw = (m) => +m.slice(8, 10) + '.' + +m.slice(5, 7) + '.';
    const K = [];
    K.push({ farbe: 'blue', icon: 'i-karten', klein: Z.kurz, gross: nf(B.einheiten), titel: B.einheiten === 1 ? 'Einheit' : 'Einheiten', text: B.einheiten ? (B.minuten >= 6000 ? nf(Math.round(B.minuten / 60)) : hm(B.minuten / 60)) + ' h Training' + (B.km ? ' · ' + nf(B.km) + ' km' : '') + '.' : 'In diesem Zeitraum gibt es noch keine Einheiten.', fakten: Object.entries(B.je).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([kat, n]) => ['i-check', n + ' ' + (KATN[kat] ? KATN[kat][n === 1 ? 0 : 1] : kat)]) });
    if (B.staerksteWoche) K.push({ farbe: 'orange', icon: 'i-flame', klein: 'Deine stärkste Woche', gross: hm(B.staerksteWoche.min / 60) + ' h', titel: 'Woche ab ' + kw(B.staerksteWoche.montag), text: 'So viel hast du in keiner anderen Woche ' + (Z.jahr ? 'des Jahres' : 'des Monats') + ' trainiert.', fakten: [] });
    if (B.kraft.length) K.push({ farbe: 'purple', icon: 'i-dumbbell', klein: 'Stärker geworden', gross: '+' + nf(100 * (B.kraft[0].nachher / B.kraft[0].vorher - 1), 0) + ' %', titel: B.kraft[0].name, text: 'Geschätztes Maximum aus deinen Sätzen.', fakten: B.kraft.slice(1).map((x) => ['i-dumbbell', x.name + ': +' + nf(100 * (x.nachher / x.vorher - 1), 0) + ' %']) });
    if (B.erholteWoche || B.tagesform != null) K.push({ farbe: 'indigo', icon: 'i-moon', klein: 'Erholung', gross: B.tagesform != null ? nf(B.tagesform) : '–', titel: 'Tagesform im Schnitt', text: B.erholteWoche ? 'Am erholtesten warst du in der Woche ab ' + kw(B.erholteWoche.montag) + ' (Ø ' + B.erholteWoche.wert + ').' : '', fakten: [B.hrv != null ? ['i-wave', 'HRV im Schnitt ' + nf(B.hrv) + ' ms'] : null, B.rhr != null ? ['i-heart', 'Ruhepuls im Schnitt ' + nf(B.rhr, 1) + ' bpm'] : null].filter(Boolean) });
    if (B.schritte) K.push({ farbe: 'green', icon: 'i-steps', klein: 'Bewegung im Alltag', gross: nf(B.schritte), titel: 'Schritte', text: 'Im Schnitt ' + nf(Math.round(B.schritteTag / 10) * 10) + ' am Tag.', fakten: [] });
    if (quests != null) K.push({ farbe: 'pink', icon: 'i-star', klein: 'Quests & XP', gross: nf(quests), titel: quests === 1 ? 'Quest geschafft' : 'Quests geschafft', text: xp ? nf(xp) + ' XP gesammelt.' : '', fakten: [] });
    K.push({ farbe: 'blue', icon: 'i-spark', klein: 'Wie weit du gekommen bist', gross: '✓', titel: Z.jahr ? 'Danke für dieses Jahr' : 'Weiter so', text: 'Fortschritt entsteht aus vielen ruhigen, regelmäßigen Tagen – nicht aus einzelnen Heldentaten.', fakten: [] });
    return { Z, K };
  }
  function storyOeffnen(k) {
    const { Z, K } = storyKarten(k);
    let i = 0;
    const fort = el('div', { class: 'tf-mk-fort', 'aria-hidden': 'true', style: 'grid-template-columns:repeat(' + K.length + ',minmax(0,1fr))' }, ...K.map(() => el('i')));
    const buehne = el('div', { class: 'tf-mk-buehne', 'aria-live': 'polite' });
    const zur = el('button', { type: 'button', class: 'tf-btn' }, 'Zurück'), vor = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Weiter');
    const karte = (x) => el('div', { class: 'tf-mk-karte', style: '--c:var(--tf-' + x.farbe + ')' },
      el('div', { class: 'tf-mk-kopf' }, el('span', { class: 'tf-mk-i' }, svgIco(x.icon)), el('small', { text: x.klein })),
      el('b', { class: 'tf-mk-gross num', text: x.gross }), el('h3', { text: x.titel }), x.text ? el('p', { text: x.text }) : null,
      x.fakten.length ? el('ul', { class: 'tf-tag-tipps tf-mk-fakten' }, ...x.fakten.map(([ic, t]) => el('li', null, svgIco(ic), el('span', { text: t })))) : null);
    const zeig = () => { [...fort.children].forEach((x, j) => { x.className = j < i ? 'fertig' : j === i ? 'an' : ''; }); buehne.replaceChildren(karte(K[i])); zur.disabled = i === 0; vor.textContent = i === K.length - 1 ? 'Fertig' : 'Weiter'; };
    const geh = (d) => { if (i + d < 0) return; if (i + d >= K.length) { tfWissen.schliessen(); return; } i += d; zeig(); };
    zur.addEventListener('click', () => geh(-1)); vor.addEventListener('click', () => geh(1));
    buehne.addEventListener('click', (e) => { if (e.target.closest('button')) return; const r = buehne.getBoundingClientRect(); geh(e.clientX - r.left < r.width * 0.35 ? -1 : 1); });
    const box = el('div', { class: 'tf-mk tf-story', tabindex: '-1' }, el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: Z.name }), fort, buehne, el('div', { class: 'tf-mk-akt' }, zur, vor));
    box.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); geh(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); geh(-1); } });
    zeig();
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  /* ---------- Sportseiten: schwarzes Band mit den letzten 7 Tagen (Version 11, der Look der Mitzieher-Fotos ohne Fotos) ---------- */
  const BAND = {
    laufen: ['lauf', 'Laufen', 'i-run', 'km', ['Lauf', 'Läufe'], 'training/laufen'], rad: ['rad', 'Rad', 'i-bike', 'km', ['Ausfahrt', 'Ausfahrten'], 'training/rad'],
    schwimmen: ['schwimmen', 'Schwimmen', 'i-swim', 'm', ['Einheit', 'Einheiten'], 'training/schwimmen'],
    gym: ['kraft', 'Gym', 'i-dumbbell', 'h', ['Einheit', 'Einheiten'], 'training/gym'], flow: ['mobil', 'Pilates & Yoga', 'i-lotus', 'h', ['Einheit', 'Einheiten'], 'training/flow'],
  };
  function band(seite) {
    const sec = document.getElementById(seite); if (!sec) return;
    const alt = sec.querySelector(':scope > .tf-sband');
    const [kat, name, icon, art, wort, route] = BAND[seite];
    if ((T.route && T.route() !== route) || (T.ohne && T.ohne() && art !== 'h')) { if (alt) alt.remove(); return; } // nur auf der Übersicht; Ausdauer braucht die Uhr
    const h = localDate(), von = M().plus(h, -6);
    const E = reihen().einheiten.filter((e) => e.kat === kat && e.date >= von && e.date <= h);
    const min = E.reduce((x, e) => x + e.min, 0), km = E.reduce((x, e) => x + e.km, 0);
    const wert = art === 'km' ? nf(km, km < 100 ? 1 : 0) : art === 'm' ? nf(Math.round((km * 1000) / 50) * 50) : hm(min / 60);
    const sub = E.length ? E.length + ' ' + wort[E.length === 1 ? 0 : 1] + (art === 'h' ? '' : ' · ' + hm(min / 60) + ' h') : 'In den letzten 7 Tagen noch nichts – der erste Schritt zählt.';
    const neu = el('div', { class: 'tf-sband tf-buehne', role: 'group', 'aria-label': name + ', letzte 7 Tage: ' + wert + ' ' + art + '. ' + sub },
      el('div', { class: 'tf-sband-k' }, svgIco(icon), el('span', { text: name + ' · letzte 7 Tage' })),
      el('div', { class: 'tf-sband-w tf-spur num' }, wert, el('span', { class: 'tf-u', text: art })),
      el('div', { class: 'tf-sband-s', text: sub }));
    if (alt) alt.replaceWith(neu); else sec.prepend(neu);
  }
  Object.keys(BAND).forEach((s2) => T.zusatz(s2, () => sicher(() => band(s2))));

  /* ---------- Version 12: „Letzte 14 Tage“ – ein Punkt je Tag (voll = mindestens 10 Minuten Bewegung), heute in Pink ---------- */
  const TAGNAME = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  function vierzehn() {
    const box = document.getElementById('home-14'); if (!box) return;
    const R = sicher(() => reihen()); if (!R) { box.replaceChildren(); return; }
    const h = localDate(), min = new Map();
    R.einheiten.forEach((e) => min.set(e.date, (min.get(e.date) || 0) + e.min));
    const P = []; for (let i = 13; i >= 0; i--) { const d = M().plus(h, -i); P.push([d, (min.get(d) || 0) >= 10]); }
    const n = P.filter((x) => x[1]).length;
    box.replaceChildren(el('span', { class: 'tf-augenbraue', text: 'Letzte 14 Tage' }),
      el('span', { class: 'tf-14-p', role: 'img', 'aria-label': n + ' von 14 Tagen mit Training' }, ...P.map(([d, an], i) => el('i', { class: [an ? 'an' : '', d === h ? 'heute' : '', i === 7 ? 'neu' : ''].join(' ').trim() || null, title: TAGNAME.format(new Date(d + 'T12:00:00Z')) + (an ? ' · trainiert' : ' · frei') }))),
      el('small', { class: 'num', text: n + ' von 14' }));
  }
  T.zusatz('heute', vierzehn);
  T.seite('trends', renderTrends);
  T.zusatz('gesundheit-hub', pfeileGesundheit);
  T.zusatz('heute', heuteRueckblick);
  window.tfRueckblick = { trends, kurz, storyOeffnen, reihen, pfeil, trendSatz };
})();
