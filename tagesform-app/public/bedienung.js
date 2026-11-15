/* Dreiklang · Bedienungshilfen (Version 19)
   Vier Ansichten: Standard, Weniger Text, Größere Schrift sowie Groß und einfach (größere Schrift und weniger Text).
   · Schriftgröße: Faktor --tf-fs am Wurzelelement (1 · 1,15 · 1,3). Jede Schriftgröße in styles.css rechnet damit;
     Diagramm-Beschriftungen wachsen höchstens um 10 %, die untere Leiste um 15 %.
   · Weniger Text: Klasse tf-kurz am Wurzelelement – Erklärungen, Quellen und Feld-Hinweise sind ausgeblendet,
     Erkenntnisse zeigen nur ihren Titel (Antippen klappt den Text auf), „Abschalten“ am Abend ist zugeklappt.
   Gespeichert nur auf diesem Gerät (localStorage tf:bedienung = { s, k }); index.html wendet es schon vor dem ersten Bild an. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el } = T.ui;
  const SCHLUESSEL = 'tf:bedienung', GROESSEN = [1, 1.15, 1.3];
  function lesen() {
    try { const o = JSON.parse(localStorage.getItem(SCHLUESSEL) || '{}') || {}; return { s: GROESSEN.includes(o.s) ? o.s : 1, k: o.k === 1 ? 1 : 0 }; } catch (e) { return { s: 1, k: 0 }; }
  }
  function anwenden(o) {
    const r = document.documentElement;
    if (o.s > 1) r.style.setProperty('--tf-fs', String(o.s)); else r.style.removeProperty('--tf-fs');
    r.classList.toggle('tf-kurz', o.k === 1);
    r.dataset.schrift = o.s >= 1.3 ? 'sehr-gross' : o.s > 1 ? 'gross' : 'standard';
  }
  function speichern(o) {
    try {
      if (o.s === 1 && !o.k) localStorage.removeItem(SCHLUESSEL);
      else localStorage.setItem(SCHLUESSEL, JSON.stringify({ s: o.s, k: o.k ? 1 : 0 }));
    } catch (e) { /* ohne Speicher gilt es bis zum Neuladen */ }
    anwenden(o);
    T.neu(); // Seiten und Diagramme mit der neuen Größe zeichnen
  }
  const ANSICHTEN = [
    { id: 'standard', name: 'Standard', sub: 'Alles mit Erklärungen und Quellen', s: 1, k: 0 },
    { id: 'kurz', name: 'Weniger Text', sub: 'Nur das Wichtigste, Erklärungen zum Antippen', s: 1, k: 1 },
    { id: 'gross', name: 'Größere Schrift', sub: 'Alles etwas größer, mit allen Erklärungen', s: 1.15, k: 0 },
    { id: 'einfach', name: 'Groß und einfach', sub: 'Größere Schrift und weniger Text – gut lesbar, auch ohne Brille', s: 1.15, k: 1 },
  ];
  const ansicht = (o) => ANSICHTEN.find((a) => (a.s > 1) === (o.s > 1) && a.k === o.k) || ANSICHTEN[0];
  function name() { const o = lesen(); return ansicht(o).name + (o.s >= 1.3 ? ', sehr groß' : ''); }

  function render() {
    const box = $('#bedienung-box'); if (!box) return;
    const o = lesen(), akt = ansicht(o);
    const liste = el('div', { class: 'tf-bh-liste', role: 'radiogroup', 'aria-label': 'Ansicht' }, ...ANSICHTEN.map((a) => {
      const b = el('button', { type: 'button', role: 'radio', class: 'tf-bh-wahl', 'aria-checked': String(a.id === akt.id), 'data-ansicht': a.id },
        el('span', { class: 'tf-bh-punkt', 'aria-hidden': 'true' }),
        el('span', { class: 'tf-bh-t' }, el('b', { text: a.name }), el('small', { text: a.sub })));
      b.addEventListener('click', () => { speichern({ s: a.s > 1 ? (o.s > 1 ? o.s : a.s) : 1, k: a.k }); render(); });
      return b;
    }));
    const teile = [liste];
    if (o.s > 1) {
      const seg = el('div', { class: 'tf-seg', role: 'group', 'aria-label': 'Schriftgröße' });
      [[1.15, 'Groß'], [1.3, 'Sehr groß']].forEach(([v, t]) => {
        const b = el('button', { type: 'button', 'aria-pressed': String(o.s === v) }, t);
        b.addEventListener('click', () => { speichern({ s: v, k: o.k }); render(); });
        seg.appendChild(b);
      });
      teile.push(el('div', { class: 'tf-field tf-bh-groesse' }, el('span', { text: 'Schriftgröße' }), seg));
    }
    box.replaceChildren(...teile);
  }

  // Weniger Text: Erkenntnisse zeigen nur den Titel – Antippen klappt den Text auf und wieder zu
  document.addEventListener('click', (e) => {
    if (!document.documentElement.classList.contains('tf-kurz') || !e.target.closest) return;
    const k = e.target.closest('.tf-insight');
    if (!k || e.target.closest('a, button, input, textarea, select')) return;
    k.classList.toggle('tf-auf');
  });

  anwenden(lesen());
  T.zusatz('profil', render);
  window.tfBedienung = { lesen, name, ANSICHTEN, setzen: (o) => { speichern(Object.assign(lesen(), o)); render(); } };
})();
