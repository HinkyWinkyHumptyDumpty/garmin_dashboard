/* Dreiklang · Rückblick (Version 10, Trends erweitert in Version 42 aus V36–V39)
   Trend-Pfeile wie in Apple Health (letzte 4 Wochen gegen die Monate davor), die Seite „Deine Trends“ mit 4, 12 und
   52 Wochen, Training je Sportart, Umfang neben Leistungsindikatoren (Median, mindestens 3 passende Einheiten je Zeitraum),
   Vergleichbarkeit nach Aktivitätstyp (Straße, Trail, Laufband …; Pool und Freiwasser getrennt) und Monatsmediane über
   12 Monate. Dazu die Rückblicke-Kachel auf Heute und der Monats- und Jahresrückblick als ruhige Story.
   Die Rechnungen stehen in alltag-motor.js (trend, zeitraum, momente, bilanz, median). */
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
        schwimmtempo: sport.filter((e) => K(e.type) === 'schwimmen' && +e.dist_m >= 200 && +e.moving_s > 0).map((e) => ({ date: e.date, v: +e.moving_s / (+e.dist_m / 100) })).filter((x) => x.v > 45 && x.v < 300),
        // V38: Rohkategorien erhalten, damit z. B. Laufband und Trail nicht als identische Tempowerte verglichen werden.
        laufDetails: sport.filter((e) => K(e.type) === 'lauf').map((e) => ({
          date: e.date, typ: e.type || 'unknown', dist: +e.dist_m || 0, sek: +e.moving_s || +e.dur_s || 0,
          pace: (+e.dist_m > 0 && (+e.moving_s || +e.dur_s) > 0) ? (+e.moving_s || +e.dur_s) / (+e.dist_m / 1000) : null,
        })),
        schwimmDetails: sport.filter((e) => K(e.type) === 'schwimmen').map((e) => ({
          date: e.date, typ: e.type || 'unknown', pool: +e.pool_m || 0, dist: +e.dist_m || 0,
          sek: +e.moving_s || +e.dur_s || 0,
          pace: (+e.dist_m > 0 && (+e.moving_s || +e.dur_s) > 0) ? (+e.moving_s || +e.dur_s) / (+e.dist_m / 100) : null,
        })),
        radDetails: sport.filter((e) => K(e.type) === 'rad').map((e) => ({
          date: e.date, np: +e.np_w || 0, if: +e.garmin_if || 0, sek: +e.moving_s || +e.dur_s || 0,
        })),
        einheiten,
      };
    });
  }
  // [Kennung, Name, Format, gut = +1 höher besser / −1 niedriger besser, Mindestanzahl kurz/lang, Seite]
  const fmtWert = { bpm: (x) => nf(x) + ' bpm', ms: (x) => nf(x) + ' ms', h: (x) => hm(x) + ' h', n: (x) => nf(Math.round(x / 10) * 10), pace: (x) => mmss(x) + ' /km', pace100: (x) => mmss(x) + ' /100 m', w: (x) => nf(x) + ' W', pz: (x) => nf(x) };
  const TRENDS = [
    ['puls', 'Ruhepuls', 'bpm', -1, [10, 30], 'gesundheit/puls', 'i-heart', 'pink'],
    ['hrv', 'HRV', 'ms', 1, [10, 30], 'gesundheit/hrv', 'i-wave', 'purple'],
    ['schlaf', 'Schlafdauer', 'h', 1, [10, 30], 'gesundheit/schlaf', 'i-moon', 'indigo'],
    ['schritte', 'Schritte am Tag', 'n', 1, [10, 30], 'gesundheit/aktivitaet', 'i-steps', 'green'],
    ['tagesform', 'Tune', 'pz', 1, [10, 30], 'heute/tagesform', 'i-ring', 'blue'],
    ['tempo', 'Lauftempo', 'pace', -1, [3, 6], 'training/laufen', 'i-run', 'mint'],
    ['rad', 'Rad-Leistung (NP)', 'w', 1, [3, 6], 'training/rad', 'i-bike', 'orange'],
    ['schwimmtempo', 'Schwimmtempo', 'pace100', -1, [3, 6], 'training/schwimmen', 'i-wave', 'blue'],
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
    if (t.f === 'pace' || t.f === 'pace100') { const s = Math.round(Math.abs(t.diff)); return t.name + ': ' + wort + ' (' + f(t.kurz) + ', ' + (s < 60 ? s + ' s' : mmss(s) + ' min') + (t.f === 'pace100' ? ' pro 100 m)' : ' pro km)'); }
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
  let SPANNE = 28;
  const SPANNEN = [[28, '4 Wochen'], [84, '12 Wochen'], [364, '52 Wochen']];
  const ZR = [ // Zeitraum-Vergleich: [Kennung, Name, Format, gut, Satzteil]
    ['puls', 'Ruhepuls', 'bpm', -1, 'Dein Ruhepuls'], ['hrv', 'HRV', 'ms', 1, 'Deine HRV'], ['schlaf', 'Schlafdauer', 'h', 1, 'Du hast im Schnitt'],
    ['tagesform', 'Tune', 'pz', 1, 'Dein Tune'], ['schritte', 'Schritte', 'n', 1, 'Du bist im Schnitt'], ['stress', 'Stress laut Uhr', 'pz', -1, 'Dein Stress lag im Schnitt'],
  ];
  function zeitraumSatz(id, z, tage) {
    const f = fmtWert[ZR.find((x) => x[0] === id)[2]] || ((x) => nf(x)), vor = tage === 364 ? 'im Jahr davor' : 'in den ' + (tage / 7) + ' Wochen davor';
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
      zeilen.push(['i-flame', 'orange', 'Training', E.length + (E.length === 1 ? ' Einheit' : ' Einheiten') + ' · ' + stunden(minA), E0.length ? (minA > minB * 1.05 ? 'Mehr als ' : minA < minB * 0.95 ? 'Weniger als ' : 'Etwa so viel wie ') + (SPANNE === 364 ? 'im Jahr davor' : 'in den ' + (SPANNE / 7) + ' Wochen davor') + ' (' + E0.length + (E0.length === 1 ? ' Einheit, ' : ' Einheiten, ') + stunden(minB) + ').' : '', !E0.length ? null : minA > minB * 1.05 ? 1 : minA < minB * 0.95 ? -1 : 0, 1]);
    }
    // V36: Trainingsumfang getrennt nach Sportart – verhindert, dass mehr Radtraining einen Rückgang beim Laufen verdeckt.
    const sportarten = [['lauf', 'Laufen', 'i-run'], ['rad', 'Rad', 'i-bike'], ['schwimmen', 'Schwimmen', 'i-wave']];
    const sportZeilen = [];
    sportarten.forEach(([kat, name, icon]) => {
      const a = E.filter((e) => e.kat === kat), b = E0.filter((e) => e.kat === kat);
      if (!a.length && !b.length) return;
      const minA = a.reduce((v, e) => v + e.min, 0), minB = b.reduce((v, e) => v + e.min, 0);
      const kmA = a.reduce((v, e) => v + (+e.km || 0), 0);
      const delta = minB > 0 ? Math.round((minA / minB - 1) * 100) : null;
      const zeit = (m) => hm(m / 60) + ' h';
      const detail = a.length + (a.length === 1 ? ' Einheit' : ' Einheiten') + ' · ' + zeit(minA) + (kmA > 0 ? ' · ' + nf(kmA, kmA < 10 ? 1 : 0) + ' km' : '');
      const vergleich = minB > 0 ? (delta > 5 ? 'Mehr' : delta < -5 ? 'Weniger' : 'Etwa gleich viel') + ' Trainingszeit als im vorherigen Zeitraum (' + (delta > 0 ? '+' : '') + delta + ' %)' : 'Für den vorherigen Zeitraum fehlen Vergleichsdaten';
      sportZeilen.push(el('div', { class: 'tf-tr-sport-zeile' },
        el('span', { class: 'tf-tr-sport-ico' }, svgIco(icon)),
        el('span', { class: 'tf-tr-sport-text' }, el('b', { text: name }), el('small', { text: detail }), el('small', { text: vergleich }))));
    });
    if (sportZeilen.length) frag.push(
      el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Training nach Sportart', el('small', { text: 'Umfang getrennt vergleichen · gleiche Zeiträume' })),
      el('div', { class: 'tf-tr-sport' }, ...sportZeilen),
      el('p', { class: 'tf-note', text: 'Trainingszeit und Distanz beschreiben den Umfang, nicht automatisch die Leistungsfähigkeit. Rad-, Lauf- und Schwimmkilometer sind nicht direkt miteinander vergleichbar.' })
    );
    // V37: Trainingsumfang den sportartspezifischen Leistungsindikatoren gegenüberstellen.
    // Median statt Mittelwert reduziert den Einfluss einzelner Ausreißer; Mindeststichprobe 3 pro Zeitraum.
    const von28 = M().plus(h, -28), von56 = M().plus(h, -56);
    const leistungsProfile = [
      { kat: 'lauf', name: 'Laufen', werte: R.tempo, format: (v) => mmss(v) + ' /km', besser: -1, indikator: 'Medianes Tempo bei Läufen ab 3 km' },
      { kat: 'rad', name: 'Rad', werte: R.rad, format: (v) => nf(Math.round(v)) + ' W NP', besser: 1, indikator: 'Median der normalisierten Leistung bei Fahrten ab 30 min' },
      { kat: 'schwimmen', name: 'Schwimmen', werte: R.schwimmtempo, format: (v) => mmss(v) + ' /100 m', besser: -1, indikator: 'Medianes Schwimmtempo ab 200 m' },
    ];
    const leistungsKarten = [];
    leistungsProfile.forEach((q) => {
      const einA = R.einheiten.filter((e) => e.kat === q.kat && e.date > von28 && e.date <= h);
      const einB = R.einheiten.filter((e) => e.kat === q.kat && e.date > von56 && e.date <= von28);
      if (!einA.length && !einB.length) return;
      const minA = einA.reduce((a, e) => a + (+e.min || 0), 0), minB = einB.reduce((a, e) => a + (+e.min || 0), 0);
      const pctUmfang = minB > 0 ? Math.round((minA / minB - 1) * 100) : null;
      const aktuelle = (q.werte || []).filter((x) => x.date > von28 && x.date <= h).map((x) => +x.v).filter((x) => x > 0 && isFinite(x));
      const vorherige = (q.werte || []).filter((x) => x.date > von56 && x.date <= von28).map((x) => +x.v).filter((x) => x > 0 && isFinite(x));
      let leistungText = 'Noch keine ausreichende Vergleichsbasis';
      let leistungDetail = 'Mindestens 3 passende Einheiten in beiden 28-Tage-Zeiträumen erforderlich.';
      let leistungKlasse = 'tf-tr-leistung-offen';
      if (aktuelle.length >= 3 && vorherige.length >= 3) {
        const med = (xs) => M().median(xs);
        const a = med(aktuelle), b = med(vorherige), besserPct = 100 * ((q.besser < 0 ? b - a : a - b) / b);
        const abs = Math.abs(besserPct);
        leistungText = abs < 1.5 ? 'Im Vergleich kaum verändert' : besserPct > 0 ? 'Indikator in günstigere Richtung' : 'Indikator in ungünstigere Richtung';
        leistungKlasse = abs < 1.5 ? 'tf-tr-leistung-neutral' : besserPct > 0 ? 'tf-tr-leistung-positiv' : 'tf-tr-leistung-negativ';
        leistungDetail = q.format(a) + ' gegenüber ' + q.format(b) + ' (' + (besserPct > 0 ? '+' : '') + nf(besserPct, 1) + ' %; n=' + aktuelle.length + '/' + vorherige.length + ').';
      } else {
        leistungDetail = 'Passende Einheiten: ' + aktuelle.length + ' aktuell, ' + vorherige.length + ' davor. Für einen vorsichtigen Vergleich werden jeweils mindestens 3 benötigt.';
      }
      const umfangText = minB > 0 ? (pctUmfang > 5 ? '+' : '') + pctUmfang + ' % Trainingszeit' : Math.round(minA / 60) + ' h Trainingszeit · kein Vorwert';
      leistungsKarten.push(el('article', { class: 'tf-tr-leistungs-karte' },
        el('div', { class: 'tf-tr-leistungs-kopf' }, el('b', { text: q.name }), el('small', { text: '28 Tage vs. vorherige 28 Tage' })),
        el('div', { class: 'tf-tr-leistungs-grid' },
          el('div', { class: 'tf-tr-leistungs-zahl' }, el('small', { text: 'Umfang' }), el('b', { class: 'num', text: umfangText }), el('small', { text: einA.length + ' vs. ' + einB.length + ' Einheiten' })),
          el('div', { class: 'tf-tr-leistungs-zahl ' + leistungKlasse }, el('small', { text: 'Leistungsindikator' }), el('b', { text: leistungText }), el('small', { text: leistungDetail })) ),
        el('small', { class: 'tf-tr-leistungs-meta', text: q.indikator })));
    });
    if (leistungsKarten.length) frag.push(
      el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Trainingsumfang und Leistung', el('small', { text: 'Letzte 28 Tage gegen die 28 Tage davor' })),
      el('div', { class: 'tf-tr-leistungs' }, ...leistungsKarten),
      el('p', { class: 'tf-note', text: 'Das sind Beobachtungen, keine Kausalanalyse: Tempo und Leistung hängen auch von Strecke, Höhenmetern, Wetter, Intensität, Material und Messqualität ab. Die Rad-NP ist insbesondere nicht um FTP oder Trainingsintensität bereinigt. Mehr Trainingszeit allein beweist keinen Leistungsfortschritt.' })
    );
    // V38: Vergleichbarkeit nach Aktivitätstyp und Datenqualität.
    const mediane = (xs) => M().median(xs.filter((x) => x != null && isFinite(x) && x > 0));
    const details = [];
    const laufNamen = {
      running: 'Laufen (allgemein)', street_running: 'Straße', trail_running: 'Trail',
      treadmill_running: 'Laufband', indoor_running: 'Indoor', track_running: 'Bahn',
      virtual_run: 'Virtuell', ultra_run: 'Ultra',
    };
    const laufGruppen = {};
    (R.laufDetails || []).forEach((e) => {
      const name = laufNamen[e.typ];
      if (!name) return;
      (laufGruppen[name] ||= []).push(e);
    });
    Object.entries(laufGruppen).forEach(([name, xs]) => {
      [['3–5 km', 3000, 5000], ['5–10 km', 5000, 10000], ['ab 10 km', 10000, Infinity]].forEach(([distName, minDist, maxDist]) => {
        const roh = xs.filter((e) => e.dist >= minDist && e.dist < maxDist);
        const gut = roh.filter((e) => e.sek >= 300 && e.pace > 150 && e.pace < 900);
        const a = gut.filter((e) => e.date > von28 && e.date <= h), b = gut.filter((e) => e.date > von56 && e.date <= von28);
        if (!roh.some((e) => e.date > von56 && e.date <= h)) return; // Version 42: nur Gruppen mit Einheiten in den letzten 56 Tagen
        const ma = mediane(a.map((e) => e.pace)), mb = mediane(b.map((e) => e.pace));
        const pct = a.length >= 3 && b.length >= 3 && ma && mb ? 100 * (mb - ma) / mb : null;
        const rawA = roh.filter((e) => e.date > von28 && e.date <= h).length, rawB = roh.filter((e) => e.date > von56 && e.date <= von28).length;
        details.push({ name: name + ' · ' + distName, sport: 'Laufen', a: a.length, b: b.length, wert: ma ? mmss(ma) + ' /km' : '–', alt: mb ? mmss(mb) + ' /km' : '–',
          delta: pct == null ? 'Zu wenige Vergleichsdaten' : Math.abs(pct) < 1.5 ? 'Kaum verändert' : (pct > 0 ? 'Schneller' : 'Langsamer') + ' (' + (pct > 0 ? '+' : '') + nf(pct, 1) + ' %)',
          hinweis: 'Median · ' + rawA + '/' + rawB + ' Rohdaten, davon ' + (rawA - a.length) + '/' + (rawB - b.length) + ' wegen Dauer/Plausibilität ausgeschlossen' });
      });
    });
    const swimGruppen = { 'Pool': [], 'Freiwasser': [], 'Wasserart unklar': [] };
    (R.schwimmDetails || []).forEach((e) => {
      const g = e.typ === 'open_water_swimming' ? 'Freiwasser' : e.typ === 'lap_swimming' || e.pool > 0 ? 'Pool' : 'Wasserart unklar';
      swimGruppen[g].push(e);
    });
    Object.entries(swimGruppen).forEach(([name, xs]) => {
      const gut = xs.filter((e) => e.dist >= 200 && e.sek >= 120 && e.pace > 45 && e.pace < 300);
      const a = gut.filter((e) => e.date > von28 && e.date <= h), b = gut.filter((e) => e.date > von56 && e.date <= von28);
      if (!xs.some((e) => e.date > von56 && e.date <= h)) return; // Version 42: wie beim Laufen – Rohdaten zählen, damit Ausschlüsse sichtbar bleiben
      const ma = mediane(a.map((e) => e.pace)), mb = mediane(b.map((e) => e.pace));
      const pct = a.length >= 3 && b.length >= 3 && ma && mb ? 100 * (mb - ma) / mb : null;
      const rawA = xs.filter((e) => e.date > von28 && e.date <= h).length, rawB = xs.filter((e) => e.date > von56 && e.date <= von28).length;
      details.push({ name, sport: 'Schwimmen', a: a.length, b: b.length, wert: ma ? mmss(ma) + ' /100 m' : '–', alt: mb ? mmss(mb) + ' /100 m' : '–',
        delta: pct == null ? 'Zu wenige Vergleichsdaten' : Math.abs(pct) < 1.5 ? 'Kaum verändert' : (pct > 0 ? 'Schneller' : 'Langsamer') + ' (' + (pct > 0 ? '+' : '') + nf(pct, 1) + ' %)',
        hinweis: 'Median · ' + rawA + '/' + rawB + ' Rohdaten, davon ' + (rawA - a.length) + '/' + (rawB - b.length) + ' wegen Dauer/Plausibilität ausgeschlossen; Wasserart getrennt' });
    });
    const rad = (R.radDetails || []).filter((e) => e.sek >= 1800 && e.if > 0 && e.if < 2.5);
    const radA = rad.filter((e) => e.date > von28 && e.date <= h), radB = rad.filter((e) => e.date > von56 && e.date <= von28);
    if (radA.length || radB.length) {
      const ma = mediane(radA.map((e) => e.if)), mb = mediane(radB.map((e) => e.if));
      details.push({ name: 'Rad · FTP-bezogener Intensitätsfaktor', sport: 'Rad', a: radA.length, b: radB.length,
        wert: ma ? nf(ma, 2) + ' IF' : '–', alt: mb ? nf(mb, 2) + ' IF' : '–',
        delta: radA.length >= 3 && radB.length >= 3 && ma && mb ? (Math.abs(ma - mb) < 0.015 ? 'Kaum verändert' : (ma > mb ? 'Höher' : 'Niedriger') + ' (' + nf(100 * (ma / mb - 1), 1) + ' %)') : 'Zu wenige Vergleichsdaten',
        hinweis: 'Garmin-IF aus Fahrten ab 30 Minuten; relativ zur hinterlegten FTP, Intensität und kein eigenständiger Fitnessnachweis' });
    }
    const detailZeilen = details.map((d) => el('div', { class: 'tf-tr-daten-zeile' },
      el('div', { class: 'tf-tr-daten-kopf' }, el('b', { text: d.sport + ' · ' + d.name }), el('small', { text: d.hinweis })),
      el('div', { class: 'tf-tr-daten-werte' },
        el('span', null, el('small', { text: 'Aktuell' }), el('b', { class: 'num', text: d.wert }), el('small', { text: d.a + ' Einheiten' })),
        el('span', null, el('small', { text: 'Davor' }), el('b', { class: 'num', text: d.alt }), el('small', { text: d.b + ' Einheiten' })),
        el('span', null, el('small', { text: 'Einordnung' }), el('b', { text: d.delta })))));
    if (detailZeilen.length) frag.push(
      el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Vergleichbarkeit und Datenqualität', el('small', { text: 'Gleiche Aktivitätstypen statt gemischter Einheiten' })),
      el('div', { class: 'tf-tr-daten' }, ...detailZeilen),
      el('p', { class: 'tf-note', text: 'Laufband, Trail, Bahn und allgemeine Laufeinheiten werden getrennt betrachtet. Pool und Freiwasser werden nicht direkt verglichen. Eine Richtungsbewertung erscheint erst ab mindestens drei passenden Einheiten je Zeitraum; bei weniger Daten bleibt die Einordnung offen. Der Garmin-IF beschreibt die relative Intensität und ist allein kein Fitnessnachweis.' })
    );

    // V39: Zwölf-Monats-Verlauf mit Monatsmedianen. Kleine Stichproben bleiben sichtbar,
    // werden aber nicht als belastbarer Monatswert ausgegeben.
    const monate12 = [];
    const monatAktuell = h.slice(0, 7);
    const datumMonat = (key) => new Date(Date.parse(key + '-01T00:00:00Z'));
    for (let i = 11; i >= 0; i--) {
      const d = datumMonat(monatAktuell);
      d.setUTCMonth(d.getUTCMonth() - i);
      monate12.push(d.toISOString().slice(0, 7));
    }
    const monatsReihen = [
      {
        id: 'lauf', name: 'Laufen · Straße / allgemein', einheit: '/km', besser: -1,
        daten: (R.laufDetails || []).filter((e) => ['running', 'street_running'].includes(e.typ) && e.dist >= 3000 && e.sek >= 300 && e.pace > 150 && e.pace < 900).map((e) => ({ date: e.date, v: e.pace }))
      },
      {
        id: 'rad', name: 'Rad · Garmin-IF', einheit: 'IF', besser: 0,
        daten: (R.radDetails || []).filter((e) => e.sek >= 1800 && e.if > 0 && e.if < 2.5).map((e) => ({ date: e.date, v: e.if }))
      },
      {
        id: 'pool', name: 'Schwimmen · Pool', einheit: '/100 m', besser: -1,
        daten: (R.schwimmDetails || []).filter((e) => (e.typ === 'lap_swimming' || e.pool > 0) && e.dist >= 200 && e.sek >= 120 && e.pace > 45 && e.pace < 300).map((e) => ({ date: e.date, v: e.pace }))
      },
    ];
    const monatsKarten = [];
    monatsReihen.forEach((q) => {
      const gruppen = monate12.map((m) => {
        const xs = q.daten.filter((e) => e.date && e.date.slice(0, 7) === m).map((e) => +e.v).filter((v) => v > 0 && isFinite(v));
        return { monat: m, n: xs.length, wert: xs.length >= 3 ? M().median(xs) : null };
      });
      if (!gruppen.some((x) => x.n)) return;
      const gueltig = gruppen.filter((x) => x.wert != null).map((x) => x.wert);
      const min = gueltig.length ? Math.min(...gueltig) : 0, max = gueltig.length ? Math.max(...gueltig) : 0;
      const cells = gruppen.map((x) => {
        const label = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(datumMonat(x.monat));
        const anteil = max === min ? null : q.besser < 0 ? (max - x.wert) / (max - min) : (x.wert - min) / (max - min); // Version 42: beim Tempo heißt höher schneller
        const hoehe = x.wert == null ? 0 : anteil == null ? 55 : 22 + 78 * anteil;
        const wert = x.wert == null ? (x.n ? 'n=' + x.n : '–') : q.id === 'lauf' || q.id === 'pool' ? mmss(x.wert) : nf(x.wert, 2);
        const detail = x.wert == null ? (x.n ? x.n + ' Einheiten – mindestens 3 für Monatsmedian' : 'Keine passende Einheit') : wert + ' ' + q.einheit + ' · Median aus ' + x.n + ' Einheiten';
        return el('div', { class: 'tf-tr-monat', title: label + ': ' + detail, 'aria-label': label + ': ' + detail },
          el('small', { text: label }),
          el('span', { class: 'tf-tr-monat-balken' }, x.wert == null ? null : el('i', { style: 'height:' + hoehe + '%' })),
          el('b', { class: 'num', text: wert }));
      });
      monatsKarten.push(el('article', { class: 'tf-tr-monat-karte' },
        el('div', { class: 'tf-tr-monat-kopf' }, el('b', { text: q.name }), el('small', { text: 'Monatsmedian · mindestens 3 passende Einheiten' })),
        el('div', { class: 'tf-tr-monat-grid' }, ...cells)));
    });
    if (monatsKarten.length) frag.push(
      el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Deine Entwicklung über 12 Monate', el('small', { text: 'Monatswerte statt einzelner Bestleistungen' })),
      el('div', { class: 'tf-tr-monat-liste' }, ...monatsKarten),
      el('p', { class: 'tf-note', text: 'Die Balken zeigen nur die Spannweite innerhalb derselben Reihe: beim Laufen und Schwimmen heißt höher schneller, beim Rad-IF intensiver. Die Höhe ist keine Fitnessnote. Monate mit weniger als drei passenden Einheiten zeigen nur die Stichprobengröße. Laufwerte umfassen Straße und allgemeine Läufe, Pool und Freiwasser bleiben getrennt. Garmin-IF beschreibt die relative Radintensität und ist kein eigenständiger Leistungsnachweis. Der Verlauf hängt davon ab, wie weit deine Garmin-Historie zurückreicht.' })
    );

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
      frag.push(el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Die letzten ' + (SPANNE === 364 ? '52 Wochen' : SPANNE === 84 ? '12 Wochen' : '4 Wochen'), el('small', { text: ohneVergleich === zeilen.length ? 'Dein Schnitt – zum Vergleich fehlen noch Daten ' + (SPANNE === 364 ? 'aus dem Jahr davor' : 'aus den ' + SPANNE + ' Tagen davor') : 'Gegen ' + (SPANNE === 364 ? 'das Jahr davor' : 'die ' + (SPANNE / 7) + ' Wochen davor') + (ohneVergleich ? ' · ohne Pfeil: noch zu wenige Daten davor' : '') })), L);
    } else frag.push(el('p', { class: 'tf-empty', text: T.ohne() ? 'Noch keine Daten für diesen Zeitraum. Sobald du Einheiten im Gym oder bei Pilates & Yoga speicherst, füllt sich dein Rückblick.' : 'Noch keine Daten für diesen Zeitraum. Mit jeder Nacht und jeder Einheit von deiner Uhr füllt sich dein Rückblick.' }));
    const g = bestaendig(SPANNE);
    if (g) frag.push(el('article', { class: 'tf-card tf-tr-gewohnheit' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-pink)' }, svgIco('i-star')), el('div', null, el('small', { text: 'Deine beständigste Gewohnheit' }), el('b', { text: g[0] }), el('p', { text: g[2] + ' – ' + Math.round(g[1] * 100) + ' %.' }))));
    // Trend-Pfeile: 4 Wochen gegen die Monate davor
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
    if (t.id === 'tempo' || t.id === 'schwimmtempo') return (t.diff < 0 ? 'Schneller' : 'Langsamer') + ': ' + f(t.kurz) + ' statt ' + f(t.lang) + '.';
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
    if (B.erholteWoche || B.tagesform != null) K.push({ farbe: 'indigo', icon: 'i-moon', klein: 'Erholung', gross: B.tagesform != null ? nf(B.tagesform) : '–', titel: 'Tune im Schnitt', text: B.erholteWoche ? 'Am erholtesten warst du in der Woche ab ' + kw(B.erholteWoche.montag) + ' (Ø ' + B.erholteWoche.wert + ').' : '', fakten: [B.hrv != null ? ['i-wave', 'HRV im Schnitt ' + nf(B.hrv) + ' ms'] : null, B.rhr != null ? ['i-heart', 'Ruhepuls im Schnitt ' + nf(B.rhr, 1) + ' bpm'] : null].filter(Boolean) });
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
    const poster = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-mk-poster' }, svgIco('i-share'), ' Als Poster'); // Version 13
    poster.addEventListener('click', () => posterBlatt(Z, K));
    const box = el('div', { class: 'tf-mk tf-story', tabindex: '-1' }, el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: Z.name }), fort, buehne, el('div', { class: 'tf-mk-akt' }, zur, vor), poster);
    box.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); geh(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); geh(-1); } });
    zeig();
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
  }

  /* ---------- Version 13: Magazin-Poster zum Teilen ----------
     Der Rückblick als ruhiges Hochformat (1080 × 1920, passt als Story): verzerrte Bühne in Sky Blue und Hot Pink mit
     Korn, alles in der App-Schrift (Version 19: Plus Jakarta Sans statt Newsreader und Mono, Beschriftungen ohne
     Großbuchstaben). Entsteht nur auf deinem Gerät; Teilen über das Teilen-Menü. */
  const POSTER_W = 1080, POSTER_H = 1920;
  function umbrechen(ctx, text, breite) { const W = String(text || '').split(/\s+/), L = []; let z = ''; W.forEach((w) => { const t = z ? z + ' ' + w : w; if (ctx.measureText(t).width > breite && z) { L.push(z); z = w; } else z = t; }); if (z) L.push(z); return L; }
  async function posterMalen(Z, K) {
    try { await Promise.all([document.fonts.load('400 120px "Plus Jakarta Sans"'), document.fonts.load('500 60px "Plus Jakarta Sans"')]); } catch (e) { /* dann mit Ersatzschrift */ }
    const cv = document.createElement('canvas'); cv.width = POSTER_W; cv.height = POSTER_H;
    const c = cv.getContext('2d'), W = POSTER_W, H = POSTER_H;
    // Bühne: Tiefe oben, Sky Blue in der Mitte, Hot Pink unten rechts
    const g = c.createLinearGradient(0, 0, W * 0.35, H); g.addColorStop(0, '#071b2b'); g.addColorStop(0.45, '#0a5f86'); g.addColorStop(0.78, '#0593C6'); g.addColorStop(1, '#3a2f6b');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const glow = (x, y, r, farbe) => { const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, farbe); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H); };
    glow(W * 0.92, H * 0.86, 820, 'rgba(216,57,149,0.78)'); glow(W * 0.08, H * 0.18, 620, 'rgba(5,147,198,0.55)'); glow(W * 0.6, H * 0.5, 520, 'rgba(252,255,255,0.10)');
    // Bewegungs-Streifen: der „verzerrte“ Look ohne Foto
    const blur = 'filter' in c;
    for (let i = 0; i < 9; i++) { const y = 260 + i * 170 + (i % 3) * 23; if (blur) c.filter = 'blur(' + (14 + (i % 4) * 6) + 'px)'; c.fillStyle = 'rgba(252,255,255,' + (0.05 + (i % 3) * 0.025) + ')'; c.fillRect(-60, y, W + 120, 18 + (i % 2) * 22); }
    if (blur) c.filter = 'none';
    // Korn
    const img = c.getImageData(0, 0, W, H), d = img.data;
    let z = 1234567; const zuf = () => { z = (z * 1103515245 + 12345) & 0x7fffffff; return z / 0x7fffffff; };
    for (let i = 0; i < d.length; i += 4) { const n = (zuf() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    c.putImageData(img, 0, 0);
    // Text
    const M0 = 96, weiss = '#FCFFFF', leise = 'rgba(252,255,255,0.72)';
    const schrift = (px, w) => (w || 400) + ' ' + px + 'px "Plus Jakarta Sans", system-ui, sans-serif';
    const sperren = (px) => { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; }; // nur große Schrift enger, kleine nie
    c.textBaseline = 'alphabetic'; c.fillStyle = leise; c.font = schrift(30, 500);
    c.fillText('Dreiklang · ' + Z.kurz, M0, 150);
    c.fillStyle = weiss; c.font = schrift(104); sperren(-3); c.fillText(Z.name, M0, 300);
    const k0 = K[0] || { gross: '–', titel: '', text: '' };
    c.font = schrift(400); sperren(-16); c.fillText(String(k0.gross), M0 - 16, 760); sperren(0);
    c.font = schrift(60, 500); sperren(-1); c.fillText(k0.titel, M0, 850); sperren(0);
    c.fillStyle = leise; c.font = schrift(38); umbrechen(c, k0.text, W - 2 * M0).slice(0, 2).forEach((t, i) => c.fillText(t, M0, 920 + i * 54));
    // Fakten: bis zu vier Karten aus dem Rückblick
    const F = K.slice(1).filter((x) => x.gross && x.gross !== '✓').slice(0, 4);
    const sp = (W - 2 * M0 - 48) / 2;
    F.forEach((x, i) => {
      const cx = M0 + (i % 2) * (sp + 48), cy = 1110 + Math.floor(i / 2) * 330;
      c.fillStyle = 'rgba(252,255,255,0.22)'; c.fillRect(cx, cy, sp, 2);
      c.fillStyle = leise; c.font = schrift(28, 500); c.fillText(String(x.klein).slice(0, 30), cx, cy + 52);
      c.fillStyle = weiss; c.font = schrift(104); sperren(-3); c.fillText(String(x.gross).slice(0, 9), cx - 4, cy + 172); sperren(0);
      c.font = schrift(34); umbrechen(c, x.titel, sp).slice(0, 2).forEach((t, j) => c.fillText(t, cx, cy + 228 + j * 44));
    });
    c.fillStyle = leise; c.font = schrift(28, 500); c.fillText('Fortschritt aus ruhigen, regelmäßigen Tagen', M0, H - 120);
    c.fillStyle = 'rgba(252,255,255,0.22)'; c.fillRect(M0, H - 168, W - 2 * M0, 2);
    return cv;
  }
  async function posterBlatt(Z, K) {
    const box = el('div', { class: 'tf-mk tf-poster' }, el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: 'Poster: ' + Z.name }), el('p', { class: 'tf-rm-sub', text: 'Wird erstellt …' }));
    if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(box);
    let cv; try { cv = await posterMalen(Z, K); } catch (e) { box.lastChild.textContent = 'Das Poster ließ sich auf diesem Gerät nicht erstellen.'; return; }
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.9)); // JPEG: mit Korn viel kleiner als PNG
    if (!blob) { box.lastChild.textContent = 'Das Poster ließ sich auf diesem Gerät nicht erstellen.'; return; }
    const name = 'dreiklang-' + Z.kurz.toLowerCase().replace(/ä/g, 'ae').replace(/[^a-z0-9]+/g, '-') + '.jpg', url = URL.createObjectURL(blob);
    const datei = typeof File === 'function' ? new File([blob], name, { type: 'image/jpeg' }) : null;
    const teilenOk = !!(datei && navigator.canShare && navigator.canShare({ files: [datei] }));
    const teilen = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-share'), teilenOk ? ' Teilen' : ' Bild speichern');
    teilen.addEventListener('click', async () => {
      if (teilenOk) { try { await navigator.share({ files: [datei], title: Z.name }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const a = el('a', { href: url, download: name, style: 'display:none' }); document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 500);
    });
    const zur = el('button', { type: 'button', class: 'tf-btn' }, 'Zurück zum Rückblick');
    zur.addEventListener('click', () => { URL.revokeObjectURL(url); storyOeffnen(Z.jahr ? Z.kurz : Z.von.slice(0, 7)); });
    box.replaceChildren(el('h2', { id: 'sheet-titel', class: 'tf-mk-titel', text: 'Poster: ' + Z.name }),
      el('img', { class: 'tf-poster-bild', src: url, alt: 'Poster ' + Z.name, width: 270, height: 480 }),
      el('p', { class: 'tf-note', text: 'Hochformat 1080 × 1920 – passt als Story. Das Bild entsteht nur auf deinem Gerät.' }),
      el('div', { class: 'tf-form-actions' }, teilen, zur));
    box.dataset.groesse = blob.size;
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
    box.replaceChildren(el('span', { class: 'tf-augenbraue', text: '14 Tage' }),
      el('span', { class: 'tf-14-p', role: 'img', 'aria-label': n + ' von 14 Tagen mit Training' }, ...P.map(([d, an], i) => el('i', { class: [an ? 'an' : '', d === h ? 'heute' : '', i === 7 ? 'neu' : ''].join(' ').trim() || null, title: TAGNAME.format(new Date(d + 'T12:00:00Z')) + (an ? ' · trainiert' : ' · frei') }))),
      el('small', { class: 'num', text: n + ' von 14' }));
  }
  T.zusatz('heute', vierzehn);
  T.seite('trends', renderTrends);
  T.zusatz('gesundheit-hub', pfeileGesundheit);
  T.zusatz('heute', heuteRueckblick);
  window.tfRueckblick = { trends, kurz, storyOeffnen, reihen, pfeil, trendSatz, posterMalen: (k) => { const { Z, K } = storyKarten(k); return posterMalen(Z, K); }, posterBlatt: (k) => { const { Z, K } = storyKarten(k); return posterBlatt(Z, K); } };
})();
