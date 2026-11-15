/* Dreiklang · Rückblick (Version 10, Trends erweitert in Version 42 aus V36–V39; Version 53: aus „Deine Trends“ wird „Deine Entwicklung“)
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
    if (tb.length >= 5 && window.tfAlltag && tfAlltag.ziele) { const n = tb.filter((x) => (+x.w || 0) >= tfAlltag.ziele(x.date).w.ml).length; alle.push(['Trinkziel erreicht', n / tb.length, 'an ' + n + ' von ' + tb.length + ' notierten Tagen – ' + Math.round((100 * n) / tb.length) + ' %']); }
    const W = M().wochen(R.einheiten.filter((e) => inZ(e.date)).map((e) => ({ date: e.date, v: 1 }))), wN = Math.max(1, Math.floor(tage / 7));
    const aktiv = [...W.values()].filter((n) => n >= 2).length; if (wN >= 2) alle.push(['Mindestens 2 Einheiten pro Woche', Math.min(1, aktiv / wN), 'in ' + aktiv + ' von ' + wN + ' Wochen']);
    return alle.filter((x) => x[1] >= 0.5).sort((a, b) => b[1] - a[1])[0] || null;
  }
  // Version 11: Fortschritt bis zu den ersten Trend-Pfeilen (10 Nächte aus den letzten 4 Wochen, 30 aus den Monaten davor)
  function trendFortschritt(R, h) {
    if (T.ohne() || !S.fortschritt) return el('p', { class: 'tf-note', text: 'Mit deiner Uhr wächst hier deine Entwicklung: Trend-Pfeile entstehen aus den Nächten deiner Uhr – mit Garmin kommen Schlaf, HRV und Ruhepuls automatisch dazu, aus deinen Läufen und Fahrten Herzschläge pro Kilometer und Watt bei gleichem Puls.' });
    const st = ['hrv', 'puls', 'schlaf'].map((id) => {
      const V = (R[id] || []).filter((x) => x.date <= h), k = V.filter((x) => x.date > M().plus(h, -28)).length, l = V.filter((x) => x.date <= M().plus(h, -28) && x.date > M().plus(h, -182)).length;
      return Math.min(k, 10) + Math.min(l, 30);
    }), ist = Math.max(0, ...st);
    return S.fortschritt({ ist, soll: 40, text: S.noch(40 - ist, 'Nacht', 'Nächte') + ' mit Uhr, bis deine ersten Trend-Pfeile erscheinen.', sub: nf(ist) + ' von 40 Nächten · 10 aus den letzten 4 Wochen, 30 aus den Monaten davor' });
  }

  /* ---------- Version 53: Seite „Deine Entwicklung“ – wie sich dein Körper anpasst ----------
     Ein großes Diagramm (Laufen: Herzschläge pro Kilometer · Rad: Watt bei gleichem Puls · Schwimmen: Zeit pro 100 m), darunter
     die Merkmale der Anpassung mit ihrer Spanne über 12 Monate, Fakten über dich, die Anpassungsuhr und deine Gewohnheiten.
     Überall gilt: oben bzw. rechts ist besser. Die Rechnung steht im Motor (entwicklung, entwicklungFakten). */
  let EW_VGL = 3, EW_SPORT = null;
  function entwicklung() {
    const EH = A().raw('garmin_einheiten') || [], TG = A().raw('garmin_tage') || [], V = rowsOf('vo2max') || [], PM = rowsOf('pmc') || [], AN = A().raw('analysen') || [], a = (rowsOf('athlet') || [])[0] || {}, h = localDate();
    return merk('entwicklung', [EH, TG, V, PM, AN, a, h], () => {
      const ek = AN.filter((x) => x && x.date && x.decoupling_pct != null && +x.min >= 45).map((x) => ({ date: x.date, id: x.id, v: +x.decoupling_pct }));
      return M().entwicklung({ einheiten: EH, tage: TG, vo2: V, pmc: PM, entkopplung: ek, athlet: a, heute: h });
    });
  }
  const ganz = (x) => nf(Math.round(x)), ganzAbs = (x) => nf(Math.round(Math.abs(x)));
  const EWD = { // je Kennzahl: Name, Einheit, Format, Format des Unterschieds, Seite mit den Details
    lauf: { name: 'Herzschläge pro Kilometer', u: 'Schläge pro km', sub: 'lockere Läufe, steigungsbereinigt', f: ganz, d: ganzAbs, du: 'Schläge', ziel: 'training/laufen', sport: 'Laufen', farbe: 'mint' },
    rad: { name: 'Watt bei gleichem Puls', u: 'W', sub: 'lockere Fahrten mit Leistung', f: ganz, d: ganzAbs, du: 'W', ziel: 'training/rad', sport: 'Rad', farbe: 'orange' },
    schwimmen: { name: 'Zeit pro 100 m', u: '/100 m', sub: 'Becken ab 400 m', f: (x) => mmss(x), d: ganzAbs, du: 's', ziel: 'training/schwimmen', sport: 'Schwimmen', farbe: 'blue' },
    zuege: { name: 'Züge pro 25 m', u: 'Züge', sub: 'im Becken', f: (x) => nf(x, 1), d: (x) => nf(Math.abs(x), 1), du: 'Züge', ziel: 'training/schwimmen' },
    puls: { name: 'Ruhepuls', u: 'bpm', sub: 'Median der Nächte', f: ganz, d: ganzAbs, du: 'bpm', ziel: 'gesundheit/puls' },
    hrv: { name: 'HRV', u: 'ms', sub: 'Median der Nächte', f: ganz, d: ganzAbs, du: 'ms', ziel: 'gesundheit/hrv' },
    vo2: { name: 'VO2max', u: 'ml/kg/min', sub: 'geschätzt aus Läufen', f: (x) => nf(x, 1), d: (x) => nf(Math.abs(x), 1), du: 'ml/kg/min', ziel: 'gesundheit/fitness' },
    entkopplung: { name: 'Puls-Drift', u: '%', sub: 'lange, gleichmäßige Einheiten', f: (x) => nf(x, 1), d: (x) => nf(Math.abs(x), 1), du: 'Prozentpunkte', ziel: 'training/einheiten' },
    kadenz: { name: 'Schrittfrequenz', u: 'spm', sub: 'lockere Läufe', f: ganz, d: ganzAbs, du: 'spm', ziel: 'training/laufen' },
    kontakt: { name: 'Bodenkontakt', u: 'ms', sub: 'lockere Läufe', f: ganz, d: ganzAbs, du: 'ms', ziel: 'training/laufen' },
    fitness: { name: 'Fitness', u: 'CTL', sub: 'Trainingslast der letzten sechs Wochen', f: ganz, d: ganzAbs, du: 'CTL', ziel: 'training/form' },
  };
  const MON_K = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  const monatName = (d) => M().MONATE[+d.slice(5, 7) - 1] + (d.slice(0, 4) !== localDate().slice(0, 4) ? ' ' + d.slice(0, 4) : '');
  const datumKurz = (d) => +d.slice(8, 10) + '. ' + MON_K[+d.slice(5, 7) - 1];
  function ewMetrik(id) { const E = sicher(entwicklung); if (!E) return null; return id === 'zuege' ? (E.schwimmen ? E.schwimmen.zuege : null) : E[id] || (E.marker && E.marker[id]) || null; }
  const ewSkala = (id, m) => (id === 'rad' && m && m.ref ? m.ref : 1); // Rad: Watt pro Herzschlag × Bezugspuls = Watt bei diesem Puls
  const wannTxt = (n) => 'zu vor ' + (n === 12 ? '12 Monaten' : n + ' Monaten');
  function ewDelta(id, m, n) { // „−36 Schläge · −4 % zu vor 3 Monaten“
    const v = m && m.vergleich && m.vergleich[n]; if (!v) return null;
    const D = EWD[id], d = v.diff * ewSkala(id, m), s = d > 0 ? '+' : d < 0 ? '−' : '±';
    const pct = ['lauf', 'rad', 'schwimmen', 'hrv', 'kontakt'].includes(id) && Math.abs(v.pct) >= 1 ? ' · ' + s + nf(Math.abs(v.pct), 0) + ' %' : '';
    return { text: s + D.d(d) + (D.du ? ' ' + D.du : '') + pct, wann: wannTxt(n), ton: v.richtung > 0 ? 'gut' : v.richtung < 0 ? 'schlecht' : 'gleich', wort: v.richtung > 0 ? 'Besser' : v.richtung < 0 ? 'Schwächer' : 'Stabil', richtung: v.richtung, monate: n };
  }
  function ewWert(id, m) { const D = EWD[id], v = m.jetzt.v * ewSkala(id, m); return id === 'schwimmen' ? D.f(v) + '\u00a0/100 m' : D.f(v) + (D.u ? '\u00a0' + D.u : ''); }
  // Eine Zeile „So siehst du es bei dir“ (Warum-Blatt) bzw. für die Liste der Merkmale
  function ewZeile(id, n) {
    if (id === 'kraft') {
      const KE = window.tfGym && tfGym.kraftEffekt ? sicher(() => tfGym.kraftEffekt()) : null;
      if (!KE || !KE.effekt || !(KE.n > 0)) return null;
      return { id, name: 'Kraft-Effekt', sub: 'geschätzt aus deinen Gewichten', wert: '+' + nf(KE.effekt.lauf.m * 100, 1) + ' % Laufen', delta: KE.effekt.rad ? 'Rad +' + nf(KE.effekt.rad.m * 100, 1) + ' %' : null, ton: 'gleich', ziel: 'training/gym' };
    }
    const m = ewMetrik(id); if (!m || !m.jetzt) return null;
    const D = EWD[id], dl = ewDelta(id, m, n || EW_VGL) || [3, 6, 12].map((k) => ewDelta(id, m, k)).find(Boolean);
    return { id, name: id === 'rad' && m.ref ? 'Watt bei Puls ' + m.ref : D.name, sub: m.jetzt.alt ? 'letzter Stand ' + monatName(m.jetzt.bis) : D.sub, wert: ewWert(id, m), delta: dl ? dl.wort + ': ' + dl.text + ' ' + dl.wann : null, ton: dl ? dl.ton : '', ziel: D.ziel };
  }
  // Das Entwicklungs-Diagramm: jede Einheit ein Punkt, der Monatsmedian als Linie – oben ist besser
  function ewChart(box, id, o) {
    o = o || {};
    const m = ewMetrik(id), U = T.ui; if (!m || !box || !U.plot) return false;
    const D = EWD[id], k = ewSkala(id, m), h = localDate(), von = M().plus(h, -364), farbe = U.col(o.farbe || D.farbe || 'blue');
    const P0 = m.punkte.filter((p) => p.date >= von).map((p) => ({ t: U.toDay(p.date), v: p.v * k, date: p.date }));
    const mitte = (mo) => (mo + '-15' > h ? h : mo + '-15'); // der laufende Monat endet heute
    const MO = m.monate.filter((x) => x.v != null && x.n >= 2 && x.mo >= von.slice(0, 7)).map((x) => ({ t: U.toDay(mitte(x.mo)), v: x.v * k, n: x.n, mo: x.mo, date: mitte(x.mo) }));
    if (P0.length < 3) { U.emptyNote(box, 'Noch zu wenige passende Einheiten in den letzten 12 Monaten – ab drei zeigt sich ein Verlauf.'); return false; }
    const q = (a, p) => M().quantil(a, p), PV = P0.map((p) => p.v), fest = MO.map((x) => x.v).concat(m.jetzt ? [m.jetzt.v * k] : [], o.vgl && m.vergleich[o.vgl] ? [m.vergleich[o.vgl].v * k] : []);
    const V = fest.concat([q(PV, 0.05), q(PV, 0.95)]), lo0 = Math.min(...V), hi0 = Math.max(...V), pad = (hi0 - lo0 || hi0 * 0.05 || 1) * 0.16, lo = lo0 - pad, hi = hi0 + pad;
    P0.forEach((p) => { p.rand = p.v < lo || p.v > hi; p.v = Math.max(lo, Math.min(hi, p.v)); }); // Ausreißer sitzen am Rand statt die Skala zu stauchen
    const P = U.plot(box, { h: o.h || 220, x: [U.toDay(von), U.toDay(h)], y: [lo, hi], yinvert: m.gut < 0, ny: 4, yfmt: (t) => D.f(t), label: D.name + ' über 12 Monate – oben ist besser' });
    U.gapShade(P, P0.map((p) => p.date), von, h, 35);
    U.dots(P, P0, (r) => r.t, (r) => r.v, U.col('fg3'), 3, 0.45);
    const ML = []; MO.forEach((x, i) => { if (i && (x.t - MO[i - 1].t) / U.DAY > 45) ML.push({ t: x.t, v: null }); ML.push(x); });
    U.line(P, ML, (r) => r.t, (r) => r.v, farbe, 2.6);
    const vg = o.vgl && m.vergleich[o.vgl];
    if (vg) { // der Vergleichszeitpunkt: gestrichelt, mit dem Wert von damals
      const x = P.xs(U.toDay(M().monateZurueck(h, o.vgl)));
      if (isFinite(x) && x > P.ml) { U.svg('line', { x1: x, x2: x, y1: P.top, y2: P.xb, class: 'tf-ew-vgl' }, P.g); U.svg('circle', { cx: x, cy: P.ys(vg.v * k), r: 4.5, class: 'tf-ew-vgl-p' }, P.g); }
    }
    if (m.jetzt && !m.jetzt.alt) U.svg('circle', { cx: P.xs(U.toDay(m.jetzt.bis)), cy: P.ys(m.jetzt.v * k), r: 5, fill: farbe, stroke: U.col('card'), 'stroke-width': 2 }, P.g);
    U.hoverTime(box, P, MO, (r) => r.t, (r) => monatName(r.date), (r) => [{ label: 'Monatsmedian', value: D.f(r.v) + ' ' + (id === 'schwimmen' ? '/100 m' : D.u), color: farbe }, { label: 'Einheiten', value: String(r.n) }], [{ y: (r) => r.v, color: farbe }]);
    return true;
  }
  const seg = (L, akt, fn, label, cls) => { const g = el('div', { class: 'tf-seg ' + (cls || ''), role: 'group', 'aria-label': label }); L.forEach(([v, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === akt), 'data-v': String(v) }, t); b.addEventListener('click', () => fn(v)); g.appendChild(b); }); return g; };
  function ewHeld(E, sports) {
    const id = EW_SPORT, m = E[id], D = EWD[id], J = m.jetzt, k = ewSkala(id, m), dl = J && !J.alt ? ewDelta(id, m, EW_VGL) : null;
    const c = el('article', { class: 'tf-card tf-ew-held', id: 'ew-held', style: '--c:var(--tf-' + D.farbe + ')' });
    if (sports.length > 1) c.appendChild(seg(sports.map((s) => [s, EWD[s].sport]), id, (v) => { EW_SPORT = v; renderTrends(); }, 'Sportart', 'tf-ew-sport'));
    const einheit = id === 'lauf' ? 'Schläge pro km' : id === 'rad' ? 'W bei Puls ' + m.ref : 'pro 100 m';
    const stand = !J ? 'Noch kein aktueller Stand' : J.alt ? 'Letzter Stand: ' + monatName(J.bis) + ' · seitdem keine passende Einheit' : 'Stand: Median der letzten ' + (J.duenn ? 'Einheiten' : 'sechs Wochen') + ' · ' + J.n + (id === 'lauf' ? ' Läufe' : id === 'rad' ? ' Fahrten' : ' Einheiten');
    let zweit = null;
    if (id === 'lauf' && m.tempo && m.tempo.jetzt && J && !J.alt) zweit = 'Bei Puls ' + m.ref + ': ' + mmss(m.tempo.jetzt) + '\u00a0/km' + (m.tempo[EW_VGL] ? ' · vor ' + (EW_VGL === 12 ? 'einem Jahr' : EW_VGL + ' Monaten') + ' ' + mmss(m.tempo[EW_VGL]) + '\u00a0/km' : '');
    if (id === 'schwimmen' && m.zuege && m.zuege.jetzt) zweit = nf(m.zuege.jetzt.v, 1) + ' Züge pro 25 m' + (m.zuege.vergleich[EW_VGL] ? ' · vor ' + (EW_VGL === 12 ? 'einem Jahr' : EW_VGL + ' Monaten') + ' ' + nf(m.zuege.vergleich[EW_VGL].v, 1) : '');
    c.append(el('div', { class: 'tf-ew-kopf' },
      el('small', { class: 'tf-ew-was', text: D.name + (id === 'rad' ? '' : '') }),
      el('div', { class: 'tf-ew-zahl' }, el('b', { class: 'num tf-zahl-gross', text: J ? D.f(J.v * k) : '–' }), el('span', { text: einheit })),
      dl ? el('p', { class: 'tf-ew-d ' + dl.ton, id: 'ew-delta' }, svgIco(dl.richtung === 0 ? 'i-minus' : 'i-pfeil'), el('span', { text: dl.wort + ': ' + dl.text + ' ' + dl.wann })) : el('p', { class: 'tf-ew-d gleich', id: 'ew-delta', text: J && J.alt ? 'Kein Vergleich – der letzte Stand ist älter als drei Monate' : 'Zum Vergleich ' + wannTxt(EW_VGL).replace('zu ', '') + ' fehlen passende Einheiten' }),
      el('small', { class: 'tf-ew-stand', text: stand }), zweit ? el('p', { class: 'tf-ew-zweit num', text: zweit }) : null));
    c.append(el('div', { class: 'tf-chart tf-ew-chart', id: 'ew-chart', style: 'min-height:220px' }),
      el('div', { class: 'tf-legend tf-ew-leg' }, el('span', null, el('i', { class: 'tf-line', style: 'background:var(--tf-' + D.farbe + ')' }), 'Monatsmedian'), el('span', null, el('i', { style: 'background:var(--tf-fg3)' }), 'einzelne Einheit'), el('span', null, el('i', { class: 'tf-ew-leg-v' }), wannTxt(EW_VGL).replace('zu ', '')), el('span', { class: 'tf-ew-oben', text: 'oben ist besser' + (id === 'lauf' ? ' – weniger Schläge' : id === 'rad' ? ' – mehr Watt' : ' – schneller') })));
    const ERKL = {
      lauf: 'Herzschläge pro Kilometer = Puls × Minuten pro Kilometer. Weniger heißt: Dein Herz arbeitet für dasselbe Tempo sparsamer – mehr Blut pro Schlag, mehr Mitochondrien. Verglichen werden nur lockere Läufe ab 3 km und 20 min, steigungsbereinigt. Hitze, Müdigkeit und Infekte heben den Wert.',
      rad: 'Watt pro Herzschlag aus lockeren Fahrten ab 30 min, umgerechnet auf Puls ' + m.ref + '. Mehr heißt: Dieselbe Leistung kostet dein Herz weniger. Auf der Rolle ist es oft wärmer – das drückt den Wert.',
      schwimmen: 'Zeit pro 100 m aus Becken-Einheiten ab 400 m in deiner üblichen Beckenlänge, ohne Pausen. Viele Technik-Übungen machen den Wert langsamer, ohne dass du schlechter wirst – darum zählen die Züge pro Bahn mit.',
    };
    c.appendChild(el('p', { class: 'tf-note tf-ew-erkl', text: ERKL[id] }));
    const p = E.regel && E.regel.pause;
    if (p && p.bis >= M().plus(localDate(), -16 * 7)) c.appendChild(el('p', { class: 'tf-ew-pause', id: 'ew-pause' }, svgIco('i-info'), el('span', { text: 'Pause vom ' + datumKurz(p.von) + ' bis ' + datumKurz(p.bis) + ' (' + p.wochen + ' Wochen): ' + M().ANPASSUNG_PAUSE.text })));
    return c;
  }
  function ewSpanne(id, m) { // wo der Wert jetzt in seiner 12-Monats-Spanne steht – rechts ist besser
    if (!m.spanne || !m.jetzt || m.spanne[1] - m.spanne[0] <= 0) return null;
    const [lo, hi] = m.spanne, k = ewSkala(id, m), pos = (v) => { const x = Math.max(0, Math.min(1, (v - lo) / (hi - lo))); return Math.round(100 * (m.gut < 0 ? 1 - x : x)); }, vg = m.vergleich[EW_VGL], D = EWD[id];
    const schlecht = m.gut < 0 ? hi : lo, gut = m.gut < 0 ? lo : hi;
    return el('span', { class: 'tf-ew-sp', role: 'img', 'aria-label': '12 Monate: ' + D.f(schlecht * k) + ' bis ' + D.f(gut * k) + ', jetzt ' + D.f(m.jetzt.v * k) + (vg ? ', ' + wannTxt(EW_VGL).replace('zu ', '') + ' ' + D.f(vg.v * k) : '') },
      el('span', { class: 'tf-ew-sp-b' }, vg ? el('i', { class: 'tf-ew-sp-d', style: 'left:' + pos(vg.v) + '%' }) : null, el('i', { class: 'tf-ew-sp-j', style: 'left:' + pos(m.jetzt.v) + '%' })),
      el('small', { class: 'num', text: D.f(schlecht * k) }), el('small', { class: 'num', text: D.f(gut * k) }));
  }
  function ewKoerper(E) {
    const ids = ['puls', 'hrv', 'vo2', 'entkopplung', 'kadenz', 'kontakt', 'fitness'], rows = [];
    ids.forEach((id) => {
      const m = E.marker[id]; if (!m || !m.jetzt) return;
      const z = ewZeile(id), b = el('button', { type: 'button', class: 'tf-ew-z', 'data-ew': id },
        el('span', { class: 'tf-ew-zt' }, el('b', { text: z.name }), el('small', { text: z.sub })),
        el('span', { class: 'tf-ew-zw' }, el('b', { class: 'num', text: z.wert }), z.delta ? el('small', { class: 'tf-ew-d ' + z.ton, text: z.delta }) : el('small', { class: 'tf-ew-d gleich', text: m.jetzt.alt ? 'ohne Vergleich' : 'noch kein Vergleich' })),
        ewSpanne(id, m));
      b.addEventListener('click', () => T.geh(z.ziel));
      rows.push(b);
    });
    const kr = ewZeile('kraft');
    if (kr) { const b = el('button', { type: 'button', class: 'tf-ew-z', 'data-ew': 'kraft' }, el('span', { class: 'tf-ew-zt' }, el('b', { text: kr.name }), el('small', { text: kr.sub })), el('span', { class: 'tf-ew-zw' }, el('b', { class: 'num', text: kr.wert }), kr.delta ? el('small', { class: 'tf-ew-d gleich', text: kr.delta }) : null)); b.addEventListener('click', () => T.geh('training/gym')); rows.push(b); }
    if (!rows.length) return null;
    return el('section', { class: 'tf-ew-teil', id: 'ew-koerper' }, el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Was sich in deinem Körper verändert', el('small', { text: 'Jetzt gegen ' + wannTxt(EW_VGL).replace('zu ', '') + ' · die Linie zeigt die Spanne der letzten 12 Monate, rechts ist besser' })),
      el('div', { class: 'tf-card tf-ew-liste' }, ...rows));
  }
  function ewFakten(E) {
    const F = M().entwicklungFakten(E, { nf, mmss }, EW_VGL), L = E.lauf;
    if (L && L.jetzt && !L.jetzt.alt) { // dein bester Monat – wenn du gerade darüber liegst
      const best = L.monate.filter((x) => x.v != null && x.n >= 3).sort((a, b) => a.v - b.v)[0];
      if (best && L.jetzt.v > best.v * 1.03) F.push({ id: 'lauf_best', ton: 'neutral', ziel: 'training/laufen', text: 'Dein bester Monat war ' + monatName(best.mo + '-01') + ': ' + nf(Math.round(best.v)) + ' Herzschläge pro Kilometer – jetzt sind es ' + nf(Math.round(L.jetzt.v)) + '.', sub: 'Median aus ' + best.n + ' lockeren Läufen. Regelmäßige lockere Kilometer bringen dich dorthin zurück.', quelle: '' });
    }
    if (!F.length) return null;
    const p = E.regel && E.regel.pause, kurzPause = p && p.bis >= M().plus(localDate(), -16 * 7);
    return el('section', { class: 'tf-ew-teil', id: 'ew-fakten' }, el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Fakten über dich', el('small', { text: 'Nur, was deine Daten tragen' })),
      el('div', { class: 'tf-ew-fl' }, ...F.slice(0, 5).map((f) => {
        const b = el('button', { type: 'button', class: 'tf-card tf-ew-f ' + f.ton, 'data-fakt': f.id },
          el('p', { class: 'tf-ew-ft', text: f.text }), el('small', { class: 'tf-ew-fs', text: f.sub + (kurzPause && f.ton === 'achtung' ? ' Deine Pause im Herbst steckt mit drin.' : '') }),
          f.quelle ? el('small', { class: 'tf-ew-fq' }, svgIco('i-book'), f.quelle) : null);
        b.addEventListener('click', () => T.geh(f.ziel));
        return b;
      })));
  }
  function ewUhr(E) {
    const R = E.regel || { wochen: 0 }, w = R.wochen, A0 = M().ANPASSUNG;
    const ol = el('ol', { class: 'tf-ew-ul', role: 'list' });
    const du = el('li', { class: 'tf-ew-du', id: 'ew-du' }, el('b', { text: w ? 'Du: seit ' + w + (w === 1 ? ' Woche' : ' Wochen') + ' regelmäßig' : 'Du: gerade keine regelmäßige Woche' }),
      el('small', { text: (w ? 'Seit ' + datumKurz(R.seit) + ' jede Woche mindestens zwei Ausdauereinheiten oder 90 Minuten' : 'Jede Woche mit zwei Ausdauereinheiten oder 90 Minuten zählt') + (R.aktiv52 ? ' · ' + R.aktiv52 + ' solche Wochen im letzten Jahr' : '') }));
    let hier = false;
    A0.forEach((s) => {
      const ok = w >= s.ab;
      if (!ok && !hier) { ol.appendChild(du); hier = true; }
      ol.appendChild(el('li', { class: 'tf-ew-us' + (ok ? ' ok' : ''), 'data-a': s.id }, el('small', { class: 'tf-ew-uw', text: s.wann }), el('b', { text: s.titel }), el('p', { text: s.text }), el('small', { class: 'tf-ew-uq' }, svgIco('i-book'), s.quelle)));
    });
    if (!hier) ol.appendChild(du);
    return el('section', { class: 'tf-ew-teil', id: 'ew-uhr' }, el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Die Anpassungsuhr', el('small', { text: 'Was sich wann verändert – und wo du gerade stehst' })),
      el('div', { class: 'tf-card tf-ew-uhr' }, ol, el('p', { class: 'tf-note', text: 'Richtwerte aus Studien – je nach Training, Alter und Veranlagung früher oder später. Gezählt werden Wochen in Folge mit mindestens zwei Ausdauereinheiten oder 90 Minuten.' })));
  }
  function ewGewohnheiten() {
    const TL = trends().filter((t) => ['schlaf', 'schritte', 'tagesform'].includes(t.id)), g = bestaendig(28), kids = [];
    if (g) kids.push(el('div', { class: 'tf-zeile tf-tr-z tf-ew-gw' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-pink)' }, svgIco('i-star')), el('span', { class: 'tf-zeile-t' }, el('b', { text: 'Beständigste Gewohnheit: ' + g[0] }), el('small', { class: 'tf-tr-satz', text: g[2] + ' in den letzten 4 Wochen' }))));
    TL.forEach((t) => {
      const b = el('button', { type: 'button', class: 'tf-zeile tf-tr-z' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + t.farbe + ')' }, svgIco(t.icon)),
        el('span', { class: 'tf-zeile-t' }, el('b', null, t.name + ' ', pfeil(t)), el('small', { class: 'tf-tr-satz', text: trendLang(t) })), svgIco('i-chev'));
      b.lastChild.classList.add('tf-chev'); b.addEventListener('click', () => T.geh(t.ziel)); kids.push(b);
    });
    if (!kids.length) return null;
    return el('section', { class: 'tf-ew-teil', id: 'ew-gewohnheiten' }, el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Gewohnheiten', el('small', { text: 'Letzte 4 Wochen gegen die Monate davor' })), el('div', { class: 'tf-links tf-tr-liste' }, ...kids));
  }
  function renderTrends() { // Version 53: die Seite heißt „Deine Entwicklung“ (Route training/entwicklung, früher gesundheit/trends)
    const box = $('#trends-box'); if (!box) return;
    const E = T.ohne() ? null : sicher(entwicklung), h = localDate(), frag = [];
    const sports = E ? ['lauf', 'rad', 'schwimmen'].filter((id) => E[id] && E[id].punkte.filter((p) => p.date > M().plus(h, -364)).length >= 3) : [];
    const koerper = E ? Object.values(E.marker || {}).some((m) => m && m.jetzt) : false;
    if (!sports.length && !koerper) {
      frag.push(el('article', { class: 'tf-card tf-ew-leer' }, el('h2', { text: 'Hier entsteht deine Entwicklung' }), trendFortschritt(reihen(), h)));
      const gw = ewGewohnheiten(); if (gw) frag.push(gw);
      box.replaceChildren(el('div', { class: 'tf-hub tf-ew' }, ...frag));
      return;
    }
    if (!sports.includes(EW_SPORT)) EW_SPORT = sports.slice().sort((a, b) => { const j = (id) => (E[id].jetzt && !E[id].jetzt.alt ? 1 : 0); return j(b) - j(a) || sports.indexOf(a) - sports.indexOf(b); })[0] || null;
    frag.push(el('div', { class: 'tf-filter tf-ew-filter' }, el('small', { text: 'Vergleich mit' }), seg([[3, 'vor 3 Monaten'], [6, 'vor 6'], [12, 'vor 12']], EW_VGL, (v) => { EW_VGL = v; renderTrends(); }, 'Vergleich mit', 'tf-ew-vgl-seg')));
    if (EW_SPORT) frag.push(ewHeld(E, sports));
    [ewKoerper(E), ewFakten(E), ewUhr(E), ewGewohnheiten()].forEach((x) => { if (x) frag.push(x); });
    const story = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-karten'), ' Monatsrückblick ansehen');
    story.addEventListener('click', () => storyOeffnen(vormonat(h)));
    const jahr = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Jahresrückblick ' + h.slice(0, 4));
    jahr.addEventListener('click', () => storyOeffnen(h.slice(0, 4)));
    const meth = el('button', { type: 'button', class: 'tf-gym-link' }, svgIco('i-book'), ' So rechnet Dreiklang');
    meth.addEventListener('click', () => T.geh('wissen/methodik'));
    frag.push(el('section', { class: 'tf-ew-teil', id: 'ew-rueckblick' }, el('h2', { class: 'tf-hub-sek tf-sek-unter' }, 'Rückblick', el('small', { text: 'Dein Monat oder Jahr als ruhiges Bild' })), el('div', { class: 'tf-form-actions' }, story, jahr)), el('p', { class: 'tf-ew-fuss' }, meth));
    box.replaceChildren(el('div', { class: 'tf-hub tf-ew' }, ...frag));
    if (EW_SPORT) requestAnimationFrame(() => sicher(() => ewChart($('#ew-chart'), EW_SPORT, { vgl: EW_VGL })));
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
  window.tfRueckblick = { trends, kurz, entwicklung, ewZeile, ewChart, ewDelta: (id, n) => ewDelta(id, ewMetrik(id), n || EW_VGL), ewMetrik, storyOeffnen, reihen, pfeil, trendSatz, posterMalen: (k) => { const { Z, K } = storyKarten(k); return posterMalen(Z, K); }, posterBlatt: (k) => { const { Z, K } = storyKarten(k); return posterBlatt(Z, K); } };
})();
