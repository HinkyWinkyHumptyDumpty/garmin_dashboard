/* Dreiklang · Quellenregister (Version 22)
   Jede Studie, Leitlinie und jedes Regelwerk, auf das sich die App irgendwo beruft – alphabetisch, mit der Zahl der Stellen
   und den Bereichen, in denen sie steckt. Die Daten (quellen-daten.js) erzeugt `node scripts/quellen-register.js` aus dem Code,
   damit nichts fehlt und nichts veraltet. Jede Zeile führt zur Suche bei Google Scholar, damit du die Arbeit selbst nachlesen kannst. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svgIco } = T.ui;
  const D = () => window.tfQuellenDaten || { stand: '', n: 0, quellen: [] };
  const Q = { q: '', wo: 'alle' };
  const SCHOLAR = 'https://scholar.google.com/scholar?q=';
  const norm = (s) => String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const istArbeit = (t) => /(19|20)\d{2}/.test(t) && /, /.test(t); // Zeitschrift oder Werk mit Jahr – sonst Regelwerk, Verband, Hersteller
  const stand = (s) => (s ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4) : '');

  function zeile(q) {
    const a = el('a', { class: 'tf-qr-link', href: SCHOLAR + encodeURIComponent(q.t.replace(/\s*\([^)]*\)\s*$/, '')), target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Bei Google Scholar suchen: ' + q.t }, svgIco('i-extern'));
    return el('div', { class: 'tf-qr-zeile' + (istArbeit(q.t) ? '' : ' tf-qr-sonst') },
      el('div', { class: 'tf-qr-t' }, el('span', { text: q.t }), el('small', { class: 'tf-qr-meta num', text: q.n + (q.n === 1 ? ' Stelle' : ' Stellen') + ' · ' + q.wo.join(', ') })), a);
  }
  function liste() {
    const box = $('#quellen-liste'); if (!box) return;
    const w = norm(Q.q).split(/\s+/).filter(Boolean);
    const L = D().quellen.filter((q) => (Q.wo === 'alle' || q.wo.includes(Q.wo)) && (!w.length || w.every((x) => norm(q.t).includes(x))));
    box.replaceChildren();
    const z = $('#quellen-zahl'); if (z) z.textContent = L.length === D().n ? D().n + ' Quellen' : L.length + ' von ' + D().n;
    if (!L.length) { box.appendChild(el('p', { class: 'tf-empty', text: 'Keine Quelle passt – versuch einen Namen wie „Seiler“ oder eine Zeitschrift wie „Sports Med“.' })); return; }
    let buchstabe = '';
    L.forEach((q) => {
      const b = q.t[0].toUpperCase().normalize('NFD')[0];
      if (b !== buchstabe) { buchstabe = b; box.appendChild(el('h3', { class: 'tf-qr-buchstabe', text: b })); }
      box.appendChild(zeile(q));
    });
  }
  function render() {
    const box = $('#quellen-box'); if (!box) return;
    const d = D();
    if (box.querySelector('#quellen-liste')) { liste(); return; }
    const inp = el('input', { class: 'tf-input', id: 'quellen-suche', type: 'search', placeholder: 'Autor, Zeitschrift oder Jahr', 'aria-label': 'Quellen durchsuchen', autocomplete: 'off', enterkeyhint: 'search' });
    inp.addEventListener('input', () => { Q.q = inp.value; liste(); });
    const bereiche = [...new Set(d.quellen.flatMap((q) => q.wo))].sort((x, y) => x.localeCompare(y, 'de'));
    const chips = el('div', { class: 'tf-chipset tf-w-kats tf-qr-chips', role: 'group', 'aria-label': 'Bereich der App' });
    [['alle', 'Alle']].concat(bereiche.map((b) => [b, b])).forEach(([id, name]) => { const c = el('button', { type: 'button', 'aria-pressed': String(Q.wo === id) }, name); c.addEventListener('click', () => { Q.wo = id; chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === c))); liste(); }); chips.appendChild(c); });
    const arbeiten = d.quellen.filter((q) => istArbeit(q.t)).length;
    box.replaceChildren(
      el('p', { class: 'tf-intro', text: arbeiten + ' Studien, Übersichtsarbeiten und Fachbücher, dazu ' + (d.n - arbeiten) + ' Regelwerke, Leitlinien und Veranstalter – alphabetisch. Jede Zeile nennt, wo in der App die Quelle steckt, und führt zur Suche bei Google Scholar.' }),
      el('div', { class: 'tf-w-such' }, svgIco('i-search'), inp),
      chips,
      el('div', { class: 'tf-qr-kopf' }, el('span', { class: 'num', id: 'quellen-zahl', text: d.n + ' Quellen' }), el('small', { text: 'Stand ' + stand(d.stand) + ' · automatisch aus dem Code der App' })),
      el('div', { id: 'quellen-liste', class: 'tf-qr-liste' }),
      el('p', { class: 'tf-note tf-bleibt', text: 'Das Register entsteht beim Bauen jeder Version aus allen Quellenangaben im Code (scripts/quellen-register.js) – was in einem Artikel, einer Kennzahl oder einem Plan zitiert wird, steht auch hier. Zitationen sind Kurzformen (Erstautor, Zeitschrift, Jahr); die Suche bei Google Scholar führt zur Arbeit. Dreiklang ersetzt keine ärztliche Beratung.' }));
    liste();
  }
  function fussLink(klein) { // kleine Zeile „Quellenregister · 263 Quellen“ für Wissen und Methodik
    const b = el('button', { type: 'button', class: 'tf-qr-fuss' + (klein ? ' tf-qr-fuss-klein' : '') }, svgIco('i-book'), el('span', { text: 'Quellenregister' }), el('small', { class: 'num', text: D().n + ' Quellen' }));
    b.addEventListener('click', () => T.geh('wissen/quellen'));
    return b;
  }
  T.seite('quellen', render);
  T.zusatz('methodik', () => { const box = $('#methodik'); if (!box || box.querySelector('.tf-qr-fuss')) return; box.appendChild(el('div', { class: 'tf-qr-fuss-box' }, fussLink())); });
  window.tfQuellen = { render, fussLink, anzahl: () => D().n };
})();
