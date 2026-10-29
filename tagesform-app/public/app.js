/* Tagesform · Darstellung (alle Zahlen kommen aus den Datensätzen und Berechnungen) */
(function () {
  'use strict';
  const root = document.getElementById('tf');
  if (!root) return;

  const NS = 'http://www.w3.org/2000/svg';
  const DAY = 864e5;
  const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const $ = (s, el) => (el || root).querySelector(s);
  const $$ = (s, el) => Array.from((el || root).querySelectorAll(s));
  const nf = (x, d) => (x == null || !isFinite(x) ? '–' : Number(x).toLocaleString('de-DE', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }));
  const toDay = (s) => new Date(s + 'T00:00:00Z');
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const fmtDay = (d) => d.getUTCDate() + '. ' + MON[d.getUTCMonth()];
  const hm = (h) => { if (h == null || !isFinite(h)) return '–'; const m = Math.round(h * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  const clock = (h) => hm((((h % 24) + 24) % 24));
  const WTAG = { Mo: 'Montag', Di: 'Dienstag', Mi: 'Mittwoch', Do: 'Donnerstag', Fr: 'Freitag', Sa: 'Samstag', So: 'Sonntag' };

  /* ---------- Daten ---------- */
  const info = (id) => (dash.data(id) || {});
  const rowsOf = (id) => { const r = info(id); if (r.status !== 'ok') return null; const d = r.data; return Array.isArray(d) ? d : (d && (d.rows || d.data || d.results)) || []; };
  const okAll = (...ids) => ids.every((id) => info(id).status === 'ok');
  const failedAny = (...ids) => ids.some((id) => ['error', 'declined', 'connect', 'missing'].includes(info(id).status));
  const params = () => Object.assign({ range: 180, tag: null, quelle: 'referenz', cda: 26, ifp: 70 }, (dash.params && dash.params()) || {});
  const parseWhere = (s) => Object.fromEntries(s.split('&').map((p) => p.split('=').map((x) => decodeURIComponent(x))));

  function fill(scope) {
    $$('[data-source][data-field]', scope).forEach((el) => {
      if (el.closest('table') || el.closest('.tf-chart')) return;
      const src = el.getAttribute('data-source');
      if (src.indexOf(' ') >= 0) return;
      const st = info(src).status;
      if (st === 'ok') {
        const rows = rowsOf(src); let row = null;
        if (el.hasAttribute('data-row')) row = rows[+el.getAttribute('data-row')];
        else if (el.hasAttribute('data-where')) { const w = parseWhere(el.getAttribute('data-where')); row = rows.find((x) => Object.keys(w).every((k) => String(x[k]) === w[k])); }
        else return;
        const v = row ? row[el.getAttribute('data-field')] : null;
        el.textContent = v == null || v === '' ? (el.classList.contains('tf-allow-empty') ? '' : '–') : String(v);
        el.classList.remove('dash-skeleton');
      } else if (['error', 'declined', 'connect', 'missing'].includes(st)) {
        el.textContent = '–'; el.classList.remove('dash-skeleton');
      }
    });
  }
  const mark = (el, src, field, where) => { el.setAttribute('data-source', src); el.setAttribute('data-field', field); if (where) el.setAttribute('data-where', where); return el; };

  /* ---------- Darstellungsmodus ---------- */
  function bgOf(el) {
    while (el) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(c)) return c; el = el.parentElement; }
    return null;
  }
  function isDark() {
    const p = document.createElement('span');
    p.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;background:var(--color-bg, transparent)';
    (root.parentElement || root).appendChild(p);
    let c = getComputedStyle(p).backgroundColor; p.remove();
    if (!c || c === 'transparent' || /rgba\(0, 0, 0, 0\)/.test(c)) c = bgOf(root.parentElement);
    if (!c) return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d');
    x.fillStyle = '#7f7f7f'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data;
    return (0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]) / 255 < 0.42;
  }
  function applyTheme() { const t = isDark() ? 'dark' : 'light'; if (root.dataset.theme !== t) { root.dataset.theme = t; return true; } return false; }
  const col = (n) => getComputedStyle(root).getPropertyValue('--tf-' + n).trim();
  const AMPEL = { gruen: 'green', gelb: 'yellow', rot: 'red', kalibrierung: 'gray' };

  /* ---------- SVG-Grundlagen ---------- */
  function svg(tag, attrs, parent) { const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function clear(el) { el.replaceChildren(); el.classList.remove('dash-skeleton'); }
  function failed(el) { clear(el); const d = document.createElement('div'); d.className = 'tf-failed'; d.textContent = 'Konnte nicht geladen werden'; el.appendChild(d); }
  function emptyNote(el, text) { clear(el); const d = document.createElement('div'); d.className = 'tf-empty'; d.textContent = text; el.appendChild(d); }

  function tip(el) {
    const t = document.createElement('div'); t.className = 'tf-tip'; el.appendChild(t);
    return {
      show(x, y, head, lines) {
        t.replaceChildren();
        const h = document.createElement('div'); h.className = 'tf-tip-h'; h.textContent = head; t.appendChild(h);
        lines.forEach((l) => {
          const r = document.createElement('div'); r.className = 'tf-tip-r';
          if (l.color) { const k = document.createElement('i'); k.className = 'tf-key'; k.style.background = l.color; r.appendChild(k); }
          const n = document.createElement('span'); n.textContent = l.label; r.appendChild(n);
          const b = document.createElement('b'); b.textContent = l.value; r.appendChild(b); t.appendChild(r);
        });
        t.classList.add('on');
        const W = el.clientWidth, tw = t.offsetWidth, th = t.offsetHeight;
        let left = x + 14; if (left + tw > W) left = x - tw - 14; if (left < 0) left = Math.max(0, Math.min(W - tw, x - tw / 2));
        let top = y - th - 12; if (top < 0) top = Math.min(y + 14, Math.max(0, el.clientHeight - th));
        t.style.left = left + 'px'; t.style.top = top + 'px';
      },
      hide() { t.classList.remove('on'); },
    };
  }

  function plot(el, o) {
    clear(el);
    const w = Math.max(260, Math.floor(el.clientWidth || 320)), h = o.h;
    const s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': o.label || '' }, el);
    const mt = o.mt == null ? 10 : o.mt, mb = o.mb == null ? 24 : o.mb, ml = o.ml == null ? 2 : o.ml;
    const ys = (o.ylog ? d3.scaleLog() : d3.scaleLinear()).domain(o.y).range([h - mb, mt]);
    if (o.yinvert) ys.range([mt, h - mb]);
    const yt = o.yticks || ys.ticks(o.ny || 4);
    const g = svg('g', null, s);
    const zeroBase = !o.yinvert && ys.domain()[0] === 0; // die Null steht auf der Grundlinie, kein Label nötig
    const labs = yt.map((t) => { const tx = svg('text', { class: 'tf-tick', 'text-anchor': 'start' }, g); tx.textContent = zeroBase && t === 0 ? '' : (o.yfmt || nf)(t); return tx; });
    const lw = labs.reduce((m, t) => Math.max(m, t.getComputedTextLength()), 0);
    const mr = Math.ceil(lw) + 12;
    let xs;
    if (o.xband) xs = d3.scaleBand().domain(o.xband).range([ml, w - mr]).paddingInner(o.pad == null ? 0.38 : o.pad).paddingOuter(0.2);
    else if (o.xlog) xs = d3.scaleLog().domain(o.x).range([ml + 8, w - mr - 8]);
    else if (o.xlin) xs = d3.scaleLinear().domain(o.x).range([ml + 8, w - mr - 8]);
    else xs = d3.scaleUtc().domain(o.x).range([ml + 4, w - mr - 4]);
    yt.forEach((t, i) => { const y = Math.round(ys(t)) + 0.5; svg('line', { x1: ml, x2: w - mr + 4, y1: y, y2: y, class: 'tf-gridline' }, g); labs[i].setAttribute('x', w - mr + 8); labs[i].setAttribute('y', y + 4); });
    const xb = Math.round(h - mb) + 0.5;
    const P = { s, g: svg('g', null, s), xs, ys, w, h, ml, mr, xb, top: mt, o };
    if (o.xaxis !== false) xAxis(g, P);
    return P;
  }

  function xAxis(g, P) {
    const { xs, o, w, mr, xb } = P;
    let ticks, fmt, pos;
    if (o.xband) {
      const dom = xs.domain(), room = Math.max(1, Math.floor((w - mr) / (o.xlabw || 46)));
      const every = Math.max(1, Math.ceil(dom.length / room));
      ticks = dom.filter((_, i) => (dom.length - 1 - i) % every === 0); fmt = o.xfmt || ((d) => d); pos = (d) => xs(d) + xs.bandwidth() / 2;
    } else if (o.xlog || o.xlin) { ticks = o.xtv; fmt = o.xfmt || nf; pos = (d) => xs(d); }
    else {
      const [a, b] = xs.domain(), span = (b - a) / DAY;
      const iv = span <= 45 ? d3.utcMonday.every(1) : span <= 260 ? d3.utcMonth.every(1) : d3.utcMonth.every(2);
      ticks = xs.ticks(iv); pos = (d) => xs(d);
      fmt = span <= 45 ? fmtDay : (d) => MON[d.getUTCMonth()] + (d.getUTCMonth() === 0 ? ' ' + String(d.getUTCFullYear()).slice(2) : '');
    }
    let lastEnd = -Infinity;
    ticks.forEach((t) => {
      const x = pos(t); if (!isFinite(x)) return;
      const tx = svg('text', { class: 'tf-tick', x, y: xb + 16, 'text-anchor': 'middle' }, g); tx.textContent = fmt(t);
      const tw = tx.getComputedTextLength();
      if (x - tw / 2 < lastEnd + 8 || x - tw / 2 < 0 || x + tw / 2 > w - 2) { tx.remove(); return; }
      lastEnd = x + tw / 2;
      if (!o.xband) svg('line', { x1: x, x2: x, y1: xb, y2: xb + 4, class: 'tf-axisline' }, g);
    });
    svg('line', { x1: P.ml, x2: w - mr + 4, y1: xb, y2: xb, class: 'tf-axisline' }, g);
  }

  // Zeiträume ohne Messwerte grau hinterlegen
  function gapShade(P, dates, from, to, minDays) {
    const ds = dates.filter((d) => d >= from && d <= to).sort();
    const segs = []; let prev = null;
    ds.forEach((d) => { if (prev && (toDay(d) - toDay(prev)) / DAY > minDays) segs.push([prev, d]); prev = d; });
    if (prev && (toDay(to) - toDay(prev)) / DAY > minDays) segs.push([prev, to]);
    if (ds.length && (toDay(ds[0]) - toDay(from)) / DAY > minDays) segs.push([from, ds[0]]);
    if (!ds.length) segs.push([from, to]);
    const g = svg('g', { class: 'tf-gap' }, P.g);
    segs.forEach(([a, b]) => {
      const x0 = P.xs(toDay(a)) + 3, x1 = P.xs(toDay(b)) - 3;
      if (x1 - x0 < 6) return;
      svg('rect', { x: x0, y: P.top, width: x1 - x0, height: P.xb - P.top, rx: 6 }, g);
      if (x1 - x0 > 92) { const t = svg('text', { x: (x0 + x1) / 2, y: P.top + 16, 'text-anchor': 'middle' }, g); t.textContent = 'keine Daten'; }
    });
  }

  // Linien und Bänder über Messlücken nicht verbinden
  function breaks(rows, maxDays) {
    const out = [];
    rows.forEach((r, i) => { if (i && (toDay(r.date) - toDay(rows[i - 1].date)) / DAY > maxDays) out.push({ date: rows[i - 1].date }); out.push(r); });
    return out;
  }
  function line(P, rows, x, y, color, width, dash) {
    const gen = d3.line().defined((d) => y(d) != null && isFinite(y(d))).x((d) => P.xs(x(d))).y((d) => P.ys(y(d)));
    return svg('path', { d: gen(rows) || '', fill: 'none', stroke: color, 'stroke-width': width || 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': dash || null }, P.g);
  }
  function band(P, rows, x, y0, y1, color, opacity) {
    const gen = d3.area().defined((d) => y0(d) != null && y1(d) != null).x((d) => P.xs(x(d))).y0((d) => P.ys(y0(d))).y1((d) => P.ys(y1(d)));
    return svg('path', { d: gen(rows) || '', fill: color, opacity: opacity == null ? 0.16 : opacity, stroke: 'none' }, P.g);
  }
  function dots(P, rows, x, y, color, r, opacity) {
    const g = svg('g', null, P.g);
    rows.forEach((d) => { const v = y(d); if (v == null || !isFinite(v)) return; svg('circle', { cx: P.xs(x(d)), cy: P.ys(v), r: r || 2.6, fill: color, opacity: opacity == null ? 0.5 : opacity }, g); });
    return g;
  }
  function endDot(P, xv, yv, color) {
    if (yv == null) return;
    svg('circle', { cx: P.xs(xv), cy: P.ys(yv), r: 5, fill: color, stroke: col('card'), 'stroke-width': 2 }, P.g);
  }
  function refLine(P, yv, color, dash) {
    if (yv == null || !isFinite(P.ys(yv))) return;
    const y = Math.round(P.ys(yv)) + 0.5;
    svg('line', { x1: P.ml, x2: P.w - P.mr + 4, y1: y, y2: y, stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': dash || '5 4' }, P.g);
  }
  function roundTop(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    if (h <= 0) return '';
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
  }

  function hoverTime(el, P, rows, xf, head, lines, marks) {
    const T = tip(el);
    const ch = svg('line', { class: 'tf-crosshair', y1: P.top, y2: P.xb, opacity: 0 }, P.s);
    const hl = (marks || []).map((m) => svg('circle', { r: 5, fill: m.color, stroke: col('card'), 'stroke-width': 2, opacity: 0, 'pointer-events': 'none' }, P.s));
    const ov = svg('rect', { x: P.ml, y: 0, width: Math.max(0, P.w - P.mr - P.ml + 4), height: P.h, fill: 'transparent' }, P.s);
    const xv = rows.map((r) => +xf(r));
    const move = (ev) => {
      if (!rows.length) return;
      const bb = P.s.getBoundingClientRect(), k = P.w / bb.width, x = (ev.clientX - bb.left) * k;
      let i = d3.bisectCenter(xv, +P.xs.invert(x)); i = Math.max(0, Math.min(rows.length - 1, i));
      const r = rows[i], X = P.xs(xf(r));
      ch.setAttribute('x1', X); ch.setAttribute('x2', X); ch.setAttribute('opacity', 1);
      let ty = P.top + 30;
      (marks || []).forEach((m, j) => { const v = m.y(r); if (v == null || !isFinite(v)) { hl[j].setAttribute('opacity', 0); return; } hl[j].setAttribute('cx', X); hl[j].setAttribute('cy', P.ys(v)); hl[j].setAttribute('opacity', 1); if (j === 0) ty = P.ys(v); });
      T.show(X / k, ty / k, head(r), lines(r));
    };
    ov.addEventListener('pointermove', move); ov.addEventListener('pointerdown', move);
    ov.addEventListener('pointerleave', () => { ch.setAttribute('opacity', 0); hl.forEach((d) => d.setAttribute('opacity', 0)); T.hide(); });
  }
  function hoverBands(el, P, keys, head, lines) {
    const T = tip(el);
    keys.forEach((key) => {
      const x = P.xs(key), bw = P.xs.step();
      const r = svg('rect', { x: x - (bw - P.xs.bandwidth()) / 2, y: 0, width: bw, height: P.h, fill: 'transparent' }, P.s);
      const fn = () => { const bb = P.s.getBoundingClientRect(), k = P.w / bb.width; T.show((x + P.xs.bandwidth() / 2) / k, (P.top + 30) / k, head(key), lines(key)); };
      r.addEventListener('pointermove', fn); r.addEventListener('pointerdown', fn); r.addEventListener('pointerleave', () => T.hide());
    });
  }
  const niceLog = (lo, hi) => { const c = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150]; let t = c.filter((v) => v >= lo && v <= hi); while (t.length > 5) t = t.filter((_, i) => i % 2 === 0); return t; };

  /* ---------- Gemeinsame Bausteine ---------- */
  function heute() { const r = rowsOf('heute'); return r && r[0]; }
  function windowRows(rows, range) {
    const h = heute(); if (!h || !rows) return { rows: [], from: null, to: null };
    const to = h.date, from = iso(toDay(to) - (range - 1) * DAY);
    return { rows: rows.filter((r) => r.date >= from && r.date <= to), from, to };
  }
  function rangeButtons() {
    const p = params();
    $$('.tf-range-seg').forEach((seg) => {
      if (!seg.childElementCount) {
        [[30, '1 M'], [90, '3 M'], [180, '6 M'], [365, '1 J']].forEach(([v, l]) => {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.dataset.range = v;
          b.addEventListener('click', () => dash.setParams({ range: v })); seg.appendChild(b);
        });
      }
      $$('button', seg).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.range === +p.range)));
    });
  }
  const TONE = { kritisch: ['red', 'i-alert'], achtung: ['orange', 'i-alert'], gut: ['green', 'i-check'], neutral: ['gray', 'i-info'] };
  function insights(box, pick) {
    if (!box) return;
    const st = info('erkenntnisse').status;
    if (st !== 'ok') { if (failedAny('erkenntnisse')) failed(box); return; }
    const list = pick(rowsOf('erkenntnisse'));
    box.replaceChildren();
    if (!list.length) { emptyNote(box, 'Gerade nichts Auffälliges – alles im Rahmen.'); return; }
    list.forEach((r) => {
      const a = document.createElement('article'); a.className = 'tf-insight tf-fade'; a.id = 'erkenntnis-' + r.id + '-' + box.id;
      const [c, icon] = TONE[r.ton] || TONE.neutral;
      const t = document.createElement('div'); t.className = 'tf-tone'; t.style.background = 'var(--tf-' + c + ')';
      const ic = document.createElementNS(NS, 'svg'); ic.setAttribute('class', 'tf-ico'); ic.style.strokeWidth = '3'; const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#' + icon); ic.appendChild(u); t.appendChild(ic);
      const body = document.createElement('div');
      const h3 = mark(document.createElement('h3'), 'erkenntnisse', 'titel', 'id=' + encodeURIComponent(r.id)); h3.textContent = r.titel;
      const p = mark(document.createElement('p'), 'erkenntnisse', 'text', 'id=' + encodeURIComponent(r.id)); p.textContent = r.text;
      const q = mark(document.createElement('div'), 'erkenntnisse', 'quelle', 'id=' + encodeURIComponent(r.id)); q.className = 'tf-src'; q.textContent = r.quelle;
      body.append(h3, p, q); a.append(t, body); box.appendChild(a);
    });
  }
  function table(tb, src, rows, cells) {
    const body = tb.tBodies[0]; body.replaceChildren();
    rows.forEach((r) => {
      const tr = document.createElement('tr'); tr.setAttribute('data-key', r[tb.getAttribute('data-row-key')]);
      cells.forEach((c) => { const td = document.createElement('td'); if (c.cls) td.className = c.cls; if (c.render) c.render(td, r); else td.textContent = r[c.f] == null ? '–' : String(r[c.f]); tr.appendChild(td); });
      body.appendChild(tr);
    });
  }

  /* ---------- Ring ---------- */
  const ringAnimiert = new Set(); // jeder Ring läuft nur beim ersten Zeichnen ein
  let ringAnimated = false; // Kompatibilität: false setzt alle Ringe zurück (Kontowechsel)
  function ring(el, score, ampel, progress, name) {
    clear(el);
    if (ringAnimated === false) { ringAnimiert.clear(); ringAnimated = true; }
    const key = name || 'tagesform';
    const S = 216, r = 94, sw = 18, c = S / 2, a0 = -135, sweep = 270;
    const s = svg('svg', { width: S, height: S, viewBox: '0 0 ' + S + ' ' + S, role: 'img', 'aria-label': score == null ? 'Kalibrierung' : 'Tagesform ' + score }, el);
    const pt = (a) => [c + r * Math.sin((a * Math.PI) / 180), c - r * Math.cos((a * Math.PI) / 180)];
    const arc = (x0, x1) => { const p0 = pt(x0), p1 = pt(x1); return 'M' + p0[0] + ',' + p0[1] + 'A' + r + ',' + r + ' 0 ' + (x1 - x0 > 180 ? 1 : 0) + ' 1 ' + p1[0] + ',' + p1[1]; };
    svg('path', { d: arc(a0, a0 + sweep), fill: 'none', stroke: col('fill'), 'stroke-width': sw, 'stroke-linecap': 'round' }, s);
    const frac = Math.max(0.012, Math.min(1, progress));
    const end = a0 + sweep * frac;
    const base = col(AMPEL[ampel] || 'gray');
    const c0 = d3.interpolateRgb(base, '#000')(0.18), c1 = d3.interpolateRgb(base, '#fff')(0.12);
    const id = 'tf-ringmask-' + key; // eindeutig je Ring – sonst greift ein Ring auf die Maske eines versteckten zu
    const defs = svg('defs', null, s);
    const m = svg('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: S, height: S }, defs);
    const mp = svg('path', { d: arc(a0, end), fill: 'none', stroke: '#fff', 'stroke-width': sw + 2, 'stroke-linecap': 'round' }, m);
    const g = svg('g', { mask: 'url(#' + id + ')' }, s);
    if (root.dataset.theme === 'dark') g.style.filter = 'drop-shadow(0 0 10px ' + d3.color(base).copy({ opacity: 0.45 }) + ')';
    const n = Math.max(2, Math.ceil((sweep * frac) / 3));
    for (let i = 0; i < n; i++) {
      const x0 = a0 + ((end - a0) * i) / n, x1 = a0 + ((end - a0) * (i + 1)) / n + 0.6;
      svg('path', { d: arc(x0, Math.min(x1, end)), fill: 'none', stroke: d3.interpolateRgb(c0, c1)(i / (n - 1)), 'stroke-width': sw + 2 }, g);
    }
    const pe = pt(end), ps = pt(a0);
    svg('circle', { cx: ps[0], cy: ps[1], r: sw / 2 + 1, fill: c0 }, g);
    svg('circle', { cx: pe[0], cy: pe[1], r: sw / 2 + 1, fill: c1 }, g);
    if (!ringAnimiert.has(key)) {
      const len = mp.getTotalLength();
      mp.style.setProperty('--tf-len', len); mp.setAttribute('stroke-dasharray', len + ' ' + len); mp.classList.add('tf-sweep');
      ringAnimiert.add(key);
    }
  }

  function zbar(el, z, color) {
    clear(el);
    const w = Math.max(120, el.clientWidth || 200), h = 18, pad = 6;
    const s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': z == null ? 'keine Basis' : 'Abweichung ' + nf(z, 1) }, el);
    const xs = d3.scaleLinear().domain([-3, 3]).range([pad, w - pad]).clamp(true);
    svg('rect', { x: pad, y: 7, width: w - 2 * pad, height: 4, rx: 2, fill: col('fill') }, s);
    svg('rect', { x: xs(-0.5), y: 5, width: xs(0.5) - xs(-0.5), height: 8, rx: 4, fill: col('fill') }, s);
    svg('line', { x1: xs(0), x2: xs(0), y1: 3, y2: 15, stroke: col('fg3'), 'stroke-width': 1.5 }, s);
    if (z != null) svg('circle', { cx: xs(z), cy: 9, r: 6, fill: color, stroke: col('card'), 'stroke-width': 2 }, s);
  }

  /* ---------- HEUTE: Key Facts und Wege in die Bereiche ---------- */
  const formText = (t) => (t == null ? 'Fitness minus Ermüdung' : t >= 15 ? 'sehr frisch – gut fürs Rennen' : t >= 5 ? 'frisch und erholt' : t >= -10 ? 'ausgeglichen' : t >= -25 ? 'du trainierst gerade hart' : 'sehr müde – Erholung einplanen');
  const APPS = { // Piktogramme auf Heute je Fokus: [Route, Name, Symbol, Farbe]
    performance: [
      ['training/plan', 'Plan', 'i-cal', 'blue'], ['training/gym', 'Gym', 'i-dumbbell', 'purple'], ['training/flow', 'Pilates & Yoga', 'i-lotus', 'teal'], ['profil/road', 'Trophy Road', 'i-trophy', 'orange'],
      ['gesundheit', 'Gesundheit', 'i-heart', 'pink'], ['gesundheit/checkin', 'Check-in', 'i-smile', 'green'], ['training/saison', 'Ziele', 'i-flag', 'red'], ['wissen', 'Wissen', 'i-book', 'yellow'],
    ],
    fitness: [
      ['training/gym', 'Gym', 'i-dumbbell', 'purple'], ['training/plan', 'Plan', 'i-cal', 'blue'], ['training/flow', 'Pilates & Yoga', 'i-lotus', 'teal'], ['profil/road', 'Trophy Road', 'i-trophy', 'orange'],
      ['gesundheit', 'Gesundheit', 'i-heart', 'pink'], ['gesundheit/checkin', 'Check-in', 'i-smile', 'green'], ['gesundheit/protokoll', 'Notiert', 'i-glass', 'blue'], ['wissen', 'Wissen', 'i-book', 'yellow'],
    ],
    alltag: [
      ['heute/tag', 'Dein Tag', 'i-sun', 'yellow'], ['gesundheit/protokoll', 'Notiert', 'i-glass', 'blue'], ['training/flow', 'Kurz-Routinen', 'i-lotus', 'teal'], ['profil/road', 'Trophy Road', 'i-trophy', 'orange'],
      ['gesundheit', 'Gesundheit', 'i-heart', 'pink'], ['gesundheit/checkin', 'Check-in', 'i-smile', 'green'], ['training/gym', 'Gym', 'i-dumbbell', 'purple'], ['wissen', 'Wissen', 'i-book', 'yellow'],
    ],
  };
  const fokus = () => (window.tfAlltag && tfAlltag.modus ? tfAlltag.modus() : 'performance');
  function appsBauen() {
    const box = $('#home-apps'); if (!box) return;
    const m = fokus(); if (box.dataset.modus === m && box.childElementCount) return;
    box.dataset.modus = m; box.replaceChildren();
    (APPS[m] || APPS.performance).forEach(([r, name, icon, farbe]) => {
      const b = el('button', { type: 'button', class: 'tf-app', 'data-ziel': r },
        el('span', { class: 'tf-app-ico', style: '--c:var(--tf-' + farbe + ')' }, svgIco(icon)), el('span', { class: 'tf-app-t', text: name }));
      b.addEventListener('click', () => geh(r));
      box.appendChild(b);
    });
  }
  function svgIco(name) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'tf-ico'); const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#' + name); s.appendChild(u); return s; }
  const TAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'], MON_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  function renderHome() {
    const sec = $('#heute');
    fill(sec);
    appsBauen();
    const ohne = !!A().state.ohne, H = heute();
    sec.classList.toggle('tf-ohne', ohne);
    if (ohne) { // ohne Garmin: Datum und Begrüßung statt Datensatz
      const d = new Date();
      const t = $('#home-titel'), l = $('#home-lede');
      t.textContent = TAGE_LANG[d.getDay()] + ', ' + d.getDate() + '. ' + MON_LANG[d.getMonth()]; t.classList.remove('dash-skeleton');
      l.textContent = 'Plane dein Training, stell dir ein Workout zusammen oder lies nach, was hinter HRV, Zone 2 & Co. steckt.'; l.classList.remove('dash-skeleton');
      const st = $('.tf-stand'); if (st) { st.textContent = 'ohne Garmin'; st.classList.remove('dash-skeleton'); }
    }
    const ath = (rowsOf('athlet') || [])[0];
    $('#profil-banner').hidden = !ath || ath.bestaetigt !== false || ohne;
    const ckHeute = (dash.app.raw('checkins') || []).some((c) => c.date === localDate());
    $('#checkin-banner').hidden = ckHeute;
    // Laufbudget nur für Läufer
    const S = sportarten();
    $('#kachel-laufbudget').hidden = !S.includes('laufen') || ohne;
    $('#karte-empfehlung').hidden = ohne || fokus() === 'alltag'; // im Alltag ersetzt „Dein Tag“ die Trainingsempfehlung
    $('#erkenntnisse-heute').hidden = $('#erkenntnisse-heute-titel').hidden = ohne;
    $('#home-facts').hidden = ohne;
    const hero = $('#home-hero');
    heroBeschriften(ohne);
    if (ohne) { gefuehlHero(hero); return; }
    hero.hidden = false;
    if (!H) { if (failedAny('erholung', 'heute')) failed($('#home-ring')); return; }
    const w = 'date=' + H.date;
    const progress = H.score != null ? H.score / 100 : Math.min(1, (H.basis_n || 0) / 14);
    ring($('#home-ring'), H.score, H.ampel, progress, 'home');
    const hw = mark($('#home-wert'), 'heute', 'score', null); hw.removeAttribute('data-where'); hw.setAttribute('data-row', '0'); hw.textContent = H.score == null ? '–' : String(H.score);
    $('#home-pct').style.display = H.score == null ? 'none' : '';
    $('#home-label').textContent = H.label || '–';
    $('#home-punkt').style.background = col(AMPEL[H.ampel] || 'gray');
    $('#home-grund').textContent = H.grund || (H.score == null ? 'Deine Basis entsteht – noch ' + Math.max(1, 14 - (H.basis_n || 0)) + ' Nächte' : 'Kein limitierender Faktor');
    const setz = (id, v, u) => { const e = $(id); e.replaceChildren(document.createTextNode(v == null ? '–' : String(v))); if (v != null && u) e.appendChild(el('span', { class: 'tf-u', text: u })); };
    setz('#home-hrv', H.hrv, 'ms'); $('#home-hrv-d').textContent = H.hrv_delta_txt || '';
    setz('#home-rhr', H.rhr, 'bpm'); $('#home-rhr-d').textContent = H.rhr_delta_txt || '';
    setz('#home-schlaf', H.schlaf_hm, 'h'); $('#home-schlaf-d').textContent = H.leistung_pct != null ? H.leistung_pct + ' % des Bedarfs' : '';
    $('#kform-sub').textContent = formText(H.tsb);
    const LW = rowsOf('laufwaechter');
    if (LW && LW[0]) $('#kachel-lauf-ampel').style.background = col(AMPEL[LW[0].ampel] || 'gray');
    insights($('#erkenntnisse-heute'), (rows) => rows.slice(0, 3));
  }

  // Ohne Uhr: Tagesform nur aus dem Check-in (Befinden, auf Wunsch Ruhepuls und Schlafdauer von Hand)
  function heroBeschriften(ohne) {
    const L = $$('#home-hero .tf-home-w > span'), T3 = ohne ? ['Befinden', 'Ruhepuls', 'Schlaf'] : ['HRV', 'Ruhepuls', 'Schlaf'];
    L.forEach((x, i) => { if (T3[i] && x.textContent !== T3[i]) x.textContent = T3[i]; });
    const cap = $('#home-hero .tf-ring-cap'); if (cap) cap.textContent = ohne ? 'nach Gefühl' : 'Tagesform';
    $('#home-hero').setAttribute('aria-label', ohne ? 'Tagesform nach Gefühl – zum Check-in' : 'Tagesform im Detail');
  }
  function gefuehlHero(hero) {
    const g = (rowsOf('gefuehl') || []).find((r) => r.date === localDate());
    hero.hidden = !g;
    if (!g) return;
    ring($('#home-ring'), g.score, g.ampel, g.score / 100, 'home');
    $('#home-wert').textContent = String(g.score); $('#home-pct').style.display = '';
    $('#home-label').textContent = g.label; $('#home-punkt').style.background = col(AMPEL[g.ampel] || 'gray');
    $('#home-grund').textContent = g.grund || (g.basis == null ? 'Dein Normal entsteht – noch ' + Math.max(1, 7 - (g.basis_n || 0)) + ' Check-ins' : 'Aus deinem Check-in');
    const setz = (id, v, u) => { const e = $(id); e.replaceChildren(document.createTextNode(v == null ? '–' : String(v))); if (v != null && u) e.appendChild(el('span', { class: 'tf-u', text: u })); };
    setz('#home-hrv', g.summe, '/25'); $('#home-hrv-d').textContent = g.basis == null ? 'Normal entsteht' : g.z_befinden >= 0.5 ? 'über deinem Normal' : g.z_befinden <= -0.5 ? 'unter deinem Normal' : 'im Normal';
    setz('#home-rhr', g.puls, 'bpm'); $('#home-rhr-d').textContent = g.puls == null ? 'nicht eingetragen' : g.puls_basis != null ? (g.puls - g.puls_basis >= 0 ? '+' : '−') + nf(Math.abs(g.puls - g.puls_basis), 0) + ' zu deinem Schnitt' : 'Schnitt ab 5 Einträgen';
    setz('#home-schlaf', g.schlaf_h != null ? hmin(g.schlaf_h * 3600) : null, 'h'); $('#home-schlaf-d').textContent = g.schlaf_pct != null ? g.schlaf_pct + ' % des Bedarfs' : 'nicht eingetragen';
  }

  /* ---------- TAGESFORM im Detail: Ring, Treiber, 14 Tage ---------- */
  function renderTagesform() {
    const sec = $('#tagesform');
    fill(sec);
    const H = heute();
    const E = rowsOf('erholung');
    if (!H || !E) { if (failedAny('erholung', 'heute')) failed($('#ring-tagesform')); return; }
    const p = params();
    const sel = (p.tag && E.find((r) => r.date === p.tag)) || E.find((r) => r.date === H.date) || E[E.length - 1];
    const w = 'date=' + sel.date;
    // Ring
    const progress = sel.score != null ? sel.score / 100 : Math.min(1, (sel.basis_n || 0) / 14);
    ring($('#ring-tagesform'), sel.score, sel.ampel, progress, 'tagesform');
    const rw = mark($('#ring-wert'), 'erholung', 'score', w); rw.textContent = sel.score == null ? '–' : String(sel.score); rw.classList.remove('dash-skeleton');
    $('#ring-pct').style.display = sel.score == null ? 'none' : '';
    const sl = mark($('#status-label'), 'erholung', 'label', w); sl.textContent = sel.label; sl.classList.remove('dash-skeleton');
    $('#status-punkt').style.background = col(AMPEL[sel.ampel] || 'gray');
    const gr = mark($('#status-grund'), 'erholung', 'grund', w); gr.textContent = sel.grund || (sel.score == null ? 'Noch zu wenige Nächte für deine Basis' : 'Kein limitierender Faktor');
    const wt = mark($('#status-wtag'), 'erholung', 'wtag', w); wt.textContent = sel.wtag;
    const dt = mark($('#status-datum'), 'erholung', 'datum', w); dt.textContent = sel.datum;
    $('#status-ansicht').hidden = sel.date === H.date;
    // Treiber
    const setv = (id, field, v) => { const e = mark($(id), 'erholung', field, w); e.textContent = v == null ? '–' : String(v); };
    setv('#treiber-hrv-wert', 'hrv', sel.hrv); setv('#treiber-hrv-delta', 'hrv_delta_txt', sel.hrv_delta_txt);
    setv('#treiber-rhr-wert', 'rhr', sel.rhr); setv('#treiber-rhr-delta', 'rhr_delta_txt', sel.rhr_delta_txt);
    setv('#treiber-schlaf-wert', 'schlaf_hm', sel.schlaf_hm); setv('#treiber-schlaf-pct', 'leistung_pct', sel.leistung_pct);
    zbar($('#treiber-hrv-z'), sel.z_hrv, col('purple'));
    zbar($('#treiber-rhr-z'), sel.z_rhr, col('pink'));
    zbar($('#treiber-schlaf-z'), sel.z_schlaf, col('indigo'));
    // Befinden aus dem Check-in
    const bv = $('#treiber-befinden-wert'), bs = $('#treiber-befinden-sub');
    if (sel.befinden_summe != null) {
      mark(bv, 'erholung', 'befinden_summe', w); bv.textContent = String(sel.befinden_summe);
      bs.textContent = !sel.befinden_basis ? 'Normal entsteht (' + Math.min(7, (sel.befinden_n || 0) + 1) + ' von 7)' : sel.z_befinden >= 0.5 ? 'über deinem Normal' : sel.z_befinden <= -0.5 ? 'unter deinem Normal' : 'im Normalbereich';
    } else { bv.textContent = '–'; bs.textContent = 'kein Check-in'; }
    zbar($('#treiber-befinden-z'), sel.z_befinden, col('green'));
    // Leiste
    const strip = $('#tagesleiste'); strip.replaceChildren();
    const byDate = new Map(E.map((r) => [r.date, r]));
    for (let i = 13; i >= 0; i--) {
      const d = iso(toDay(H.date) - i * DAY), r = byDate.get(d), dd = toDay(d);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tf-day';
      const has = r && (r.score != null || r.schlaf_h != null);
      if (!has) b.disabled = true;
      b.setAttribute('aria-pressed', String(sel.date === d));
      b.setAttribute('aria-label', fmtDay(dd) + (r && r.score != null ? ', Tagesform ' + r.score : ', keine Daten'));
      const wd = document.createElement('span'); wd.className = 'tf-wd'; wd.textContent = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][dd.getUTCDay()];
      const mini = document.createElement('span'); mini.className = 'tf-mini';
      const ms = svg('svg', { width: 34, height: 34, viewBox: '0 0 34 34' }, mini);
      const rr = 14, circ = 2 * Math.PI * rr;
      svg('circle', { cx: 17, cy: 17, r: rr, fill: 'none', stroke: col('fill'), 'stroke-width': 4, 'stroke-dasharray': has ? null : '2 3' }, ms);
      if (r && r.score != null) svg('circle', { cx: 17, cy: 17, r: rr, fill: 'none', stroke: col(AMPEL[r.ampel]), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': (circ * r.score) / 100 + ' ' + circ, transform: 'rotate(-90 17 17)' }, ms);
      const val = document.createElement('span');
      if (r && r.score != null) { mark(val, 'erholung', 'score', 'date=' + d); val.textContent = String(r.score); }
      mini.appendChild(val);
      const dn = document.createElement('span'); dn.className = 'tf-dn'; dn.textContent = dd.getUTCDate() + '.';
      b.append(wd, mini, dn);
      if (has) b.addEventListener('click', () => dash.setParams({ tag: d === H.date ? null : d }));
      strip.appendChild(b);
    }
    // Weiter zu den Treibern
    const links = $('#tagesform-links');
    if (links && !links.childElementCount) {
      [['gesundheit/hrv', 'HRV im Verlauf', 'i-wave', 'purple', 'Wie ausgeruht dein Nervensystem ist'], ['gesundheit/puls', 'Ruhepuls & Atmung', 'i-heart', 'pink', 'Ruhepuls, Atemfrequenz, autonomer Status'], ['gesundheit/schlaf', 'Schlaf', 'i-moon', 'indigo', 'Dauer, Phasen und Rhythmus'], ['gesundheit/checkin', 'Check-in', 'i-smile', 'green', 'Wie du dich fühlst – fließt in den Wert ein'], ['wissen/tagesform', 'So entsteht der Wert', 'i-book', 'yellow', 'Einfach erklärt, mit Quellen']]
        .forEach(([r, t, icon, farbe, sub]) => links.appendChild(zeile(r, t, icon, farbe, sub)));
    }
  }
  // Listenzeile mit Symbol, Titel, Untertitel und Pfeil – führt zu einer Route
  function zeile(r, titel, icon, farbe, sub, wert) {
    const b = el('button', { type: 'button', class: 'tf-zeile' },
      el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + farbe + ')' }, svgIco(icon)),
      el('span', { class: 'tf-zeile-t' }, el('b', { text: titel }), sub ? el('small', { text: sub }) : null),
      wert ? el('span', { class: 'tf-zeile-w', text: wert }) : null,
      svgIco('i-chev'));
    b.lastChild.classList.add('tf-chev');
    b.addEventListener('click', () => geh(r));
    return b;
  }

  /* ---------- ERHOLUNG ---------- */
  // Einordnung des HRV-Korridors (7-Tage-Schnitt gegen Normalbereich, mit Ruhepuls und Last gelesen)
  const KORR = { normal: 'green', puls: 'yellow', sympathisch: 'red', saettigung: 'indigo', parasympathisch: 'teal', hyper: 'orange', unklar: 'gray' };
  const KORR_KURZ = { normal: 'normal', puls: 'Ruhepuls erhöht', sympathisch: 'sympathisch belastet', saettigung: 'parasympathische Sättigung', parasympathisch: 'parasympathisch erholt', hyper: 'Hyperaktivität?', unklar: 'uneindeutig' };
  function korridorLeiste(P, KO, from, to, range) { // Farbleiste je Tag, exakt unter der Zeitachse des HRV-Diagramms
    const box = $('#korridor-strip'); if (!box) return;
    box.replaceChildren();
    const R = [...KO.values()].filter((r) => r.date >= from && r.date <= to && r.klasse);
    if (!R.length) return;
    const h = 30, s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + P.w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': 'Einordnung des HRV-Korridors je Tag' }, box);
    const dw = Math.max(1.2, (P.xs(toDay(to)) - P.xs(toDay(from))) / Math.max(1, range - 1));
    R.forEach((r) => { const x = P.xs(toDay(r.date)); svg('rect', { x: x - dw / 2, y: 6, width: Math.max(1, dw - (dw > 5 ? 1.5 : 0)), height: 14, rx: Math.min(3, dw / 2), fill: col(KORR[r.klasse]), opacity: 0.9 }, s); });
    hoverTime(box, { s, xs: P.xs, w: P.w, h, ml: P.ml, mr: P.mr, xb: 22, top: 4 }, R, (r) => toDay(r.date), (r) => fmtDay(toDay(r.date)), (r) => [{ label: 'Einordnung', value: r.titel, color: col(KORR[r.klasse]) }, { label: '7-Tage-HRV', value: r.hrv7 + ' ms (Korridor ' + r.lo + '–' + r.hi + ')' }, r.tage > 1 ? { label: 'seit', value: r.tage + ' Tagen' } : null].filter(Boolean));
    const vorhanden = [...new Set(R.map((r) => r.klasse))];
    box.appendChild(el('div', { class: 'tf-legend' }, ...Object.keys(KORR).filter((k) => vorhanden.includes(k)).map((k) => { const i = el('i'); i.style.background = col(KORR[k]); return el('span', null, i, KORR_KURZ[k]); })));
  }
  function renderErholung() {
    const sec = $('#erholung'); fill(sec); rangeButtons();
    const E = rowsOf('erholung'), p = params();
    const charts = ['#chart-hrv', '#chart-ruhepuls', '#chart-quadrant', '#chart-atmung'];
    const ks = $('#korridor-strip'); if (ks) ks.replaceChildren();
    if (!E || !heute()) { if (failedAny('erholung')) charts.forEach((c) => failed($(c))); return; }
    const { rows, from, to } = windowRows(E, +p.range);
    const X = [toDay(from), toDay(to)], xf = (r) => toDay(r.date), head = (r) => WTAG[r.wtag] + ', ' + fmtDay(toDay(r.date));
    // HRV
    {
      const el = $('#chart-hrv'), v = rows.flatMap((r) => [r.hrv, r.hrv_lo, r.hrv_hi, r.hrv7]).filter((x) => x > 0);
      if (!v.length) emptyNote(el, 'Keine HRV-Messungen in diesem Zeitraum.');
      else {
        const lo = Math.min(...v) * 0.9, hi = Math.max(...v) * 1.08;
        const P = plot(el, { h: 230, y: [lo, hi], ylog: true, yticks: niceLog(lo, hi), x: X, label: 'HRV-Verlauf' });
        gapShade(P, rows.filter((r) => r.hrv).map((r) => r.date), from, to, 9);
        const rb = breaks(rows.filter((r) => r.hrv), 3);
        band(P, rb, xf, (r) => r.hrv_lo, (r) => r.hrv_hi, col('purple'), 0.16);
        dots(P, rows, xf, (r) => r.hrv, col('purple'), 2.6, 0.45);
        line(P, rb, xf, (r) => r.hrv7, col('purple'), 2.2);
        const last = [...rows].reverse().find((r) => r.hrv); if (last) endDot(P, xf(last), last.hrv, col('purple'));
        const KO = new Map((rowsOf('hrv_korridor') || []).map((k) => [k.date, k]));
        hoverTime(el, P, rows.filter((r) => r.hrv), xf, head, (r) => [
          { label: 'Nacht', value: r.hrv + ' ms', color: col('purple') },
          { label: '7-Tage-Schnitt', value: r.hrv7 == null ? '–' : r.hrv7 + ' ms' },
          { label: 'Normalbereich', value: r.hrv_lo == null ? 'Basis fehlt' : r.hrv_lo + '–' + r.hrv_hi + ' ms' },
          KO.get(r.date) && KO.get(r.date).klasse ? { label: 'Korridor', value: KO.get(r.date).titel, color: col(KORR[KO.get(r.date).klasse]) } : null,
        ].filter(Boolean), [{ y: (r) => r.hrv, color: col('purple') }]);
        korridorLeiste(P, KO, from, to, +p.range);
      }
    }
    // Ruhepuls
    {
      const el = $('#chart-ruhepuls'), v = rows.flatMap((r) => [r.rhr, r.rhr_lo, r.rhr_hi]).filter((x) => x > 0);
      if (!v.length) emptyNote(el, 'Keine Ruhepuls-Werte in diesem Zeitraum.');
      else {
        const P = plot(el, { h: 200, y: [Math.floor(Math.min(...v) - 2), Math.ceil(Math.max(...v) + 2)], x: X, label: 'Ruhepuls-Verlauf' });
        gapShade(P, rows.filter((r) => r.rhr).map((r) => r.date), from, to, 9);
        const rb = breaks(rows.filter((r) => r.rhr), 3);
        band(P, rb, xf, (r) => r.rhr_lo, (r) => r.rhr_hi, col('pink'), 0.14);
        dots(P, rows, xf, (r) => r.rhr, col('pink'), 2.6, 0.45);
        line(P, rb, xf, (r) => r.rhr7, col('pink'), 2.2);
        const last = [...rows].reverse().find((r) => r.rhr); if (last) endDot(P, xf(last), last.rhr, col('pink'));
        hoverTime(el, P, rows.filter((r) => r.rhr), xf, head, (r) => [
          { label: 'Ruhepuls', value: r.rhr + ' bpm', color: col('pink') },
          { label: '7-Tage-Schnitt', value: r.rhr7 == null ? '–' : nf(r.rhr7, 1) + ' bpm' },
          { label: 'Basis', value: r.rhr_basis == null ? '–' : nf(r.rhr_basis, 1) + ' bpm' },
        ], [{ y: (r) => r.rhr, color: col('pink') }]);
      }
    }
    // Quadrant
    {
      const el = $('#chart-quadrant');
      const Q = E.filter((r) => r.z_hrv7 != null && r.z_rhr7 != null && r.date <= to).slice(-28);
      const sub = $('#status-zeitraum'); sub.replaceChildren();
      if (!Q.length) { emptyNote(el, 'Noch zu wenige Nächte für eine Einordnung.'); sub.textContent = 'HRV und Ruhepuls gegen deine Norm'; }
      else {
        const a = mark(document.createElement('span'), 'erholung', 'datum', 'date=' + Q[0].date); a.textContent = Q[0].datum;
        const b = mark(document.createElement('span'), 'erholung', 'datum', 'date=' + Q[Q.length - 1].date); b.textContent = Q[Q.length - 1].datum;
        sub.append('Letzte Nächte mit Wert · ', a, '–', b);
        clear(el);
        const w = Math.max(260, el.clientWidth || 320), h = 260, pad = 8;
        const s = svg('svg', { width: '100%', height: h, viewBox: '0 0 ' + w + ' ' + h, class: 'tf-svg', role: 'img', 'aria-label': 'Autonomer Status' }, el);
        const xs = d3.scaleLinear().domain([-3, 3]).range([pad, w - pad]).clamp(true), ys = d3.scaleLinear().domain([-3, 3]).range([h - pad, pad]).clamp(true);
        const quad = [[0, 3, 'green', 'Erholt', 'end', 'top'], [-3, 3, 'purple', 'Sättigung', 'start', 'top'], [-3, 0, 'red', 'Ermüdet', 'start', 'bottom'], [0, 0, 'gray', 'Uneindeutig', 'end', 'bottom']];
        quad.forEach(([x0, y1, c, label, anchor, vpos]) => {
          svg('rect', { x: xs(x0), y: ys(y1), width: xs(x0 + 3) - xs(x0), height: ys(y1 - 3) - ys(y1), fill: col(c), opacity: 0.07 }, s);
          const t = svg('text', { class: 'tf-tick', x: anchor === 'end' ? w - pad - 8 : pad + 8, y: vpos === 'top' ? pad + 16 : h - pad - 10, 'text-anchor': anchor, 'font-weight': 600 }, s); t.textContent = label;
        });
        svg('rect', { x: xs(-0.5), y: ys(0.5), width: xs(0.5) - xs(-0.5), height: ys(-0.5) - ys(0.5), rx: 8, fill: col('fill') }, s);
        svg('line', { x1: xs(0), x2: xs(0), y1: pad, y2: h - pad, class: 'tf-axisline' }, s);
        svg('line', { x1: pad, x2: w - pad, y1: ys(0), y2: ys(0), class: 'tf-axisline' }, s);
        const pts = Q.map((r) => [xs(r.z_hrv7), ys(-r.z_rhr7)]);
        svg('path', { d: d3.line()(pts), fill: 'none', stroke: col('fg3'), 'stroke-width': 1, 'stroke-linejoin': 'round', opacity: 0.6 }, s);
        pts.forEach((p, i) => svg('circle', { cx: p[0], cy: p[1], r: i === pts.length - 1 ? 6.5 : 3.6, fill: col('indigo'), opacity: i === pts.length - 1 ? 1 : 0.25 + (0.6 * i) / pts.length, stroke: i === pts.length - 1 ? col('card') : null, 'stroke-width': 2 }, s));
        const T = tip(el), del = d3.Delaunay.from(pts);
        const qn = { erholt: 'Erholt', ermuedet: 'Ermüdet', saettigung: 'Sättigung', uneindeutig: 'Uneindeutig', normal: 'Normalbereich' };
        const mv = (ev) => { const bb = s.getBoundingClientRect(), k = w / bb.width, i = del.find((ev.clientX - bb.left) * k, (ev.clientY - bb.top) * k), r = Q[i]; T.show(pts[i][0] / k, pts[i][1] / k, WTAG[r.wtag] + ', ' + r.datum, [{ label: 'Status', value: qn[r.quadrant] || '–' }, { label: 'HRV (z)', value: nf(r.z_hrv7, 1) }, { label: 'Ruhepuls (z)', value: nf(r.z_rhr7, 1) }]); };
        s.addEventListener('pointermove', mv); s.addEventListener('pointerdown', mv); s.addEventListener('pointerleave', () => T.hide());
        const cap = document.createElement('div'); cap.className = 'tf-caption'; cap.textContent = 'Rechts: HRV über deiner Norm · oben: Ruhepuls unter deiner Norm · graues Feld: normal'; el.appendChild(cap);
      }
    }
    // Atmung
    {
      const el = $('#chart-atmung'), v = rows.flatMap((r) => [r.atem, r.atem_basis != null ? r.atem_basis + 1 : null]).filter((x) => x > 0);
      if (!v.length) emptyNote(el, 'Keine Atemfrequenz-Werte in diesem Zeitraum.');
      else {
        const P = plot(el, { h: 170, y: [Math.floor(Math.min(...v) - 1), Math.ceil(Math.max(...v) + 1)], x: X, ny: 3, label: 'Atemfrequenz-Verlauf' });
        gapShade(P, rows.filter((r) => r.atem).map((r) => r.date), from, to, 9);
        const rb = breaks(rows.filter((r) => r.atem), 3);
        line(P, rb, xf, (r) => r.atem_basis, col('teal'), 1.5);
        line(P, rb, xf, (r) => (r.atem_basis == null ? null : r.atem_basis + 1), col('fg3'), 1.5, '5 4');
        dots(P, rows, xf, (r) => r.atem, col('teal'), 2.8, 0.7);
        rows.filter((r) => r.atem_alarm).forEach((r) => svg('circle', { cx: P.xs(xf(r)), cy: P.ys(r.atem), r: 5, fill: col('red'), stroke: col('card'), 'stroke-width': 2 }, P.g));
        hoverTime(el, P, rows.filter((r) => r.atem), xf, head, (r) => [
          { label: 'Atemfrequenz', value: nf(r.atem, 1) + ' /min', color: col('teal') },
          { label: 'Basis', value: r.atem_basis == null ? '–' : nf(r.atem_basis, 1) + ' /min' },
          { label: 'Abweichung', value: r.atem_delta == null ? '–' : (r.atem_delta > 0 ? '+' : '') + nf(r.atem_delta, 1) },
        ], [{ y: (r) => r.atem, color: col('teal') }]);
      }
    }
    insights($('#erkenntnisse-erholung'), (rows) => rows.filter((r) => r.bereich === 'erholung' || r.id === 'autonom' || r.id === 'atem'));
  }

  /* ---------- SCHLAF ---------- */
  function renderSchlaf() {
    const sec = $('#schlaf'); fill(sec); rangeButtons();
    const E = rowsOf('erholung'), p = params();
    if (!E || !heute()) { if (failedAny('erholung')) ['#chart-phasen', '#chart-fenster', '#chart-dauer'].forEach((c) => failed($(c))); return; }
    const N = E.filter((r) => r.schlaf_h != null).slice(-14);
    const keys = N.map((r) => r.date), byKey = new Map(N.map((r) => [r.date, r]));
    const lab = (d) => { const r = byKey.get(d); return r ? r.datum : d; };
    // Phasen
    {
      const el = $('#chart-phasen');
      if (!N.length) emptyNote(el, 'Noch keine Nächte mit Schlafdaten.');
      else {
        const top = Math.max(9, ...N.map((r) => Math.max(r.bedarf_h || 0, (r.tief_h || 0) + (r.leicht_h || 0) + (r.rem_h || 0) + (r.wach_h || 0)))) + 0.5;
        const P = plot(el, { h: 220, y: [0, top], yticks: d3.range(0, top, 2), yfmt: (t) => t + ' h', xband: keys, xfmt: lab, xlabw: 48, label: 'Schlafphasen' });
        const bw = Math.min(26, P.xs.bandwidth());
        const parts = [['tief_h', 'deep'], ['leicht_h', 'core'], ['rem_h', 'rem'], ['wach_h', 'awake']];
        N.forEach((r) => {
          const x = P.xs(r.date) + (P.xs.bandwidth() - bw) / 2; let acc = 0;
          const segs = parts.filter(([f]) => r[f] > 0);
          segs.forEach(([f, c], i) => {
            const y0 = P.ys(acc), y1 = P.ys(acc + r[f]); acc += r[f];
            const hgt = Math.max(0, y0 - y1 - (i < segs.length - 1 ? 2 : 0));
            if (i === segs.length - 1) svg('path', { d: roundTop(x, y1, bw, hgt, 5), fill: col(c) }, P.g);
            else svg('rect', { x, y: y1 + 2, width: bw, height: Math.max(0, hgt), fill: col(c) }, P.g);
          });
          if (r.bedarf_h) { const y = P.ys(r.bedarf_h); svg('line', { x1: x - 3, x2: x + bw + 3, y1: y, y2: y, stroke: col('fg'), 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.75 }, P.g); }
        });
        hoverBands(el, P, keys, (d) => { const r = byKey.get(d); return WTAG[r.wtag] + ', ' + r.datum; }, (d) => { const r = byKey.get(d); return [
          { label: 'Schlaf', value: r.schlaf_hm + ' h' }, { label: 'Tief', value: hm(r.tief_h), color: col('deep') }, { label: 'Leicht', value: hm(r.leicht_h), color: col('core') },
          { label: 'REM', value: hm(r.rem_h), color: col('rem') }, { label: 'Wach', value: hm(r.wach_h), color: col('awake') }, { label: 'Bedarf', value: r.bedarf_hm + ' h' }]; });
      }
    }
    // Schlaffenster
    {
      const el = $('#chart-fenster'), S = rowsOf('schlafmuster');
      const W = N.filter((r) => r.start_h != null && r.ende_h != null);
      if (!W.length) emptyNote(el, 'Noch keine Nächte mit Schlafzeiten.');
      else {
        const lo = Math.floor(Math.min(...W.map((r) => r.start_h)) - 0.5), hi = Math.ceil(Math.max(...W.map((r) => r.ende_h)) + 0.5);
        const step = hi - lo > 10 ? 3 : 2, yt = d3.range(Math.ceil(lo / step) * step, hi + 0.01, step);
        const P = plot(el, { h: 220, y: [lo, hi], yinvert: true, yticks: yt, yfmt: (t) => clock(t), xband: W.map((r) => r.date), xfmt: lab, xlabw: 48, label: 'Schlaffenster' });
        const bw = Math.min(14, P.xs.bandwidth());
        W.forEach((r) => { const x = P.xs(r.date) + (P.xs.bandwidth() - bw) / 2, y0 = P.ys(r.start_h), y1 = P.ys(r.ende_h); svg('rect', { x, y: y0, width: bw, height: Math.max(2, y1 - y0), rx: bw / 2, fill: col('indigo') }, P.g); });
        const s14 = S && S.find((x) => x.id === '14');
        if (s14 && s14.einschlaf_h != null) { refLine(P, s14.einschlaf_h, col('fg3')); refLine(P, s14.aufwach_h, col('fg3')); }
        hoverBands(el, P, W.map((r) => r.date), (d) => { const r = byKey.get(d); return WTAG[r.wtag] + ', ' + r.datum; }, (d) => { const r = byKey.get(d); return [{ label: 'Eingeschlafen', value: r.einschlaf + ' Uhr' }, { label: 'Aufgewacht', value: r.aufwach + ' Uhr' }, { label: 'Schlaf', value: r.schlaf_hm + ' h' }]; });
        const cap = document.createElement('div'); cap.className = 'tf-caption'; cap.textContent = 'Gestrichelt: deine Durchschnittszeiten'; el.appendChild(cap);
      }
    }
    // Dauer
    {
      const el = $('#chart-dauer');
      const { rows, from, to } = windowRows(E, +p.range);
      const R = rows.filter((r) => r.schlaf_h != null);
      if (!R.length) emptyNote(el, 'Keine Schlafdaten in diesem Zeitraum.');
      else {
        const top = Math.max(10, ...R.map((r) => r.schlaf_h)) + 0.5;
        const P = plot(el, { h: 200, y: [0, top], yticks: d3.range(0, top, 2), yfmt: (t) => t + ' h', x: [toDay(from), toDay(to)], label: 'Schlafdauer' });
        gapShade(P, R.map((r) => r.date), from, to, 9);
        const dw = Math.max(1.5, Math.min(14, (P.xs(toDay(to)) - P.xs(toDay(from))) / (+p.range) - 1.5));
        R.forEach((r) => { const x = P.xs(toDay(r.date)) - dw / 2, y = P.ys(r.schlaf_h); svg('path', { d: roundTop(x, y, dw, P.ys(0) - y, Math.min(4, dw / 2)), fill: col('indigo'), opacity: 0.45 }, P.g); });
        const rb = breaks(R, 3);
        line(P, rb, (r) => toDay(r.date), (r) => r.bedarf_h, col('fg3'), 1.5, '5 4');
        line(P, rb, (r) => toDay(r.date), (r) => r.schlaf7_h, col('indigo'), 2.2);
        hoverTime(el, P, R, (r) => toDay(r.date), (r) => WTAG[r.wtag] + ', ' + r.datum, (r) => [
          { label: 'Schlaf', value: r.schlaf_hm + ' h', color: col('indigo') }, { label: '7-Tage-Schnitt', value: hm(r.schlaf7_h) + ' h' }, { label: 'Bedarf', value: r.bedarf_hm + ' h' }, { label: 'Schlafschuld (7 N.)', value: r.schuld7_hm + ' h' },
        ], [{ y: (r) => r.schlaf_h, color: col('indigo') }]);
      }
    }
    insights($('#erkenntnisse-schlaf'), (rows) => rows.filter((r) => r.bereich === 'schlaf' || r.id === 'schlaf_heute'));
  }

  /* ---------- BELASTUNG ---------- */
  const DISZ = [['gesamt', 'Gesamt', ''], ['swim', 'Schwimmen', 'swim_'], ['bike', 'Rad', 'bike_'], ['run', 'Laufen', 'run_'], ['kraft', 'Kraft', 'kraft_']];
  const DISZ_FARBE = { gesamt: 'blue', swim: 'blue', bike: 'orange', run: 'mint', kraft: 'purple' };
  function diszVerfuegbar(PD) { // Disziplinen mit nennenswerter Fitness im letzten Jahr
    const bis = PD.length ? PD[PD.length - 1].date : '', von = bis ? iso(toDay(bis) - 365 * DAY) : '';
    return DISZ.filter(([k, , pre]) => k === 'gesamt' || PD.some((r) => r.date >= von && r[pre + 'ctl'] >= 2));
  }
  function renderBelastung() {
    const sec = $('#belastung'); fill(sec); rangeButtons();
    const p = params(), PD = rowsOf('pmc_disziplin'), WO = rowsOf('wochen'), TID = rowsOf('intensitaet');
    if (!heute()) return;
    const verf = PD ? diszVerfuegbar(PD) : [DISZ[0]], disz = verf.find(([k]) => k === p.disz) ? p.disz : 'gesamt', [, dName, pre] = DISZ.find(([k]) => k === disz);
    segButtons($('#disz-seg'), verf.map(([k, l]) => [k, l]), disz, (v) => dash.setParams({ disz: v === 'gesamt' ? null : v }));
    $('#disz-seg').closest('.tf-filter').hidden = verf.length < 2;
    $('#pmc-sub').textContent = disz === 'gesamt' ? 'Banister-Modell auf deiner Tagesbelastung (TSS) aller Sportarten' : 'Nur ' + dName + ' – so trennst du die Ermüdung der Disziplinen';
    const PMC = PD && PD.map((r) => ({ date: r.date, tss: r[pre + 'tss'], ctl: r[pre + 'ctl'], atl: r[pre + 'atl'], tsb: r[pre + 'tsb'], acwr: r[pre + 'acwr'], rampe: r[pre + 'rampe'] }));
    // Kacheln für die gewählte Disziplin
    if (PMC && disz !== 'gesamt') {
      const H = heute(), r = PMC.find((x) => x.date === H.date) || PMC[PMC.length - 1], sg = (x) => (x == null ? '–' : (x > 0 ? '+' : x < 0 ? '−' : '±') + nf(Math.abs(x)));
      $('#kachel-ctl .num').textContent = nf(r.ctl); $('#kachel-atl .num').textContent = nf(r.atl); $('#kachel-tsb .num').textContent = sg(Math.round(r.tsb));
      $('#kachel-rampe .num').textContent = r.rampe == null ? '–' : sg(Math.round(r.rampe)); $('#kachel-acwr .num').textContent = r.acwr == null ? '–' : nf(r.acwr, 2);
      $('#kachel-acwr .tf-tile-sub').textContent = r.acwr == null ? 'zu wenig ' + dName + ' für einen Wert' : r.acwr > 1.5 ? 'über 1,5: Belastungsspitze' : r.acwr < 0.8 ? 'unter 0,8: Entlastung' : '0,8–1,3: günstiger Bereich';
    }
    // PMC
    {
      const el = $('#chart-pmc'), el2 = $('#chart-tsb');
      if (!PMC) { if (failedAny('pmc_disziplin')) { failed(el); failed(el2); } }
      else {
        const { rows, from, to } = windowRows(PMC, +p.range), X = [toDay(from), toDay(to)], xf = (r) => toDay(r.date);
        const top = Math.max(20, ...rows.map((r) => Math.max(r.ctl, r.atl))) * 1.1;
        const P = plot(el, { h: 230, y: [0, top], x: X, label: 'Fitness und Ermüdung' }), cF = col(DISZ_FARBE[disz]);
        const gid = 'tf-ctl-grad'; const defs = svg('defs', null, P.s), lg = svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        [[0, 0.3], [0.5, 0.12], [1, 0]].forEach(([o, a]) => svg('stop', { offset: o, 'stop-color': cF, 'stop-opacity': a }, lg));
        svg('path', { d: d3.area().x((r) => P.xs(xf(r))).y0(P.ys(0)).y1((r) => P.ys(r.ctl))(rows), fill: 'url(#' + gid + ')' }, P.g);
        line(P, rows, xf, (r) => r.ctl, cF, 2.4);
        line(P, rows, xf, (r) => r.atl, col('pink'), 1.6);
        const last = rows[rows.length - 1]; endDot(P, xf(last), last.ctl, cF);
        hoverTime(el, P, rows, xf, (r) => fmtDay(xf(r)), (r) => [{ label: 'Fitness', value: nf(r.ctl), color: cF }, { label: 'Ermüdung', value: nf(r.atl), color: col('pink') }, { label: 'Form', value: (r.tsb > 0 ? '+' : '') + nf(r.tsb) }, { label: 'TSS am Tag', value: nf(r.tss) }, { label: 'ACWR', value: r.acwr == null ? '–' : nf(r.acwr, 2) }], [{ y: (r) => r.ctl, color: cF }, { y: (r) => r.atl, color: col('pink') }]);
        const m = Math.max(10, ...rows.map((r) => Math.abs(r.tsb))) * 1.1;
        const Q = plot(el2, { h: 110, y: [-m, m], yticks: [-Math.round(m / 2 / 10) * 10 || -10, 0, Math.round(m / 2 / 10) * 10 || 10], x: X, mt: 6, label: 'Form' });
        const dw = Math.max(1, (Q.xs(X[1]) - Q.xs(X[0])) / (+p.range) - 0.6);
        rows.forEach((r) => { if (!r.tsb) return; const y = Q.ys(r.tsb), y0 = Q.ys(0); svg('rect', { x: Q.xs(xf(r)) - dw / 2, y: Math.min(y, y0), width: dw, height: Math.abs(y - y0), fill: col(r.tsb > 0 ? 'teal' : 'orange'), opacity: 0.85 }, Q.g); });
        hoverTime(el2, Q, rows, xf, (r) => fmtDay(xf(r)), (r) => [{ label: 'Form', value: (r.tsb > 0 ? '+' : '') + nf(r.tsb), color: col(r.tsb > 0 ? 'teal' : 'orange') }]);
      }
    }
    // Wochen
    {
      const el = $('#chart-wochen');
      if (!WO) { if (failedAny('wochen')) failed(el); }
      else {
        const h = heute(), from = iso(toDay(h.date) - (+p.range - 1) * DAY);
        const W = WO.filter((w) => w.woche >= iso(toDay(from) - 6 * DAY) && w.woche <= h.date);
        const by = new Map(W.map((w) => [w.woche, w]));
        const top = Math.max(4, ...W.map((w) => w.gesamt_h)) * 1.08;
        const P = plot(el, { h: 220, y: [0, top], yfmt: (t) => t + ' h', xband: W.map((w) => w.woche), xfmt: (k) => by.get(k).kw, xlabw: 54, pad: 0.3, label: 'Umfang pro Woche' });
        const bw = Math.min(24, P.xs.bandwidth()), parts = [['schwimmen_h', 'blue'], ['rad_h', 'orange'], ['lauf_h', 'mint'], ['sonst_h', 'gray']];
        W.forEach((w) => {
          const x = P.xs(w.woche) + (P.xs.bandwidth() - bw) / 2; let acc = 0;
          const segs = parts.filter(([f]) => w[f] > 0.05);
          segs.forEach(([f, c], i) => { const y0 = P.ys(acc), y1 = P.ys(acc + w[f]); acc += w[f]; const hg = Math.max(0, y0 - y1 - (i < segs.length - 1 ? 2 : 0)); if (i === segs.length - 1) svg('path', { d: roundTop(x, y1, bw, hg, 4), fill: col(c) }, P.g); else svg('rect', { x, y: y1 + 2, width: bw, height: hg, fill: col(c) }, P.g); });
        });
        hoverBands(el, P, W.map((w) => w.woche), (k) => by.get(k).kw + ' · ab ' + fmtDay(toDay(k)), (k) => { const w = by.get(k); return [{ label: 'Gesamt', value: nf(w.gesamt_h, 1) + ' h' }, { label: 'Schwimmen', value: hm(w.schwimmen_h), color: col('blue') }, { label: 'Rad', value: hm(w.rad_h), color: col('orange') }, { label: 'Laufen', value: hm(w.lauf_h), color: col('mint') }, { label: 'Sonstiges', value: hm(w.sonst_h), color: col('gray') }, { label: 'TSS', value: nf(w.tss) }]; });
      }
    }
    // Intensitätsverteilung
    {
      const el = $('#chart-verteilung');
      if (!TID) { if (failedAny('intensitaet')) failed(el); }
      else {
        clear(el);
        TID.forEach((r) => {
          const row = document.createElement('div'); row.className = 'tf-tid-row';
          const name = document.createElement('div'); name.className = 'tf-tid-name';
          const n1 = mark(document.createElement('span'), 'intensitaet', 'fenster', 'id=' + r.id); n1.textContent = r.fenster;
          const n2 = mark(document.createElement('small'), 'intensitaet', 'zeitraum', 'id=' + r.id); n2.textContent = r.zeitraum;
          name.append(n1, n2);
          const bar = document.createElement('div'); bar.className = 'tf-tid-bar';
          [['z1_pct', 'z1'], ['z2_pct', 'z2'], ['z3_pct', 'z3']].forEach(([f, c]) => {
            const v = r[f] || 0; if (v <= 0) return;
            const d = document.createElement('div'); d.style.flex = v + ' 1 0'; d.style.background = 'var(--tf-' + c + ')';
            if (c === 'z1') d.classList.add('tf-dark-text');
            if (v >= 12) { mark(d, 'intensitaet', f, 'id=' + r.id); d.textContent = String(v); }
            d.title = '';
            bar.appendChild(d);
          });
          const meta = document.createElement('div'); meta.className = 'tf-tid-meta';
          const m1 = document.createElement('span'); const typ = mark(document.createElement('b'), 'intensitaet', 'typ', 'id=' + r.id); typ.textContent = r.typ; m1.append(typ);
          const m2 = document.createElement('span'); const pi = mark(document.createElement('span'), 'intensitaet', 'pi_txt', 'id=' + r.id); pi.textContent = r.pi_txt; m2.append('PI ', pi, ' · ');
          const hh = mark(document.createElement('span'), 'intensitaet', 'stunden', 'id=' + r.id); hh.textContent = String(r.stunden); m2.append(hh, ' h');
          meta.append(m1, m2);
          row.append(name, bar, meta); el.appendChild(row);
        });
        const cap = document.createElement('div'); cap.className = 'tf-caption'; cap.textContent = 'Zahlen in den Balken: Anteil in Prozent. Zeitfenster enden mit deiner letzten Einheit.'; el.appendChild(cap);
      }
    }
    // Monotonie
    {
      const el = $('#chart-monotonie');
      if (!WO) { if (failedAny('wochen')) failed(el); }
      else {
        const h = heute(), from = iso(toDay(h.date) - (+p.range - 1) * DAY);
        const W = WO.filter((w) => w.woche >= iso(toDay(from) - 6 * DAY) && w.woche <= h.date);
        const by = new Map(W.map((w) => [w.woche, w]));
        const vals = W.map((w) => w.monotonie).filter((v) => v != null);
        if (!vals.length) emptyNote(el, 'Keine vollständigen Trainingswochen in diesem Zeitraum.');
        else {
          const top = Math.max(2.6, ...vals) * 1.1;
          const P = plot(el, { h: 180, y: [0, top], yfmt: (t) => nf(t, t % 1 ? 1 : 0), xband: W.map((w) => w.woche), xfmt: (k) => by.get(k).kw, xlabw: 54, pad: 0.3, label: 'Monotonie' });
          const bw = Math.min(20, P.xs.bandwidth());
          W.forEach((w) => { if (w.monotonie == null) return; const x = P.xs(w.woche) + (P.xs.bandwidth() - bw) / 2, y = P.ys(w.monotonie); svg('path', { d: roundTop(x, y, bw, P.ys(0) - y, 4), fill: col(w.monotonie > 2 ? 'orange' : 'gray'), opacity: w.monotonie > 2 ? 1 : 0.55 }, P.g); });
          refLine(P, 2, col('red'));
          hoverBands(el, P, W.map((w) => w.woche), (k) => by.get(k).kw, (k) => { const w = by.get(k); return [{ label: 'Monotonie', value: w.monotonie == null ? '–' : nf(w.monotonie, 2) }, { label: 'Strain', value: w.strain == null ? '–' : nf(w.strain) }, { label: 'TSS', value: nf(w.tss) }]; });
        }
      }
    }
    insights($('#erkenntnisse-training'), (rows) => rows.filter((r) => ['aufbau', 'verteilung', 'monotonie', 'lastbilanz'].includes(r.id) || r.id.indexOf('acwr_') === 0));
  }

  /* ---------- EINHEITEN ---------- */
  function renderEinheiten() {
    const sec = $('#einheiten'); fill(sec);
    const B = rowsOf('belastung');
    if (B) {
      const SC = { swim: 'blue', bike: 'orange', run: 'mint', kraft: 'purple' };
      table($('#tabelle-einheiten'), 'belastung', B.filter((r) => r.sport !== 'wechsel').slice(-12).reverse(), [
        { f: 'datum' },
        { f: 'sportart', render: (td, r) => { const s = document.createElement('span'); s.className = 'tf-sport'; const i = document.createElement('i'); i.style.background = 'var(--tf-' + (SC[r.sport] || 'gray') + ')'; s.appendChild(i); s.append(r.sportart); td.appendChild(s); } },
        { f: 'dauer', cls: 'r' }, { f: 'km_txt', cls: 'r tf-hide-s' }, { f: 'tss', cls: 'r' }, { f: 'if_txt', cls: 'r tf-hide-s' }, { f: 'methode', cls: 'tf-hide-s' },
      ]);
    }
    renderFueling();
    renderCheck();
    insights($('#erkenntnisse-einheiten'), (rows) => rows.filter((r) => ['grauzone', 'ego', 'decoupling', 'decoupling_gut'].includes(r.id) || (r.bereich === 'ernaehrung' && r.id.indexOf('fueling') === 0)));
  }

  /* ---------- EINHEITEN-CHECK (Training) ---------- */
  const TYP = { locker: ['Locker', 'green'], spitzen: ['Locker mit Spitzen', 'pink'], qualitaet: ['Qualität', 'indigo'], renntempo: ['Renntempo', 'orange'], grauzone: ['Grauzone', 'yellow'], gemischt: ['Gemischt', 'gray'] };
  const typKey = (r) => (r.ego ? 'spitzen' : r.typ);
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const CH = { n: 8, offen: null, serien: new Map(), laden: new Set() };
  async function checkSerie(id) {
    if (CH.laden.has(id)) return;
    CH.laden.add(id);
    try { const j = await A().api('GET', '/api/data?serie=' + encodeURIComponent(id)); CH.serien.set(id, j.serie || null); }
    catch (e) { CH.serien.set(id, false); }
    finally { CH.laden.delete(id); if (CH.offen === id && tab === 'einheiten') renderCheck(); }
  }
  function renderCheck() {
    const R = rowsOf('einheiten_check'), list = $('#check-liste'), sum = $('#check-summe'), more = $('#check-mehr'), note = $('#check-hinweis');
    if (!R) { if (failedAny('einheiten_check')) failed(list); return; }
    const st = A().state.stand || {};
    note.textContent = st.analyse_offen > 0 ? 'Noch ' + st.analyse_offen + (st.analyse_offen === 1 ? ' Einheit wartet' : ' Einheiten warten') + ' auf die Auswertung – sie kommen mit den nächsten Abrufen.' : '';
    if (!R.length) { sum.replaceChildren(); more.hidden = true; emptyNote(list, 'Noch keine ausgewerteten Einheiten. Beim nächsten Abruf lädt die App die Sekundendaten deiner Rad- und Laufeinheiten ab 15 Minuten.'); return; }
    // Bilanz: 4 Wochen bis zur letzten ausgewerteten Einheit
    const bis = R[0].date, von = iso(toDay(bis) - 27 * DAY), R4 = R.filter((r) => r.date >= von), cnt = {};
    R4.forEach((r) => { const k = typKey(r); cnt[k] = (cnt[k] || 0) + 1; });
    const bar = el('div', { class: 'tf-check-bar', role: 'img', 'aria-label': 'Einheiten nach Art' }), leg = el('div', { class: 'tf-check-leg' });
    Object.keys(TYP).filter((k) => cnt[k]).forEach((k) => {
      const d = el('div', { text: String(cnt[k]) }); d.style.flex = cnt[k] + ' 1 0'; d.style.background = col(TYP[k][1]); if (k === 'grauzone') d.style.color = '#1c1c1e';
      bar.appendChild(d);
      const i = el('i'); i.style.background = col(TYP[k][1]); leg.appendChild(el('span', null, i, TYP[k][0]));
    });
    sum.replaceChildren(el('div', { class: 'tf-check-meta', text: R4.length + (R4.length === 1 ? ' Einheit' : ' Einheiten') + ' vom ' + fmtDay(toDay(von)) + ' bis ' + fmtDay(toDay(bis)) }), bar, leg);
    // Liste
    clear(list);
    R.slice(0, CH.n).forEach((r) => {
      const [, c] = TYP[typKey(r)] || ['', 'gray'], dot = el('i'); dot.style.background = col(c);
      const offen = CH.offen === r.id, w = 'id=' + r.id;
      const meta = el('div', { class: 'tf-check-meta' }, WD[toDay(r.date).getUTCDay()] + ', ' + r.datum + ' · ' + r.sportart + ' · ' + r.dauer + ' h' + (r.tss != null ? ' · ' + r.tss + ' TSS' : ''));
      const kenn = el('div', { class: 'tf-check-kenn' }, r.kenn);
      const titel = mark(el('div', { class: 'tf-check-titel', text: r.titel }), 'einheiten_check', 'titel', w);
      const text = mark(el('div', { class: 'tf-check-text', text: r.text }), 'einheiten_check', 'text', w);
      const b = el('button', { type: 'button', class: 'tf-check-row', 'aria-expanded': String(offen) }, dot, meta, kenn, titel, text);
      b.addEventListener('click', () => { CH.offen = offen ? null : r.id; if (!offen && CH.serien.get(r.id) === false) CH.serien.delete(r.id); renderCheck(); });
      list.appendChild(b);
      if (offen) { const box = el('div', { class: 'tf-check-detail' }); list.appendChild(box); checkDetail(r, box); }
    });
    more.hidden = R.length <= CH.n;
    more.textContent = 'Ältere Einheiten zeigen (' + (R.length - CH.n) + ')';
    more.onclick = () => { CH.n += 12; renderCheck(); };
  }
  function checkDetail(r, box) {
    const a = rowsOf('athlet')[0], rad = r.sport === 'rad';
    const zb = el('div', { class: 'tf-tid-bar' });
    [['z1_pct', 'z1'], ['z2_pct', 'z2'], ['z3_pct', 'z3']].forEach(([f, c]) => { const v = r[f] || 0; if (v <= 0) return; const d = el('div', { text: v >= 8 ? v + ' %' : '' }); d.style.flex = v + ' 1 0'; d.style.background = 'var(--tf-' + c + ')'; if (c === 'z1') d.classList.add('tf-dark-text'); zb.appendChild(d); });
    const kvb = el('div', { class: 'tf-kv' });
    box.append(el('div', { class: 'tf-check-meta', text: 'Zeit in den drei Zonen ' + (r.zonen === 'Leistung' ? '(Leistung: unter 76 % · 76–100 % · über 100 % FTP)' : '(Puls: unter VT1 · VT1–VT2 · über VT2)') }), zb, kvb);
    const dz = r.decoupling_pct == null ? null : r.decoupling_pct < 5 ? { c: 'green', label: 'stabil' } : r.decoupling_pct < 8 ? { c: 'orange', label: 'erhöht' } : { c: 'red', label: 'hoch' };
    const dec = ['Decoupling', r.decoupling_pct == null ? '–' : nf(Math.max(0, r.decoupling_pct), 1), r.decoupling_pct == null ? '' : '%', dz];
    kv(kvb, rad && r.np
      ? [['Normalized Power', String(r.np), 'W'], ['Intensität (IF)', nf(r.if, 2), '', { c: r.if > a.rad_if_max + 0.005 || r.if < a.rad_if_min - 0.005 ? 'gray' : 'green', label: r.if > a.rad_if_max + 0.005 ? 'härter als Renntempo' : r.if < a.rad_if_min - 0.005 ? 'lockerer als Renntempo' : 'Renntempo' }], ['Variabilität (VI)', nf(r.vi, 2), '', r.vi <= 1.05 ? { c: 'green', label: 'gleichmäßig' } : r.vi <= 1.1 ? { c: 'gray', label: 'wechselnd' } : { c: 'orange', label: 'stark wechselnd' }], ['Über FTP', String(r.ueber_ftp_min || 0), 'min'], dec, ['Belastung', String(r.tss == null ? '–' : r.tss), 'TSS']]
      : [['Unter VT1', String(r.z1_pct), '% der Zeit'], [rad ? 'Puls über VT2' : 'Schneller als VT2', String(rad ? r.puls_vt2_min || 0 : r.schnell_min || 0), 'min'], [rad ? 'Zwischen VT1 und VT2' : 'Puls über VT2', String(rad ? r.z2_min || 0 : r.puls_vt2_min || 0), 'min'], dec, [rad ? 'Trittfrequenz' : 'Schrittfrequenz', r.kadenz == null ? '–' : String(r.kadenz), rad ? 'U/min' : 'spm'], ['Belastung', String(r.tss == null ? '–' : r.tss), 'TSS']]);
    const cA = el('div', { class: 'tf-chart', style: 'min-height:150px' }), cB = el('div', { class: 'tf-chart', style: 'min-height:120px' }), cap = el('div', { class: 'tf-caption' });
    box.append(cA, cB, cap);
    const S = CH.serien.get(r.id);
    if (S === undefined) { emptyNote(cA, 'Verlauf wird geladen …'); checkSerie(r.id); return; }
    if (S === false) { emptyNote(cA, 'Verlauf gerade nicht erreichbar – bist du offline? Später noch einmal antippen.'); return; }
    if (!S || !S.m || !S.m.length) { emptyNote(cA, 'Für diese Einheit ist kein Verlauf gespeichert.'); return; }
    const rows = S.m.map((m, i) => ({ m, p: S.p[i], hr: S.hr[i], pace: S.v[i] > 1.5 ? 1000 / S.v[i] : null }));
    const T = rows[rows.length - 1].m, step = T > 200 ? 60 : T > 100 ? 30 : T > 45 ? 15 : 10;
    const xo = { xlin: true, x: [0, Math.max(1, T)], xtv: d3.range(0, T + 0.01, step), xfmt: (v) => (v >= 60 ? hm(v / 60) + ' h' : Math.round(v) + ' min') };
    const head = (q) => 'nach ' + (q.m >= 60 ? hm(q.m / 60) + ' h' : Math.round(q.m) + ' min');
    const hasP = rad && rows.some((q) => q.p > 0), hasV = !rad && rows.some((q) => q.pace);
    const lines = (q) => [hasP ? { label: 'Leistung', value: q.p == null ? '–' : q.p + ' W', color: col('orange') } : hasV ? { label: 'Tempo', value: q.pace ? mmss(q.pace) + ' /km' : '–', color: col('mint') } : null, { label: 'Puls', value: q.hr ? q.hr + ' bpm' : '–', color: col('pink') }].filter(Boolean);
    if (hasP) {
      const ftp = a.ftp_ref_w, ps = rows.map((q) => q.p).filter((x) => x != null).sort(d3.ascending);
      const P = plot(cA, Object.assign({ h: 150, y: [0, Math.max(ftp * 1.08, d3.quantile(ps, 0.995) || 0) * 1.05], ny: 4, yfmt: (t) => t + ' W', label: 'Leistung im Verlauf' }, xo));
      refLine(P, 0.76 * ftp, col('blue')); refLine(P, ftp, col('red'));
      line(P, rows, (q) => q.m, (q) => q.p, col('orange'), 1.7);
      hoverTime(cA, P, rows, (q) => q.m, head, lines, [{ y: (q) => q.p, color: col('orange') }]);
    } else if (hasV) {
      const pv = rows.map((q) => q.pace).filter(Boolean).sort(d3.ascending);
      const lo = Math.floor((Math.min(d3.quantile(pv, 0.02), a.vt2_pace_s_km) - 10) / 5) * 5, hi = Math.ceil((Math.max(d3.quantile(pv, 0.98), a.vt1_pace_s_km) + 15) / 5) * 5;
      const pst = hi - lo > 120 ? 60 : 30, ptk = d3.range(Math.ceil(lo / pst) * pst, hi + 0.1, pst);
      const P = plot(cA, Object.assign({ h: 150, y: [lo, hi], yinvert: true, yticks: ptk, yfmt: mmss, label: 'Tempo im Verlauf' }, xo));
      refLine(P, a.vt1_pace_s_km, col('blue')); refLine(P, a.vt2_pace_s_km, col('red'));
      const R2 = rows.map((q) => Object.assign({}, q, { pk: q.pace == null ? null : Math.max(lo, Math.min(hi, q.pace)) }));
      line(P, R2, (q) => q.m, (q) => q.pk, col('mint'), 1.8);
      hoverTime(cA, P, R2, (q) => q.m, head, lines, [{ y: (q) => q.pk, color: col('mint') }]);
    } else emptyNote(cA, rad ? 'Keine Leistungsdaten – die Einordnung kommt aus dem Puls.' : 'Keine Tempodaten.');
    const hs = rows.map((q) => q.hr).filter((x) => x);
    if (hs.length) {
      const lo = Math.floor((Math.min(...hs, a.vt1_hf) - 8) / 5) * 5, hi = Math.ceil((Math.max(...hs, a.vt2_hf) + 6) / 5) * 5;
      const P = plot(cB, Object.assign({ h: 120, y: [lo, hi], ny: 3, label: 'Puls im Verlauf' }, xo));
      const y1 = P.ys(Math.min(hi, a.vt2_hf)), y2 = P.ys(Math.max(lo, a.vt1_hf));
      svg('rect', { x: P.ml, y: P.top, width: P.w - P.mr - P.ml, height: Math.max(0, y1 - P.top), fill: col('red'), opacity: 0.06 }, P.g);
      svg('rect', { x: P.ml, y: y1, width: P.w - P.mr - P.ml, height: Math.max(0, y2 - y1), fill: col('orange'), opacity: 0.06 }, P.g);
      refLine(P, a.vt1_hf, col('blue')); refLine(P, a.vt2_hf, col('red'));
      line(P, rows, (q) => q.m, (q) => q.hr, col('pink'), 1.7);
      hoverTime(cB, P, rows, (q) => q.m, head, lines, [{ y: (q) => q.hr, color: col('pink') }]);
    } else emptyNote(cB, 'Keine Pulsdaten.');
    cap.textContent = (hasP ? 'Oben Leistung – gestrichelt blau 76 % FTP (Grenze locker), rot FTP ' + a.ftp_ref_w + ' W. ' : hasV ? 'Oben Tempo, oben ist schneller – gestrichelt blau VT1 ' + mmss(a.vt1_pace_s_km) + ', rot VT2 ' + mmss(a.vt2_pace_s_km) + ' /km. ' : '') + 'Unten Puls – blau VT1 ' + a.vt1_hf + ', rot VT2 ' + a.vt2_hf + ' bpm.' + (r.decoupling_pct == null ? ' Decoupling gibt es nur für gleichmäßige Einheiten ab ' + (rad ? '70' : '55') + ' min.' : '') + (r.kh_g_h != null ? ' Kohlenhydrate: ' + r.kh_g_h + ' g/h.' : '') + (r.temp != null ? ' Gerätetemperatur im Schnitt ' + r.temp + ' °C (in der Sonne und am Körper höher als die Luft).' : '');
  }

  /* ---------- LAUF-BELASTUNGSWÄCHTER (Training) ---------- */
  function renderLaufwaechter() {
    const L = rowsOf('laufwaechter'), W = rowsOf('lauf_wochen'), At = rowsOf('athlet'), el1 = $('#chart-laufwochen');
    if (!L || !W || !At) { if (failedAny('laufwaechter', 'lauf_wochen')) failed(el1); return; }
    const l = L[0], a = At[0], ramp = a.lauf_rampe_max_pct / 100;
    if (!l) return;
    $('#lw-ampel').style.background = col(AMPEL[l.ampel] || 'gray');
    const kz = l.kadenz == null ? null : l.kadenz >= l.kadenz_ziel - 5 ? { c: 'green', label: 'Ziel ' + l.kadenz_ziel } : { c: 'orange', label: 'Ziel ' + l.kadenz_ziel };
    kv($('#lw-kv'), [
      ['Diese Woche', l.woche_txt, 'km', { c: l.woche_km > l.budget_km ? 'red' : 'green', label: 'Budget ' + l.budget_km + ' km' }],
      ['Noch frei', l.ampel === 'rot' ? '0' : String(l.rest_km), 'km', { c: AMPEL[l.ampel] || 'gray', label: l.modus === 'wiedereinstieg' ? 'Wiedereinstieg' : '+' + l.ramp_pct + ' % pro Woche' }],
      l.ratio == null ? ['4-Wochen-Schnitt', l.chronic_txt, 'km'] : ['7 Tage zu 4 Wochen', l.ratio_txt, '', { c: l.ratio > 1.3 ? 'red' : l.ratio > 1 + ramp ? 'orange' : 'green', label: l.km7_txt + ' km in 7 Tagen' }],
      ['Schrittfrequenz', l.kadenz == null ? '–' : String(l.kadenz), 'spm', kz],
    ]);
    const rows = W.map((w, i) => {
      const prev = W.slice(Math.max(0, i - 4), i), chronic = prev.length === 4 ? prev.reduce((s, x) => s + x.km, 0) / 4 : null;
      return Object.assign({}, w, { limit: w.aktuell ? l.budget_km : chronic != null && chronic >= 8 ? chronic * (1 + ramp) : null });
    }).slice(-12);
    const by = new Map(rows.map((w) => [w.woche, w]));
    const top = Math.max(10, ...rows.map((w) => Math.max(w.km, w.limit || 0))) * 1.12;
    const P = plot(el1, { h: 170, y: [0, top], yfmt: (t) => t + ' km', xband: rows.map((w) => w.woche), xfmt: (k) => by.get(k).kw, xlabw: 54, pad: 0.3, label: 'Laufkilometer pro Woche' });
    const bw = Math.min(22, P.xs.bandwidth());
    rows.forEach((w) => {
      const x = P.xs(w.woche) + (P.xs.bandwidth() - bw) / 2;
      if (w.km > 0) { const y = P.ys(w.km); svg('path', { d: roundTop(x, y, bw, P.ys(0) - y, 4), fill: col(w.limit != null && w.km > w.limit ? 'orange' : 'mint'), opacity: w.aktuell ? 0.55 : 1 }, P.g); }
      if (w.limit != null) { const y = Math.round(P.ys(w.limit)) + 0.5; svg('line', { x1: x - 3, x2: x + bw + 3, y1: y, y2: y, stroke: col('fg'), 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.7 }, P.g); }
    });
    hoverBands(el1, P, rows.map((w) => w.woche), (k) => { const w = by.get(k); return w.kw + ' · ab ' + fmtDay(toDay(k)) + (w.aktuell ? ' (läuft)' : ''); }, (k) => { const w = by.get(k); return [{ label: 'Laufen', value: nf(w.km, 1) + ' km', color: col(w.limit != null && w.km > w.limit ? 'orange' : 'mint') }, { label: 'Läufe', value: String(w.laeufe) }, { label: 'Längster Lauf', value: w.laengster ? nf(w.laengster, 1) + ' km' : '–' }, { label: w.aktuell ? 'Budget' : 'Grenze', value: w.limit == null ? '–' : nf(w.limit) + ' km' }]; });
  }

  /* ---------- RAD ---------- */
  function renderRad() {
    const sec = $('#rad'); fill(sec);
    const L = rowsOf('leistung'), F = rowsOf('ftp'), LA = rowsOf('lauf'), RA = rowsOf('rad'), A = rowsOf('athlet'), H = heute();
    // Leistungskurve
    {
      const el = $('#chart-kurve');
      if (!L || !F) { if (failedAny('leistung', 'ftp')) failed(el); }
      else {
        const R = L.filter((r) => r.watt);
        const top = Math.max(...R.map((r) => r.watt)) * 1.08;
        const P = plot(el, { h: 220, y: [0, top], yfmt: (t) => nf(t), xlog: true, x: [1, 7200], xtv: [1, 5, 30, 60, 300, 1200, 3600, 7200], xfmt: (t) => (t < 60 ? t + ' s' : t < 3600 ? t / 60 + ' min' : t / 3600 + ' h'), label: 'Leistungskurve' });
        const gid = 'tf-pc-grad', defs = svg('defs', null, P.s), lg = svg('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        [[0, 0.26], [0.5, 0.1], [1, 0]].forEach(([o, a]) => svg('stop', { offset: o, 'stop-color': col('orange'), 'stop-opacity': a }, lg));
        svg('path', { d: d3.area().x((r) => P.xs(r.sek)).y0(P.ys(0)).y1((r) => P.ys(r.watt))(R), fill: 'url(#' + gid + ')' }, P.g);
        const ref = F.find((x) => x.id === 'ref'), dat = F.find((x) => x.id === 'p20');
        if (ref) refLine(P, ref.watt, col('blue'));
        if (dat && dat.watt) refLine(P, dat.watt, col('gray'));
        line(P, R, (r) => r.sek, (r) => r.watt, col('orange'), 2.2);
        dots(P, R, (r) => r.sek, (r) => r.watt, col('orange'), 3.2, 1);
        hoverTime(el, P, R, (r) => r.sek, (r) => r.dauer, (r) => [{ label: 'Bestwert', value: r.watt + ' W', color: col('orange') }, { label: 'pro kg', value: r.wkg + ' W/kg' }, { label: 'am', value: r.datum || '–' }], [{ y: (r) => r.watt, color: col('orange') }]);
      }
    }
    if (F) table($('#tabelle-ftp'), 'ftp', F, [{ f: 'methode', cls: 'tf-wrap-cell' }, { f: 'watt', cls: 'r' }, { f: 'wkg', cls: 'r' }, { f: 'hinweis', cls: 'tf-hide-s tf-wrap-cell' }]);
    effizienz('#chart-ef-rad', RA, 'teal', 'W/Schlag', 'rad', H);
    const RB = rowsOf('rad_bedarf');
    if (RB && A) {
      table($('#tabelle-bedarf'), 'rad_bedarf', RB, [{ f: 'cda_txt' }, { f: 'watt', cls: 'r' }, { f: 'ref_pct', cls: 'r' }, { f: 'daten_pct', cls: 'r' }, { f: 'genannt_pct', cls: 'r tf-hide-s' }]);
      $$('#tabelle-bedarf tbody tr').forEach((tr, i) => { if (Math.abs(RB[i].cda - A[0].cda_m2) < 1e-6) tr.style.fontWeight = '700'; });
    }
    insights($('#erkenntnisse-leistung'), (rows) => rows.filter((r) => r.bereich === 'leistung' && r.id !== 'kadenz'));
  }
  function effizienz(id, rows, c, unit, src, H) {
      const el = $(id);
      if (!rows || !H) { if (failedAny(src)) failed(el); return; }
      const from = iso(toDay(H.date) - 364 * DAY), R = rows.filter((r) => r.ef && r.date >= from);
      if (!R.length) { emptyNote(el, 'Keine passenden Einheiten in den letzten 12 Monaten.'); return; }
      const v = R.map((r) => r.ef), pad = (Math.max(...v) - Math.min(...v)) * 0.12 || 0.1;
      const P = plot(el, { h: 170, y: [Math.min(...v) - pad, Math.max(...v) + pad], yfmt: (t) => nf(t, 1), ny: 3, x: [toDay(from), toDay(H.date)], label: 'Effizienz ' + src });
      gapShade(P, R.map((r) => r.date), from, H.date, 21);
      dots(P, R, (r) => toDay(r.date), (r) => r.ef, col(c), 3, 0.45);
      line(P, breaks(R, 21), (r) => toDay(r.date), (r) => r.ef_trend, col(c), 2.2);
      hoverTime(el, P, R, (r) => toDay(r.date), (r) => fmtDay(toDay(r.date)), (r) => [{ label: 'Effizienz', value: nf(r.ef, 2) + ' ' + unit, color: col(c) }, { label: 'Median (7)', value: nf(r.ef_trend, 2) }, src === 'rad' ? { label: 'NP / Puls', value: r.np + ' W / ' + r.hf } : { label: 'Tempo / Puls', value: r.tempo + ' / ' + r.hf }], [{ y: (r) => r.ef, color: col(c) }]);
  }

  /* ---------- LAUFEN ---------- */
  function renderLaufen() {
    const sec = $('#laufen'); fill(sec);
    const LA = rowsOf('lauf'), A = rowsOf('athlet'), H = heute();
    renderLaufwaechter();
    // Kadenz
    {
      const el = $('#chart-kadenz');
      if (!LA || !A || !H) { if (failedAny('lauf', 'athlet')) failed(el); }
      else {
        const from = iso(toDay(H.date) - 364 * DAY), R = LA.filter((r) => r.kadenz && r.date >= from), goal = A[0].kadenz_ziel_spm;
        if (!R.length) emptyNote(el, 'Keine Läufe mit Schrittfrequenz in den letzten 12 Monaten.');
        else {
          const v = R.map((r) => r.kadenz).concat([goal]);
          const P = plot(el, { h: 200, y: [Math.floor(Math.min(...v) - 4), Math.ceil(Math.max(...v) + 4)], x: [toDay(from), toDay(H.date)], label: 'Schrittfrequenz' });
          gapShade(P, R.map((r) => r.date), from, H.date, 21);
          svg('rect', { x: P.ml, y: P.top, width: P.w - P.mr - P.ml, height: Math.max(0, P.ys(goal) - P.top), fill: col('green'), opacity: 0.06 }, P.g);
          refLine(P, goal, col('green'));
          dots(P, R, (r) => toDay(r.date), (r) => r.kadenz, col('mint'), 3, 0.45);
          line(P, breaks(R, 21), (r) => toDay(r.date), (r) => r.kadenz_trend, col('mint'), 2.2);
          hoverTime(el, P, R, (r) => toDay(r.date), (r) => fmtDay(toDay(r.date)) + ' · ' + nf(r.km, 1) + ' km', (r) => [{ label: 'Schrittfrequenz', value: r.kadenz + ' spm', color: col('mint') }, { label: 'Median (7 Läufe)', value: r.kadenz_trend + ' spm' }, { label: 'Tempo', value: r.tempo + ' /km' }, { label: 'Schrittlänge', value: r.schritt_m == null ? '–' : nf(r.schritt_m, 2) + ' m' }], [{ y: (r) => r.kadenz, color: col('mint') }]);
        }
      }
    }
    effizienz('#chart-ef-lauf', LA, 'mint', 'm/min/Schlag', 'lauf', H);
    insights($('#erkenntnisse-laufen'), (rows) => rows.filter((r) => ['laufwaechter', 'kadenz', 'acwr_run', 'schmerz'].includes(r.id)));
  }

  /* ---------- Helfer für Eingaben ---------- */
  const A = () => dash.app;
  const localDate = (d) => (d || new Date()).toLocaleDateString('sv-SE');
  const pad2 = (n) => String(n).padStart(2, '0');
  const mmss = (s) => { if (s == null || !isFinite(s)) return '–'; s = Math.round(s); return Math.floor(s / 60) + ':' + pad2(s % 60); };
  const hms = (s) => { if (s == null || !isFinite(s)) return '–'; s = Math.round(s); return Math.floor(s / 3600) + ':' + pad2(Math.floor((s % 3600) / 60)) + ':' + pad2(s % 60); };
  const hmin = (s) => { if (s == null || !isFinite(s)) return '–'; const m = Math.round(s / 60); return Math.floor(m / 60) + ':' + pad2(m % 60); };
  const kurz = (s) => (s < 3600 ? mmss(s) : hms(s)); // 58:12 oder 4:45:10
  const minLab = (t) => (t >= 60 ? Math.floor(t / 60) + ':' + pad2(Math.round(t % 60)) + ' h' : Math.round(t) + ' min');
  // "58:30" → Sekunden; zwei Teile sind min:s ('ms') oder h:min ('hm'), drei Teile h:min:s; eine Zahl = Minuten bzw. Stunden
  function parseTime(str, two) {
    const p = String(str == null ? '' : str).trim().replace(/[.,;]/g, ':').split(':').map((x) => x.trim());
    if (!p.length || p.some((x) => !/^\d{1,3}$/.test(x))) return null;
    const n = p.map(Number);
    if (n.length === 3) return n[1] < 60 && n[2] < 60 ? n[0] * 3600 + n[1] * 60 + n[2] : null;
    if (n.length === 2) return n[1] < 60 ? (two === 'hm' ? n[0] * 3600 + n[1] * 60 : n[0] * 60 + n[1]) : null;
    return two === 'hm' ? n[0] * 3600 : n[0] * 60;
  }
  function el(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) { const v = attrs[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v); }
    kids.forEach((c) => { if (c != null) e.append(c); });
    return e;
  }
  function segButtons(box, items, cur, onPick) {
    box.replaceChildren();
    items.forEach(([v, label, small]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(v === cur), 'data-v': v }, label);
      if (small) b.append(el('small', { text: small }));
      b.addEventListener('click', () => onPick(v));
      box.appendChild(b);
    });
  }
  function setMsg(node, text, err) { node.textContent = text || ''; node.classList.toggle('err', !!err); }
  const monday = (d) => { const t = Date.parse(d), wd = (new Date(t).getUTCDay() + 6) % 7; return iso(t - wd * DAY); };
  const kwOf = (m) => { const t = new Date(Date.parse(m) + 3 * DAY); return Math.floor((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / DAY / 7) + 1; };
  const median = (v) => { const x = v.filter((n) => n != null && isFinite(n)).sort((p, q) => p - q); return x.length ? x[x.length >> 1] : null; };
  function kv(box, items) { // [Bezeichnung, Wert, Einheit, Zone?]
    box.replaceChildren();
    items.forEach(([l, v, u, z]) => {
      const d = el('div', null, el('small', { text: l }), el('span', { class: 'num', text: v }), u ? el('span', { class: 'tf-u', text: u }) : null);
      if (z) { const i = el('i'); i.style.background = col(z.c); d.append(el('span', { class: 'tf-zone' }, i, z.label)); }
      box.appendChild(d);
    });
  }

  /* ---------- BEFINDEN ---------- */
  const FRAGEN = [['schlaf', 'Schlafqualität', 'sehr schlecht', 'sehr gut'], ['energie', 'Energie', 'erschöpft', 'voller Energie'], ['muskeln', 'Muskeln', 'schwer, wund', 'locker'], ['stress', 'Stress', 'sehr gestresst', 'entspannt'], ['stimmung', 'Stimmung', 'mies', 'super']];
  const ORTE = [['schienbein', 'Schienbein'], ['knie', 'Knie'], ['achilles', 'Achillessehne'], ['fuss', 'Fuß'], ['huefte', 'Hüfte'], ['ruecken', 'Rücken'], ['schulter', 'Schulter'], ['sonstiges', 'Anderes']];
  const LK = ['red', 'orange', 'yellow', 'teal', 'green'];
  let ckDate = null, ck = null, ckBuilt = false;
  function ckLoad(date) {
    ckDate = date;
    const row = (A().raw('checkins') || []).find((c) => c.date === date);
    ck = row ? Object.assign({}, row) : { date, schmerz: 0, schmerz_ort: null, krank: false, notiz: '' };
    setMsg($('#checkin-msg'), '');
    ckFill();
  }
  function ckBuild() {
    const box = $('#checkin-fragen');
    FRAGEN.forEach(([k, label, lo, hi]) => {
      const opts = el('div', { class: 'tf-likert-opts' });
      for (let v = 1; v <= 5; v++) {
        const b = el('button', { type: 'button', 'data-k': k, 'data-v': v, 'aria-label': label + ': ' + v + ' von 5' }, String(v));
        b.style.setProperty('--lk', 'var(--tf-' + LK[v - 1] + ')');
        b.addEventListener('click', () => { ck[k] = v; ckFill(); });
        opts.appendChild(b);
      }
      box.appendChild(el('div', { class: 'tf-likert', role: 'group', 'aria-label': label }, el('div', { class: 'tf-likert-h', text: label }), opts, el('div', { class: 'tf-likert-ends' }, el('span', { text: lo }), el('span', { text: hi }))));
    });
    const ortBox = $('#checkin-ort');
    ORTE.forEach(([v, l]) => { const b = el('button', { type: 'button', 'data-v': v }, l); b.addEventListener('click', () => { ck.schmerz_ort = ck.schmerz_ort === v ? null : v; ckFill(); }); ortBox.appendChild(b); });
    const sl = $('#checkin-schmerz');
    sl.addEventListener('input', () => { ck.schmerz = +sl.value; if (!ck.schmerz) ck.schmerz_ort = null; ckFill(); });
    $('#checkin-krank').addEventListener('change', (e) => { ck.krank = e.target.checked; });
    // ohne Uhr: Schlafdauer in halben Stunden, Ruhepuls von Hand
    const schlafSchritt = (d) => { const v = ck.schlaf_h == null ? (d > 0 ? 7 : 7.5) : Math.round((ck.schlaf_h + d) * 2) / 2; ck.schlaf_h = Math.max(2, Math.min(14, v)); ckFill(); };
    $('#ck-schlaf-minus').addEventListener('click', () => schlafSchritt(-0.5));
    $('#ck-schlaf-plus').addEventListener('click', () => schlafSchritt(0.5));
    $('#ck-puls').addEventListener('input', (e) => { const v = Math.round(+e.target.value.replace(/\D/g, '')); ck.puls = v >= 30 && v <= 130 ? v : null; });
    $('#checkin-notiz').addEventListener('input', (e) => { ck.notiz = e.target.value; });
    $('#checkin-form').addEventListener('submit', ckSave);
    $('#checkin-loeschen').addEventListener('click', ckDelete);
    ckBuilt = true;
  }
  function ckFill() {
    const today = localDate(), yest = localDate(new Date(Date.now() - DAY));
    const items = [[today, 'Heute'], [yest, 'Gestern']];
    if (ckDate !== today && ckDate !== yest) items.push([ckDate, fmtDay(toDay(ckDate))]);
    segButtons($('#checkin-tag'), items, ckDate, (d) => ckLoad(d));
    $$('#checkin-fragen button').forEach((b) => b.setAttribute('aria-pressed', String(+ck[b.dataset.k] === +b.dataset.v)));
    const s = $('#checkin-schmerz'); if (document.activeElement !== s) s.value = ck.schmerz || 0;
    $('#checkin-schmerz-wert').textContent = ck.schmerz ? ck.schmerz + ' von 10' : 'keine';
    $('#checkin-ort').hidden = !(ck.schmerz > 0);
    $$('#checkin-ort button').forEach((b) => b.setAttribute('aria-pressed', String(ck.schmerz_ort === b.dataset.v)));
    $('#checkin-krank').checked = !!ck.krank;
    $('#checkin-ohne').hidden = !A().state.ohne;
    $('#ck-schlaf-wert').textContent = ck.schlaf_h == null ? '–' : hmin(ck.schlaf_h * 3600) + ' h';
    const pi = $('#ck-puls'); if (document.activeElement !== pi) pi.value = ck.puls ? String(ck.puls) : '';
    const n = $('#checkin-notiz'); if (document.activeElement !== n) n.value = ck.notiz || '';
    const exists = (A().raw('checkins') || []).some((c) => c.date === ckDate);
    $('#checkin-loeschen').hidden = !exists;
    $('#checkin-speichern').textContent = exists ? 'Änderungen speichern' : 'Speichern';
    const done = FRAGEN.every(([k]) => ck[k] >= 1), sum = FRAGEN.reduce((x, [k]) => x + (+ck[k] || 0), 0);
    $('#checkin-summe').textContent = done ? String(sum) : '–';
    const B = rowsOf('befinden'), row = B && B.find((r) => r.date === ckDate);
    $('#checkin-vergleich').textContent = row && row.basis != null && exists ? (row.z >= 0.5 ? 'über' : row.z <= -0.5 ? 'unter' : 'im') + ' Normal (' + nf(row.basis, 1) + ')' : done ? (exists ? 'Normal ab 8 Einträgen' : 'nicht gespeichert') : FRAGEN.filter(([k]) => !(ck[k] >= 1)).length + ' offen';
  }
  async function ckSave(ev) {
    ev.preventDefault();
    const msg = $('#checkin-msg');
    if (!FRAGEN.every(([k]) => ck[k] >= 1)) return setMsg(msg, 'Bitte alle fünf Fragen beantworten.', true);
    if (ck.schmerz > 0 && !ck.schmerz_ort) return setMsg(msg, 'Wo tut es weh? Bitte einen Ort wählen.', true);
    const btn = $('#checkin-speichern'); btn.disabled = true; setMsg(msg, 'Speichert …');
    try {
      const j = await A().api('POST', '/api/checkin', Object.assign({}, ck, A().state.ohne ? {} : { puls: null, schlaf_h: null }));
      A().patch('checkins', (A().raw('checkins') || []).filter((c) => c.date !== ck.date).concat([j.row]));
      ck = Object.assign({}, j.row); setMsg(msg, 'Gespeichert ✓');
      A().toast(ck.date === localDate() ? 'Check-in gespeichert – Tagesform neu berechnet' : 'Check-in gespeichert');
    } catch (e) { setMsg(msg, e.message, true); }
    finally { btn.disabled = false; }
  }
  async function ckDelete() {
    const msg = $('#checkin-msg'), d = ckDate;
    try { await A().api('DELETE', '/api/checkin?date=' + encodeURIComponent(d)); A().patch('checkins', (A().raw('checkins') || []).filter((c) => c.date !== d)); ckLoad(d); setMsg(msg, 'Eintrag gelöscht.'); }
    catch (e) { setMsg(msg, e.message, true); }
  }

  function renderBefinden() {
    const sec = $('#befinden'); fill(sec);
    if (info('checkins').status !== 'ok') return;
    if (!ckBuilt) ckBuild();
    if (!ckDate) ckLoad(localDate()); else ckFill();
    const B = rowsOf('befinden') || [];
    // Verlauf
    {
      const el1 = $('#chart-befinden');
      if (!B.length) emptyNote(el1, 'Noch keine Check-ins. Nach dem ersten Eintrag siehst du hier deinen Verlauf.');
      else {
        const to = localDate(), from = B[0].date > iso(toDay(to) - 89 * DAY) ? iso(toDay(B[0].date) - 3 * DAY) : iso(toDay(to) - 89 * DAY), R = B.filter((r) => r.date >= from);
        const P = plot(el1, { h: 200, y: [5, 25], yticks: [5, 10, 15, 20, 25], x: [toDay(from), toDay(to)], label: 'Befinden' });
        const xf = (r) => toDay(r.date);
        band(P, breaks(R.filter((r) => r.basis != null), 6), xf, (r) => r.basis - 0.5 * r.streuung, (r) => r.basis + 0.5 * r.streuung, col('green'), 0.14);
        dots(P, R, xf, (r) => r.summe, col('green'), 3.2, 0.6);
        line(P, breaks(R, 4), xf, (r) => r.schnitt7, col('green'), 2.2);
        R.filter((r) => r.schmerz >= 3).forEach((r) => svg('circle', { cx: P.xs(xf(r)), cy: P.top + 5, r: 4, fill: col('red') }, P.g));
        const last = R[R.length - 1]; endDot(P, xf(last), last.summe, col('green'));
        hoverTime(el1, P, R, xf, (r) => fmtDay(xf(r)), (r) => [
          { label: 'Summe', value: r.summe + ' / 25', color: col('green') }, { label: '7-Tage-Schnitt', value: nf(r.schnitt7, 1) },
          { label: 'Schlaf · Energie · Muskeln', value: r.schlaf + ' · ' + r.energie + ' · ' + r.muskeln }, { label: 'Stress · Stimmung', value: r.stress + ' · ' + r.stimmung },
          { label: 'Schmerz', value: r.schmerz ? r.schmerz + '/10 ' + r.ort_txt : 'keiner' },
        ], [{ y: (r) => r.summe, color: col('green') }]);
      }
    }
    // Liste
    table($('#tabelle-befinden'), 'befinden', B.slice(-14).reverse(), [
      { f: 'datum' }, { f: 'summe', cls: 'r' }, { f: 'schlaf', cls: 'r tf-hide-s' }, { f: 'energie', cls: 'r tf-hide-s' }, { f: 'muskeln', cls: 'r tf-hide-s' }, { f: 'stress', cls: 'r tf-hide-s' }, { f: 'stimmung', cls: 'r tf-hide-s' },
      { f: 'schmerz', cls: 'r', render: (td, r) => { td.textContent = r.schmerz ? r.schmerz + ' · ' + r.ort_txt : '–'; if (r.schmerz >= 3) td.style.color = col('red'); } },
    ]);
    if (!B.length) $('#tabelle-befinden').tBodies[0].appendChild(el('tr', null, el('td', { colspan: 8, class: 'tf-empty', text: 'Noch keine Einträge.' })));
    $$('#tabelle-befinden tbody tr[data-key]').forEach((tr) => tr.addEventListener('click', () => { ckLoad(tr.getAttribute('data-key')); $('#karte-checkin').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    // Gewicht
    {
      const el2 = $('#chart-gewicht'), G = rowsOf('gewicht'), At = rowsOf('athlet');
      if (!G || !At) { if (failedAny('gewicht')) failed(el2); }
      else if (!G.length) emptyNote(el2, 'Noch keine Gewichtseinträge in Garmin Connect.');
      else {
        const ref = At[0].gewicht_ref_kg, to = localDate(), from = G[0].date > iso(toDay(to) - 364 * DAY) ? iso(toDay(G[0].date) - 7 * DAY) : iso(toDay(to) - 364 * DAY);
        const R = G.filter((r) => r.date >= from), v = R.map((r) => r.kg).concat([ref]), xf = (r) => toDay(r.date);
        const P = plot(el2, { h: 180, y: [Math.floor(Math.min(...v) - 1), Math.ceil(Math.max(...v) + 1)], ny: 4, x: [toDay(from), toDay(to)], label: 'Gewicht' });
        refLine(P, ref, col('fg3'));
        dots(P, R, xf, (r) => r.kg, col('indigo'), 3, 0.55);
        line(P, breaks(R, 14), xf, (r) => r.mittel7, col('indigo'), 2.2);
        hoverTime(el2, P, R, xf, (r) => fmtDay(xf(r)), (r) => [{ label: 'Gewicht', value: nf(r.kg, 1) + ' kg', color: col('indigo') }, { label: '7-Tage-Mittel', value: nf(r.mittel7, 1) + ' kg' }, { label: 'Körperfett', value: r.fett_pct == null ? '–' : nf(r.fett_pct, 1) + ' %' }], [{ y: (r) => r.kg, color: col('indigo') }]);
      }
    }
    // Ernährung
    {
      const el3 = $('#chart-ernaehrung'), N = rowsOf('ernaehrung');
      if (!N) { if (failedAny('ernaehrung')) failed(el3); }
      else if (!N.length) emptyNote(el3, 'Noch keine Mahlzeiten in Garmin Connect. Sobald du dort unter „Ernährung“ protokollierst, erscheinen Kohlenhydrate und Eiweiß hier – je Tag gegen deinen Bedarf.');
      else {
        const R = N.slice(-21), keys = R.map((r) => r.date), by = new Map(R.map((r) => [r.date, r]));
        const top = Math.max(12, ...R.map((r) => r.kh_gkg)) * 1.08;
        const P = plot(el3, { h: 190, y: [0, top], yfmt: (t) => t + ' g/kg', xband: keys, xfmt: (d) => by.get(d).datum, xlabw: 46, label: 'Kohlenhydrate pro kg' });
        const bw = Math.min(18, P.xs.bandwidth());
        R.forEach((r) => {
          const x = P.xs(r.date) + (P.xs.bandwidth() - bw) / 2;
          svg('rect', { x: x - 3, y: P.ys(r.kh_hi), width: bw + 6, height: Math.max(0, P.ys(r.kh_lo) - P.ys(r.kh_hi)), rx: 5, fill: col('fill') }, P.g);
          const y = P.ys(r.kh_gkg); svg('path', { d: roundTop(x, y, bw, P.ys(0) - y, 4), fill: col(r.kh_lage === 'im' ? 'green' : r.kh_lage === 'unter' ? 'orange' : 'blue') }, P.g);
        });
        hoverBands(el3, P, keys, (d) => fmtDay(toDay(d)), (d) => { const r = by.get(d); return [{ label: 'Kohlenhydrate', value: r.kh_g + ' g · ' + r.kh_txt + ' g/kg' }, { label: 'Spanne für ' + nf(r.training_h, 1) + ' h Training', value: r.kh_ziel }, { label: 'Eiweiß', value: r.eiweiss_g + ' g · ' + r.eiweiss_txt + ' g/kg' }, { label: 'Energie', value: nf(r.kcal) + ' kcal' }]; });
        el3.appendChild(el('div', { class: 'tf-caption', text: 'Graue Felder: Spanne für den Trainingsumfang des Tages · grün im Bereich, orange darunter, blau darüber.' }));
      }
    }
    insights($('#erkenntnisse-befinden'), (rows) => rows.filter((r) => ['befinden', 'koerper', 'ernaehrung'].includes(r.bereich) || r.id === 'schmerz'));
  }

  /* ---------- FUELING (Training) ---------- */
  async function fuelSave(id, v) {
    const raw = A().raw('fueling_log') || [], rest = raw.filter((r) => String(r.id) !== String(id));
    try {
      if (String(v).trim() === '') { await A().api('DELETE', '/api/fueling?id=' + encodeURIComponent(id)); A().patch('fueling_log', rest); A().toast('Eintrag entfernt'); return; }
      const g = Math.round(+String(v).replace(',', '.'));
      if (!(g >= 0 && g <= 2000)) throw new Error('Bitte Gramm zwischen 0 und 2000 eintragen.');
      await A().api('POST', '/api/fueling', { id: String(id), kh_g: g });
      A().patch('fueling_log', rest.concat([{ id: String(id), kh_g: g }]));
      A().toast('Fueling gespeichert');
    } catch (e) { A().toast(e.message, 5000); }
  }
  function renderFueling() {
    const FU = rowsOf('fueling'), tb = $('#tabelle-fueling');
    if (!FU) return;
    table(tb, 'fueling', FU.slice(0, 10), [
      { f: 'datum' }, { f: 'sportart' }, { f: 'dauer', cls: 'r' },
      { f: 'kh_g', cls: 'r', render: (td, r) => {
        if (r.quelle === 'Garmin') { td.textContent = r.kh_g + ' g'; td.title = 'aus Garmin Connect'; return; }
        const inp = el('input', { class: 'tf-input tf-cell-input', inputmode: 'numeric', placeholder: 'g', 'aria-label': 'Kohlenhydrate in Gramm, ' + r.sportart + ' am ' + r.datum });
        inp.value = r.kh_g == null ? '' : r.kh_g;
        inp.addEventListener('change', () => fuelSave(r.id, inp.value));
        td.appendChild(inp);
      } },
      { f: 'g_h_txt', cls: 'r', render: (td, r) => { const i = el('i'); i.style.background = col(r.lage === 'im' ? 'green' : r.lage === 'unter' ? 'orange' : r.lage === 'über' ? 'blue' : 'fill'); td.appendChild(el('span', { class: 'tf-lage', title: 'Ziel ' + r.ziel }, i, r.g_h_txt)); } },
      { f: 'schweiss_txt', cls: 'tf-hide-s' },
    ]);
    if (!FU.length) tb.tBodies[0].appendChild(el('tr', null, el('td', { colspan: 6, class: 'tf-empty', text: 'Noch keine Radeinheit ab 90 min oder kein Lauf ab 75 min.' })));
  }

  /* ---------- SCHWIMMEN ---------- */
  let cssBuilt = false;
  function cssBuild() {
    const d = $('#css-datum'); d.value = localDate(); d.max = localDate();
    const upd = () => { const t4 = parseTime($('#css-400').value, 'ms'), t2 = parseTime($('#css-200').value, 'ms'); $('#css-ergebnis').textContent = t4 && t2 && t4 > t2 ? mmss(100 / (200 / (t4 - t2))) + ' /100 m' : '–'; };
    $('#css-400').addEventListener('input', upd); $('#css-200').addEventListener('input', upd);
    $('#css-form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const msg = $('#css-msg'), date = $('#css-datum').value, t400 = parseTime($('#css-400').value, 'ms'), t200 = parseTime($('#css-200').value, 'ms');
      if (!date || !t400 || !t200) return setMsg(msg, 'Bitte Datum und beide Zeiten als m:ss eingeben.', true);
      try {
        const j = await A().api('POST', '/api/css', { date, t400_s: t400, t200_s: t200 });
        const tests = (A().raw('css_tests') || []).filter((t) => t.date !== date).concat([{ date, t400_s: t400, t200_s: t200 }]);
        A().patch('css_tests', tests);
        const neuester = tests.map((t) => t.date).sort().pop() === date, ath = A().raw('athlet');
        if (neuester && ath && ath[0]) A().patch('athlet', [Object.assign({}, ath[0], { css_s_100m: j.css_s_100m })]);
        setMsg(msg, neuester ? 'Neue CSS: ' + mmss(j.css_s_100m) + ' /100 m' : 'Gespeichert (älterer Test – deine aktuelle CSS bleibt).');
        if (neuester) A().toast('CSS übernommen – Schwimm-TSS und Rennrechner nutzen den neuen Wert');
      } catch (e) { setMsg(msg, e.message, true); }
    });
    cssBuilt = true;
  }
  function renderSchwimmen() {
    const sec = $('#schwimmen'); fill(sec); rangeButtons();
    if (!cssBuilt) cssBuild();
    const S = rowsOf('schwimmen'), W = rowsOf('schwimm_wochen'), At = rowsOf('athlet'), C = rowsOf('css'), H = heute(), p = params();
    if (!S || !At || !H) { if (failedAny('schwimmen')) failed($('#chart-schwimm-tempo')); return; }
    const css = At[0].css_s_100m, ref = H.date, from28 = iso(toDay(ref) - 27 * DAY), S28 = S.filter((s) => s.date >= from28);
    // Kacheln
    const lastTest = C && C.length ? C[C.length - 1] : null, lastSwim = S[S.length - 1];
    $('#sk-css').textContent = mmss(css);
    $('#sk-css-sub').textContent = lastTest && lastTest.aktiv ? 'Test vom ' + lastTest.datum : 'Profilwert · Test eintragen ↓';
    const pool = S28.filter((s) => s.plausibel && !s.freiwasser), mp = median(pool.map((s) => s.pace_s));
    $('#sk-tempo').textContent = mp ? mmss(mp) : '–';
    $('#sk-tempo-sub').textContent = mp ? Math.round((100 * css) / mp) + ' % CSS · Becken, 4 Wochen' : lastSwim ? 'letzte Einheit ' + lastSwim.datum : 'noch keine Einheit';
    $('#sk-km').textContent = nf(S28.reduce((x, s) => x + s.km, 0), 1);
    $('#sk-km-sub').textContent = S28.length + (S28.length === 1 ? ' Einheit' : ' Einheiten') + ' in 4 Wochen';
    const md = median(S28.map((s) => s.dps_m)), mdAll = median(S.slice(-10).map((s) => s.dps_m));
    $('#sk-dps').textContent = md ? nf(md, 2) : mdAll ? nf(mdAll, 2) : '–';
    $('#sk-dps-sub').textContent = md ? 'Median, 4 Wochen' : mdAll ? 'Median der letzten 10' : '–';
    // Tempo
    {
      const el1 = $('#chart-schwimm-tempo'), { rows, from, to } = windowRows(S, +p.range), R = rows.filter((s) => s.plausibel);
      if (!R.length) emptyNote(el1, 'Keine Schwimmeinheiten in diesem Zeitraum.');
      else {
        const v = R.map((s) => s.pace_s).concat([css]), lo = Math.floor(Math.min(...v) / 5) * 5 - 5, hi = Math.ceil(Math.max(...v) / 5) * 5 + 5;
        const P = plot(el1, { h: 230, y: [lo, hi], yinvert: true, yfmt: mmss, ny: 5, x: [toDay(from), toDay(to)], label: 'Schwimmtempo' });
        const zb = (a1, a2, c, o) => { const y1 = P.ys(Math.max(lo, Math.min(hi, css / a1))), y2 = P.ys(Math.max(lo, Math.min(hi, css / a2))); svg('rect', { x: P.ml, y: Math.min(y1, y2), width: P.w - P.mr - P.ml, height: Math.abs(y2 - y1), fill: col(c), opacity: o }, P.g); };
        zb(0.9, 0.97, 'blue', 0.08); zb(0.97, 1.03, 'orange', 0.1);
        gapShade(P, R.map((s) => s.date), from, to, 21);
        refLine(P, css, col('red'));
        const xf = (s) => toDay(s.date);
        dots(P, R.filter((s) => !s.freiwasser), xf, (s) => s.pace_s, col('blue'), 3.6, 0.75);
        dots(P, R.filter((s) => s.freiwasser), xf, (s) => s.pace_s, col('teal'), 3.6, 0.85);
        const pr = R.filter((s) => !s.freiwasser).map((s, i, arr) => ({ date: s.date, t: median(arr.slice(Math.max(0, i - 4), i + 1).map((x) => x.pace_s)) }));
        line(P, breaks(pr, 28), (r) => toDay(r.date), (r) => r.t, col('blue'), 2.2);
        hoverTime(el1, P, R, xf, (s) => fmtDay(xf(s)) + ' · ' + s.art, (s) => [{ label: 'Tempo', value: s.pace_txt + ' /100 m', color: col(s.freiwasser ? 'teal' : 'blue') }, { label: 'Intensität', value: s.css_pct + ' % CSS · ' + s.zone }, { label: 'Strecke', value: nf(s.m) + ' m in ' + s.dauer }, { label: 'SWOLF · Züge/min', value: (s.swolf || '–') + ' · ' + (s.zuege_min || '–') }], [{ y: (s) => s.pace_s, color: col('blue') }]);
        const n = rows.length - R.length;
        if (n) el1.appendChild(el('div', { class: 'tf-caption', text: n + (n === 1 ? ' Einheit' : ' Einheiten') + ' mit unplausiblem Tempo (vermutlich Bahnzählfehler) ausgeblendet.' }));
      }
    }
    // Umfang
    if (W) {
      const el2 = $('#chart-schwimm-wochen'), from = iso(toDay(ref) - (+p.range - 1) * DAY), by = new Map(W.map((w) => [w.woche, w])), keys = [];
      for (let t = Date.parse(monday(from)); t <= Date.parse(ref); t += 7 * DAY) keys.push(iso(t));
      const top = Math.max(2, ...keys.map((k) => (by.get(k) || {}).km || 0)) * 1.1;
      const P = plot(el2, { h: 190, y: [0, top], yfmt: (t) => t + ' km', xband: keys, xfmt: (k) => 'KW ' + kwOf(k), xlabw: 54, pad: 0.3, label: 'Schwimmumfang' });
      const bw = Math.min(20, P.xs.bandwidth());
      keys.forEach((k) => { const w = by.get(k); if (!w || !w.km) return; const x = P.xs(k) + (P.xs.bandwidth() - bw) / 2, y = P.ys(w.km); svg('path', { d: roundTop(x, y, bw, P.ys(0) - y, 4), fill: col('blue') }, P.g); });
      hoverBands(el2, P, keys, (k) => 'KW ' + kwOf(k) + ' · ab ' + fmtDay(toDay(k)), (k) => { const w = by.get(k) || { km: 0, einheiten: 0, pace_txt: '–' }; return [{ label: 'Umfang', value: nf(w.km, 1) + ' km', color: col('blue') }, { label: 'Einheiten', value: String(w.einheiten) }, { label: 'Tempo (Median)', value: w.pace_txt + ' /100 m' }]; });
    }
    // Strecke pro Zug
    {
      const el3 = $('#chart-schwimm-dps'), { rows, from, to } = windowRows(S, +p.range), R = rows.filter((s) => s.dps_m && s.plausibel);
      if (!R.length) emptyNote(el3, 'Keine Einheiten mit Zugdaten in diesem Zeitraum.');
      else {
        const v = R.map((s) => s.dps_m), pad = Math.max(0.1, (Math.max(...v) - Math.min(...v)) * 0.15), xf = (s) => toDay(s.date);
        const P = plot(el3, { h: 190, y: [Math.min(...v) - pad, Math.max(...v) + pad], ny: 4, yfmt: (t) => nf(t, 1) + ' m', x: [toDay(from), toDay(to)], label: 'Strecke pro Zug' });
        gapShade(P, R.map((s) => s.date), from, to, 21);
        dots(P, R, xf, (s) => s.dps_m, col('teal'), 3.4, 0.7);
        const tr = R.map((s, i) => ({ date: s.date, t: median(R.slice(Math.max(0, i - 4), i + 1).map((x) => x.dps_m)) }));
        line(P, breaks(tr, 28), (r) => toDay(r.date), (r) => r.t, col('teal'), 2.2);
        hoverTime(el3, P, R, xf, (s) => fmtDay(xf(s)) + ' · ' + s.art, (s) => [{ label: 'Strecke pro Zug', value: s.dps_txt + ' m', color: col('teal') }, { label: 'Züge pro Minute', value: s.zuege_min == null ? '–' : String(s.zuege_min) }, { label: 'Stroke-Index', value: s.si_txt }], [{ y: (s) => s.dps_m, color: col('teal') }]);
      }
    }
    if (C) table($('#tabelle-css'), 'css', C.slice().reverse(), [{ f: 'datum' }, { f: 't400_txt', cls: 'r' }, { f: 't200_txt', cls: 'r' }, { f: 'css_txt', cls: 'r' }]);
    if (C && !C.length) $('#tabelle-css').tBodies[0].appendChild(el('tr', null, el('td', { colspan: 4, class: 'tf-empty', text: 'Noch kein Test – deine CSS kommt aus dem Profil.' })));
    table($('#tabelle-schwimmen'), 'schwimmen', S.slice(-12).reverse(), [
      { f: 'datum' }, { f: 'art', cls: 'tf-hide-s' }, { f: 'm', cls: 'r', render: (td, s) => { td.textContent = nf(s.m); } }, { f: 'pace_txt', cls: 'r' },
      { f: 'css_pct', cls: 'r', render: (td, s) => { const i = el('i'); i.style.background = col(!s.plausibel ? 'fill' : s.css_pct < 90 ? 'gray' : s.css_pct < 97 ? 'blue' : s.css_pct <= 103 ? 'orange' : 'red'); td.appendChild(el('span', { class: 'tf-lage', title: s.zone }, i, s.plausibel ? s.css_pct + ' %' : '?')); } },
      { f: 'swolf', cls: 'r tf-hide-s' },
    ]);
    insights($('#erkenntnisse-schwimmen'), (rows) => rows.filter((r) => r.bereich === 'schwimmen'));
  }

  /* ---------- RENNRECHNER ---------- */
  // Erst die Sportart, dann die Distanz – alle Distanzen mit denselben Kennzahlen (Katalog TF_DISTANZEN in calcs.js)
  const RR_SPORT = [['tri', 'Triathlon', 'i-tri', 'pink'], ['lauf', 'Laufen', 'i-run', 'mint'], ['rad', 'Rad', 'i-bike', 'orange'], ['schwimmen', 'Schwimmen', 'i-swim', 'blue'], ['mehr', 'Weitere', 'i-target', 'purple']];
  const RR = { st: null, built: null, ctrls: {}, saveT: null, raf: 0 };
  const khMitte = (a) => Math.round((a.kh_g_h_min + a.kh_g_h_max) / 10) * 5; // Mitte der eigenen Spanne, auf 5 g gerundet
  const rrKey = () => RR.st.sport + '_' + RR.st.dist[RR.st.sport];
  const rrItem = () => tfDistanz(RR.st.sport, RR.st.dist[RR.st.sport]);
  function rrLegs(item) {
    const L = item.legs, runs = L.filter((l) => l.typ === 'run');
    return { swim: L.find((l) => l.typ === 'swim') || null, bike: L.find((l) => l.typ === 'bike') || null, runs, run: runs[runs.length - 1] || null, run1: runs.length > 1 ? runs[0] : null, t1: L.find((l) => l.typ === 't1') || null, t2: L.find((l) => l.typ === 't2') || null };
  }
  const bandOf = (leg, a) => (leg.band === 'profil' ? [a.rad_if_min, a.rad_if_max] : leg.band);
  const refPace = (leg, a) => (leg.ref === 'vt1' ? a.vt1_pace_s_km : a.vt2_pace_s_km);
  const refName = (leg) => (leg.ref === 'vt1' ? 'VT1' : 'VT2');
  const mitteB = (b) => (b[0] + b[1]) / 2;
  const istPlan = (item) => item.sport === 'tri' && item.id === 'ld';
  function rrDauerGrob(item) { // erwartete Renndauer in Stunden – für Voreinstellungen der Verpflegung
    return item.legs.reduce((s, l) => s + (l.typ === 'bike' ? l.km / 32 : l.typ === 'run' ? l.km / 12 : l.typ === 'swim' ? l.km / 3.3 : 0), 0);
  }
  function rrDefaults(a, item, kind) {
    const g = rrLegs(item), H = rrDauerGrob(item);
    const s = { vorlage: 'daten', ftp_q: 'referenz', cda: a.cda_m2, hm: 0, pacing: 'gleich', fade_ab: 0, fade_s: 0, ziel_s: null, neo: false, neo_pct: 3,
      fu_kh_rad: H > 2.5 ? khMitte(a) : 60, fu_kh_lauf: H > 2.5 ? 70 : 45, fu_schweiss: 0, fu_gel_g: 25, fu_flasche_g: 60 };
    if (g.swim) { s.neo = !!g.swim.neo; const pool = a.css_s_100m / mitteB(g.swim.band); s.swim_s = Math.round((s.neo ? pool / (1 + s.neo_pct / 100) : pool) * g.swim.km * 10); }
    if (g.bike) s.watt = Math.round(a.ftp_ref_w * mitteB(bandOf(g.bike, a)));
    if (g.run) { s.run_pace = Math.round(refPace(g.run, a) / mitteB(g.run.band)); s.fade_ab = Math.round(g.run.km * 0.6); }
    if (g.run1) s.run1_pace = Math.round(refPace(g.run1, a) / mitteB(g.run1.band));
    if (g.t1) s.t1_s = g.t1.s;
    if (g.t2) s.t2_s = g.t2.s;
    if (kind === 'plan' && istPlan(item)) Object.assign(s, { vorlage: 'plan', swim_s: a.ziel_schwimmen_min * 60, t1_s: a.ziel_t1_min * 60, t2_s: a.ziel_t2_min * 60, watt: null, run_pace: Math.round((a.ziel_lauf_min * 60) / 42.195), fade_ab: 25, ziel_s: a.ziel_gesamt_min * 60 });
    return s;
  }
  const ftpOf = (q, a) => (q === 'genannt' ? a.ftp_genannt_w : q === 'daten' ? ((rowsOf('ftp') || []).find((f) => f.id === 'p20') || {}).watt || null : a.ftp_ref_w);
  const rrPhys = (a, s) => ({ cda: s.cda, crr: a.crr, m: a.gewicht_ref_kg + a.rad_kg, rho: a.luftdichte, eta: a.antrieb_eta });
  function vAt(p, g, ph) { // Tempo bei Leistung p und Steigung g: P·η = ½ρ·CdA·v³ + (Crr·m·g·cosθ + m·g·sinθ)·v
    const th = Math.atan(g), F = ph.crr * ph.m * 9.81 * Math.cos(th) + ph.m * 9.81 * Math.sin(th), k = 0.5 * ph.rho * ph.cda, P = ph.eta * p;
    let lo = 0.3, hi = 32;
    for (let i = 0; i < 46; i++) { const v = (lo + hi) / 2; if (k * v * v * v + F * v > P) hi = v; else lo = v; }
    return (lo + hi) / 2;
  }
  function rrBike(P, s, ph, D) {
    const amp = s.hm > 0 ? (Math.PI * s.hm) / (D * 1000) : 0, segs = []; // Wellen mit 10 km Länge, Summe der Anstiege = Höhenmeter
    const mult = s.pacing === 'ruhig' ? (x) => (x < 0.2 * D ? 0.95 : 1.0125) : s.pacing === 'negativ' ? (x) => (x < D / 2 ? 0.98 : 1.02) : () => 1;
    let t = 0, work = 0, p4 = 0, z = 0;
    for (let i = 0; i < Math.ceil(D); i++) {
      const len = Math.min(1, D - i), x = i + len / 2, g = amp * Math.sin((2 * Math.PI * x) / 10), p = P * mult(x), v = vAt(p, g, ph), dt = (len * 1000) / v;
      segs.push({ km: i + len, x, t0: t, t1: t + dt, p, v, g, z });
      t += dt; work += p * dt; p4 += p ** 4 * dt; z += g * len * 1000;
    }
    return { t, segs, avg: work / t, np: Math.pow(p4 / t, 0.25), kj: work / 1000 };
  }
  // Anteil der Kohlenhydrate an der Energie je nach Intensität (grob nach Romijn et al. 1993 und van Loon et al. 2001):
  // etwa 50 % bei IF 0,6, 70 % bei 0,75, 85 % bei 0,9. kJ Arbeit ≈ kcal Umsatz bei etwa 24 % Wirkungsgrad, dazu 5 % Aufschlag.
  const khAnteil = (IF) => Math.max(0.4, Math.min(0.95, 0.5 + (IF - 0.6) * 1.17));
  function rrWattFor(T, s, ph, D) { let lo = 40, hi = 800; for (let i = 0; i < 28; i++) { const m = (lo + hi) / 2; if (rrBike(m, s, ph, D).t > T) lo = m; else hi = m; } return Math.ceil(hi); }
  function rrRun(s, D, key) { // key: Feld des Tempos (run_pace oder run1_pace); Einbruch nur im letzten Lauf
    const pace = s[key || 'run_pace'], fade = key === 'run1_pace' ? 0 : s.fade_s, ab = Math.min(s.fade_ab, D), segs = []; let t = 0;
    for (let i = 0; i < Math.ceil(D); i++) {
      const len = Math.min(1, D - i), x = i + len / 2, extra = fade && x > ab ? (fade * (x - ab)) / Math.max(0.5, D - ab) : 0, p = pace + extra;
      t += p * len; segs.push({ km: +(i + len).toFixed(3), x, p, t });
    }
    return { t, segs, avg: t / D, verlust: t - pace * D };
  }
  const zoneBand = (x, b, name) => (x > b[1] + 0.02 ? { label: 'schneller als ' + name, c: 'red' } : x > b[1] + 0.0005 ? { label: 'am oberen Rand', c: 'orange' } : x >= b[0] - 0.0005 ? { label: 'im Rennbereich', c: 'green' } : { label: 'ruhiger als ' + name, c: 'gray' });
  const zoneBike = (IF, b) => (IF > b[1] + 0.0005 ? { label: 'über dem Korridor', c: 'red' } : IF < b[0] - 0.0005 ? { label: 'unter dem Korridor', c: 'gray' } : { label: 'im Korridor', c: 'green' });
  function rrCur() {
    const k = rrKey();
    if (!RR.st.w[k]) RR.st.w[k] = rrDefaults(rowsOf('athlet')[0], rrItem(), 'daten');
    return RR.st.w[k];
  }
  function rrSchedule() { if (RR.raf) return; RR.raf = requestAnimationFrame(() => { RR.raf = 0; const At = rowsOf('athlet'); if (At) rrUpdate(At[0]); }); }
  function rrSave() {
    clearTimeout(RR.saveT);
    const k = rrKey(), full = Object.assign({ sport: RR.st.sport, dist: RR.st.dist }, RR.st.w);
    A().setRechner(JSON.parse(JSON.stringify(full)));
    const snap = { sport: RR.st.sport, dist: RR.st.dist }; snap[k] = RR.st.w[k];
    RR.saveT = setTimeout(() => A().api('POST', '/api/rechner', JSON.parse(JSON.stringify(snap))).catch(() => {}), 900);
  }
  function rrSet(key, v, commit) { const s = rrCur(); s[key] = v; s.vorlage = null; if (commit) rrSave(); rrSchedule(); }
  function rrStartwahl(a) { // ohne gespeicherte Wahl: A-Rennen aus der Saison, sonst passend zu den Sportarten
    const sz = (rowsOf('saison') || [])[0];
    if (sz && sz.ziel_sport && tfDistanz(sz.ziel_sport, sz.ziel_distanz)) return [sz.ziel_sport, sz.ziel_distanz];
    const S = Array.isArray(a.sportarten) && a.sportarten.length ? a.sportarten : ['schwimmen', 'rad', 'laufen'];
    if (S.includes('schwimmen') && S.includes('rad') && S.includes('laufen')) return ['tri', 'ld'];
    if (S.includes('laufen')) return ['lauf', 'hm'];
    if (S.includes('rad')) return ['rad', 'ezf40'];
    return ['schwimmen', 's1500'];
  }
  function rrInit(a) {
    const saved = A().state.rechner || {}, w = {};
    Object.keys(saved).forEach((k) => { if (/^(tri|lauf|rad|schwimmen|mehr)_/.test(k) && saved[k] && typeof saved[k] === 'object') w[k] = Object.assign({}, saved[k]); });
    if (saved.ld && !w.tri_ld) w.tri_ld = Object.assign(rrDefaults(a, tfDistanz('tri', 'ld'), 'plan'), saved.ld); // ältere Form
    if (saved.md && !w.tri_md) w.tri_md = Object.assign(rrDefaults(a, tfDistanz('tri', 'md'), 'daten'), saved.md);
    const dist = { tri: 'ld', lauf: '10k', rad: 'ezf40', schwimmen: 's1500', mehr: 'du_std' };
    Object.keys(dist).forEach((sp) => { const v = saved.dist && saved.dist[sp]; if (v && tfDistanz(sp, v)) dist[sp] = v; });
    let sport = saved.sport && TF_DISTANZEN[saved.sport] ? saved.sport : null;
    if (!sport) { const [sp, d] = saved.strecke ? ['tri', saved.strecke === 'md' ? 'md' : 'ld'] : rrStartwahl(a); sport = sp; dist[sp] = d; }
    RR.st = { sport, dist, w };
    // gespeicherte Werte um neue Felder ergänzen
    Object.keys(w).forEach((k) => { const [sp, ...rest] = k.split('_'), it = tfDistanz(sp, rest.join('_')); if (it) w[k] = Object.assign(rrDefaults(a, it, istPlan(it) ? 'plan' : 'daten'), w[k]); else delete w[k]; });
  }
  function rrSlider(box, o) { // o: key, label, min, max, step, fmt(v, s), get?, set?, help?
    const get = o.get || ((s) => s[o.key]), put = o.set || ((s, v) => { s[o.key] = v; });
    const id = 'rr-' + o.key, b = el('b'), inp = el('input', { class: 'tf-range', id, type: 'range', min: o.min, max: o.max, step: o.step });
    const wrap = el('div', null, el('label', { for: id }, o.label, b), inp);
    if (o.help) wrap.append(el('div', { class: 'tf-ctrl-help', text: o.help }));
    const on = (commit) => { const s = rrCur(); put(s, +inp.value); if (!o.frei) s.vorlage = null; if (commit) rrSave(); rrSchedule(); };
    inp.addEventListener('input', () => on(false)); inp.addEventListener('change', () => on(true));
    box.appendChild(wrap);
    RR.ctrls['s_' + o.key] = (s) => { const v = get(s); if (document.activeElement !== inp) inp.value = v; b.textContent = o.fmt(v, s); };
    return wrap;
  }
  function rrTimeInput(box, o) { // o: id, label, get(s) → Text, set(s, sek), ph, two, hint
    const inp = el('input', { class: 'tf-input', id: 'rr-' + o.id, inputmode: 'numeric', placeholder: o.ph, 'aria-label': o.label });
    box.appendChild(el('div', null, el('label', { class: 'tf-ctrl-l', for: 'rr-' + o.id }, el('span', { text: o.label })), el('div', { class: 'tf-time' }, inp, o.hint ? el('span', { class: 'tf-ctrl-help', text: o.hint }) : null)));
    inp.addEventListener('change', () => {
      const v = parseTime(inp.value, o.two);
      if (!v) { A().toast('Bitte als ' + o.ph + ' eingeben'); inp.value = o.get(rrCur()); return; }
      const s = rrCur(); o.set(s, v); s.vorlage = null; rrSave(); rrSchedule();
    });
    RR.ctrls['t_' + o.id] = (s) => { if (document.activeElement !== inp) inp.value = o.get(s); };
  }
  function rrSeg(box, key, label, items) {
    const seg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': label });
    box.appendChild(el('div', null, el('div', { class: 'tf-ctrl-l' }, el('span', { text: label })), seg));
    RR.ctrls['g_' + key] = (s) => segButtons(seg, typeof items === 'function' ? items(s) : items, s[key], (v) => rrSet(key, v, true));
  }
  function rrRef(item) { // letztes passendes Rennen aus Garmin (Multisport mit Schwimmen, Rad und Lauf)
    if (item.sport !== 'tri') return null;
    const g = rrLegs(item), nah = (x, y) => x >= y * 0.85 && x <= y * 1.15;
    return (rowsOf('rennen') || []).find((r) => nah(r.rad_km, g.bike.km) && nah(r.lauf_km, g.run.km) && r.schwimmen_s > 0 && r.rad_s > 0 && r.lauf_s > 0 && (r.rad_avg_w || r.rad_np_w)) || null;
  }
  function rrCdaFor(T, s, a, D) { // effektiver CdA, mit dem das Modell den echten Rad-Split trifft
    const ph = rrPhys(a, s); let lo = 0.12, hi = 0.6;
    for (let i = 0; i < 30; i++) { ph.cda = (lo + hi) / 2; if (rrBike(s.watt, s, ph, D).t > T) hi = ph.cda; else lo = ph.cda; }
    return Math.round(((lo + hi) / 2) * 1000) / 1000;
  }
  function rrPreset(kind, a) {
    const item = rrItem(), g = rrLegs(item), s = rrCur(), fu = Object.fromEntries(Object.entries(s).filter(([f]) => f.indexOf('fu_') === 0)), keep = { ftp_q: s.ftp_q, neo: s.neo, neo_pct: s.neo_pct, cda: s.cda, hm: s.hm };
    if (kind === 'plan') { Object.assign(s, rrDefaults(a, item, 'plan'), { ftp_q: s.ftp_q, neo: s.neo, neo_pct: s.neo_pct }); s.watt = rrWattFor(a.ziel_rad_min * 60, s, rrPhys(a, s), g.bike.km); }
    else if (kind === 'rennen') {
      const r = rrRef(item); if (!r) return;
      Object.assign(s, { swim_s: Math.round(r.schwimmen_s), t1_s: Math.round(r.t1_s), t2_s: Math.round(r.t2_s), run_pace: r.lauf_s / g.run.km, fade_s: 0, pacing: 'gleich', watt: Math.round(r.rad_avg_w || r.rad_np_w), hm: r.rad_hm ? Math.min(3000, Math.round(r.rad_hm / 50) * 50) : 0 });
      s.cda = rrCdaFor(r.rad_s, s, a, g.bike.km);
    } else if (kind === 'daten') {
      const d = rrDefaults(a, item, 'daten'), fd = ftpOf('daten', a);
      Object.assign(s, d, keep, { ziel_s: s.ziel_s });
      if (g.swim) { const pool = a.css_s_100m / mitteB(g.swim.band); s.swim_s = Math.round((s.neo ? pool / (1 + s.neo_pct / 100) : pool) * g.swim.km * 10); }
      if (g.bike) { s.ftp_q = fd ? 'daten' : 'referenz'; s.watt = Math.round((fd || a.ftp_ref_w) * mitteB(bandOf(g.bike, a))); }
    }
    Object.assign(s, fu); s.vorlage = kind; rrSave(); rrSchedule();
  }
  function rrBuild(a) {
    RR.ctrls = {};
    const item = rrItem(), g = rrLegs(item), sp = RR.st.sport;
    // Sportart und Distanz
    const sw0 = $('#rr-sport'); sw0.replaceChildren();
    RR_SPORT.forEach(([v, l, ic, c]) => {
      const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + ic);
      const ico = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ico.setAttribute('class', 'tf-ico'); ico.appendChild(u);
      const b = el('button', { type: 'button', 'aria-pressed': String(v === sp) }, ico, el('span', { text: l }));
      b.style.setProperty('--c', 'var(--tf-' + c + ')');
      b.addEventListener('click', () => { if (v === RR.st.sport) return; RR.st.sport = v; rrSave(); RR.built = null; renderRennen(); });
      sw0.appendChild(b);
    });
    const ds = $('#rr-strecke'); ds.replaceChildren();
    Object.entries(TF_DISTANZEN[sp].items).forEach(([id, it]) => {
      const b = el('button', { type: 'button', 'aria-pressed': String(id === RR.st.dist[sp]), title: it.lang }, it.name);
      b.addEventListener('click', () => { if (id === RR.st.dist[sp]) return; RR.st.dist[sp] = id; rrSave(); RR.built = null; renderRennen(); });
      ds.appendChild(b);
    });
    requestAnimationFrame(() => { // gewählte Distanz ganz sichtbar machen (die Leiste scrollt am Handy seitlich)
      const on = ds.querySelector('[aria-pressed="true"]'); if (!on || ds.scrollWidth <= ds.clientWidth) return;
      const a0 = ds.getBoundingClientRect(), b0 = on.getBoundingClientRect();
      if (b0.right > a0.right) ds.scrollLeft += b0.right - a0.right + 6; else if (b0.left < a0.left) ds.scrollLeft -= a0.left - b0.left + 6;
    });
    const pre = $('#rr-presets'); pre.replaceChildren();
    const ref = rrRef(item);
    (istPlan(item) ? [['plan', 'Mein Zielplan']] : []).concat([['daten', 'Aus meinen Daten']]).concat(ref ? [['rennen', 'Wie ' + ref.ort + ' ' + ref.jahr]] : []).forEach(([v, l]) => { const b = el('button', { type: 'button', 'data-v': v }, l); b.addEventListener('click', () => rrPreset(v, a)); pre.appendChild(b); });
    RR.ctrls.presets = (s) => $$('button', pre).forEach((b) => b.setAttribute('aria-pressed', String(s.vorlage === b.dataset.v)));
    // Karten nur für vorhandene Abschnitte
    $('#karte-rr-schwimmen').hidden = !g.swim; $('#karte-rr-rad').hidden = !g.bike; $('#karte-rr-lauf').hidden = !g.run;
    // Schwimmen
    const swc = $('#rr-swim-ctrl'); swc.replaceChildren();
    if (g.swim) {
      const D = g.swim.km;
      rrTimeInput(swc, { id: 'swim', label: 'Schwimmzeit', ph: D >= 3 ? '1:15:00' : D >= 1 ? '25:00' : '6:00', two: 'ms', hint: nf(D * 1000) + ' m', get: (s) => kurz(s.swim_s), set: (s, v) => { s.swim_s = v; } });
      rrSlider(swc, { key: 'swim_pace', label: 'Tempo', min: 60, max: 160, step: 1, get: (s) => Math.round(s.swim_s / (D * 10)), set: (s, v) => { s.swim_s = Math.round(v * D * 10); }, fmt: (v) => mmss(v) + ' /100 m' });
      if (g.swim.neo !== false) {
        const neoSw = el('label', { class: 'tf-switch' }), neoCb = el('input', { type: 'checkbox' });
        neoSw.append(neoCb, el('span', { class: 'tf-switch-ui', 'aria-hidden': 'true' }), el('span', null, 'Neoprenanzug', el('small', { text: 'rechnet dein Tempo auf Beckentempo um' })));
        neoCb.addEventListener('change', () => rrSet('neo', neoCb.checked, true));
        swc.appendChild(neoSw);
        const neoRow = rrSlider(swc, { key: 'neo_pct', label: 'Vorteil durch Neo', min: 0, max: 8, step: 0.5, fmt: (v) => nf(v, 1) + ' % schneller', help: 'Hängt von Anzug und Technik ab – Studien zeigen einige Prozent.' });
        RR.ctrls.neo = (s) => { neoCb.checked = !!s.neo; neoRow.hidden = !s.neo; };
      }
      $('#rr-swim-sub').textContent = 'Tempo und Intensität zu deiner CSS · Rennbereich ' + Math.round(100 * g.swim.band[0]) + '–' + Math.round(100 * g.swim.band[1]) + ' %';
    }
    // Rad
    const bk = $('#rr-bike-ctrl'); bk.replaceChildren();
    if (g.bike) {
      const D = g.bike.km;
      rrSeg(bk, 'ftp_q', 'FTP-Basis', () => [['referenz', 'Referenz', a.ftp_ref_w + ' W']].concat(ftpOf('daten', a) ? [['daten', 'Daten', ftpOf('daten', a) + ' W']] : []).concat([['genannt', 'Genannt', a.ftp_genannt_w + ' W']]));
      rrSlider(bk, { key: 'watt', label: 'Leistung', min: 100, max: 460, step: 1, fmt: (v, s) => v + ' W · ' + Math.round((100 * v) / (ftpOf(s.ftp_q, a) || a.ftp_ref_w)) + ' % FTP' });
      if (istPlan(item)) {
        const btn = el('button', { type: 'button', class: 'tf-btn tf-btn-plain', style: 'justify-self:start;padding-left:0' }, 'Watt für ' + hmin(a.ziel_rad_min * 60) + ' h berechnen');
        btn.addEventListener('click', () => { const s = rrCur(); s.watt = rrWattFor(a.ziel_rad_min * 60, s, rrPhys(a, s), D); s.vorlage = null; rrSave(); rrSchedule(); });
        bk.appendChild(btn);
      }
      rrSlider(bk, { key: 'cda', label: 'Luftwiderstand CdA', min: 0.18, max: 0.42, step: 0.005, fmt: (v) => nf(v, 3) + ' m²', help: 'Aero-Position, Helm, Anzug – meist der größte Hebel für mehr Tempo. Setups vergleichen: Rennen → Werkzeuge.' });
      rrSlider(bk, { key: 'hm', label: 'Höhenmeter', min: 0, max: D < 60 ? 1000 : D < 120 ? 1500 : 3000, step: 25, fmt: (v) => (v ? nf(v) + ' m' : 'flach') });
      rrSeg(bk, 'pacing', 'Pacing', [['gleich', 'Gleichmäßig'], ['ruhig', 'Ruhiger Start'], ['negativ', 'Negativ-Split']]);
      const b = bandOf(g.bike, a);
      $('#rr-bike-sub').textContent = 'Leistung, Aerodynamik und Strecke → Zeit (Martin et al. 1998) · Korridor IF ' + nf(b[0], 2) + '–' + nf(b[1], 2);
    }
    // Lauf (bei Duathlon zwei Läufe)
    const rn = $('#rr-run-ctrl'); rn.replaceChildren();
    if (g.run1) {
      rrTimeInput(rn, { id: 'run1', label: 'Lauf 1', ph: '40:00', two: 'hm', hint: nf(g.run1.km, 1) + ' km', get: (s) => kurz(s.run1_pace * g.run1.km), set: (s, v) => { s.run1_pace = Math.max(150, Math.round(v / g.run1.km)); } });
      rrSlider(rn, { key: 'run1_pace', label: 'Tempo Lauf 1', min: 150, max: 450, step: 1, fmt: (v) => mmss(v) + ' /km' });
    }
    if (g.run) {
      const D = g.run.km;
      rrTimeInput(rn, { id: 'run', label: g.run1 ? 'Lauf 2' : 'Laufzeit', ph: D >= 30 ? '3:50:00' : D >= 15 ? '1:45:00' : '45:00', two: 'hm', hint: nf(D, D % 1 ? 1 : 0) + ' km', get: (s) => kurz(rrRun(s, D).t), set: (s, v) => { s.run_pace = Math.max(150, Math.round((v - rrRun(Object.assign({}, s, { run_pace: 0 }), D).t) / D)); } });
      rrSlider(rn, { key: 'run_pace', label: g.run1 ? 'Tempo Lauf 2' : 'Tempo', min: 150, max: 450, step: 1, fmt: (v) => mmss(v) + ' /km' });
      if (D >= 10) {
        rrSlider(rn, { key: 'fade_ab', label: 'Einbruch ab', min: 0, max: Math.floor(D), step: 1, fmt: (v) => (v ? 'km ' + v : 'Start') });
        rrSlider(rn, { key: 'fade_s', label: 'Langsamer bis ins Ziel', min: 0, max: 90, step: 5, fmt: (v) => (v ? '+' + v + ' s/km' : 'kein Einbruch') });
      }
      $('#rr-run-sub').textContent = 'Pace, ' + (D >= 10 ? 'Abbau ' : '') + 'und Intensität zu ' + refName(g.run) + ' · Rennbereich ' + Math.round(100 * g.run.band[0]) + '–' + Math.round(100 * g.run.band[1]) + ' %';
    }
    // Verpflegung
    const fu = $('#rr-fu-ctrl'); fu.replaceChildren();
    if (g.bike) rrSlider(fu, { key: 'fu_kh_rad', frei: true, label: 'Kohlenhydrate Rad', min: 30, max: 130, step: 5, fmt: (v) => v + ' g/h', help: 'Dein Ziel: ' + a.kh_g_h_min + '–' + a.kh_g_h_max + ' g/h' });
    if (g.run) rrSlider(fu, { key: 'fu_kh_lauf', frei: true, label: 'Kohlenhydrate Lauf', min: 0, max: 100, step: 5, fmt: (v) => v + ' g/h', help: 'Beim Laufen verträgt der Magen meist weniger: bis 2,5 h 30–60 g/h, länger 60–90 g/h' });
    const swHelp = rrSlider(fu, { key: 'fu_schweiss', frei: true, label: 'Schweißrate', min: 300, max: 2000, step: 50, get: (s) => fuSchweiss(s).ml, fmt: (v) => nf(v) + ' ml/h', help: ' ' });
    RR.ctrls.fu_hilfe = (s) => { const gm = fuGarmin(), x = fuSchweiss(s), t = fuTest(); swHelp.querySelector('.tf-ctrl-help').textContent = (x.quelle === 'test' ? 'Aus deinen Schweißraten-Tests (' + t.n + '). ' : x.quelle === 'garmin' ? 'Garmin-Schätzung aus ' + gm.n + ' langen Einheiten (Median). ' : x.quelle === 'eigen' ? 'Eigener Wert' + (gm ? ' · Garmin schätzt ' + nf(gm.ml) + ' ml/h' : '') + '. ' : 'Standardwert – noch kein Test und keine Garmin-Schätzung. ') + (x.quelle === 'test' ? '' : 'Genauer: Test unter Training → Schweißrate.'); };
    rrSlider(fu, { key: 'fu_gel_g', frei: true, label: 'Gel', min: 15, max: 45, step: 1, fmt: (v) => v + ' g Kohlenhydrate' });
    if (g.bike) rrSlider(fu, { key: 'fu_flasche_g', frei: true, label: 'Flasche (750 ml)', min: 0, max: 120, step: 5, fmt: (v) => (v ? v + ' g Kohlenhydrate' : 'nur Wasser'), help: 'Getränkepulver in der Radflasche' });
    // Summe: Abschnitte in Rennfolge, Wechsel als Eingabe
    const legs = $('#rr-legs'); legs.replaceChildren();
    const FARBE = { swim: 'blue', t1: 'gray', t2: 'gray', bike: 'orange', run: 'mint' };
    const NAME = { swim: 'Schwimmen|Schw.', t1: 'T1', t2: 'T2', bike: 'Rad', run: 'Laufen|Lauf' };
    const wechsel = [];
    item.legs.forEach((l, i) => {
      const ic = el('i'); ic.style.background = 'var(--tf-' + FARBE[l.typ] + ')';
      const nm = l.typ === 'run' && g.run1 ? (l === g.run1 ? 'Lauf 1|L1' : 'Lauf 2|L2') : NAME[l.typ], [lang, kz] = nm.split('|');
      let node;
      if (l.typ === 't1' || l.typ === 't2') {
        node = el('input', { inputmode: 'numeric', 'aria-label': (l.typ === 't1' ? 'Wechsel 1' : 'Wechsel 2') + ' (m:ss)' }); const key = l.typ + '_s';
        node.addEventListener('change', () => { const v = parseTime(node.value, 'ms'); if (v == null) { A().toast('Wechselzeit bitte als m:ss eingeben'); node.value = mmss(rrCur()[key]); return; } rrSet(key, v, true); });
        wechsel.push([node, key]);
      } else node = el('span', { class: 'num', id: 'rr-leg-' + i });
      legs.appendChild(el('div', { class: 'tf-rr-leg' }, el('small', null, ic, el('span', { class: 'tf-lang', text: lang }), el('span', { class: 'tf-kurz', text: kz || lang })), node));
    });
    legs.style.gridTemplateColumns = 'repeat(' + item.legs.length + ', minmax(0, 1fr))';
    const zi = $('#rr-ziel');
    zi.onchange = () => { const v = parseTime(zi.value, 'hm'); if (!v) { A().toast('Zielzeit bitte als h:mm eingeben'); zi.value = hms(rrCur().ziel_s); return; } rrSet('ziel_s', v, true); };
    RR.ctrls.fix = (s) => { wechsel.forEach(([inp, key]) => { if (document.activeElement !== inp) inp.value = mmss(s[key]); }); if (document.activeElement !== zi) zi.value = s.ziel_s ? hms(s.ziel_s) : ''; };
    RR.built = rrKey();
  }
  function rrUpdate(a) {
    const item = rrItem(), g = rrLegs(item), s = rrCur(), ph = rrPhys(a, s);
    if (s.ftp_q === 'daten' && !ftpOf('daten', a)) s.ftp_q = 'referenz';
    const ftp = ftpOf(s.ftp_q, a);
    if (g.bike && s.watt == null) s.watt = istPlan(item) ? rrWattFor(a.ziel_rad_min * 60, s, ph, g.bike.km) : Math.round(a.ftp_ref_w * mitteB(bandOf(g.bike, a)));
    Object.values(RR.ctrls).forEach((f) => f(s));
    const T = {}; // Zeit je Abschnitt
    // Schwimmen
    if (g.swim) {
      const D = g.swim.km, swPace = s.swim_s / (D * 10), neo = g.swim.neo !== false && s.neo, fNeo = neo ? 1 + s.neo_pct / 100 : 1, pool = swPace * fNeo, swPct = a.css_s_100m / pool, zs = zoneBand(swPct, g.swim.band, 'der Rennbereich');
      T.swim = s.swim_s;
      $('#rr-swim-zeit').textContent = kurz(s.swim_s); $('#rr-swim-pace').textContent = mmss(swPace) + ' /100 m';
      kv($('#rr-swim-kv'), [['Tempo', mmss(swPace), '/100 m'], ['Intensität', String(Math.round(swPct * 100)), '% CSS', zs], neo ? ['Ohne Neo etwa', mmss(pool), '/100 m'] : ['1 s pro 100 m', '± ' + Math.round(D * 10), 's']]);
      rrSwimChart(a, s, g.swim, item);
    }
    // Rad
    let bkr = null;
    if (g.bike) {
      const D = g.bike.km; bkr = rrBike(s.watt, s, ph, D);
      const IF = bkr.np / ftp, hrs = bkr.t / 3600, tss = hrs * IF * IF * 100, zb = zoneBike(IF, bandOf(g.bike, a));
      T.bike = bkr.t;
      $('#rr-bike-zeit').textContent = hms(bkr.t); $('#rr-bike-kmh').textContent = nf((D / bkr.t) * 3600, 1) + ' km/h';
      kv($('#rr-bike-kv'), [['Ø Leistung', String(Math.round(bkr.avg)), 'W'], ['Intensität', String(Math.round(IF * 100)), '% FTP', zb], ['TSS', String(Math.round(tss)), ''], ['W/kg', nf(bkr.avg / a.gewicht_ref_kg, 2), 'bei ' + a.gewicht_ref_kg + ' kg'], ['Arbeit', nf(bkr.kj), 'kJ'], hrs >= 1 ? ['KH-Verbrauch', '≈ ' + Math.round((khAnteil(IF) * bkr.kj * 1.05) / 4 / hrs / 5) * 5, 'g/h', { c: 'gray', label: Math.round(khAnteil(IF) * 100) + ' % aus Kohlenhydraten' }] : ['Normalized Power', String(Math.round(bkr.np)), 'W']]);
      rrBikeChart(a, s, g.bike, item, ph, ftp, bkr);
      rrBikeProfile(a, s, g.bike, ftp, bkr);
    }
    // Lauf
    let rnr = null, rn1 = null;
    if (g.run1) { rn1 = rrRun(s, g.run1.km, 'run1_pace'); T.run1 = rn1.t; }
    if (g.run) {
      const D = g.run.km; rnr = rrRun(s, D);
      const rp = refPace(g.run, a), pct = rp / rnr.avg, zr = zoneBand(pct, g.run.band, 'der Rennbereich');
      T.run = rnr.t;
      $('#rr-run-zeit').textContent = hms(rnr.t + (rn1 ? rn1.t : 0)); $('#rr-run-pace').textContent = rn1 ? 'L1 ' + mmss(rn1.avg) + ' · L2 ' + mmss(rnr.avg) + ' /km' : mmss(rnr.avg) + ' /km';
      const items = [['Ø Tempo', mmss(rnr.avg), '/km'], ['Intensität', String(Math.round(pct * 100)), '% ' + refName(g.run) + '-Tempo', zr]];
      if (rn1) { const p1 = refPace(g.run1, a) / rn1.avg; items.unshift(['Lauf 1', hms(rn1.t), mmss(rn1.avg) + ' /km', zoneBand(p1, g.run1.band, 'der Rennbereich')]); }
      if (D >= 10) items.push(['Einbruch kostet', rnr.verlust >= 1 ? '+' + mmss(rnr.verlust) : '0:00', 'min']);
      else items.push(['Laufzeit', hms(rnr.t), '']);
      kv($('#rr-run-kv'), items);
      rrRunChart(a, s, g.run, item, rnr);
    }
    // Summe in Rennfolge
    let total = 0; const seq = [];
    item.legs.forEach((l, i) => {
      const t = l.typ === 'swim' ? T.swim : l.typ === 'bike' ? T.bike : l.typ === 'run' ? (l === g.run1 ? T.run1 : T.run) : s[l.typ + '_s'] || 0;
      total += t || 0; seq.push([t || 0, { swim: 'blue', bike: 'orange', run: 'mint', t1: 'gray', t2: 'gray' }[l.typ]]);
      const node = $('#rr-leg-' + i); if (node) node.textContent = t >= 3600 ? hms(t) : kurz(t);
    });
    if (!s.ziel_s) s.ziel_s = Math.ceil(total / 300) * 300; // Startwert: Prognose, auf 5 min aufgerundet
    const buf = s.ziel_s - total, ok = buf >= 0;
    $('#rr-gesamt').textContent = total >= 3600 ? hms(total) : kurz(total);
    $('#rr-pill').querySelector('i').style.background = col(ok ? 'green' : 'red');
    const zh = s.ziel_s / 3600;
    $('#rr-pill-t').textContent = Number.isInteger(zh) && zh >= 2 ? (ok ? 'Sub-' + zh : 'über ' + zh + ' Stunden') : ok ? 'Ziel erreicht' : 'über dem Ziel';
    $('#rr-puffer').textContent = (ok ? 'Puffer ' : 'Es fehlen ') + kurz(Math.abs(buf)) + (Math.abs(buf) < 3600 ? ' min' : ' h') + ' zur Zielzeit';
    const bar = $('#rr-bar'); bar.replaceChildren();
    seq.forEach(([t, c]) => { const d = el('div'); d.style.flex = t + ' 1 0'; d.style.background = 'var(--tf-' + c + ')'; bar.appendChild(d); });
    const ref = s.vorlage === 'rennen' ? rrRef(item) : null;
    const ann = s.vorlage === 'daten'
      ? 'Aus deinen Daten: jeweils die Mitte des Rennbereichs für ' + (item.lang || item.name) + ' – ' + [g.swim ? 'Schwimmen ' + Math.round(50 * (g.swim.band[0] + g.swim.band[1])) + ' % CSS' : '', g.bike ? 'Rad ' + Math.round(50 * (bandOf(g.bike, a)[0] + bandOf(g.bike, a)[1])) + ' % der ' + (s.ftp_q === 'daten' ? 'Daten-FTP' : 'Referenz-FTP') : '', g.run ? 'Lauf ' + Math.round(50 * (g.run.band[0] + g.run.band[1])) + ' % des ' + refName(g.run) + '-Tempos' : ''].filter(Boolean).join(', ') + '. '
      : s.vorlage === 'plan' ? 'Zielplan aus deinem Profil; die Rad-Watt sind so gewählt, dass bei deinem CdA genau ' + hmin(a.ziel_rad_min * 60) + ' h herauskommen. '
      : ref ? 'Nachgerechnet: ' + ref.ort + ' am ' + ref.datum + ' – Schwimmen, Wechsel und Lauf wie gelaufen, Rad mit deinem Ø von ' + Math.round(ref.rad_avg_w || ref.rad_np_w) + ' W' + (ref.rad_np_w ? ' (NP ' + ref.rad_np_w + ' W)' : '') + (ref.rad_hm ? ' über ' + nf(ref.rad_hm) + ' Höhenmeter' : '') + '. Den Split trifft das Modell mit einem effektiven CdA von ' + nf(s.cda, 3) + ' m² – darin stecken auch Wind, Kurven und Stopps. ' : '';
    $('#rr-annahmen').textContent = ann + (g.bike ? 'Rad-Modell windstill, ' + (s.hm ? nf(s.hm) + ' Höhenmeter als gleichmäßige Wellen' : 'flach') + '; CdA, Rollwiderstand und Gewicht (' + nf(ph.m) + ' kg mit Rad) sind Schätzwerte.' : 'Tempo und Intensität beziehen sich auf deine Schwellen im Profil.');
    // Verpflegung ab etwa 75 min mit Rad oder Lauf
    const fuOk = total >= 75 * 60 && (g.bike || g.run);
    $('#karte-rr-fueling').hidden = !fuOk;
    if (fuOk) rrFuel(a, s, item, g, T);
  }
  function rrSwimChart(a, s, leg, item) {
    const el1 = $('#chart-rr-swim'), D = leg.km, neo = leg.neo !== false && s.neo, f = neo ? 1 + s.neo_pct / 100 : 1, cssRace = a.css_s_100m / f, cur = s.swim_s / (D * 10);
    const lo = Math.floor(Math.min(cur, cssRace) - 12), hi = Math.ceil(Math.max(cur, cssRace) + 16), pts = [];
    for (let q = lo; q <= hi; q += 1) pts.push({ p: q, t: (q * D * 10) / 60 });
    const goal = istPlan(item) ? a.ziel_schwimmen_min : null, ys = pts.map((q) => q.t).concat(goal ? [goal] : []);
    const P = plot(el1, { h: 190, y: [Math.floor(Math.min(...ys) - 1), Math.ceil(Math.max(...ys) + 1)], ny: 4, yfmt: minLab, xlin: true, x: [lo, hi], xtv: d3.range(Math.ceil(lo / 5) * 5, hi + 1, 5), xfmt: mmss, label: 'Schwimmzeit je Tempo' });
    const at = (pct) => a.css_s_100m / (pct * f);
    const zone = (p1, p2, c, o, t) => { const x1 = P.xs(Math.max(lo, Math.min(hi, p1))), x2 = P.xs(Math.max(lo, Math.min(hi, p2))); if (x2 - x1 < 1) return; svg('rect', { x: x1, y: P.top, width: x2 - x1, height: P.xb - P.top, fill: col(c), opacity: o }, P.g); if (t && x2 - x1 > 40) { const tx = svg('text', { x: (x1 + x2) / 2, y: P.top + 13, 'text-anchor': 'middle', class: 'tf-tick', 'font-weight': 600 }, P.g); tx.textContent = t; } };
    zone(at(leg.band[1]), at(leg.band[0]), 'green', 0.1, 'Rennbereich');
    if (goal) refLine(P, goal, col('green'));
    line(P, pts, (q) => q.p, (q) => q.t, col('blue'), 2.2);
    endDot(P, cur, (cur * D * 10) / 60, col('blue'));
    hoverTime(el1, P, pts, (q) => q.p, (q) => mmss(q.p) + ' /100 m', (q) => [{ label: 'Schwimmzeit', value: kurz(q.p * D * 10), color: col('blue') }, { label: 'Intensität', value: Math.round((100 * a.css_s_100m) / (q.p * f)) + ' % CSS' }], [{ y: (q) => q.t, color: col('blue') }]);
    $('#rr-swim-cap').textContent = 'Zeit je Tempo · grünes Feld: Rennbereich ' + Math.round(100 * leg.band[0]) + '–' + Math.round(100 * leg.band[1]) + ' % deiner CSS' + (neo ? ' (Neo eingerechnet)' : '') + (goal ? ' · gestrichelt: Ziel ' + minLab(goal) : '') + ' · 1 s pro 100 m = ' + Math.round(D * 10) + ' s.';
  }
  function rrBikeChart(a, s, leg, item, ph, ftp, bkr) {
    const el1 = $('#chart-rr-bike'), D = leg.km, [clo, chi] = bandOf(leg, a);
    const lo = Math.floor((Math.min(s.watt, clo * ftp) * 0.85) / 10) * 10, hi = Math.ceil((Math.max(s.watt, chi * ftp) * 1.1) / 10) * 10, pts = [];
    for (let q = lo; q <= hi; q += 5) { const r = rrBike(q, s, ph, D); pts.push({ p: q, t: r.t / 60, kmh: (D / r.t) * 3600 }); }
    const goal = istPlan(item) ? a.ziel_rad_min : null, dur = bkr.t, sek = dur > 5400 ? 7200 : dur > 2700 ? 3600 : 1200, best = ((rowsOf('leistung') || []).find((r) => r.sek === sek) || {}).watt;
    const ys = pts.map((q) => q.t).concat(goal ? [goal] : []), stp = D >= 60 ? 5 : 1;
    const P = plot(el1, { h: 190, y: [Math.floor(Math.min(...ys) / stp) * stp - stp, Math.ceil(Math.max(...ys) / stp) * stp + stp], ny: 4, yfmt: (t) => (D >= 60 ? hmin(t * 60) : Math.round(t) + ' min'), xlin: true, x: [lo, hi], xtv: d3.ticks(lo, hi, 6), xfmt: (v) => v + ' W', label: 'Rad-Split je Leistung' });
    const x1 = P.xs(Math.max(lo, clo * ftp)), x2 = P.xs(Math.min(hi, chi * ftp));
    svg('rect', { x: x1, y: P.top, width: Math.max(0, x2 - x1), height: P.xb - P.top, fill: col('green'), opacity: 0.1 }, P.g);
    if (goal) refLine(P, goal, col('green'));
    if (best && best >= lo && best <= hi) { const xb = Math.round(P.xs(best)) + 0.5; svg('line', { x1: xb, x2: xb, y1: P.top, y2: P.xb, stroke: col('fg2'), 'stroke-width': 1.5, 'stroke-dasharray': '2 4' }, P.g); }
    line(P, pts, (q) => q.p, (q) => q.t, col('orange'), 2.2);
    endDot(P, s.watt, bkr.t / 60, col('orange'));
    hoverTime(el1, P, pts, (q) => q.p, (q) => q.p + ' W · ' + Math.round((100 * q.p) / ftp) + ' % FTP', (q) => [{ label: 'Rad-Split', value: hms(q.t * 60), color: col('orange') }, { label: 'Tempo', value: nf(q.kmh, 1) + ' km/h' }], [{ y: (q) => q.t, color: col('orange') }]);
    $('#rr-bike-cap').textContent = 'Split je Leistung · grünes Feld: Korridor ' + Math.round(100 * clo) + '–' + Math.round(100 * chi) + ' % FTP' + (goal ? ' · gestrichelt: Ziel ' + hmin(goal * 60) + ' h' : '') + (best ? ' · gepunktet: dein bestes ' + (sek === 7200 ? '2-h' : sek === 3600 ? '60-min' : '20-min') + '-Mittel (' + best + ' W)' : '') + '.';
  }
  function rrBikeProfile(a, s, leg, ftp, bkr) {
    const el1 = $('#chart-rr-bike-verlauf'), [clo, chi] = bandOf(leg, a), T = bkr.t / 3600;
    const ps = bkr.segs.map((g) => g.p), ylo = Math.floor((Math.min(...ps, clo * ftp) * 0.88) / 10) * 10, yhi = Math.ceil((Math.max(...ps, chi * ftp) * 1.06) / 10) * 10;
    const tstep = T > 3 ? 1 : T > 1.2 ? 0.5 : 0.25;
    const P = plot(el1, { h: 170, y: [ylo, yhi], ny: 3, yfmt: (v) => v + ' W', xlin: true, x: [0, T], xtv: d3.range(0, T + 0.01, tstep), xfmt: (v) => (T > 1.2 ? nf(v, v % 1 ? 1 : 0) + ' h' : Math.round(v * 60) + ' min'), label: 'Watt über die Zeit' });
    const yA = P.ys(Math.min(yhi, chi * ftp)), yB = P.ys(Math.max(ylo, clo * ftp));
    svg('rect', { x: P.ml, y: yA, width: P.w - P.mr - P.ml, height: Math.max(0, yB - yA), fill: col('green'), opacity: 0.1 }, P.g);
    if (s.hm > 0) {
      const zs = bkr.segs.map((g) => g.z), z0 = Math.min(...zs), z1 = Math.max(...zs), base = P.xb, topZ = P.xb - (P.xb - P.top) * 0.32;
      const area = d3.area().x((g) => P.xs((g.t0 + g.t1) / 7200)).y0(base).y1((g) => base - ((g.z - z0) / Math.max(1, z1 - z0)) * (base - topZ));
      svg('path', { d: area(bkr.segs), fill: col('gray'), opacity: 0.18 }, P.g);
    }
    const stp = []; bkr.segs.forEach((g) => { stp.push({ x: g.t0 / 3600, p: g.p }); stp.push({ x: g.t1 / 3600, p: g.p }); });
    line(P, stp, (q) => q.x, (q) => q.p, col('orange'), 2.2);
    hoverTime(el1, P, bkr.segs, (g) => (g.t0 + g.t1) / 7200, (g) => 'km ' + nf(Math.ceil(g.km)) + ' · nach ' + hmin(g.t1) + ' h', (g) => [{ label: 'Leistung', value: Math.round(g.p) + ' W', color: col('orange') }, { label: 'Tempo', value: nf(g.v * 3.6, 1) + ' km/h' }, { label: 'Steigung', value: nf(g.g * 100, 1) + ' %' }], [{ y: (g) => g.p, color: col('orange') }]);
    $('#rr-bike-cap2').textContent = 'Geplante Leistung über die Renndauer' + (s.pacing === 'ruhig' ? ' (erste 20 % der Strecke 5 % ruhiger)' : s.pacing === 'negativ' ? ' (erste Hälfte 2 % ruhiger, zweite 2 % stärker)' : '') + ' · grünes Band: Korridor' + (s.hm > 0 ? ' · graue Fläche: Höhenprofil' : '') + '. Normalized Power ' + Math.round(bkr.np) + ' W.';
  }
  function rrRunChart(a, s, leg, item, rnr) {
    const el1 = $('#chart-rr-run'), D = leg.km, vt1 = a.vt1_pace_s_km, vt2 = a.vt2_pace_s_km, goal = istPlan(item) ? (a.ziel_lauf_min * 60) / D : null;
    const rp = refPace(leg, a), bandLo = rp / leg.band[1], bandHi = rp / leg.band[0]; // schnelles und langsames Ende des Rennbereichs
    const ps = rnr.segs.map((g) => g.p).concat([vt1, vt2, bandLo, bandHi]).concat(goal ? [goal] : []);
    const P = plot(el1, { h: 190, y: [Math.floor(Math.min(...ps) / 5) * 5 - 5, Math.ceil(Math.max(...ps) / 5) * 5 + 5], yinvert: true, ny: 4, yfmt: mmss, xlin: true, x: [0, D], xtv: d3.range(0, D + 0.1, D > 25 ? 10 : D > 12 ? 5 : D > 6 ? 2 : 1), xfmt: (v) => v + ' km', label: 'Tempo über die Strecke' });
    svg('rect', { x: P.ml, y: P.ys(bandLo), width: P.w - P.mr - P.ml, height: Math.max(0, P.ys(bandHi) - P.ys(bandLo)), fill: col('green'), opacity: 0.08 }, P.g);
    refLine(P, vt1, col('blue')); refLine(P, vt2, col('red')); if (goal) refLine(P, goal, col('green'));
    const stp = []; let prev = 0; rnr.segs.forEach((g) => { stp.push({ x: prev, p: g.p }); stp.push({ x: g.km, p: g.p }); prev = g.km; });
    line(P, stp, (q) => q.x, (q) => q.p, col('mint'), 2.4);
    hoverTime(el1, P, rnr.segs, (g) => g.x, (g) => 'km ' + nf(Math.ceil(g.km)), (g) => [{ label: 'Tempo', value: mmss(g.p) + ' /km', color: col('mint') }, { label: 'Zeit bis hier', value: hms(g.t) }], [{ y: (g) => g.p, color: col('mint') }]);
    $('#rr-run-cap').textContent = 'Oben ist schneller · grünes Feld: Rennbereich · gestrichelt: blau VT1 ' + mmss(vt1) + ', rot VT2 ' + mmss(vt2) + (goal ? ', grün Ziel-Tempo ' + mmss(goal) : '') + ' /km.';
  }
  /* Verpflegungsplan */
  function fuGarmin() { // Garmin-Schätzung des Schweißverlusts aus langen Einheiten
    const v = (rowsOf('fueling') || []).filter((f) => f.schweiss_ml_h && f.min >= 75 && f.min <= 480).map((f) => f.schweiss_ml_h);
    return v.length ? { ml: Math.round(median(v) / 50) * 50, n: v.length } : null;
  }
  function fuTest() { // eigene Schweißraten-Tests (Training → Schweißrate): draußen zuerst, sonst alle
    const c = (A().state.rechner || {}).schweiss, M = window.tfAlltagMotor;
    if (!M || !c || !Array.isArray(c.tests)) return null;
    const p = M.schweissProfil(c.tests), drau = ['mild', 'hitze', 'kuehl'].map((b) => p.je[b]).filter(Boolean);
    const x = p.je.mild || (drau.length ? drau[0] : p.gesamt);
    return x ? { ml: Math.round((x.lh * 1000) / 50) * 50, n: x.n } : null;
  }
  function fuSchweiss(s) {
    const g = fuGarmin(), t = fuTest();
    return s.fu_schweiss > 0 ? { ml: s.fu_schweiss, quelle: 'eigen' } : t ? { ml: Math.min(2000, Math.max(300, t.ml)), quelle: 'test' } : g ? { ml: Math.min(2000, Math.max(300, g.ml)), quelle: 'garmin' } : { ml: 800, quelle: 'standard' };
  }
  function fuTraining() { // erreichte Kohlenhydrate pro Stunde in langen Radeinheiten
    const F = (rowsOf('fueling') || []).filter((f) => f.sport === 'bike' && f.g_h != null);
    return F.length ? { gh: Math.round(median(F.map((f) => f.g_h))), n: F.length } : null;
  }
  const fuClock = (min) => { const m = Math.round(min / 5) * 5; return Math.floor(m / 60) + ':' + pad2(m % 60); };
  function fuTimes(T, iv, first) { const out = []; if (!iv || !isFinite(iv)) return out; for (let t = first; t <= T - 10; t += iv) out.push(t); return out; }
  function rrFuelDaten(a, s, item, g, T) { // Verpflegung rechnen – für den Rennrechner und die Race Card
    // Abschnitte mit Verpflegung (Rad und Lauf) in Rennfolge, Zeiten ab Start des ersten davon
    const F = []; let uhr = 0, start = null;
    item.legs.forEach((l) => {
      const t = (l.typ === 'swim' ? T.swim : l.typ === 'bike' ? T.bike : l.typ === 'run' ? (l === g.run1 ? T.run1 : T.run) : s[l.typ + '_s'] || 0) / 60;
      if (l.typ === 'bike' || l.typ === 'run') { if (start == null) start = uhr; F.push({ leg: l.typ === 'bike' ? 'rad' : 'lauf', T: t, km: l.km, off: uhr - start, name: l.typ === 'bike' ? 'Rad' : g.run1 ? (l === g.run1 ? 'Lauf 1' : 'Lauf 2') : 'Laufen' }); }
      uhr += t || 0;
    });
    const lang = uhr > 150; // ab 2,5 h Renndauer verträgt und braucht man auch beim Laufen mehr (60–90 statt 30–60 g/h)
    const sw = fuSchweiss(s), H = F.reduce((x, f) => x + f.T, 0) / 60, gel = s.fu_gel_g, kb = s.fu_kh_rad, kr = s.fu_kh_lauf;
    const trinken = Math.round(Math.min(1000, Math.max(0, sw.ml - (20 * a.gewicht_ref_kg) / H)) / 10) * 10; // höchstens 2 % Körpermasse verlieren
    const flH = g.bike ? trinken / 750 : 0, flKh = flH * s.fu_flasche_g; // Flaschen und Gramm pro Stunde (nur auf dem Rad)
    let khR = 0, khL = 0, nR = 0, nL = 0, ivR = null, ivL = null;
    const B = [];
    F.forEach((f) => {
      const rad = f.leg === 'rad', rate = rad ? flKh : 0, iv = rad ? (kb - flKh > 2 ? (60 * gel) / (kb - flKh) : null) : kr > 0 ? (60 * gel) / kr : null;
      f.gels = fuTimes(f.T, iv, rad ? Math.max(15, Math.min(45, (iv || 0) / 2)) : Math.max(10, Math.min(30, (iv || 0) / 2)));
      f.kh = Math.round((rate * f.T) / 60 + f.gels.length * gel); f.iv = iv;
      if (rad) { khR += f.kh; nR += f.gels.length; ivR = iv; } else { khL += f.kh; nL += f.gels.length; ivL = iv; }
      const own = [];
      for (let h = 0; h * 60 < f.T - 0.5; h++) { const t0 = h * 60, t1 = Math.min(f.T, (h + 1) * 60); if (t1 - t0 < 20 && own.length) own[own.length - 1].t1 = t1; else own.push({ leg: f.leg, t0, t1, off: f.off, name: f.name }); }
      own.forEach((b) => { const d = (b.t1 - b.t0) / 60; b.gels = f.gels.filter((t) => t >= b.t0 && t < b.t1).length; b.flasche = rate * d; b.gh = (b.flasche + b.gels * gel) / d; b.ml = trinken * d; B.push(b); });
    });
    const tb = F.filter((f) => f.leg === 'rad').reduce((x, f) => x + f.T, 0), tr = F.filter((f) => f.leg === 'lauf').reduce((x, f) => x + f.T, 0);
    return { F, B, uhr, lang, sw, H, gel, kb, kr, trinken, flH, flKh, khR, khL, nR, nL, ivR, ivL, tb, tr };
  }
  function rrFuel(a, s, item, g, T) {
    const { F, B, lang, sw, H, gel, kb, kr, trinken, flH, flKh, khR, khL, nR, nL, tb, tr } = rrFuelDaten(a, s, item, g, T);
    $('#rr-fu-kh').textContent = nf(khR + khL);
    $('#rr-fu-kh-sub').textContent = [g.bike ? 'Rad ' + nf(khR) + ' g' : '', g.run ? 'Lauf ' + nf(khL) + ' g' : ''].filter(Boolean).join(' · ');
    const loss = (Math.max(0, sw.ml - trinken) * H) / 1000, pct = (100 * loss) / a.gewicht_ref_kg, ghR = tb ? khR / (tb / 60) : 0, ghL = tr ? khL / (tr / 60) : 0;
    kv($('#rr-fu-kv'), [
      g.bike ? ['Rad', String(Math.round(ghR)), 'g/h', { c: ghR >= a.kh_g_h_min - 2 && ghR <= a.kh_g_h_max + 2 ? 'green' : 'orange', label: ghR < a.kh_g_h_min - 2 ? 'unter deinem Ziel' : ghR > a.kh_g_h_max + 2 ? 'über deinem Ziel' : 'Ziel ' + a.kh_g_h_min + '–' + a.kh_g_h_max }] : null,
      g.run ? ['Lauf', String(Math.round(ghL)), 'g/h', lang ? { c: ghL >= 58 && ghL <= 92 ? 'green' : 'orange', label: ghL < 58 ? 'eher wenig' : ghL > 92 ? 'sehr viel' : 'Bereich 60–90' } : { c: ghL >= 28 && ghL <= 62 ? 'green' : 'orange', label: 'bis 2,5 h: 30–60' }] : null,
      ['Trinken', trinken < 150 ? 'nach Durst' : nf(trinken), trinken < 150 ? '' : 'ml/h', { c: 'gray', label: 'bei ' + nf(sw.ml) + ' ml/h Schweiß' }],
      g.bike ? ['Flaschen Rad', nf((flH * tb) / 60, 1), '× 750 ml'] : null,
      ['Gels', String(nR + nL), 'Stück', { c: 'gray', label: [g.bike ? nR + ' Rad' : '', g.run ? nL + ' Lauf' : ''].filter(Boolean).join(' · ') }],
      ['Gewichtsverlust', nf(loss, 1), 'kg', { c: pct <= 2.05 ? 'green' : pct <= 3 ? 'orange' : 'red', label: nf(pct, 1) + ' % Körpermasse' }],
    ].filter(Boolean));
    // Diagramm: Kohlenhydrate je Rennstunde
    const el1 = $('#chart-rr-fu'), last = F[F.length - 1], X = (last.off + last.T) / 60, top = Math.max(130, ...B.map((b) => b.gh)) * 1.08;
    const P = plot(el1, { h: 190, y: [0, top], ny: 4, yfmt: (t) => t + ' g/h', xlin: true, x: [0, X], xtv: d3.range(0, X + 0.01, X > 3 ? 1 : 0.5), xfmt: (v) => nf(v, v % 1 ? 1 : 0) + ' h', label: 'Kohlenhydrate je Rennstunde' });
    const zone = (x0, x1, lo, hi) => { const a0 = P.xs(x0), a1 = P.xs(x1), y0 = P.ys(Math.min(hi, top)), y1 = P.ys(lo); svg('rect', { x: a0, y: y0, width: Math.max(0, a1 - a0), height: Math.max(0, y1 - y0), fill: col('green'), opacity: 0.1 }, P.g); };
    F.forEach((f) => zone(f.off / 60, (f.off + f.T) / 60, f.leg === 'rad' ? a.kh_g_h_min : lang ? 60 : 30, f.leg === 'rad' ? a.kh_g_h_max : lang ? 90 : 60));
    B.forEach((b) => { const x0 = P.xs((b.off + b.t0) / 60) + 2, x1 = P.xs((b.off + b.t1) / 60) - 2, y = P.ys(b.gh); svg('path', { d: roundTop(x0, y, Math.max(2, x1 - x0), P.ys(0) - y, 5), fill: col(b.leg === 'rad' ? 'orange' : 'mint') }, P.g); });
    hoverTime(el1, P, B, (b) => (b.off + (b.t0 + b.t1) / 2) / 60, (b) => b.name + ' ' + fuClock(b.t0) + '–' + fuClock(b.t1) + ' h', (b) => [
      { label: 'Kohlenhydrate', value: Math.round(b.gh) + ' g/h', color: col(b.leg === 'rad' ? 'orange' : 'mint') },
      b.leg === 'rad' ? { label: 'aus der Flasche', value: Math.round(b.flasche) + ' g' } : null,
      { label: 'Gels', value: b.gels + ' × ' + gel + ' g' }, { label: 'Trinken', value: nf(b.ml) + ' ml' },
    ].filter(Boolean));
    $('#rr-fu-cap').textContent = 'Balken: geplante Kohlenhydrate je Stunde · grüne Felder: ' + [g.bike ? 'Rad dein Ziel ' + a.kh_g_h_min + '–' + a.kh_g_h_max + ' g/h' : '', g.run ? 'Laufen ' + (lang ? '60–90' : '30–60') + ' g/h' : ''].filter(Boolean).join(', ') + '. Einzelne Stunden schwanken, weil Gels nur ganz gehen.';
    // Ablauf
    const plan = $('#rr-fu-plan'); plan.replaceChildren();
    const legBox = (name, c, dauer, items) => {
      const i = el('i'); i.style.background = col(c); const ul = el('ul');
      items.filter(Boolean).forEach((x) => ul.appendChild(x instanceof Node ? x : el('li', null, ...[].concat(x))));
      plan.appendChild(el('div', { class: 'tf-fu-leg' }, el('h3', null, i, name, el('span', { text: dauer })), ul));
    };
    const zeiten = (arr) => el('span', { class: 'tf-fu-times', text: arr.map(fuClock).join(' · ') });
    F.forEach((f) => {
      if (f.leg === 'rad') legBox(f.name, 'orange', hms(f.T * 60) + ' h', [
        ['Trinken: alle 15 min etwa ', el('b', { text: Math.round(trinken / 40) * 10 + ' ml' }), ' – zusammen ' + nf(trinken) + ' ml pro Stunde.'],
        s.fu_flasche_g ? 'Flaschen mit ' + s.fu_flasche_g + ' g Kohlenhydraten pro 750 ml liefern ' + Math.round(flKh) + ' g/h.' : 'In den Flaschen nur Wasser.',
        f.gels.length ? ['Gel (' + gel + ' g) bei ', zeiten(f.gels), ' – etwa alle ' + Math.round(f.iv) + ' min.'] : flKh >= kb - 2 ? 'Keine Gels nötig – die Flaschen decken ' + kb + ' g/h.' : null,
        flKh > kb + 5 ? el('li', { class: 'tf-warn-t', text: 'Die Flaschen allein liefern schon ' + Math.round(flKh) + ' g/h – mehr als dein Ziel von ' + kb + ' g/h. Dünner mischen.' }) : null,
        'Gesamt: ' + nf((flH * f.T) / 60, 1) + ' Flaschen und ' + f.gels.length + ' Gels = ' + nf(f.kh) + ' g Kohlenhydrate.',
      ]);
      else legBox(f.name, 'mint', hms(f.T * 60) + ' h', [
        f.gels.length ? ['Gel (' + gel + ' g) bei ', zeiten(f.gels), ' – etwa alle ' + Math.round(f.iv) + ' min.'] : 'Keine Gels geplant' + (f.T < 60 ? ' – für unter eine Stunde reichen die Speicher.' : '.'),
        trinken < 150 ? 'Trinken nach Durst an den Verpflegungsstellen.' : ['Trinken: an jeder Verpflegungsstelle etwa ', el('b', { text: Math.round((trinken * (2 * f.T) / Math.max(1, f.km) / 60) / 10) * 10 + ' ml' }), ' (Annahme: Stellen etwa alle 2 km).'],
        'Gesamt: ' + f.gels.length + ' Gels = ' + nf(f.kh) + ' g Kohlenhydrate.',
      ]);
    });
    const tr2 = fuTraining(), kmax = Math.max(g.bike ? kb : 0, g.run ? kr : 0);
    $('#rr-fu-note').textContent = (kmax > 60 ? 'Mehr als etwa 60 g Glukose pro Stunde kann der Darm nicht aufnehmen – darüber hilft nur eine Mischung aus Glukose und Fruktose, die einen zweiten Weg ins Blut nutzt. Für ' + kmax + ' g/h also Produkte mit beiden Zuckern wählen. ' : 'Bis etwa 60 g/h reicht Glukose allein. ')
      + (g.bike ? (tr2 ? 'Im Training zuletzt ' + tr2.gh + ' g/h auf dem Rad (Median aus ' + tr2.n + (tr2.n === 1 ? ' langen Fahrt' : ' langen Fahrten') + ')' + (tr2.gh < kb - 15 ? ' – die Rennmenge also erst in langen Einheiten schrittweise üben.' : ' – das passt zur Rennmenge.') : 'Aus dem Training fehlen noch Angaben – trag die Kohlenhydrate langer Einheiten unter Training → Einheiten ein und übe die Rennmenge vorher.') : 'Die Rennmenge vorher in langen Läufen üben.')
      + ' Beim Trinken gilt: höchstens 2 % Körpermasse verlieren und nie mehr trinken, als du schwitzt.';
  }
  function renderRennen() {
    const sec = $('#rennen'); fill(sec);
    const At = rowsOf('athlet'); if (!At) return;
    const a = At[0];
    if (!RR.st) rrInit(a);
    if (RR.built !== rrKey()) rrBuild(a);
    rrUpdate(a);
    const RN = rowsOf('rennen');
    if (RN) table($('#tabelle-rennen'), 'rennen', RN, [{ f: 'datum' }, { f: 'name', cls: 'tf-wrap-cell' }, { f: 'gesamt', cls: 'r' }, { f: 'schwimmen', cls: 'r tf-hide-s' }, { f: 'rad', cls: 'r tf-hide-s' }, { f: 'lauf', cls: 'r tf-hide-s' }]);
  }

  /* ---------- PROFIL ---------- */
  const PF = [
    ['Körper', [['gewicht_ref_kg', 'Referenzgewicht', 'kg', 'Basis aller W/kg'], ['groesse_cm', 'Körpergröße', 'cm', 'optional', null, true], ['schlafbedarf_min', 'Schlafbedarf', 'min', 'falls Garmin keinen liefert']]],
    ['Rad', [['ftp_ref_w', 'FTP Referenz', 'W', 'Arbeitswert'], ['ftp_genannt_w', 'FTP genannt', 'W'], ['rad_if_min', 'Korridor von', '% FTP', null, 'pct'], ['rad_if_max', 'Korridor bis', '% FTP', null, 'pct'], ['cda_m2', 'CdA', 'm²', 'Schätzwert'], ['crr', 'Rollwiderstand', 'Crr'], ['rad_kg', 'Rad + Ausrüstung', 'kg']]],
    ['Laufen & Puls', [['vt1_pace_s_km', 'VT1-Tempo', 'min/km', null, 'pace'], ['vt2_pace_s_km', 'VT2-Tempo', 'min/km', null, 'pace'], ['vt1_hf', 'VT1-Puls', 'bpm'], ['vt2_hf', 'VT2-Puls', 'bpm'], ['hf_max', 'Maximalpuls', 'bpm'], ['lthr_lauf', 'Schwellenpuls Lauf', 'bpm'], ['lthr_rad', 'Schwellenpuls Rad', 'bpm'], ['kadenz_ziel_spm', 'Schrittfrequenz-Ziel', 'Schritte/min'], ['lauf_rampe_max_pct', 'Lauf-Steigerung höchstens', '% pro Woche', 'für den Belastungswächter']]],
    ['Schwimmen', [['css_s_100m', 'CSS', 'min/100 m', 'oder per Test unter Schwimmen', 'pace']]],
    ['Verpflegung Rad', [['kh_g_h_min', 'Kohlenhydrate von', 'g pro Stunde'], ['kh_g_h_max', 'Kohlenhydrate bis', 'g pro Stunde', 'langsam steigern – der Darm muss es lernen']]],
    ['Rennziele Langdistanz', [['ziel_schwimmen_min', 'Schwimmen', 'h:mm', null, 'dauer'], ['ziel_t1_min', 'Wechsel 1', 'min'], ['ziel_rad_min', 'Rad', 'h:mm', null, 'dauer'], ['ziel_t2_min', 'Wechsel 2', 'min'], ['ziel_lauf_min', 'Laufen', 'h:mm', null, 'dauer'], ['ziel_gesamt_min', 'Gesamt', 'h:mm', null, 'dauer']]],
  ];
  let pfBuilt = false;
  const pfShow = (v, f) => (v == null ? '' : f === 'pct' ? nf(v * 100, v * 100 % 1 ? 1 : 0) : f === 'pace' ? mmss(v) : f === 'dauer' ? hmin(v * 60) : String(v).replace('.', ','));
  const pfParse = (str, f) => {
    const t = String(str).trim(); if (!t) return null;
    if (f === 'pace') return parseTime(t, 'ms');
    if (f === 'dauer') { const s = parseTime(t, 'hm'); return s == null ? null : s / 60; }
    const n = Number(t.replace(',', '.')); if (!isFinite(n)) return null;
    return f === 'pct' ? n / 100 : n;
  };
  function pfFill(force) {
    const a = (rowsOf('athlet') || [])[0]; if (!a) return;
    const G = new Set(a.aus_garmin || []), S = new Set(a.standard || []);
    $$('#profil-felder input').forEach((i) => {
      if (force || document.activeElement !== i) i.value = pfShow(a[i.dataset.key], i.dataset.f);
      const t = $('.tf-pf-tag', i.closest('label')), k = i.dataset.key;
      t.hidden = !(G.has(k) || (S.has(k) && a[k] != null)); t.textContent = G.has(k) ? 'aus Garmin' : 'Standard'; t.classList.toggle('garmin', G.has(k));
    });
    const offen = a.bestaetigt === false;
    $('#profil-hinweis').hidden = !offen;
    if (offen) $('#profil-hinweis-text').textContent = 'Werte mit „aus Garmin“ sind aus deinen Daten geschätzt, „Standard“ sind allgemeine Startwerte. Trag ein, was du genauer weißt – etwa deine FTP aus einem Test – und tippe auf Speichern. Auch ohne Änderung bestätigt Speichern dein Profil.';
  }
  async function pfSave(ev) {
    ev.preventDefault();
    const a = rowsOf('athlet')[0], body = {}, msg = $('#profil-msg');
    for (const i of $$('#profil-felder input')) {
      const v = pfParse(i.value, i.dataset.f);
      if (v == null && i.dataset.opt && a[i.dataset.key] == null) continue; // freiwilliges Feld leer gelassen
      if (v == null) return setMsg(msg, 'Bitte prüfen: „' + i.getAttribute('aria-label') + '“.', true);
      if (a[i.dataset.key] == null || Math.abs(v - a[i.dataset.key]) > 1e-9) body[i.dataset.key] = v;
    }
    if (!Object.keys(body).length) {
      if (a.bestaetigt !== false) return setMsg(msg, 'Keine Änderungen.');
      body.bestaetigt = true;
    }
    try {
      const j = await A().api('POST', '/api/profil', body);
      A().patch('athlet', [j.profil]); RR.st = null; RR.built = null;
      setMsg(msg, 'Gespeichert ✓ – alle Seiten rechnen mit den neuen Werten.'); A().toast('Profil gespeichert');
    } catch (e) { setMsg(msg, e.message, true); }
  }
  function pfBuild() {
    const box = $('#profil-felder');
    PF.forEach(([title, fields]) => {
      const fs = el('div', { class: 'tf-fieldset' }, el('h3', { text: title }));
      fields.forEach(([key, label, unit, help, f, opt]) => {
        const inp = el('input', { class: 'tf-input', id: 'pf-' + key, 'data-key': key, 'data-f': f || '', inputmode: f === 'pace' || f === 'dauer' ? 'numeric' : 'decimal', 'aria-label': label, autocomplete: 'off' });
        if (opt) inp.dataset.opt = '1';
        const tag = el('span', { class: 'tf-pf-tag' }); tag.hidden = true;
        fs.appendChild(el('label', { class: 'tf-pf', for: 'pf-' + key }, el('span', null, label, tag, el('small', { text: unit + (help ? ' · ' + help : '') })), inp));
      });
      box.appendChild(fs);
    });
    $('#profil-form').addEventListener('submit', pfSave);
    $('#profil-reset').addEventListener('click', async () => {
      try { const j = await A().api('POST', '/api/profil', { zuruecksetzen: true }); A().patch('athlet', [j.profil]); RR.st = null; RR.built = null; pfFill(true); setMsg($('#profil-msg'), 'Zurückgesetzt: Standardwerte plus Vorschläge aus deinen Garmin-Daten.'); }
      catch (e) { setMsg($('#profil-msg'), e.message, true); }
    });
    $('#daten-jetzt').addEventListener('click', () => (A().state.ohne && !A().konto().garmin ? A().showGarmin() : A().refresh()));
    $('#daten-voll').addEventListener('click', () => A().refresh({ voll: true }));
    $('#abmelden').addEventListener('click', () => A().logout());
    kontoBuild();
    pfBuilt = true;
  }

  /* Konto */
  function kontoForm(id, fn) {
    const f = $('#' + id), m = $('.tf-form-msg', f);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const btn = $('button[type="submit"]', f); btn.disabled = true; setMsg(m, 'Einen Moment …');
      try { await fn(f, m); } catch (e) { setMsg(m, e.message, true); } finally { btn.disabled = false; }
    });
    return m;
  }
  function kontoBuild() {
    kontoForm('konto-f-garmin', async (f, m) => {
      const k = $('#konto-garmin-key').value.trim();
      if (!k) return setMsg(m, 'Bitte den neuen Schlüssel einfügen.', true);
      setMsg(m, 'Frage bei Garmin nach, ob der Schlüssel passt …');
      const j = await A().api('POST', '/api/konto', { aktion: 'garmin', schluessel: k });
      $('#konto-garmin-key').value = '';
      A().setKonto({ garmin: true, garmin_seit: j.garmin_seit || new Date().toISOString() });
      setMsg(m, 'Gespeichert ✓ – neue Daten werden geholt.');
      A().refresh({ leise: true });
    });
    const weg = $('#konto-garmin-weg');
    let wegT = null;
    weg.addEventListener('click', async () => {
      const m = $('.tf-form-msg', $('#konto-f-garmin'));
      if (!weg.dataset.sicher) { weg.dataset.sicher = '1'; weg.textContent = 'Wirklich entfernen?'; clearTimeout(wegT); wegT = setTimeout(() => { delete weg.dataset.sicher; weg.textContent = 'Schlüssel entfernen'; }, 5000); return; }
      delete weg.dataset.sicher; weg.textContent = 'Schlüssel entfernen'; clearTimeout(wegT);
      try { await A().api('POST', '/api/konto', { aktion: 'garmin', schluessel: '' }); A().setKonto({ garmin: false, garmin_seit: null }); setMsg(m, 'Entfernt. Ohne Schlüssel holt Tagesform keine neuen Daten – deine bisherigen bleiben.'); }
      catch (e) { setMsg(m, e.message, true); }
    });
    kontoForm('konto-f-passwort', async (f, m) => {
      const alt = $('#konto-pw-alt').value, neu = $('#konto-pw-neu').value, neu2 = $('#konto-pw-neu2').value;
      if (!alt) return setMsg(m, 'Bitte dein aktuelles Passwort eingeben.', true);
      if (neu.length < 10) return setMsg(m, 'Das neue Passwort braucht mindestens 10 Zeichen.', true);
      if (neu !== neu2) return setMsg(m, 'Die beiden neuen Passwörter sind nicht gleich.', true);
      await A().api('POST', '/api/konto', { aktion: 'passwort', alt, neu });
      ['#konto-pw-alt', '#konto-pw-neu', '#konto-pw-neu2'].forEach((x) => { $(x).value = ''; });
      setMsg(m, 'Geändert ✓ – auf anderen Geräten musst du dich neu anmelden.');
    });
    kontoForm('konto-f-notfall', async (f, m) => {
      const pw = $('#konto-notfall-pw').value;
      if (!pw) return setMsg(m, 'Bitte dein Passwort eingeben.', true);
      const j = await A().api('POST', '/api/konto', { aktion: 'notfallcode', passwort: pw });
      $('#konto-notfall-pw').value = ''; setMsg(m, 'Neuer Code erstellt – der alte gilt nicht mehr.');
      A().zeigeNotfall(j.notfallcode);
    });
    kontoForm('konto-f-loeschen', async (f, m) => {
      const pw = $('#konto-loeschen-pw').value;
      if (!pw) return setMsg(m, 'Bitte zur Bestätigung dein Passwort eingeben.', true);
      await A().api('POST', '/api/konto', { aktion: 'loeschen', passwort: pw });
      $('#konto-loeschen-pw').value = ''; setMsg(m, '');
      $$('#karte-konto details').forEach((d) => { d.open = false; });
      await A().geloescht();
    });
    const an = $('#teilen-anleitung'); an.href = A().anleitung;
    $('#teilen-kopieren').addEventListener('click', () => {
      const link = (A().status() || {}).registrierung === 'offen' ? location.origin + '/' : A().anleitung, ok = () => A().toast('Link kopiert');
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(link).then(ok, () => A().toast(link, 8000));
      else A().toast(link, 8000);
    });
  }
  function kontoRender() {
    const k = A().konto();
    $('#konto-mail').textContent = k.email || '–';
    $('#konto-garmin').textContent = k.garmin ? 'verbunden' + (k.garmin_seit ? ' seit ' + new Date(k.garmin_seit).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: '2-digit' }) : '') : 'nicht verbunden';
    $('#konto-garmin').style.color = k.garmin ? '' : col('orange');
    const st = A().status() || {}, offen = st.registrierung === 'offen', ts = $('#teilen-status');
    $('#teilen-text').innerHTML = offen
      ? 'Auf dieser Seite kann sich <b>jeder ein eigenes Konto</b> anlegen und seinen eigenen Garmin-Schlüssel eintragen – ohne deine Freigabe. Jedes Konto sieht nur seine eigenen Daten.'
      : 'Jeder kann sich eine <b>eigene Kopie</b> einrichten – kostenlos, mit eigenem Garmin-Schlüssel, in etwa 10 Minuten. So bleiben die Daten bei der Person, der sie gehören. Garmins persönliche Schlüssel sind genau dafür gedacht: eigene Daten, eigene App.';
    $('#teilen-anleitung').hidden = offen;
    $('#teilen-kopieren').textContent = offen ? 'Link zur App kopieren' : 'Link kopieren';
    if (ts) ts.textContent = offen ? 'Anmeldung auf dieser Seite: offen.'
      : st.registrierung === 'code' ? 'Anmeldung auf dieser Seite: nur mit Einladungscode.'
      : st.registrierung_hinweis === 'betreiber' ? 'Anmeldung auf dieser Seite: noch zu – in Vercel fehlen BETREIBER_NAME und BETREIBER_KONTAKT für die Datenschutzerklärung.'
      : 'Anmeldung auf dieser Seite: geschlossen – für alle öffnen mit REGISTRIERUNG = offen (dazu BETREIBER_NAME und BETREIBER_KONTAKT) in Vercel.';
  }
  /* Morgen-Push */
  const PU = { built: false, abo: undefined, server: null, gemeldet: false };
  const puIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const puApp = () => navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const puGeht = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const puBytes = (b64) => { const t = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4)); return Uint8Array.from(t, (c) => c.charCodeAt(0)); };
  const puGeraet = () => { const u = navigator.userAgent; return /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows-PC' : 'Browser'; };
  const puReg = () => (puGeht() ? Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 5000))]) : Promise.resolve(null));
  async function puLaden() {
    const reg = await puReg().catch(() => null);
    PU.abo = reg ? await reg.pushManager.getSubscription().catch(() => null) : null;
    try { PU.server = await A().api('GET', '/api/push'); } catch (e) { PU.server = null; }
    // Gerät beim Server auffrischen (z. B. nach einem Wechsel der Datenbank)
    if (PU.abo && PU.server && !PU.gemeldet && A().pushKonto()) { PU.gemeldet = true; A().api('POST', '/api/push', { aktion: 'abo', abo: PU.abo.toJSON(), geraet: puGeraet() }).catch(() => {}); }
    puRender();
  }
  function puRender() {
    const dot = $('#push-punkt'), an = $('#push-an'), test = $('#push-test'), aus = $('#push-aus');
    const set = (c, titel, text) => { dot.style.background = col(c); $('#push-status').textContent = titel; $('#push-text').textContent = text; };
    an.hidden = test.hidden = aus.hidden = true;
    const n = PU.server ? PU.server.geraete.length : 0;
    if (puIOS() && !puApp()) return set('orange', 'Erst als App installieren', 'Auf dem iPhone kommen Mitteilungen nur bei Apps vom Home-Bildschirm: In Safari auf „Teilen“ tippen → „Zum Home-Bildschirm“. Dann Tagesform von dort öffnen und hier den Push aktivieren.');
    if (!puGeht()) return set('gray', 'Nicht verfügbar', 'Dieser Browser kann keine Push-Mitteilungen empfangen.');
    if (Notification.permission === 'denied') return set('red', 'Mitteilungen blockiert', 'Tagesform darf auf diesem Gerät keine Mitteilungen zeigen. Erlauben kannst du das in den Einstellungen (iPhone: Einstellungen → Mitteilungen → Tagesform).');
    if (PU.abo === undefined) return set('gray', 'Wird geprüft …', '');
    if (PU.abo) { set('green', 'Aktiv auf diesem Gerät', 'Kommt jeden Morgen nach dem automatischen Garmin-Abruf – sobald deine Nacht da ist, sonst gegen 9–10 Uhr.' + (n > 1 ? ' Angemeldet sind ' + n + ' Geräte.' : '')); test.hidden = aus.hidden = false; return; }
    set('gray', 'Aus', 'Jeden Morgen nach dem Garmin-Abruf: Tagesform, Empfehlung und – falls noch offen – die Erinnerung an den Check-in.' + (n ? ' Schon aktiv auf ' + n + (n === 1 ? ' anderem Gerät.' : ' anderen Geräten.') : ''));
    an.hidden = false;
  }
  async function puAn() {
    const msg = $('#push-msg');
    try {
      const erlaubnis = await Notification.requestPermission(); // muss direkt aus dem Tippen kommen (iPhone)
      if (erlaubnis !== 'granted') { setMsg(msg, 'Ohne deine Erlaubnis kann Tagesform keine Mitteilungen zeigen.', true); return puRender(); }
      setMsg(msg, 'Wird eingerichtet …');
      const reg = await puReg();
      if (!reg) throw new Error('Der Hintergrunddienst ist noch nicht bereit – lade die Seite neu.');
      if (!PU.server) PU.server = await A().api('GET', '/api/push');
      const alt = await reg.pushManager.getSubscription();
      if (alt) await alt.unsubscribe();
      const abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: puBytes(PU.server.publicKey) });
      await A().api('POST', '/api/push', { aktion: 'abo', abo: abo.toJSON(), geraet: puGeraet() });
      PU.abo = abo; PU.gemeldet = true; A().pushKonto(true);
      PU.server = await A().api('GET', '/api/push').catch(() => PU.server);
      setMsg(msg, 'Aktiviert ✓ – mit „Test senden“ kannst du es gleich ausprobieren.');
    } catch (e) { setMsg(msg, 'Hat nicht geklappt: ' + e.message, true); }
    puRender();
  }
  async function puTest() {
    const msg = $('#push-msg');
    try {
      setMsg(msg, 'Sendet …');
      const j = await A().api('POST', '/api/push', { aktion: 'test', endpoint: PU.abo.endpoint });
      if (j.ok) setMsg(msg, 'Gesendet – die Mitteilung kommt in ein paar Sekunden.');
      else if (j.status === 404 || j.status === 410) { setMsg(msg, 'Diese Anmeldung ist abgelaufen – bitte Push neu aktivieren.', true); await PU.abo.unsubscribe().catch(() => {}); PU.abo = null; puRender(); }
      else setMsg(msg, 'Der Push-Dienst hat abgelehnt (HTTP ' + j.status + ')' + (j.text ? ': ' + j.text : '.'), true);
    } catch (e) { setMsg(msg, e.message, true); if (e.status === 404) { PU.gemeldet = false; puLaden(); } }
  }
  async function puAus() {
    const msg = $('#push-msg');
    try {
      const ep = PU.abo.endpoint;
      await PU.abo.unsubscribe();
      await A().api('POST', '/api/push', { aktion: 'ab', endpoint: ep });
      PU.abo = null; setMsg(msg, 'Ausgeschaltet.');
      PU.server = await A().api('GET', '/api/push').catch(() => PU.server);
    } catch (e) { setMsg(msg, e.message, true); }
    puRender();
  }

  function renderProfil() {
    if (!pfBuilt) pfBuild();
    pfFill(false);
    fill($('#karte-push'));
    if (!PU.built) { PU.built = true; $('#push-an').addEventListener('click', puAn); $('#push-test').addEventListener('click', puTest); $('#push-aus').addEventListener('click', puAus); puRender(); puLaden(); }
    const sw = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
    $('#daten-offline').textContent = sw ? 'Offline-Modus aktiv: Die App startet auch ohne Netz mit dem letzten Stand.' : '';
    segButtons($('#theme-seg'), [['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']], A().theme(), (t) => { A().setTheme(t); });
    kontoRender();
    const sta = A().status();
    $('#daten-auto').textContent = sta && sta.cron_secret === false
      ? 'Automatische Abrufe sind aus: In Vercel fehlt die Variable CRON_SECRET. Bis dahin holt die App neue Daten, wenn du sie öffnest und der letzte Abruf älter als zwei Stunden ist.'
      : 'Automatisch: jeden Morgen gegen 7–8 Uhr, ein zweites Mal am Vormittag und am Abend. Beim Öffnen holt die App neue Daten, wenn der letzte Abruf älter als zwei Stunden ist. Ohne Netz zeigt sie den zuletzt geladenen Stand.';
    const st = A().state.stand, f = A().state.fehler;
    $('#daten-stand').textContent = st ? 'Zuletzt geholt ' + A().relTime(st.at) + ' · Daten bis ' + (st.bis ? fmtDay(toDay(st.bis)) : '–') + ' · ' + st.tage + ' Tage, ' + st.einheiten + ' Einheiten' : 'Noch kein Abruf';
    setMsg($('#daten-msg'), f ? 'Letzter Abruf fehlgeschlagen (' + A().relTime(f.at) + '): ' + f.text : '', !!f);
    const ohneG = A().state.ohne && !A().konto().garmin; // noch ohne Garmin: verbinden statt aktualisieren
    $('#daten-jetzt').textContent = ohneG ? 'Garmin verbinden' : 'Jetzt aktualisieren';
    $('#daten-jetzt').classList.toggle('tf-btn-primary', ohneG);
    $('#daten-voll').hidden = ohneG;
    if (ohneG) { $('#daten-stand').textContent = 'Nicht verbunden'; $('#daten-auto').textContent = 'Verbinde deinen persönlichen Garmin-Schlüssel – dann holt Tagesform HRV, Schlaf, Ruhepuls und deine Einheiten jeden Morgen automatisch.'; }
  }

  /* ---------- METHODIK ---------- */
  function renderMethodik() {
    const box = $('#methoden-liste'), M = rowsOf('methoden');
    if (!M) { if (failedAny('methoden')) failed(box); return; }
    box.replaceChildren();
    M.forEach((r) => {
      const a = document.createElement('article'); a.className = 'tf-method'; a.id = 'methode-' + r.id;
      const w = 'id=' + encodeURIComponent(r.id);
      const e = mark(document.createElement('div'), 'methoden', 'bereich', w); e.className = 'tf-eyebrow2'; e.textContent = r.bereich;
      const h = mark(document.createElement('h3'), 'methoden', 'kennzahl', w); h.textContent = r.kennzahl;
      const f = mark(document.createElement('p'), 'methoden', 'formel', w); f.className = 'tf-formel'; f.textContent = r.formel;
      const d = mark(document.createElement('p'), 'methoden', 'deutung', w); d.textContent = r.deutung;
      const q = mark(document.createElement('p'), 'methoden', 'quelle', w); q.className = 'tf-quelle'; q.textContent = r.quelle;
      a.append(e, h, f, d, q); box.appendChild(a);
    });
  }

  /* ---------- Steuerung: Bereich → Thema → Detail ----------
     Fünf Bereiche (unten am Handy, oben am Laptop). Jede Route zeigt eine Seite (section); data-thema blendet
     auf geteilten Seiten nur die Karten des Themas ein. Zurück folgt dem Verlauf, sonst geht es zur Übersicht. */
  const PAGES = { heute: renderHome, tagesform: renderTagesform, befinden: renderBefinden, erholung: renderErholung, schlaf: renderSchlaf, belastung: renderBelastung, einheiten: renderEinheiten, schwimmen: renderSchwimmen, rad: renderRad, laufen: renderLaufen, rennen: renderRennen, profil: renderProfil, methodik: renderMethodik, 'ohne-daten': () => {} };
  const ZUSATZ = {}; // Erweiterungen aus anderen Dateien: { seite: [fn] }
  const BEREICHE = ['heute', 'training', 'gesundheit', 'wissen', 'profil'];
  const ROUTEN = {
    heute: { seite: 'heute', titel: 'Heute' },
    'heute/tagesform': { seite: 'tagesform', titel: 'Tagesform', sub: 'Wie bereit dein Körper heute ist', daten: true },
    'heute/tag': { seite: 'tag', titel: 'Dein Tag', sub: 'Zeitfenster für Energie, Essen und Schlaf' },
    'heute/woche': { seite: 'woche', titel: 'Wochenrückblick', sub: 'Was diese Woche los war' },
    training: { seite: 'training-hub', titel: 'Training', sub: 'Planen, trainieren, auswerten' },
    'training/plan': { seite: 'plan', titel: 'Trainingsplan', sub: 'Dein Weg zum Ziel – Woche für Woche' },
    'training/gym': { seite: 'gym', titel: 'Gym', sub: 'Muskeln antippen, Workout bekommen' },
    'training/flow': { seite: 'flow', titel: 'Pilates & Yoga', sub: 'Rumpf, Beweglichkeit und Entspannung' },
    'training/schwimmen': { seite: 'schwimmen', titel: 'Schwimmen', sub: 'Tempo, Umfang, Technik und CSS', daten: true },
    'training/rad': { seite: 'rad', titel: 'Rad', sub: 'Leistungskurve, FTP und Effizienz', daten: true },
    'training/laufen': { seite: 'laufen', titel: 'Laufen', sub: 'Belastung, Schrittfrequenz und Effizienz', daten: true },
    'training/form': { seite: 'belastung', thema: 'form', titel: 'Fitness & Form', sub: 'Fitness, Ermüdung und Form über die Zeit', daten: true },
    'training/last': { seite: 'belastung', thema: 'last', titel: 'Belastungssprünge', sub: 'Wie schnell deine Last steigt – je Disziplin', daten: true },
    'training/umfang': { seite: 'belastung', thema: 'umfang', titel: 'Umfang & Intensität', sub: 'Stunden pro Woche und wie hart sie waren', daten: true },
    'training/einheiten': { seite: 'einheiten', thema: 'check', titel: 'Einheiten', sub: 'Hat jede Einheit ihren Zweck getroffen?', daten: true },
    'training/fueling': { seite: 'einheiten', thema: 'fueling', titel: 'Fueling', sub: 'Kohlenhydrate pro Stunde in langen Einheiten', daten: true },
    'training/saison': { seite: 'saison', titel: 'Saison & Rennen', sub: 'Deine Rennen, Phasen und der Countdown' },
    'training/rechner': { seite: 'rennen', titel: 'Rennrechner', sub: 'Splits, Pacing und Verpflegung' },
    'training/werkzeuge': { seite: 'werkzeuge', titel: 'Werkzeuge', sub: 'Watt pro Kilo, Aerodynamik und TSS' },
    'training/renntag': { seite: 'renntag', titel: 'Renntag', sub: 'Race Card zum Ausdrucken und Packliste' },
    'training/schweiss': { seite: 'schweiss', titel: 'Schweißrate', sub: 'Wie viel du schwitzt – für Trinken und Verpflegung' },
    'training/material': { seite: 'material', titel: 'Material', sub: 'Kette wachsen und Laufschuh-Kilometer' },
    gesundheit: { seite: 'gesundheit-hub', titel: 'Gesundheit', sub: 'Erholung, Schlaf und Körper' },
    'gesundheit/checkin': { seite: 'befinden', thema: 'checkin', titel: 'Check-in', sub: 'Fünf Fragen am Morgen – 20 Sekunden' },
    'gesundheit/hrv': { seite: 'erholung', thema: 'hrv', titel: 'HRV', sub: 'Herzfrequenzvariabilität und dein Normalbereich', daten: true },
    'gesundheit/puls': { seite: 'erholung', thema: 'puls', titel: 'Ruhepuls & Atmung', sub: 'Nachtwerte gegen deine Basis', daten: true },
    'gesundheit/schlaf': { seite: 'schlaf', titel: 'Schlaf', sub: 'Dauer, Phasen und Rhythmus', daten: true },
    'gesundheit/fitness': { seite: 'fitness', titel: 'Fitness-Alter', sub: 'Wie alt dein Herz-Kreislauf-System ist', daten: true },
    'gesundheit/koerper': { seite: 'befinden', thema: 'koerper', titel: 'Körper & Energie', sub: 'Gewicht, W/kg und Ernährung', daten: true },
    'gesundheit/aktivitaet': { seite: 'aktivitaet', titel: 'Schritte & Bewegung', sub: 'Alltagsbewegung und aktive Minuten', daten: true },
    'gesundheit/stress': { seite: 'stress', titel: 'Stress & Body Battery', sub: 'Anspannung und Energie über den Tag', daten: true },
    'gesundheit/protokoll': { seite: 'protokoll', titel: 'Heute notiert', sub: 'Trinken, Eiweiß, Koffein und dein Stack' },
    'gesundheit/labor': { seite: 'labor', titel: 'Laborwerte', sub: 'Deine Blutwerte über die Saison' },
    wissen: { seite: 'wissen', titel: 'Wissen', sub: 'Begriffe und Fragen – einfach erklärt' },
    'wissen/methodik': { seite: 'methodik', titel: 'So rechnet Tagesform', sub: 'Jede Kennzahl mit Formel und Studie' },
    profil: { seite: 'profil-hub', titel: 'Profil', sub: 'Du, deine Werte und dein Konto' },
    'profil/ich': { seite: 'profil', thema: 'ich', titel: 'Über dich', sub: 'Fokus der App, Alter, Sportarten und Wissenslevel' },
    'profil/athlet': { seite: 'profil', thema: 'athlet', titel: 'Athletenprofil', sub: 'Gewicht, FTP, Zonen und Ziele' },
    'profil/garmin': { seite: 'profil', thema: 'garmin', titel: 'Garmin & Daten', sub: 'Abruf und Aktualisierung' },
    'profil/push': { seite: 'profil', thema: 'push', titel: 'Morgen-Push', sub: 'Deine Tagesform als Mitteilung' },
    'profil/darstellung': { seite: 'profil', thema: 'darstellung', titel: 'Darstellung', sub: 'Hell, dunkel oder wie dein Gerät' },
    'profil/konto': { seite: 'profil', thema: 'konto', titel: 'Konto & Datenschutz', sub: 'Passwort, Garmin-Schlüssel, Daten' },
    'profil/teilen': { seite: 'profil', thema: 'teilen', titel: 'Tagesform teilen', sub: 'Für Freunde und Trainingspartner' },
    'profil/quests': { seite: 'spiel-quests', titel: 'Quests', sub: 'Täglich und wöchentlich XP sammeln' },
    'profil/road': { seite: 'spiel-road', titel: 'Trophy Road', sub: 'Level, Stufen und Belohnungen' },
    'profil/trophaeen': { seite: 'spiel-trophaeen', titel: 'Trophäen', sub: 'Besondere Leistungen – auch aus deiner Vergangenheit' },
    'profil/avatar': { seite: 'spiel-avatar', titel: 'Profilbild & Banner', sub: 'Foto, Abzeichen, Banner, Rahmen und Titel' },
  };
  // alte Seiten-Namen und Links (Push, Lesezeichen) → neue Routen
  const ALIAS = { befinden: 'gesundheit/checkin', erholung: 'gesundheit/hrv', schlaf: 'gesundheit/schlaf', fitness: 'gesundheit/fitness', belastung: 'training/form', einheiten: 'training/einheiten', schwimmen: 'training/schwimmen', rad: 'training/rad', leistung: 'training/rad', laufen: 'training/laufen', gym: 'training/gym', saison: 'training/saison', rennen: 'training/rechner', werkzeuge: 'training/werkzeuge', methodik: 'wissen/methodik', tagesform: 'heute/tagesform', plan: 'training/plan', flow: 'training/flow', pilates: 'training/flow', yoga: 'training/flow', rennrechner: 'training/rechner', quests: 'profil/quests', xp: 'profil/quests', road: 'profil/road', trophyroad: 'profil/road', level: 'profil/road', trophaeen: 'profil/trophaeen', avatar: 'profil/avatar', profilbild: 'profil/avatar', schritte: 'gesundheit/aktivitaet', aktivitaet: 'gesundheit/aktivitaet', stress: 'gesundheit/stress', bodybattery: 'gesundheit/stress', tag: 'heute/tag', woche: 'heute/woche', wochenrueckblick: 'heute/woche', protokoll: 'gesundheit/protokoll', notiert: 'gesundheit/protokoll', wasser: 'gesundheit/protokoll', labor: 'gesundheit/labor', laborwerte: 'gesundheit/labor', schweiss: 'training/schweiss', schweissrate: 'training/schweiss', material: 'training/material', kette: 'training/material', schuhe: 'training/material', renntag: 'training/renntag', racecard: 'training/renntag', packliste: 'training/renntag', routinen: 'training/flow' };
  const ZUSATZ_ROUTEN = {}; // dynamische Routen aus Modulen: Präfix → fn(rest) → Routen-Info
  function routeInfo(r) {
    if (!r) return null;
    let R = ROUTEN[r];
    if (!R) { const i = r.lastIndexOf('/'), pre = i > 0 ? r.slice(0, i) : null; if (pre && ZUSATZ_ROUTEN[pre]) R = ZUSATZ_ROUTEN[pre](r.slice(i + 1)); }
    if (!R) return null;
    const bereich = r.split('/')[0];
    return Object.assign({ id: r, bereich, oben: r === bereich, eltern: bereich }, R);
  }
  const normal = (r) => { r = String(r || '').replace(/^#/, ''); if (!r) return 'heute'; r = ALIAS[r] || r; return routeInfo(r) ? r : 'heute'; };
  const SPORT_STANDARD = ['schwimmen', 'rad', 'laufen', 'gym'];
  function sportarten() { const a = (rowsOf('athlet') || [])[0]; return a && Array.isArray(a.sportarten) && a.sportarten.length ? a.sportarten : SPORT_STANDARD; }
  let lastIn = {};
  try { lastIn = JSON.parse(localStorage.getItem('tf:zuletzt2')) || {}; } catch (e) { lastIn = {}; }
  Object.keys(lastIn).forEach((g) => { const R = routeInfo(lastIn[g]); if (!R || R.bereich !== g) delete lastIn[g]; });
  const START = location.hash; // Startlink merken: Module melden ihre Routen erst später an
  let route = normal(START), navigiert = false;
  const sichtbar = (R) => (R.daten && A().state.ohne ? 'ohne-daten' : R.seite);
  let tab = routeInfo(route).seite; // die gerade sichtbare Seite (section)
  const scrollMerk = new Map();
  let kontoUid;
  function kontoWechsel() {
    const uid = A().konto().uid || null;
    if (uid === kontoUid) return;
    kontoUid = uid;
    RR.st = null; RR.built = null;
    CH.offen = null; CH.serien.clear(); CH.laden.clear();
    ckDate = null; ck = null;
    PU.abo = undefined; PU.server = null; PU.gemeldet = false;
    if (PU.built && uid) { puRender(); puLaden(); }
    ringAnimated = false;
  }
  function render() {
    kontoWechsel();
    applyTheme();
    const R = routeInfo(route), neu = sichtbar(R);
    if (neu !== tab) { tab = neu; mark_nav(); }
    fill($('#kopf'));
    try { if (PAGES[tab]) PAGES[tab](); } catch (err) { setTimeout(() => { throw err; }); }
    (ZUSATZ[tab] || []).forEach((f) => { try { f(); } catch (err) { setTimeout(() => { throw err; }); } });
    (ZUSATZ['*'] || []).forEach((f) => { try { f(tab); } catch (err) { setTimeout(() => { throw err; }); } }); // für alle Seiten, z. B. Begriffe erklären
  }
  function mark_nav() {
    const R = routeInfo(route);
    tab = sichtbar(R);
    root.dataset.route = R.id; root.dataset.bereich = R.bereich; root.dataset.ebene = R.id === 'heute' ? 'start' : R.oben ? 'bereich' : 'detail';
    root.dataset.group = R.bereich; // ältere Stilregeln
    $$('.tf-page').forEach((pg) => { pg.hidden = pg.id !== tab; });
    const sec = document.getElementById(tab);
    if (sec) $$('[data-thema]', sec).forEach((e) => e.classList.toggle('tf-aus', !!R.thema && !e.dataset.thema.split(' ').includes(R.thema)));
    $$('#bottom-nav button, #gruppen button').forEach((b) => { if (b.dataset.group === R.bereich) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const start = R.id === 'heute';
    $('#navkopf').hidden = start;
    if (!start) {
      $('#nav-titel').textContent = R.titel;
      $('#nav-sub').textContent = R.sub || '';
      const z = $('#zurueck'); z.hidden = R.oben;
      if (!R.oben) { const st = history.state, von = st && st.tf && st.t > 0 && st.von ? routeInfo(st.von) : null; $('#zurueck-text').textContent = (von || routeInfo(R.eltern)).titel; }
      $('#nav-aktion').replaceChildren();
    }
    document.title = start ? 'Tagesform' : R.titel + ' · Tagesform';
  }
  function zeigeRoute(ziel, art) { // art: vor · zurueck · tab · start
    const R = routeInfo(ziel); if (!R) return false;
    navigiert = true;
    if (route !== ziel) scrollMerk.set(route, window.scrollY);
    route = ziel; lastIn[R.bereich] = ziel;
    try { localStorage.setItem('tf:zuletzt2', JSON.stringify(lastIn)); } catch (e) { /* egal */ }
    mark_nav();
    render();
    if (art === 'zurueck') window.scrollTo(0, scrollMerk.get(ziel) || 0); else if (art !== 'start') window.scrollTo(0, 0);
    const pg = document.getElementById(tab);
    if (pg && art !== 'start') { pg.classList.remove('tf-rein', 'tf-raus', 'tf-page-in'); void pg.offsetWidth; pg.classList.add(art === 'vor' ? 'tf-rein' : art === 'zurueck' ? 'tf-raus' : 'tf-page-in'); }
    const nk = $('#navkopf'); if (nk && !nk.hidden && art !== 'start') { nk.classList.remove('tf-page-in'); void nk.offsetWidth; nk.classList.add('tf-page-in'); }
    return true;
  }
  function geh(ziel, opt) {
    opt = opt || {};
    ziel = normal(ziel);
    const R = routeInfo(ziel);
    if (ziel === route) { if (!opt.still) window.scrollTo({ top: 0, behavior: 'smooth' }); render(); return; }
    const st = history.state && history.state.tf ? history.state : { t: 0 };
    const t = opt.tab || R.oben ? 0 : (st.t || 0) + 1;
    const e = { tf: 1, r: ziel, t, von: opt.tab ? null : route };
    try { if (opt.ersetzen) history.replaceState(e, '', '#' + ziel); else history.pushState(e, '', '#' + ziel); } catch (err) { /* z. B. in Vorschauen */ }
    zeigeRoute(ziel, opt.tab ? 'tab' : 'vor');
  }
  function zurueck() {
    const st = history.state;
    if (st && st.tf && st.t > 0 && st.von) { history.back(); return; }
    const R = routeInfo(route), ziel = R.eltern;
    try { history.replaceState({ tf: 1, r: ziel, t: 0, von: null }, '', '#' + ziel); } catch (err) { /* egal */ }
    zeigeRoute(ziel, 'zurueck');
  }
  function vonAussen() { // Zurück/Vor im Browser, Links mit #…, Mitteilungen
    const st = history.state, ziel = normal(st && st.tf ? st.r : location.hash);
    if (ziel === route) return;
    if (st && st.tf) { zeigeRoute(ziel, 'zurueck'); return; }
    try { history.replaceState({ tf: 1, r: ziel, t: routeInfo(ziel).oben ? 0 : 1, von: route }, '', '#' + ziel); } catch (err) { /* egal */ }
    zeigeRoute(ziel, 'vor');
  }
  window.addEventListener('popstate', vonAussen);
  // Wischen vom linken Rand: eine Ebene zurück – nur in der installierten App, im Browser übernimmt das der Browser selbst
  const alsApp = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (alsApp) {
    let sx = null, sy = 0, st = 0;
    window.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t && t.clientX < 24 && !routeInfo(route).oben && !document.body.classList.contains('tf-sheet-offen')) { sx = t.clientX; sy = t.clientY; st = Date.now(); } else sx = null; }, { passive: true });
    window.addEventListener('touchend', (e) => { if (sx == null) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy); sx = null; if (dx > 70 && dy < 60 && Date.now() - st < 800) zurueck(); }, { passive: true });
  }
  window.addEventListener('hashchange', vonAussen);
  $('#zurueck').addEventListener('click', zurueck);
  $$('#bottom-nav button, #gruppen button').forEach((b) => b.addEventListener('click', () => {
    const g = b.dataset.group, R = routeInfo(route);
    if (R.bereich === g) { if (route !== g) geh(g, { tab: true }); else window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const L = lastIn[g] && routeInfo(lastIn[g]);
    geh(L && L.bereich === g ? lastIn[g] : g, { tab: true });
  }));
  // Schnittstelle für die Seitenmodule (seiten.js, hubs.js, plan.js, gym.js, flow.js, wissen.js)
  window.tfApp = {
    ui: { $, $$, el, svg, nf, iso, toDay, fmtDay, hm, hms, hmin, mmss, kurz, minLab, parseTime, col, clear, failed, emptyNote, tip, plot, line, band, dots, endDot, refLine, roundTop, hoverTime, hoverBands, gapShade, breaks, table, fill, mark, kv, segButtons, setMsg, insights, info, rowsOf, failedAny, params, heute, windowRows, rangeButtons, median, localDate, monday, kwOf, DAY, AMPEL, WTAG, MON, ring, zeile, svgIco, formText },
    seite(id, fn) { PAGES[id] = fn; if (tab === id && dash.data && info('athlet').status === 'ok') render(); },
    zusatz(id, fn) { (ZUSATZ[id] = ZUSATZ[id] || []).push(fn); },
    routen(prefix, fn) {
      ZUSATZ_ROUTEN[prefix] = fn;
      const r = normal(START);
      if (!navigiert && r !== route) { route = r; try { history.replaceState({ tf: 1, r, t: 0, von: null }, '', '#' + r); } catch (err) { /* egal */ } mark_nav(); }
    },
    zeige: (t, opt) => geh(t, opt),
    geh: (t, opt) => geh(t, opt),
    zurueck,
    route: () => route,
    routeInfo,
    kopf(o) { if (o.titel != null) $('#nav-titel').textContent = o.titel; if (o.sub != null) $('#nav-sub').textContent = o.sub; if (o.aktion !== undefined) $('#nav-aktion').replaceChildren(...(o.aktion ? [o.aktion] : [])); },
    tab: () => tab,
    neu: () => render(),
    sportarten,
    ohne: () => !!A().state.ohne,
    rr: () => ({ vAt, rrBike, rrRun }),
    farben: { korridor: KORR, korridorKurz: KORR_KURZ, disziplin: DISZ_FARBE },
    // Rennrechner auf eine Distanz stellen und öffnen (aus der Saison)
    rrWahl(sport, dist, ziel) {
      const a = (rowsOf('athlet') || [])[0]; if (!a || !tfDistanz(sport, dist)) return;
      if (!RR.st) rrInit(a);
      RR.st.sport = sport; RR.st.dist[sport] = dist; RR.built = null;
      if (ziel) rrCur().ziel_s = ziel;
      rrSave(); geh('training/rechner');
    },
    // Für die Race Card: die aktuelle Auswahl im Rennrechner mit Splits, Rad-Leistung, Lauftempo und Verpflegung
    rrKarte() {
      const a = (rowsOf('athlet') || [])[0]; if (!a) return null;
      if (!RR.st) rrInit(a);
      const item = rrItem(), g = rrLegs(item), s = Object.assign({}, rrCur()), ph = rrPhys(a, s), ftp = ftpOf(s.ftp_q, a) || a.ftp_ref_w;
      if (g.bike && s.watt == null) s.watt = istPlan(item) ? rrWattFor(a.ziel_rad_min * 60, s, ph, g.bike.km) : Math.round(a.ftp_ref_w * mitteB(bandOf(g.bike, a)));
      const T = {}; let bkr = null, rnr = null, rn1 = null;
      if (g.swim) T.swim = s.swim_s;
      if (g.bike) { bkr = rrBike(s.watt, s, ph, g.bike.km); T.bike = bkr.t; }
      if (g.run1) { rn1 = rrRun(s, g.run1.km, 'run1_pace'); T.run1 = rn1.t; }
      if (g.run) { rnr = rrRun(s, g.run.km); T.run = rnr.t; }
      const legs = item.legs.map((l) => ({ typ: l.typ, km: l.km, run1: l === g.run1, t: l.typ === 'swim' ? T.swim : l.typ === 'bike' ? T.bike : l.typ === 'run' ? (l === g.run1 ? T.run1 : T.run) : s[l.typ + '_s'] || 0 }));
      const total = legs.reduce((x, l) => x + (l.t || 0), 0);
      const fuel = total >= 75 * 60 && (g.bike || g.run) ? rrFuelDaten(a, s, item, g, T) : null;
      return { item, s, a, g, legs, total, ftp, bkr, rnr, rn1, fuel, sw: fuSchweiss(s), bikeBand: g.bike ? bandOf(g.bike, a) : null, runRef: g.run ? refPace(g.run, a) : null, runRefName: g.run ? refName(g.run) : null };
    },
    // Zeiten und Intensitäten je Abschnitt mit den Einstellungen aus dem Rennrechner (für den TSS-Planer)
    rrSplits(sport, dist) {
      const a = (rowsOf('athlet') || [])[0], item = tfDistanz(sport, dist); if (!a || !item) return null;
      if (!RR.st) rrInit(a);
      const k = sport + '_' + dist, eigen = !!RR.st.w[k], s = Object.assign({}, RR.st.w[k] || rrDefaults(a, item, 'daten')), g = rrLegs(item), ph = rrPhys(a, s);
      if (g.bike && s.watt == null) s.watt = istPlan(item) ? rrWattFor(a.ziel_rad_min * 60, s, ph, g.bike.km) : Math.round(a.ftp_ref_w * mitteB(bandOf(g.bike, a)));
      const legs = item.legs.map((l) => {
        if (l.typ === 'swim') return { typ: 'swim', km: l.km, t: s.swim_s, pace: s.swim_s / (l.km * 10) };
        if (l.typ === 'bike') { const r = rrBike(s.watt, s, ph, l.km); return { typ: 'bike', km: l.km, t: r.t, np: r.np, avg: r.avg }; }
        if (l.typ === 'run') { const r = l === g.run1 ? rrRun(s, l.km, 'run1_pace') : rrRun(s, l.km); return { typ: 'run', km: l.km, t: r.t, pace: r.avg, ref: l.ref }; }
        return { typ: l.typ, t: s[l.typ + '_s'] || 0 };
      });
      return { legs, ftp: ftpOf(s.ftp_q, a) || a.ftp_ref_w, eigen };
    },
  };
  $('#checkin-banner').addEventListener('click', () => { geh('gesundheit/checkin'); if (ckBuilt) ckLoad(localDate()); });
  $('#profil-banner').addEventListener('click', () => geh('profil/athlet'));
  $('#home-hero').addEventListener('click', () => { if (A().state.ohne) { geh('gesundheit/checkin'); if (ckBuilt) ckLoad(localDate()); } else geh('heute/tagesform'); });
  $('#kachel-laufbudget').addEventListener('click', () => geh('training/laufen'));
  $('#kachel-form').addEventListener('click', () => geh('training/form'));
  $('#kachel-schuld').addEventListener('click', () => geh('gesundheit/schlaf'));
  $('#ohne-verbinden').addEventListener('click', () => A().showGarmin());
  $$('.tf-chart').forEach((c) => c.classList.add('dash-skeleton'));
  try { history.replaceState({ tf: 1, r: route, t: 0, von: null }, '', '#' + route); } catch (err) { /* egal */ }
  mark_nav();
  applyTheme();
  const mo = new MutationObserver(() => { if (applyTheme()) render(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (applyTheme()) render(); });
  dash.onData(render);
})();
