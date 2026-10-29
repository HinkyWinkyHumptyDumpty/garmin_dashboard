/* Tagesform · Spiel: XP, Quests, Trophy Road, Trophäen, Profilbild und Banner.
   Die Regeln stehen in spiel-motor.js. Hier werden die Daten gesammelt, der Spielstand gespeichert
   (rechner.spiel) und alles dargestellt – auf Heute, im Profil und auf vier eigenen Seiten. */
(function () {
  'use strict';
  const T = window.tfApp, M = window.tfSpielMotor;
  if (!T || !M) return;
  const { $, el, svg, nf, rowsOf, svgIco, setMsg, localDate, plot, roundTop, hoverBands, col, hm, iso, toDay, DAY } = T.ui;
  const A = () => dash.app;
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const ruhig = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const uhr = (h) => { if (h == null || !isFinite(h)) return '–'; const m = Math.round((((h % 24) + 24) % 24) * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const datumKurz = (d) => (d ? +d.slice(8, 10) + '.' + +d.slice(5, 7) + '.' + d.slice(2, 4) : '');

  /* =====================================================================
     Daten sammeln, rechnen, speichern
     ===================================================================== */
  function planDaten(heute) {
    if (!window.tfPlan || !tfPlan.bilanz) return { tage: null, wochen: null };
    try { return tfPlan.bilanz(heute) || { tage: null, wochen: null }; } catch (e) { console.warn('Plan für das Spiel:', e); return { tage: null, wochen: null }; }
  }
  function sammeln() {
    const st = A().state, r = st.rechner || {}, a = athlet(), heute = localDate();
    const ampel = {}; (rowsOf('erholung') || []).forEach((x) => { if (x.score != null) ampel[x.date] = x.ampel; });
    if (st.ohne) (rowsOf('gefuehl') || []).forEach((x) => { if (x.score != null && !ampel[x.date]) ampel[x.date] = x.ampel; }); // ohne Uhr: Tagesform nach Gefühl
    const pl = planDaten(heute), tb = A().raw('tagebuch') || [];
    const ziele = { wasser: 0, protein: 0, wasserAm: {} };
    try { if (window.tfAlltag) { const z = tfAlltag.ziele(heute); ziele.wasser = z.w.ml; ziele.protein = z.p.g; tb.forEach((x) => { if (x && x.date && x.date >= iso(toDay(heute) - 60 * DAY)) ziele.wasserAm[x.date] = tfAlltag.ziele(x.date).w.ml; }); } } catch (e) { /* ohne Ziele keine Trink-Quests */ }
    return {
      heute, garmin: !st.ohne, tage: A().raw('garmin_tage') || [], einheiten: A().raw('garmin_einheiten') || [], checkins: A().raw('checkins') || [],
      gym: (r.gym && r.gym.log) || [], flow: (r.flow && r.flow.log) || [], plan: pl.tage, planWochen: pl.wochen, ampel, tagebuch: tb, ziele,
      profil: { schritte_ziel: a.schritte_ziel, schlafbedarf_min: a.schlafbedarf_min, sportarten: a.sportarten, schritte_dyn: a.schritte_dyn },
      spiel: r.spiel || {}, extra: { foto: !!st.avatar, planDa: !!(r.plan && r.plan.v === 1), planErstellt: r.plan && r.plan.erstellt },
    };
  }
  let MEMO = { teile: null, r: null };
  function stand() {
    const st = A().state; if (st.status !== 'ok' || !rowsOf('athlet')) return null;
    const teile = [A().raw('garmin_tage'), A().raw('garmin_einheiten'), A().raw('checkins'), st.rechner, rowsOf('athlet'), rowsOf('erholung'), localDate(), st.avatar ? 1 : 0, st.ohne, A().konto().uid, st.frisch, A().raw('tagebuch'), st.ohne ? rowsOf('gefuehl') : null];
    if (MEMO.r && MEMO.teile.every((x, i) => x === teile[i])) return MEMO.r;
    if (MEMO.teile && MEMO.teile[9] !== teile[9]) FEIER = []; // anderes Konto: keine fremden Feiern
    let r;
    try { r = M.berechne(sammeln()); } catch (e) { console.error('Spiel:', e); return null; }
    MEMO = { teile, r };
    if (!st.frisch) return r; // erst mit bestätigten Serverdaten speichern und feiern – sonst überschreibt ein altes Gerät den Stand
    if (r.geaendert) speichern(r.spiel);
    vormerken(r);
    return r;
  }
  let saveT = null;
  function speichern(sp, sofort) {
    A().setRechner(Object.assign({}, A().state.rechner || {}, { spiel: sp }));
    clearTimeout(saveT);
    if (!A().state.frisch) return;
    saveT = setTimeout(() => A().api('POST', '/api/rechner', { spiel: sp })
      .then((j) => { // der Server führt Stände mehrerer Geräte zusammen
        if (j && j.spiel && M.kanon(j.spiel) !== M.kanon((A().state.rechner || {}).spiel || {})) { A().setRechner(Object.assign({}, A().state.rechner || {}, { spiel: j.spiel })); T.neu(); }
      })
      .catch((e) => console.warn('Spielstand nicht gespeichert:', e.message)), sofort ? 0 : 900);
  }
  const spiel = () => JSON.parse(JSON.stringify((A().state.rechner || {}).spiel || {}));
  function aendern(fn) { const sp = spiel(); fn(sp); speichern(sp); T.neu(); }
  // Wissen: gelesener Begriff zählt für Quests und Trophäen
  function gelesen(id) {
    if (!id || A().state.status !== 'ok') return;
    const sp = spiel(), d = localDate();
    sp.tage = sp.tage || {}; sp.gelesen = Array.isArray(sp.gelesen) ? sp.gelesen : [];
    const neuTag = !String(sp.tage[d] || '').includes('w'), neuBegriff = !sp.gelesen.includes(id);
    if (!neuTag && !neuBegriff) return;
    if (neuTag) sp.tage[d] = String(sp.tage[d] || '') + 'w';
    if (neuBegriff) sp.gelesen = sp.gelesen.concat([id]).slice(-60);
    speichern(sp);
  }

  /* =====================================================================
     Auswahl: Profilbild, Banner, Rahmen, Titel
     ===================================================================== */
  function name() {
    const a = athlet(); if (a.name) return a.name;
    const m = (A().konto().email || '').split('@')[0].split(/[._-]/)[0];
    return m ? m[0].toUpperCase() + m.slice(1) : 'Du';
  }
  const initialen = () => name().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
  function wahl(R) {
    const w = (spiel().wahl || {}), f = R ? R.freigeschaltet : { banner: ['bronze'], rahmen: ['bronze'], titel: ['t1'], abzeichen: [] };
    const st = R ? R.level.stufe.id : 'bronze', trOk = (id) => R && R.trophaeen.some((t) => t.id === id && t.erreicht);
    const titelAuto = 't' + Math.max(...f.titel.map((x) => +x.slice(1)));
    let av = w.avatar || 'init';
    if (av === 'foto' && !A().state.avatar) av = 'init';
    if (/^lv\d+$/.test(av) && !f.abzeichen.includes(av)) av = 'init';
    if (/^tr:/.test(av) && !trOk(av.slice(3))) av = 'init';
    if (!w.avatar && A().state.avatar) av = 'foto'; // eigenes Foto ist Standard, wenn es eins gibt
    return {
      avatar: av, banner: w.banner && f.banner.includes(w.banner) ? w.banner : st, rahmen: w.rahmen && f.rahmen.includes(w.rahmen) ? w.rahmen : st,
      titel: w.titel && f.titel.includes(w.titel) ? w.titel : titelAuto, auto: { banner: !w.banner, rahmen: !w.rahmen, titel: !w.titel },
    };
  }
  const titelText = (id) => M.TITEL[+String(id).slice(1)] || '';

  /* =====================================================================
     Medaillen, Abzeichen, Avatar
     ===================================================================== */
  const MATERIAL = {
    bronze: ['#f7cc9f', '#c98048', '#6f3714'], silber: ['#ffffff', '#b1bbc6', '#56616e'], gold: ['#fff3ad', '#eeb321', '#8a5d00'], platin: ['#eefdff', '#7fd0dc', '#24616e'],
    diamant: ['#efeaff', '#8f7dff', '#33259f'], meister: ['#ffdba8', '#ff4f60', '#7f0b29'], legende: ['#fff4c8', '#f2b42c', '#2d2152'],
  };
  const FORM = { bronze: 'kreis', silber: 'hex', gold: 'schild', platin: 'hex', diamant: 'raute', meister: 'schild', legende: 'sonne' };
  const polygon = (n, r, cx, cy, start) => Array.from({ length: n }, (_, i) => { const a = ((start + (360 / n) * i) * Math.PI) / 180; return (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); }).join('') + 'Z';
  const kreis = (r, cx, cy) => 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0Z';
  const sonne = (() => { let d = ''; for (let i = 0; i < 16; i++) { const a = (i * 22.5 * Math.PI) / 180, b = 0.15; const p = (r, w) => (50 + r * Math.cos(w)).toFixed(2) + ' ' + (50 + r * Math.sin(w)).toFixed(2); d += 'M' + p(36, a - b) + 'L' + p(48, a) + 'L' + p(36, a + b) + 'Z'; } return d + kreis(38, 50, 50); })();
  const FORMEN = {
    kreis: { aussen: kreis(44, 50, 50), innen: kreis(36, 50, 50), ico: [27, 27, 46] },
    hex: { aussen: polygon(6, 45, 50, 50, -90), innen: polygon(6, 37, 50, 50, -90), ico: [28, 28, 44] },
    schild: { aussen: 'M50 5L87 17V47C87 70 71 86 50 95C29 86 13 70 13 47V17Z', innen: 'M50 13L79 23V47C79 65 67 78 50 86C33 78 21 65 21 47V23Z', ico: [29, 25, 42] },
    raute: { aussen: 'M50 4L96 50L50 96L4 50Z', innen: 'M50 15L85 50L50 85L15 50Z', ico: [31, 31, 38] },
    sonne: { aussen: sonne, innen: kreis(30, 50, 50), ico: [30, 30, 40] },
    medaille: { aussen: kreis(34, 50, 60), innen: kreis(27, 50, 60), ico: [33, 43, 34], band: true },
  };
  let gid = 0;
  function medaille(o) { // { stufe, form, icon, zahl, gesperrt }
    const id = 'tfm' + (++gid), c = MATERIAL[o.stufe] || MATERIAL.bronze, F = FORMEN[o.form || FORM[o.stufe] || 'kreis'];
    const s = sv('svg', { viewBox: '0 0 100 100', class: 'tf-med' + (o.gesperrt ? ' tf-med-zu' : ''), 'aria-hidden': 'true', focusable: 'false' });
    const defs = sv('defs', null, s), g = sv('linearGradient', { id: id + 'g', x1: '0.1', y1: '0', x2: '0.9', y2: '1' }, defs);
    [[0, c[0]], [0.48, c[1]], [1, c[2]]].forEach(([p, f]) => sv('stop', { offset: p, 'stop-color': f }, g));
    if (o.stufe === 'legende' || o.stufe === 'diamant') { // schillernder Rand
      const r = sv('linearGradient', { id: id + 'r', x1: '0', y1: '1', x2: '1', y2: '0' }, defs);
      (o.stufe === 'legende' ? ['#7cf3d7', '#b388ff', '#ffb3c7', '#f2b42c'] : ['#ffffff', '#b9adff', '#ffffff', '#8f7dff']).forEach((f, i, L) => sv('stop', { offset: i / (L.length - 1), 'stop-color': f }, r));
    }
    if (F.band) { // Band der Trophäen-Medaille
      sv('path', { d: 'M30 4H46L56 34H40Z', fill: c[2] }, s); sv('path', { d: 'M70 4H54L44 34H60Z', fill: c[1] }, s);
      sv('path', { d: 'M30 4H46L48 10H32Z', fill: 'rgba(255,255,255,.25)' }, s);
    }
    sv('path', { d: F.aussen, fill: 'url(#' + id + 'g)', stroke: o.stufe === 'legende' || o.stufe === 'diamant' ? 'url(#' + id + 'r)' : 'url(#' + id + 'g)', 'stroke-width': o.stufe === 'legende' || o.stufe === 'diamant' ? 3 : 5, 'stroke-linejoin': 'round' }, s);
    sv('path', { d: F.innen, fill: 'rgba(0,0,0,.10)', stroke: 'rgba(255,255,255,.55)', 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, s);
    sv('path', { d: F.aussen, fill: 'url(#' + id + 'gl)', opacity: 0.9 }, s);
    const gl = sv('linearGradient', { id: id + 'gl', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    sv('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.42 }, gl); sv('stop', { offset: 0.45, 'stop-color': '#fff', 'stop-opacity': 0.0 }, gl); sv('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.12 }, gl);
    const [x, y, w] = F.ico;
    if (o.zahl != null) {
      const t = sv('text', { x: 50, y: (F.band ? 60 : 50) + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'tf-med-zahl', fill: '#fff', 'font-size': String(o.zahl).length > 2 ? 30 : 38 }, s);
      t.textContent = o.zahl;
    } else if (o.icon) {
      sv('use', { href: '#' + o.icon, x, y: y + 1.6, width: w, height: w, fill: 'none', stroke: c[2], 'stroke-opacity': 0.45, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      sv('use', { href: '#' + o.icon, x, y, width: w, height: w, fill: 'none', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    }
    if (o.gesperrt) { const k = sv('g', { class: 'tf-med-schloss' }, s); sv('circle', { cx: 78, cy: 80, r: 14, fill: 'var(--tf-card)' }, k); sv('use', { href: '#i-lock', x: 68, y: 70, width: 20, height: 20, fill: 'none', stroke: 'var(--tf-fg2)', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, k); }
    return s;
  }
  // Abzeichen: Level-Abzeichen (lvN) oder Trophäe (tr:id)
  function abzeichen(id) {
    if (/^lv\d+$/.test(id)) { const L = +id.slice(2), a = M.ABZEICHEN[L]; if (!a) return null; const st = M.stufeVon(L).id; return { id, name: a[0], icon: a[1], stufe: st, form: L === 70 ? 'sonne' : FORM[st], level: L }; }
    if (/^tr:/.test(id)) { const t = M.TR_BY[id.slice(3)]; if (!t) return null; return { id, name: t.name, icon: t.icon, stufe: t.stufe, form: 'medaille', trophae: t }; }
    return null;
  }
  const medVon = (id, gesperrt) => { const a = abzeichen(id); return a ? medaille({ stufe: a.stufe, form: a.form, icon: a.icon, gesperrt }) : null; };
  function avatar(gr, o) { // Profilbild mit Rahmen der Stufe
    o = o || {};
    const R = o.R || stand(), w = Object.assign(wahl(R), o.wahl || {});
    const box = el('span', { class: 'tf-av tf-st-' + w.rahmen + (['diamant', 'meister', 'legende'].includes(w.rahmen) ? ' tf-av-glanz' : ''), style: '--gr:' + gr + 'px', 'aria-hidden': 'true' });
    let innen;
    if (w.avatar === 'foto' && A().state.avatar) innen = el('img', { src: A().state.avatar, alt: '' });
    else if (w.avatar !== 'init' && abzeichen(w.avatar)) innen = el('span', { class: 'tf-av-med' }, medVon(w.avatar));
    else innen = el('span', { class: 'tf-av-init', text: initialen() });
    box.appendChild(el('span', { class: 'tf-av-in' }, innen));
    return box;
  }
  function xpBalken(R, klein) {
    const L = R.level, b = el('span', { class: 'tf-xpbar tf-st-' + L.stufe.id + (klein ? ' tf-xpbar-k' : ''), role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(L.anteil * 100), 'aria-label': 'Fortschritt zum nächsten Level' });
    const i = el('i'); i.style.width = Math.max(2, Math.round(L.anteil * 1000) / 10) + '%'; b.appendChild(i);
    return b;
  }
  const levelText = (L) => (L.nr === M.MAX_LEVEL ? 'Level 70' + (L.sterne ? ' · ' + L.sterne + (L.sterne === 1 ? ' Stern' : ' Sterne') : '') : 'Level ' + L.nr);
  const xpText = (L) => (L.bis ? nf(L.xp - L.von) + ' / ' + nf(L.bis - L.von) + ' XP' : nf(L.xp) + ' XP');
  const fehltText = (L) => (L.bis ? 'noch ' + nf(L.fehlt) + ' XP bis Level ' + (L.nr + 1) : 'noch ' + nf(L.fehlt) + ' XP bis zum nächsten Stern');

  /* =====================================================================
     Quests
     ===================================================================== */
  const Q_ZIEL = { schritte: 'gesundheit/aktivitaet', schritte_plus: 'gesundheit/aktivitaet', spaziergang: 'gesundheit/aktivitaet', bewegung30: 'training', locker: 'training/plan', kraft: 'training/gym', mobil: 'training/flow', frueh: 'training', plan: 'training/plan', schlaf: 'gesundheit/schlaf', bettzeit: 'gesundheit/schlaf', erholung: 'heute/tagesform', checkin: 'gesundheit/checkin', wissen: 'wissen',
    who150: 'gesundheit/aktivitaet', einheiten3: 'training', kraft2: 'training/gym', schlaf5: 'gesundheit/schlaf', schritte_w: 'gesundheit/aktivitaet', aktiv5: 'gesundheit/aktivitaet', checkin3: 'gesundheit/checkin', mobil2: 'training/flow', regel: 'gesundheit/schlaf', plan80: 'training/plan', locker80: 'training/umfang', ruhetag: 'heute/tagesform', wissen3: 'wissen',
    wasser: 'gesundheit/protokoll', protein: 'gesundheit/protokoll', routine: 'training/flow', checkin7: 'gesundheit/checkin', schritte3: 'gesundheit/aktivitaet', wasser5: 'gesundheit/protokoll', routine3: 'training/flow', schlaf75: 'gesundheit/schlaf' };
  function questStatus(q) {
    if (q.status === 'nacht') return 'Wird morgen früh geprüft';
    if (q.status === 'laeuft') return 'Läuft bis Mitternacht – bisher eingehalten';
    const vs = (u) => nf(q.wert) + ' von ' + nf(q.ziel) + (u ? ' ' + u : '');
    switch (q.id) {
      case 'schritte': case 'schritte_plus': return q.fertig ? 'Geschafft – ' + nf(q.wert) + ' Schritte' : vs('Schritten');
      case 'spaziergang': return q.fertig ? 'Geschafft' : nf(q.wert) + ' von 5.000 Schritten';
      case 'bewegung30': case 'locker': case 'mobil': return q.fertig ? 'Geschafft – ' + nf(q.wert) + ' min' : vs('min');
      case 'plan': return q.wert + ' von ' + q.ziel + (q.ziel === 1 ? ' Einheit' : ' Einheiten') + ' erledigt';
      case 'schlaf': return q.wert ? hm(q.wert / 60) + ' h geschlafen' + (q.fertig ? '' : ' – knapp verfehlt') : 'Keine Schlafdaten für diese Nacht';
      case 'bettzeit': return q.wert != null ? 'Eingeschlafen um ' + uhr(q.wert) + ' Uhr' : 'Keine Schlafdaten für diese Nacht';
      case 'erholung': return q.fertig ? 'Eingehalten' : 'Hartes Training erkannt';
      case 'who150': return vs('min');
      case 'schritte_w': return vs('Schritten');
      case 'schlaf5': return vs('Nächten');
      case 'aktiv5': return vs('Tagen');
      case 'regel': return vs('Abenden');
      case 'plan80': return q.wert + ' von ' + q.ziel + ' Einheiten';
      case 'locker80': return q.wert ? q.wert + ' % locker – Ziel 80 %' : 'Noch keine Einheit mit Puls';
      case 'ruhetag': return q.fertig ? 'Erledigt' : 'Noch kein Ruhetag in dieser Woche';
      case 'einheiten3': case 'kraft2': case 'checkin3': case 'mobil2': case 'wissen3': case 'checkin7': case 'routine3': return vs('');
      case 'schritte3': case 'wasser5': return vs('Tagen');
      case 'schlaf75': return vs('Nächten');
      case 'wasser': return q.fertig ? 'Geschafft – ' + nf(q.wert / 1000, 1) + ' l' : nf(q.wert / 1000, 1) + ' von ' + nf(q.ziel / 1000, 1) + ' l';
      case 'protein': return q.fertig ? 'Geschafft – ' + nf(q.wert) + ' g' : vs('g');
      default: return q.fertig ? 'Erledigt' : q.status === 'verpasst' ? 'Nicht geschafft' : 'Noch offen';
    }
  }
  const anteil = (q) => (q.fertig ? 1 : q.id === 'bettzeit' || q.id === 'erholung' || q.status === 'nacht' ? 0 : Math.max(0, Math.min(1, (q.wert || 0) / (q.ziel || 1))));
  function ring(a, farbe, icon, fertig) {
    const s = sv('svg', { viewBox: '0 0 44 44', class: 'tf-q-ring', 'aria-hidden': 'true' }), r = 19, u = 2 * Math.PI * r;
    sv('circle', { cx: 22, cy: 22, r, fill: 'none', stroke: 'var(--tf-fill)', 'stroke-width': 4 }, s);
    if (a > 0) sv('circle', { cx: 22, cy: 22, r, fill: 'none', stroke: 'var(--tf-' + farbe + ')', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': (u * a).toFixed(1) + ' ' + u.toFixed(1), transform: 'rotate(-90 22 22)' }, s);
    if (fertig) { sv('circle', { cx: 22, cy: 22, r: 15, fill: 'var(--tf-' + farbe + ')' }, s); sv('use', { href: '#i-check', x: 12, y: 12, width: 20, height: 20, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s); }
    else sv('use', { href: '#' + icon, x: 13, y: 13, width: 18, height: 18, fill: 'none', stroke: 'var(--tf-' + farbe + ')', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    return s;
  }
  function questZeile(q, o) {
    o = o || {};
    const b = el('button', { type: 'button', class: 'tf-q tf-q-' + q.status + (o.gross ? ' tf-q-gross' : '') + (q.art === 'woche' ? ' tf-q-woche' : ''), style: '--c:var(--tf-' + q.farbe + ')' },
      ring(anteil(q), q.farbe, q.icon, q.fertig),
      el('span', { class: 'tf-q-t' }, el('b', { text: q.titel }), el('small', { text: questStatus(q) }), o.gross ? el('span', { class: 'tf-q-text', text: q.text }) : null, o.gross && q.quelle ? el('span', { class: 'tf-q-quelle', text: q.quelle }) : null),
      el('span', { class: 'tf-q-xp' + (q.fertig ? ' an' : ''), text: '+' + q.xp + ' XP' }));
    if (q.art === 'woche' && !q.fertig) { const bar = el('span', { class: 'tf-q-bar' }, el('i')); bar.firstChild.style.width = Math.round(anteil(q) * 100) + '%'; b.querySelector('.tf-q-t').appendChild(bar); }
    b.addEventListener('click', () => T.geh(Q_ZIEL[q.id] || 'profil/quests'));
    return b;
  }

  /* =====================================================================
     Heute: Spielstand und Quests
     ===================================================================== */
  function heuteKarte() {
    const box = $('#home-spiel'); if (!box) return;
    const R = stand(); if (!R) { box.replaceChildren(); return; }
    const L = R.level, Q = R.quests.heute, fertig = Q.filter((q) => q.fertig).length, W = R.quests.woche, wf = W.filter((q) => q.fertig).length;
    const kopf = el('button', { type: 'button', class: 'tf-sp-hk', 'aria-label': levelText(L) + ', ' + L.stufe.name + ' – Trophy Road öffnen' },
      avatar(46, { R }),
      el('span', { class: 'tf-sp-hk-t' }, el('b', null, levelText(L), el('span', { class: 'tf-sp-stufe tf-st-' + L.stufe.id, text: L.stufe.name })), el('small', { text: fehltText(L) }), xpBalken(R, true)),
      el('span', { class: 'tf-sp-hk-x' + (R.heuteXp ? ' an' : '') }, el('b', { class: 'num', text: '+' + nf(R.heuteXp) }), el('small', { text: 'XP heute' })));
    kopf.addEventListener('click', () => T.geh('profil/road'));
    const liste = el('div', { class: 'tf-sp-ql' }, ...Q.map((q) => questZeile(q)));
    const fuss = el('div', { class: 'tf-sp-hf' });
    const wb = el('button', { type: 'button', class: 'tf-sp-hf-b' }, svgIco('i-cal'), el('span', { text: 'Wochenquests ' + wf + '/' + W.length }));
    wb.addEventListener('click', () => T.geh('profil/quests'));
    const tb = el('button', { type: 'button', class: 'tf-sp-hf-b' }, svgIco('i-trophy'), el('span', { text: 'Trophäen ' + R.trophaeen.filter((t) => t.erreicht).length }));
    tb.addEventListener('click', () => T.geh('profil/trophaeen'));
    fuss.append(wb, tb);
    const card = el('article', { class: 'tf-card tf-sp-heute', id: 'karte-spiel' }, kopf,
      el('div', { class: 'tf-sp-qk' }, el('h3', { text: 'Deine Quests heute' }), el('span', { class: 'tf-sp-qz' + (fertig === Q.length ? ' an' : ''), text: fertig === Q.length ? 'Alle geschafft · +' + M.TAG_BONUS + ' Bonus' : fertig + ' von ' + Q.length })),
      liste, fuss);
    box.replaceChildren(card);
    zeigeFeierBald();
  }

  /* =====================================================================
     Profil: Spielerkarte und Kacheln
     ===================================================================== */
  function spielerKarte(o) {
    o = o || {};
    const R = o.R || stand(); if (!R) return null;
    const w = Object.assign(wahl(R), o.wahl || {}), L = R.level;
    const serie = R.quests.serie || R.quests.serieLetzte;
    const bearb = o.vorschau ? null : el('button', { type: 'button', class: 'tf-sp-bearb', 'aria-label': 'Profilbild und Banner ändern' }, svgIco('i-edit'), el('span', { text: 'Anpassen' }));
    if (bearb) bearb.addEventListener('click', () => T.geh('profil/avatar'));
    const karte = el('article', { class: 'tf-card tf-sp-karte', id: o.vorschau ? null : 'karte-spieler' },
      el('div', { class: 'tf-sp-banner tf-bn tf-bn-' + w.banner }, bearb),
      el('div', { class: 'tf-sp-kopf' }, avatar(o.vorschau ? 76 : 84, { R, wahl: o.wahl }),
        el('div', { class: 'tf-sp-name' }, el('b', { text: o.name != null ? o.name || name() : name() }), el('small', { text: titelText(w.titel) }))),
      el('div', { class: 'tf-sp-lv' }, el('span', { class: 'tf-sp-lv-nr' }, el('b', { text: levelText(L) }), el('span', { class: 'tf-sp-stufe tf-st-' + L.stufe.id, text: L.stufe.name })), el('span', { class: 'tf-sp-lv-xp', text: xpText(L) })),
      xpBalken(R),
      el('p', { class: 'tf-sp-fehlt', text: fehltText(L) + ' · ' + nf(R.xp) + ' XP gesamt' }));
    if (!o.vorschau) {
      const stat = (wert, txt, ziel) => { const b = el('button', { type: 'button' }, el('b', { class: 'num', text: wert }), el('small', { text: txt })); b.addEventListener('click', () => T.geh(ziel)); return b; };
      karte.appendChild(el('div', { class: 'tf-sp-stats' },
        stat(R.trophaeen.filter((t) => t.erreicht).length + '/' + R.trophaeen.length, 'Trophäen', 'profil/trophaeen'),
        stat(String(serie), serie === 1 ? 'Woche in Folge' : 'Wochen in Folge', 'profil/quests'),
        stat('+' + nf(R.heuteXp), 'XP heute', 'profil/quests')));
      zeigeFeierBald();
    }
    return karte;
  }
  function profilKacheln() {
    const R = stand(); if (!R || !window.tfHubs) return null;
    const K = tfHubs.kachel, Q = R.quests.heute, f = Q.filter((q) => q.fertig).length, naechste = M.ROAD[R.level.nr] || null;
    const nb = naechste ? naechste.belohnungen.map(belohnungText).join(' + ') : 'Alles freigeschaltet';
    const tr = R.trophaeen.filter((t) => t.erreicht).length, w = wahl(R);
    return el('div', { class: 'tf-kacheln tf-sp-kacheln' },
      K({ ziel: 'profil/quests', titel: 'Quests', icon: 'i-target', farbe: 'orange', wert: f + '/' + Q.length, sub: 'heute erledigt · ' + R.quests.woche.filter((q) => q.fertig).length + '/' + R.quests.woche.length + ' in der Woche', erkl: 'Kleine Aufgaben für Bewegung, Schlaf und Erholung – jede bringt XP.' }),
      K({ ziel: 'profil/road', titel: 'Trophy Road', icon: 'i-trophy', farbe: 'gold', wert: 'Level ' + R.level.nr + ' · ' + R.level.stufe.name, txt: true, sub: naechste ? 'Als Nächstes: ' + nb : nb, erkl: 'Mit jedem Level schaltest du Abzeichen, Banner, Rahmen und Titel frei.' }),
      K({ ziel: 'profil/trophaeen', titel: 'Trophäen', icon: 'i-medal', farbe: 'purple', wert: tr + '/' + R.trophaeen.length, sub: (() => { const t = R.trophaeen.filter((x) => x.erreicht).sort((a, b) => (a.erreicht < b.erreicht ? 1 : -1))[0]; return t ? 'Zuletzt: ' + t.name : 'Erste Trophäe wartet'; })(), erkl: 'Besondere Leistungen wie dein erster Halbmarathon – auch rückwirkend aus deinen Daten.' }),
      K({ ziel: 'profil/avatar', titel: 'Profilbild & Banner', icon: 'i-camera', farbe: 'pink', wert: 'Banner ' + M.BANNER[w.banner], txt: true, sub: w.avatar === 'foto' ? 'Eigenes Foto' : w.avatar === 'init' ? 'Initialen' : 'Abzeichen „' + (abzeichen(w.avatar) || {}).name + '“', erkl: 'Eigenes Foto oder ein freigeschaltetes Abzeichen, dazu Banner deiner Stufe.' }));
  }
  function belohnungText(b) {
    if (b.art === 'abzeichen') return 'Abzeichen „' + abzeichen(b.id).name + '“';
    if (b.art === 'banner') return 'Banner „' + M.BANNER[b.id] + '“';
    if (b.art === 'rahmen') return 'Rahmen ' + M.STUFEN.find((s) => s.id === b.id).name;
    return 'Titel „' + titelText(b.id) + '“';
  }

  /* =====================================================================
     Seite: Quests
     ===================================================================== */
  const QUELLEN_XP = [
    ['bewegung', 'Bewegung', 'orange', 'Jede Minute Training = 1 XP, egal welche Sportart. Ab 2 Stunden am Tag zählt jede Minute halb, nach 5 Stunden nicht mehr. An roten Tagen bringen harte Minuten keine XP.'],
    ['schritte', 'Schritte', 'green', '1 XP je 200 Schritte bis 10.000, danach 1 XP je 400 Schritte – bis zu 75 XP am Tag. Auch ohne Sport sammelst du so jeden Tag.'],
    ['schlaf', 'Schlaf', 'indigo', '10 XP ab 7 Stunden, weitere 10 XP, wenn du dein Schlafziel erreichst.'],
    ['quests', 'Quests', 'gold', 'Täglich 3 Quests (15–40 XP), wöchentlich 3 Quests (60–150 XP).'],
    ['bonus', 'Boni', 'purple', '+' + M.TAG_BONUS + ' XP für alle Tagesquests, +' + M.WOCHEN_BONUS + ' XP für alle Wochenquests, ein Serienbonus für jede Woche in Folge mit 150 Bewegungsminuten – und +20 XP „klug erholt“, wenn du an einem roten Tag nichts Hartes machst.'],
    ['sonst', 'Check-in, App & Plan', 'teal', '10 XP je Check-in, 10 XP je Eintrag aus Gym oder Pilates & Yoga (höchstens 3 am Tag), 15 XP je erledigter Plan-Einheit.'],
    ['trophaeen', 'Trophäen', 'pink', 'Bronze 50, Silber 100, Gold 200, Platin 400 XP.'],
  ];
  function renderQuests() {
    const box = $('#spiel-quests-box'); if (!box) return;
    const R = stand(); if (!R) return;
    const Q = R.quests.heute, W = R.quests.woche, f = Q.filter((q) => q.fertig).length, wf = W.filter((q) => q.fertig).length;
    const serie = R.quests.serie || R.quests.serieLetzte, frag = [];
    frag.push(el('div', { class: 'tf-hub-sum tf-sp-sum' },
      el('div', null, el('small', { text: 'Heute' }), el('span', { class: 'num', text: '+' + nf(R.heuteXp) }), el('em', { text: 'XP' })),
      el('div', null, el('small', { text: 'Tagesquests' }), el('span', { class: 'num', text: f + '/' + Q.length }), el('em', { text: f === Q.length ? 'Bonus geholt' : 'alle: +' + M.TAG_BONUS + ' XP' })),
      el('div', null, el('small', { text: 'Serie' }), el('span', { class: 'num', text: String(serie) }), el('em', { text: serie === 1 ? 'Woche' : 'Wochen' }))));
    frag.push(el('h2', { class: 'tf-hub-sek' }, 'Heute', el('small', { text: 'neue Quests jeden Tag' })));
    frag.push(el('div', { class: 'tf-sp-qliste' }, ...Q.map((q) => questZeile(q, { gross: true }))));
    const mo = new Date(R.heute + 'T00:00:00Z'), so = new Date(mo.getTime() + (6 - ((mo.getUTCDay() + 6) % 7)) * 864e5);
    frag.push(el('h2', { class: 'tf-hub-sek' }, 'Diese Woche', el('small', { text: wf + ' von ' + W.length + ' · bis Sonntag, ' + so.getUTCDate() + '.' + (so.getUTCMonth() + 1) + '.' })));
    frag.push(el('div', { class: 'tf-sp-qliste' }, ...W.map((q) => questZeile(q, { gross: true }))));
    frag.push(el('p', { class: 'tf-note tf-sp-bonus' }, svgIco('i-gift'), ' Alle drei Wochenquests: +' + M.WOCHEN_BONUS + ' XP. Jede Woche in Folge mit ' + (R.garmin ? '150 Bewegungsminuten' : '3 Einheiten') + ' bringt zusätzlich 20 XP pro Woche der Serie (bis 200 XP).'));
    if (!R.garmin) frag.push(el('p', { class: 'tf-note tf-sp-bonus' }, svgIco('i-sync'), ' Mit Garmin kommen Schritte, Schlaf und automatisch erkannte Einheiten als Quests und XP dazu.'));
    // Verlauf
    const vk = el('article', { class: 'tf-card tf-span2', id: 'karte-xp-verlauf' },
      el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: 'background:var(--tf-gold)' }, svgIco('i-bars')), el('div', null, el('h2', { text: 'Deine XP der letzten 14 Tage' }), el('div', { class: 'tf-sub', text: 'Woher deine Punkte kommen' }))));
    const ch = el('div', { class: 'tf-chart', id: 'chart-xp' });
    vk.append(ch, el('div', { class: 'tf-legend' }, ...QUELLEN_XP.slice(0, 6).map(([, n, c]) => el('span', null, el('i', { class: 'tf-key', style: 'background:var(--tf-' + c + ')' }), n))));
    frag.push(el('h2', { class: 'tf-hub-sek', text: 'Verlauf' }), vk);
    // So gibt es XP
    const lk = el('article', { class: 'tf-card tf-sp-regeln' },
      el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: 'background:var(--tf-orange)' }, svgIco('i-star')), el('div', null, el('h2', { text: 'So sammelst du XP' }), el('div', { class: 'tf-sub', text: 'Regelmäßigkeit zählt mehr als Härte' }))),
      el('div', { class: 'tf-sp-regel-l' }, ...QUELLEN_XP.map(([, n, c, t]) => el('div', { class: 'tf-sp-regel' }, el('i', { class: 'tf-key', style: 'background:var(--tf-' + c + ')' }), el('div', null, el('b', { text: n }), el('p', { text: t }))))),
      el('p', { class: 'tf-note', text: 'Tagesform belohnt, was dich gesünder und fitter macht: Bewegung, Schlaf, Erholung und Regelmäßigkeit. An Tagen mit roter Tagesform gibt es Quests fürs Erholen statt für Leistung – und lange Einheiten bringen ab 2 Stunden nur noch halbe XP. Startguthaben: deine 30 Tage vor dem ersten Öffnen.' }));
    frag.push(el('h2', { class: 'tf-hub-sek', text: 'Regeln' }), lk);
    box.replaceChildren(el('div', { class: 'tf-hub' }, ...frag));
    xpChart(ch, R);
    zeigeFeierBald();
  }
  function xpChart(elm, R) {
    const V = R.verlauf, keys = V.map((v) => v.datum), byKey = new Map(V.map((v) => [v.datum, v]));
    const teil = (v, k) => (!v.teile ? 0 : k === 'sonst' ? v.teile.checkin + v.teile.app + v.teile.plan : k === 'bonus' ? v.teile.bonus + v.teile.trophaeen + (v.teile.klug || 0) : v.teile[k] || 0);
    const top = Math.max(100, ...V.map((v) => v.summe)) * 1.08;
    const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const lab = (d) => WT[new Date(d + 'T00:00:00Z').getUTCDay()];
    const P = plot(elm, { h: 200, y: [0, top], ny: 4, xband: keys, xfmt: lab, xlabw: 26, label: 'XP pro Tag' });
    const bw = Math.min(22, P.xs.bandwidth()), ord = ['bewegung', 'schritte', 'schlaf', 'quests', 'bonus', 'sonst'], farbe = { bewegung: 'orange', schritte: 'green', schlaf: 'indigo', quests: 'gold', bonus: 'purple', sonst: 'teal' };
    V.forEach((v) => {
      const x = P.xs(v.datum) + (P.xs.bandwidth() - bw) / 2; let acc = 0;
      const segs = ord.filter((k) => teil(v, k) > 0);
      segs.forEach((k, i) => { const y0 = P.ys(acc), y1 = P.ys(acc + teil(v, k)); acc += teil(v, k); const h = Math.max(0, y0 - y1 - (i < segs.length - 1 ? 1.5 : 0)); if (i === segs.length - 1) svg('path', { d: roundTop(x, y1, bw, h, 5), fill: col(farbe[k]) }, P.g); else svg('rect', { x, y: y1 + 1.5, width: bw, height: h, fill: col(farbe[k]) }, P.g); });
    });
    hoverBands(elm, P, keys, (d) => { const t = new Date(d + 'T00:00:00Z'); return lab(d) + ', ' + t.getUTCDate() + '.' + (t.getUTCMonth() + 1) + '.'; }, (d) => { const v = byKey.get(d); return [{ label: 'Gesamt', value: nf(v.summe) + ' XP' }].concat(ord.filter((k) => teil(v, k) > 0).map((k) => ({ label: QUELLEN_XP.find((q) => q[0] === k)[1], value: nf(teil(v, k)), color: col(farbe[k]) }))).concat(v.quests ? [{ label: 'Quests erledigt', value: String(v.quests) }] : []); });
  }

  /* =====================================================================
     Seite: Trophy Road
     ===================================================================== */
  const RD = { offen: {}, gescrollt: null };
  const ROW = 92;
  const welleX = (i) => [50, 74, 50, 26][i % 4]; // Prozent der Straßenbreite (linke Spalte)
  function renderRoad() {
    const box = $('#spiel-road-box'); if (!box) return;
    const R = stand(); if (!R) return;
    const L = R.level, uid = A().konto().uid;
    if (RD.uid !== uid) { RD.uid = uid; RD.offen = {}; RD.gescrollt = null; }
    const frag = [];
    // Kopf: großes Level-Abzeichen, Fortschritt, nächste Belohnung
    const naechste = M.ROAD[L.nr];
    const held = el('article', { class: 'tf-card tf-rd-held tf-st-' + L.stufe.id },
      el('div', { class: 'tf-rd-held-m' }, medaille({ stufe: L.stufe.id, form: L.nr === M.MAX_LEVEL ? 'sonne' : FORM[L.stufe.id], zahl: L.nr })),
      el('div', { class: 'tf-rd-held-t' },
        el('small', { text: L.stufe.name + ' · ' + titelText(wahl(R).titel) }),
        el('b', { text: levelText(L) }),
        xpBalken(R),
        el('span', { class: 'tf-rd-held-x', text: xpText(L) + ' · ' + fehltText(L) }),
        naechste ? el('span', { class: 'tf-rd-held-n' }, svgIco('i-gift'), ' Level ' + naechste.nr + ': ' + naechste.belohnungen.map(belohnungText).join(' + ')) : el('span', { class: 'tf-rd-held-n', text: 'Du hast die Trophy Road gemeistert. Alle 10.000 XP kommt ein Stern dazu.' })));
    frag.push(held);
    M.STUFEN.forEach((st, i) => {
      const von = st.ab, bis = i < M.STUFEN.length - 1 ? M.STUFEN[i + 1].ab - 1 : M.MAX_LEVEL;
      const zustand = L.nr > bis ? 'fertig' : L.nr >= von ? 'jetzt' : 'zu';
      const naechsteStufe = M.STUFEN.find((s) => s.ab > L.nr);
      const offenStd = zustand === 'jetzt' || (naechsteStufe && naechsteStufe.id === st.id);
      const offen = RD.offen[st.id] != null ? RD.offen[st.id] : offenStd;
      frag.push(stufe(st, von, bis, zustand, offen, R));
    });
    box.replaceChildren(el('div', { class: 'tf-rd' }, ...frag));
    if (RD.gescrollt !== L.nr) { // beim ersten Öffnen zum aktuellen Level
      RD.gescrollt = L.nr;
      requestAnimationFrame(() => { const k = box.querySelector('.tf-rd-k.jetzt'); if (k) { const r = k.getBoundingClientRect(); if (r.top > innerHeight * 0.75 || r.top < 80) window.scrollTo({ top: window.scrollY + r.top - innerHeight * 0.42, behavior: ruhig() ? 'auto' : 'smooth' }); } });
    }
    zeigeFeierBald();
  }
  function stufe(st, von, bis, zustand, offen, R) {
    const L = R.level.nr, n = bis - von + 1, erreicht = Math.max(0, Math.min(n, L - von + 1));
    const alle = M.ROAD.slice(von - 1, bis).flatMap((r) => r.belohnungen);
    const zaehl = (art) => alle.filter((b) => b.art === art).length;
    const zusammen = [zaehl('abzeichen') + ' Abzeichen', zaehl('banner') + (zaehl('banner') === 1 ? ' Banner' : ' Banner'), zaehl('titel') + (zaehl('titel') === 1 ? ' Titel' : ' Titel'), 'Rahmen'].join(' · ');
    const status = zustand === 'fertig' ? 'Geschafft' : zustand === 'jetzt' ? erreicht + ' von ' + n + ' Level' : 'ab Level ' + von + ' · ' + nf(M.xpFuer(von)) + ' XP';
    const kopf = el('button', { type: 'button', class: 'tf-rd-kopf tf-bn tf-bn-' + st.id, 'aria-expanded': String(offen) },
      el('b', { class: 'tf-rd-kopf-n', text: st.name }),
      el('span', { class: 'tf-rd-kopf-s' }, zustand === 'fertig' ? svgIco('i-check') : zustand === 'zu' ? svgIco('i-lock') : null, el('span', { text: status })), svgIco('i-chev'),
      el('small', { class: 'tf-rd-kopf-u', text: 'Level ' + von + '–' + bis + ' · ' + zusammen }));
    kopf.addEventListener('click', () => { RD.offen[st.id] = !offen; renderRoad(); });
    const sec = el('section', { class: 'tf-rd-st tf-st-' + st.id + ' tf-rd-' + zustand + (offen ? ' offen' : ''), 'aria-label': st.name }, kopf);
    if (!offen) return sec;
    const weg = el('div', { class: 'tf-rd-weg', style: 'height:' + n * ROW + 'px' }), bahn = el('div', { class: 'tf-rd-bahn' });
    // Straße
    const s = sv('svg', { class: 'tf-rd-svg', viewBox: '0 0 100 ' + n * ROW, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const pt = (i) => [welleX(von - 1 + i), i * ROW + ROW / 2];
    let d = 'M' + pt(0)[0] + ' 0L' + pt(0)[0] + ' ' + pt(0)[1];
    const seg = [];
    for (let i = 0; i < n - 1; i++) { const [x0, y0] = pt(i), [x1, y1] = pt(i + 1); const c = 'C' + x0 + ' ' + (y0 + ROW / 2) + ' ' + x1 + ' ' + (y1 - ROW / 2) + ' ' + x1 + ' ' + y1; d += c; seg.push('M' + x0 + ' ' + y0 + c); }
    d += 'L' + pt(n - 1)[0] + ' ' + n * ROW;
    sv('path', { d, class: 'tf-rd-strasse' }, s);
    sv('path', { d, class: 'tf-rd-mitte' }, s);
    // Geschafft: bis zum aktuellen Level, das Stück zum nächsten anteilig
    if (erreicht > 0) {
      let g = 'M' + pt(0)[0] + ' 0L' + pt(0)[0] + ' ' + pt(0)[1];
      for (let i = 0; i < Math.min(erreicht, n) - 1; i++) g += seg[i].replace(/^M[^C]*/, '');
      if (zustand === 'fertig') g += 'L' + pt(n - 1)[0] + ' ' + n * ROW;
      sv('path', { d: g, class: 'tf-rd-fertig' }, s);
      if (zustand === 'jetzt' && erreicht < n) sv('path', { d: seg[erreicht - 1], class: 'tf-rd-fertig', pathLength: 100, 'stroke-dasharray': Math.round(R.level.anteil * 100) + ' 100' }, s);
    }
    bahn.appendChild(s); weg.appendChild(bahn);
    for (let i = 0; i < n; i++) {
      const nr = von + i, info = M.ROAD[nr - 1], [x, y] = pt(i), ist = nr === L, ok = nr <= L;
      const k = el('button', { type: 'button', class: 'tf-rd-k ' + (ist ? 'jetzt' : ok ? 'ok' : 'zu'), style: 'left:' + x + '%;top:' + y + 'px', 'aria-label': 'Level ' + nr + (ist ? ', du bist hier' : ok ? ', erreicht' : ', gesperrt') });
      if (ist) k.append(avatar(54, { R }), el('span', { class: 'tf-rd-k-nr num', text: String(nr) }));
      else k.appendChild(medaille({ stufe: st.id, form: FORM[st.id], zahl: nr, gesperrt: !ok }));
      k.addEventListener('click', () => levelBlatt(nr, R));
      const lab = el('button', { type: 'button', class: 'tf-rd-l ' + (ist ? 'jetzt' : ok ? 'ok' : 'zu'), style: 'top:' + y + 'px' },
        el('b', null, 'Level ' + nr, ist ? el('small', { text: ' · du bist hier' }) : !ok ? el('small', { text: ' · ab ' + nf(info.xp) + ' XP' }) : null),
        el('span', { class: 'tf-rd-l-b' }, ...info.belohnungen.map((b) => belohnungChip(b, !ok))),
        ist && R.level.bis ? el('small', { text: fehltText(R.level) }) : null);
      lab.addEventListener('click', () => levelBlatt(nr, R));
      bahn.appendChild(k); weg.appendChild(lab);
    }
    sec.appendChild(weg);
    return sec;
  }
  function belohnungChip(b, zu) {
    if (b.art === 'abzeichen') return el('span', { class: 'tf-rd-c' }, el('span', { class: 'tf-rd-c-m' }, medVon(b.id, zu)), abzeichen(b.id).name);
    if (b.art === 'banner') return el('span', { class: 'tf-rd-c' }, el('span', { class: 'tf-rd-c-bn tf-bn tf-bn-' + b.id + (zu ? ' tf-zu' : '') }), 'Banner ' + M.BANNER[b.id]);
    if (b.art === 'rahmen') return el('span', { class: 'tf-rd-c' }, el('span', { class: 'tf-rd-c-ra tf-st-' + b.id + (zu ? ' tf-zu' : '') }), 'Rahmen');
    return el('span', { class: 'tf-rd-c tf-rd-c-ti' }, '„' + titelText(b.id) + '“');
  }
  function levelBlatt(nr, R) {
    const info = M.ROAD[nr - 1], ok = nr <= R.level.nr, st = info.stufe;
    const box = el('div', { class: 'tf-sp-blatt' },
      el('div', { class: 'tf-sp-blatt-m' }, medaille({ stufe: st.id, form: nr === M.MAX_LEVEL ? 'sonne' : FORM[st.id], zahl: nr, gesperrt: !ok })),
      el('h2', { class: 'tf-w-titel', id: 'sheet-titel', text: 'Level ' + nr }),
      el('p', { class: 'tf-sp-blatt-sub', text: st.name + ' · ' + (ok ? 'erreicht' : 'ab ' + nf(info.xp) + ' XP – noch ' + nf(info.xp - R.xp) + ' XP') }));
    const L = el('div', { class: 'tf-sp-bel' });
    info.belohnungen.forEach((b) => {
      const z = el('div', { class: 'tf-sp-bel-z' });
      if (b.art === 'abzeichen') z.append(el('span', { class: 'tf-sp-bel-m' }, medVon(b.id, !ok)), el('div', null, el('b', { text: 'Abzeichen „' + abzeichen(b.id).name + '“' }), el('small', { text: 'Als Profilbild verwendbar' })));
      else if (b.art === 'banner') z.append(el('span', { class: 'tf-sp-bel-bn tf-bn tf-bn-' + b.id + (ok ? '' : ' tf-zu') }), el('div', null, el('b', { text: 'Banner „' + M.BANNER[b.id] + '“' }), el('small', { text: 'Hintergrund deiner Spielerkarte' })));
      else if (b.art === 'rahmen') z.append(el('span', { class: 'tf-sp-bel-ra' }, avatar(48, { R, wahl: { rahmen: b.id } })), el('div', null, el('b', { text: 'Rahmen ' + M.STUFEN.find((s) => s.id === b.id).name }), el('small', { text: 'Rahmen um dein Profilbild' })));
      else z.append(el('span', { class: 'tf-sp-bel-ti', text: '“' }), el('div', null, el('b', { text: 'Titel „' + titelText(b.id) + '“' }), el('small', { text: 'Steht unter deinem Namen' })));
      if (ok) {
        const nutzen = el('button', { type: 'button', class: 'tf-btn' }, 'Verwenden');
        nutzen.addEventListener('click', () => { aendern((sp) => { sp.wahl = sp.wahl || {}; sp.wahl[b.art === 'abzeichen' ? 'avatar' : b.art] = b.id; }); blattZu(); A().toast('Übernommen'); });
        z.appendChild(nutzen);
      }
      L.appendChild(z);
    });
    box.appendChild(L);
    blatt(box);
  }
  function blatt(node) { if (window.tfWissen && tfWissen.blatt) tfWissen.blatt(node); }
  function blattZu() { if (window.tfWissen) tfWissen.schliessen(); }

  /* =====================================================================
     Seite: Trophäen
     ===================================================================== */
  const TRF = { filter: 'alle' };
  function renderTrophaeen() {
    const box = $('#spiel-trophaeen-box'); if (!box) return;
    const R = stand(); if (!R) return;
    const Tr = R.trophaeen, ok = Tr.filter((t) => t.erreicht), xp = ok.reduce((s, t) => s + t.xp, 0);
    const neueste = ok.slice().sort((a, b) => (a.erreicht < b.erreicht ? 1 : -1))[0];
    const naechste = Tr.filter((t) => !t.erreicht && (R.garmin || !t.garmin)).sort((a, b) => b.anteil - a.anteil)[0];
    const frag = [];
    const ringE = (() => { const s = sv('svg', { viewBox: '0 0 80 80', class: 'tf-tr-ring', 'aria-hidden': 'true' }), r = 34, u = 2 * Math.PI * r; sv('circle', { cx: 40, cy: 40, r, fill: 'none', stroke: 'var(--tf-fill)', 'stroke-width': 8 }, s); sv('circle', { cx: 40, cy: 40, r, fill: 'none', stroke: 'var(--tf-gold)', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': (u * ok.length / Tr.length).toFixed(1) + ' ' + u.toFixed(1), transform: 'rotate(-90 40 40)' }, s); return s; })();
    frag.push(el('article', { class: 'tf-card tf-tr-held' },
      el('div', { class: 'tf-tr-held-r' }, ringE, el('span', { class: 'num' }, el('b', { text: String(ok.length) }), el('small', { text: 'von ' + Tr.length }))),
      el('div', { class: 'tf-tr-held-t' }, el('b', { text: ok.length ? ok.length + ' Trophäen gesammelt' : 'Noch keine Trophäe' }),
        el('small', { text: nf(xp) + ' XP aus Trophäen' + (neueste ? ' · zuletzt „' + neueste.name + '“ am ' + datumKurz(neueste.erreicht) : '') }),
        naechste ? el('span', { class: 'tf-tr-held-n' }, svgIco('i-target'), ' Am nächsten dran: „' + naechste.name + '“ – ' + Math.round(naechste.anteil * 100) + ' %') : null)));
    const fl = el('div', { class: 'tf-seg tf-tr-filter', role: 'group', 'aria-label': 'Trophäen filtern' });
    [['alle', 'Alle'], ['ok', 'Erreicht'], ['offen', 'Offen']].forEach(([v, n]) => { const b = el('button', { type: 'button', 'aria-pressed': String(TRF.filter === v) }, n); b.addEventListener('click', () => { TRF.filter = v; renderTrophaeen(); }); fl.appendChild(b); });
    frag.push(el('div', { class: 'tf-filter', style: 'margin-top:16px' }, fl));
    Object.entries(M.TR_KAT).forEach(([k, [kn, icon, farbe]]) => {
      const L = Tr.filter((t) => t.kat === k && (TRF.filter === 'alle' || (TRF.filter === 'ok' ? t.erreicht : !t.erreicht)));
      if (!L.length) return;
      const n = Tr.filter((t) => t.kat === k), nOk = n.filter((t) => t.erreicht).length;
      frag.push(el('h2', { class: 'tf-hub-sek' }, el('span', { class: 'tf-tr-kat' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + farbe + ')' }, svgIco(icon)), kn), el('small', { text: nOk + ' von ' + n.length })));
      frag.push(el('div', { class: 'tf-tr-grid' }, ...L.map((t) => trophaeKachel(t, R))));
    });
    box.replaceChildren(el('div', { class: 'tf-hub' }, ...frag));
    zeigeFeierBald();
  }
  const fmtWert = (t, x) => (/^lauf_|^rad_|^schwimm_/.test(t.id) ? nf(x, x < 10 ? 1 : 0) + ' km' : /^lang_/.test(t.id) ? nf(x, 1) + ' h' : t.id === 'hoehe_1000' ? nf(x) + ' hm' : nf(x));
  function trophaeKachel(t, R) {
    const ok = !!t.erreicht;
    const b = el('button', { type: 'button', class: 'tf-tr-k' + (ok ? ' ok' : '') + (t.garmin && !R.garmin ? ' tf-tr-garmin' : '') },
      el('span', { class: 'tf-tr-k-m' }, medaille({ stufe: t.stufe, form: 'medaille', icon: t.icon, gesperrt: !ok })),
      el('b', { text: t.name }),
      ok ? el('small', { text: datumKurz(t.erreicht) }) : el('span', { class: 'tf-tr-k-bar' }, el('i', { style: 'width:' + Math.round(t.anteil * 100) + '%' })),
      !ok ? el('small', { text: t.garmin && !R.garmin ? 'mit Garmin' : fmtWert(t, t.wert) + ' / ' + fmtWert(t, t.ziel) }) : null);
    b.addEventListener('click', () => trophaeBlatt(t, R));
    return b;
  }
  const STUFE_NAME = { bronze: 'Bronze', silber: 'Silber', gold: 'Gold', platin: 'Platin' };
  function trophaeBlatt(t, R) {
    const ok = !!t.erreicht;
    const box = el('div', { class: 'tf-sp-blatt' },
      el('div', { class: 'tf-sp-blatt-m' }, medaille({ stufe: t.stufe, form: 'medaille', icon: t.icon, gesperrt: !ok })),
      el('h2', { class: 'tf-w-titel', id: 'sheet-titel', text: t.name }),
      el('p', { class: 'tf-sp-blatt-sub', text: STUFE_NAME[t.stufe] + ' · ' + t.xp + ' XP · ' + M.TR_KAT[t.kat][0] }),
      el('p', { class: 'tf-w-text', text: t.text }));
    if (ok) box.appendChild(el('p', { class: 'tf-sp-blatt-ok' }, svgIco('i-check'), ' Erreicht am ' + datumKurz(t.erreicht) + (t.frueher ? ' – aus deinen Daten vor dem Spielstart' : '')));
    else {
      const bar = el('span', { class: 'tf-tr-k-bar tf-gross' }, el('i', { style: 'width:' + Math.round(t.anteil * 100) + '%' }));
      box.append(bar, el('p', { class: 'tf-note', text: t.garmin && !R.garmin ? 'Diese Trophäe braucht Garmin-Daten.' : 'Bisher: ' + fmtWert(t, t.wert) + ' von ' + fmtWert(t, t.ziel) }));
    }
    const akt = el('div', { class: 'tf-form-actions' });
    if (ok) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, 'Als Profilbild verwenden'); b.addEventListener('click', () => { aendern((sp) => { sp.wahl = sp.wahl || {}; sp.wahl.avatar = 'tr:' + t.id; }); blattZu(); A().toast('Profilbild geändert'); }); akt.appendChild(b); }
    box.appendChild(akt);
    blatt(box);
  }

  /* =====================================================================
     Seite: Profilbild & Banner
     ===================================================================== */
  function renderAvatar() {
    const box = $('#spiel-avatar-box'); if (!box) return;
    const R = stand(); if (!R) return;
    const w = wahl(R), f = R.freigeschaltet, frag = [];
    frag.push(spielerKarte({ R, vorschau: true }));
    // Name
    const msg = el('p', { class: 'tf-form-msg', role: 'status' });
    const inp = el('input', { class: 'tf-input', type: 'text', maxlength: 30, value: athlet().name || '', placeholder: name(), autocomplete: 'nickname', 'aria-label': 'Anzeigename' });
    const sp = el('button', { type: 'button', class: 'tf-btn' }, 'Speichern');
    const nameSpeichern = async () => { const v = inp.value.trim(); if (v === (athlet().name || '')) return; try { setMsg(msg, 'Speichert …'); const j = await A().api('POST', '/api/profil', { name: v || null }); A().patch('athlet', [j.profil]); A().toast(v ? 'Name gespeichert' : 'Name entfernt'); } catch (e) { setMsg(msg, e.message, true); } };
    sp.addEventListener('click', nameSpeichern); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameSpeichern(); });
    frag.push(abschnitt('Name', 'So heißt du auf deiner Spielerkarte. Nur du siehst ihn.', el('div', { class: 'tf-sp-name-f' }, inp, sp), msg));
    // Profilbild
    const fmsg = el('p', { class: 'tf-form-msg', role: 'status' });
    const datei = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/*', class: 'tf-sp-datei', 'aria-label': 'Foto auswählen' });
    datei.addEventListener('change', () => { const fl = datei.files && datei.files[0]; datei.value = ''; if (fl) fotoHochladen(fl, fmsg); });
    const hoch = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-camera'), A().state.avatar ? ' Anderes Foto' : ' Foto wählen');
    hoch.addEventListener('click', () => datei.click());
    const weg = A().state.avatar ? el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-btn-danger' }, 'Foto entfernen') : null;
    if (weg) weg.addEventListener('click', async () => { try { setMsg(fmsg, 'Entfernt …'); await A().api('POST', '/api/profil', { bild: null }); A().setAvatar(null); aendern((s) => { s.wahl = s.wahl || {}; if (s.wahl.avatar === 'foto') delete s.wahl.avatar; }); A().toast('Foto entfernt'); } catch (e) { setMsg(fmsg, e.message, true); } });
    const wahlen = el('div', { class: 'tf-sp-avwahl', role: 'radiogroup', 'aria-label': 'Profilbild' });
    const opt = (id, inhalt, label, gesperrt) => {
      const b = el('button', { type: 'button', class: 'tf-sp-avo' + (w.avatar === id ? ' an' : '') + (gesperrt ? ' zu' : ''), role: 'radio', 'aria-checked': String(w.avatar === id), 'aria-label': label, disabled: gesperrt || null, title: label }, inhalt);
      if (!gesperrt) b.addEventListener('click', () => aendern((s) => { s.wahl = s.wahl || {}; s.wahl.avatar = id; }));
      return b;
    };
    if (A().state.avatar) wahlen.appendChild(opt('foto', el('img', { src: A().state.avatar, alt: '' }), 'Eigenes Foto'));
    wahlen.appendChild(opt('init', el('span', { class: 'tf-av-init', text: initialen() }), 'Initialen'));
    f.abzeichen.forEach((id) => wahlen.appendChild(opt(id, medVon(id), 'Abzeichen ' + abzeichen(id).name)));
    R.trophaeen.filter((t) => t.erreicht).forEach((t) => wahlen.appendChild(opt('tr:' + t.id, medVon('tr:' + t.id), 'Trophäe ' + t.name)));
    const zuL = Object.keys(M.ABZEICHEN).map(Number).filter((L) => L > R.level.nr).slice(0, 4);
    zuL.forEach((L) => wahlen.appendChild(opt('lv' + L, medVon('lv' + L, true), 'Abzeichen ' + M.ABZEICHEN[L][0] + ' – ab Level ' + L, true)));
    const nochZu = Object.keys(M.ABZEICHEN).filter((L) => +L > R.level.nr).length + R.trophaeen.filter((t) => !t.erreicht).length;
    frag.push(abschnitt('Profilbild', 'Ein eigenes Foto, deine Initialen oder ein freigeschaltetes Abzeichen.', el('div', { class: 'tf-form-actions' }, hoch, weg, datei), fmsg, wahlen,
      el('p', { class: 'tf-note', text: 'Noch ' + nochZu + ' Abzeichen und Trophäen warten auf der Trophy Road und bei den Trophäen. Dein Foto wird verkleinert (256 × 256) und nur in deinem Konto gespeichert.' })));
    // Banner
    const bl = el('div', { class: 'tf-sp-bnwahl', role: 'radiogroup', 'aria-label': 'Banner' });
    Object.keys(M.BANNER).forEach((id) => {
      const ok = f.banner.includes(id), lvl = M.ROAD.find((r) => r.belohnungen.some((b) => b.art === 'banner' && b.id === id)).nr;
      const b = el('button', { type: 'button', class: 'tf-sp-bno' + (w.banner === id ? ' an' : '') + (ok ? '' : ' zu'), role: 'radio', 'aria-checked': String(w.banner === id), disabled: ok ? null : true },
        el('span', { class: 'tf-sp-bno-f tf-bn tf-bn-' + id }, ok ? null : svgIco('i-lock')), el('b', { text: M.BANNER[id] }), el('small', { text: ok ? (w.banner === id ? 'gewählt' : 'freigeschaltet') : 'ab Level ' + lvl }));
      if (ok) b.addEventListener('click', () => aendern((s) => { s.wahl = s.wahl || {}; s.wahl.banner = id; }));
      bl.appendChild(b);
    });
    frag.push(abschnitt('Banner', 'Jede Stufe der Trophy Road schaltet zwei Banner frei.', bl));
    // Rahmen
    const rl = el('div', { class: 'tf-sp-rawahl', role: 'radiogroup', 'aria-label': 'Rahmen' });
    M.STUFEN.forEach((st) => {
      const ok = f.rahmen.includes(st.id);
      const b = el('button', { type: 'button', class: 'tf-sp-rao' + (w.rahmen === st.id ? ' an' : '') + (ok ? '' : ' zu'), role: 'radio', 'aria-checked': String(w.rahmen === st.id), disabled: ok ? null : true },
        avatar(52, { R, wahl: { rahmen: st.id } }), el('small', { text: ok ? st.name : 'ab Level ' + st.ab }));
      if (ok) b.addEventListener('click', () => aendern((s) => { s.wahl = s.wahl || {}; s.wahl.rahmen = st.id; }));
      rl.appendChild(b);
    });
    frag.push(abschnitt('Rahmen', 'Der Rahmen um dein Profilbild zeigt deine Stufe – ab Diamant schimmert er.', rl));
    // Titel
    const tl = el('div', { class: 'tf-chipset', role: 'radiogroup', 'aria-label': 'Titel' });
    Object.keys(M.TITEL).forEach((L) => {
      const id = 't' + L, ok = f.titel.includes(id);
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(w.titel === id), 'aria-pressed': String(w.titel === id), disabled: ok ? null : true }, ok ? null : svgIco('i-lock'), (ok ? '' : ' ') + M.TITEL[L], ok ? null : el('small', { text: ' · ab ' + L }));
      if (ok) b.addEventListener('click', () => aendern((s) => { s.wahl = s.wahl || {}; s.wahl.titel = id; }));
      tl.appendChild(b);
    });
    frag.push(abschnitt('Titel', 'Steht unter deinem Namen. Neue Titel gibt es alle fünf Level.', tl));
    const auto = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Banner, Rahmen und Titel automatisch nach Stufe');
    auto.addEventListener('click', () => aendern((s) => { s.wahl = s.wahl || {}; delete s.wahl.banner; delete s.wahl.rahmen; delete s.wahl.titel; }));
    frag.push(el('div', { class: 'tf-form-actions', style: 'margin-top:8px' }, auto));
    box.replaceChildren(el('div', { class: 'tf-hub tf-sp-avseite' }, ...frag));
  }
  function abschnitt(titel, sub, ...inhalt) {
    return el('article', { class: 'tf-card tf-sp-ab' }, el('div', { class: 'tf-card-head' }, el('div', null, el('h2', { text: titel }), sub ? el('div', { class: 'tf-sub', text: sub }) : null)), ...inhalt);
  }
  // Foto: im Browser quadratisch zuschneiden und verkleinern, dann als JPEG speichern
  async function fotoHochladen(file, msg) {
    if (!/^image\//.test(file.type || 'image/')) return setMsg(msg, 'Bitte ein Bild wählen.', true);
    if (file.size > 25e6) return setMsg(msg, 'Das Bild ist zu groß (höchstens 25 MB).', true);
    setMsg(msg, 'Bereite das Bild vor …');
    let bild;
    try { bild = await bildLaden(file); } catch (e) { return setMsg(msg, 'Dieses Bildformat kann dein Browser nicht öffnen – bitte als JPEG oder PNG wählen.', true); }
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), w = bild.width || bild.naturalWidth, h = bild.height || bild.naturalHeight, s = Math.min(w, h);
    x.imageSmoothingQuality = 'high';
    x.drawImage(bild, (w - s) / 2, (h - s) / 2.6, s, s, 0, 0, N, N); // leicht nach oben versetzt: Gesichter sitzen meist oben
    let url = '', q = 0.86;
    for (let i = 0; i < 6; i++) { url = c.toDataURL('image/jpeg', q); if (url.length <= 48000) break; q -= 0.12; }
    if (url.length > 48000) return setMsg(msg, 'Das Bild ließ sich nicht klein genug machen.', true);
    try {
      setMsg(msg, 'Speichert …');
      await A().api('POST', '/api/profil', { bild: url });
      A().setAvatar(url);
      aendern((sp) => { sp.wahl = sp.wahl || {}; sp.wahl.avatar = 'foto'; });
      A().toast('Profilbild gespeichert');
    } catch (e) { setMsg(msg, e.message, true); }
  }
  function bildLaden(file) {
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => bildPerImg(file));
    return bildPerImg(file);
  }
  function bildPerImg(file) {
    return new Promise((ok, fehler) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = () => { URL.revokeObjectURL(u); fehler(new Error('Bild')); }; i.src = u; });
  }

  /* =====================================================================
     Feiern: Willkommen, Level-up, neue Trophäen
     ===================================================================== */
  let FEIER = [], feierOffen = false, feierT = null;
  function vormerken(R) {
    const sp = R.spiel, gesehen = (sp.gesehen && sp.gesehen.lvl) || 1;
    if (R.neu) { FEIER = [{ art: 'start', R }]; return; }
    if (R.level.nr > gesehen && !FEIER.some((f) => f.art === 'level')) FEIER.push({ art: 'level', von: gesehen, R });
    else FEIER.forEach((f) => { if (f.art === 'level') f.R = R; });
    if (R.neueTr.length) FEIER.push({ art: 'trophaeen', ids: R.neueTr.slice(), R });
  }
  function zeigeFeierBald() { clearTimeout(feierT); feierT = setTimeout(zeigeFeier, 450); }
  function zeigeFeier() {
    if (feierOffen || !FEIER.length) return;
    const tab = T.tab();
    if (!['heute', 'profil-hub', 'spiel-quests', 'spiel-road', 'spiel-trophaeen'].includes(tab)) return;
    if (document.body.classList.contains('tf-sheet-offen') || document.querySelector('.tf-fp') || document.querySelector('.tf-overlay:not([hidden])')) return;
    // Level und Trophäen zusammenfassen
    const start = FEIER.find((f) => f.art === 'start'), lv = FEIER.find((f) => f.art === 'level'), trs = [...new Set(FEIER.filter((f) => f.art === 'trophaeen').flatMap((f) => f.ids))];
    const R = (FEIER[FEIER.length - 1] || {}).R; FEIER = [];
    if (!R) return;
    feierOffen = true;
    const L = R.level, stufeF = start || lv ? L.stufe.id : (M.TR_BY[trs[0]] || {}).stufe || L.stufe.id, farben = MATERIAL[stufeF];
    const held = el('div', { class: 'tf-feier-held' });
    const knoepfe = el('div', { class: 'tf-feier-a' });
    const weiter = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, start ? 'Los geht’s' : 'Weiter');
    let inhalt;
    if (start) {
      held.appendChild(medaille({ stufe: L.stufe.id, form: FORM[L.stufe.id], zahl: L.nr }));
      const tr = R.trophaeen.filter((t) => t.erreicht).length;
      inhalt = [el('small', { class: 'tf-feier-k', text: 'Neu in Tagesform' }), el('h2', { id: 'feier-t', text: 'Deine Trophy Road beginnt' }),
        el('p', { text: R.garmin ? 'Ab jetzt bringt dir jede Bewegung XP – jede Einheit von der Uhr, deine Schritte, guter Schlaf, Check-ins und Quests. Mit jedem Level schaltest du Abzeichen, Banner und Titel frei.' : 'Ab jetzt bringt dir jede Einheit XP – Gym, Pilates & Yoga, dein Trainingsplan, Check-ins und Quests. Mit jedem Level schaltest du Abzeichen, Banner und Titel frei. Mit Garmin kommen Schritte, Schlaf und alle Einheiten deiner Uhr dazu.' }),
        R.startXp || tr ? el('div', { class: 'tf-feier-z' },
          el('div', null, el('b', { class: 'num', text: nf(R.startXp) }), el('small', { text: 'XP Startguthaben aus deinen letzten 30 Tagen' })),
          el('div', null, el('b', { class: 'num', text: String(tr) }), el('small', { text: tr === 1 ? 'Trophäe aus deinen Daten (' + nf(R.trXp) + ' XP)' : 'Trophäen aus deinen Daten (' + nf(R.trXp) + ' XP)' }))) : null,
        el('p', { class: 'tf-feier-l', text: 'Du startest auf ' + levelText(L) + ' · ' + L.stufe.name + '.' })];
      const road = el('button', { type: 'button', class: 'tf-btn' }, 'Trophy Road ansehen');
      road.addEventListener('click', () => { zu(); T.geh('profil/road'); });
      knoepfe.append(weiter, road);
    } else if (lv) {
      held.appendChild(medaille({ stufe: L.stufe.id, form: L.nr === M.MAX_LEVEL ? 'sonne' : FORM[L.stufe.id], zahl: L.nr }));
      const bel = M.ROAD.slice(lv.von, L.nr).flatMap((r) => r.belohnungen);
      const neueStufe = M.STUFEN.find((s) => s.ab > lv.von && s.ab <= L.nr);
      inhalt = [el('small', { class: 'tf-feier-k', text: neueStufe ? 'Neue Stufe: ' + neueStufe.name : 'Level-up' }), el('h2', { id: 'feier-t', text: levelText(L) + ' erreicht!' }),
        el('p', { text: bel.length === 1 ? 'Freigeschaltet:' : bel.length + ' Belohnungen freigeschaltet:' }),
        el('div', { class: 'tf-feier-bel' }, ...bel.slice(0, 6).map((b) => belohnungChip(b, false)), bel.length > 6 ? el('span', { class: 'tf-rd-c', text: '+ ' + (bel.length - 6) + ' weitere' }) : null)];
      if (trs.length) inhalt.push(el('p', { class: 'tf-feier-l', text: 'Dazu ' + (trs.length === 1 ? 'eine neue Trophäe: „' + M.TR_BY[trs[0]].name + '“' : trs.length + ' neue Trophäen') + '.' }));
      const road = el('button', { type: 'button', class: 'tf-btn' }, 'Trophy Road');
      road.addEventListener('click', () => { zu(); T.geh('profil/road'); });
      knoepfe.append(weiter, road);
    } else {
      const t0 = M.TR_BY[trs[0]];
      held.appendChild(medaille({ stufe: t0.stufe, form: 'medaille', icon: t0.icon }));
      inhalt = [el('small', { class: 'tf-feier-k', text: trs.length === 1 ? 'Neue Trophäe' : trs.length + ' neue Trophäen' }), el('h2', { id: 'feier-t', text: t0.name }), el('p', { text: t0.text + ' +' + t0.xp + ' XP' })];
      if (trs.length > 1) inhalt.push(el('div', { class: 'tf-feier-bel' }, ...trs.slice(1, 5).map((id) => el('span', { class: 'tf-rd-c' }, el('span', { class: 'tf-rd-c-m' }, medVon('tr:' + id)), M.TR_BY[id].name))));
      const ansehen = el('button', { type: 'button', class: 'tf-btn' }, 'Trophäen ansehen');
      ansehen.addEventListener('click', () => { zu(); T.geh('profil/trophaeen'); });
      knoepfe.append(weiter, ansehen);
    }
    const leinwand = el('canvas', { class: 'tf-feier-konfetti', 'aria-hidden': 'true' });
    const ov = el('div', { class: 'tf-feier tf-st-' + stufeF, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'feier-t' },
      el('div', { class: 'tf-feier-bg' }), leinwand,
      el('div', { class: 'tf-feier-box' }, el('div', { class: 'tf-feier-strahl', 'aria-hidden': 'true' }), held, ...inhalt, knoepfe));
    const vorher = document.activeElement;
    function zu() {
      ov.classList.add('weg'); setTimeout(() => ov.remove(), 220); feierOffen = false;
      aendern((sp) => { sp.gesehen = sp.gesehen || {}; sp.gesehen.lvl = Math.max(L.nr, (sp.gesehen.lvl || 1)); });
      document.removeEventListener('keydown', taste, true);
      if (vorher && vorher.focus && document.contains(vorher)) vorher.focus({ preventScroll: true });
      setTimeout(zeigeFeier, 400);
    }
    function taste(e) {
      if (e.key === 'Escape') { e.preventDefault(); zu(); }
      if (e.key === 'Tab') { const f = [...ov.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    }
    weiter.addEventListener('click', zu);
    ov.querySelector('.tf-feier-bg').addEventListener('click', zu);
    document.addEventListener('keydown', taste, true);
    document.getElementById('tf').appendChild(ov);
    requestAnimationFrame(() => { ov.classList.add('an'); weiter.focus({ preventScroll: true }); });
    if (!ruhig()) konfetti(leinwand, farben.concat(['#ffffff', 'var']));
    if (navigator.vibrate && !ruhig()) try { navigator.vibrate([18, 40, 18]); } catch (e) { /* egal */ }
  }
  function konfetti(c, farben) {
    const F = farben.filter((f) => f[0] === '#'), dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = c.clientWidth || innerWidth, H = c.clientHeight || innerHeight; c.width = W * dpr; c.height = H * dpr;
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    const P = Array.from({ length: 140 }, (_, i) => ({ x: W / 2 + (Math.random() - 0.5) * 60, y: H * 0.36, vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, f: F[i % F.length] }));
    const t0 = performance.now();
    (function bild(t) {
      const dt = Math.min(2.2, 1); x.clearRect(0, 0, W, H);
      P.forEach((p) => { p.vy += 0.32 * dt; p.vx *= 0.992; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.f; x.globalAlpha = Math.max(0, 1 - (t - t0) / 2600); x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); x.restore(); });
      if (t - t0 < 2600 && c.isConnected) requestAnimationFrame(bild); else x.clearRect(0, 0, W, H);
    })(t0);
  }

  /* =====================================================================
     Anmelden bei der App
     ===================================================================== */
  T.zusatz('heute', heuteKarte);
  T.seite('spiel-quests', renderQuests);
  T.seite('spiel-road', renderRoad);
  T.seite('spiel-trophaeen', renderTrophaeen);
  T.seite('spiel-avatar', renderAvatar);
  window.tfSpiel = { stand, avatar, spielerKarte, profilKacheln, gelesen, medaille, wahl, name, zeigeFeierBald };
})();
