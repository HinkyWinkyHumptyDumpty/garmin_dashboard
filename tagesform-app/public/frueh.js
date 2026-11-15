/* Dreiklang · vor dem ersten Bild – für die App und die Datenschutz-Seite
   Version 19: Bedienungshilfen (Schriftgröße, weniger Text) – nur auf diesem Gerät gespeichert.
   Version 28: aus den Seiten hierher, damit die Content-Security-Policy keine eingebetteten Skripte erlauben muss:
   hell oder dunkel schon vor dem ersten Bild, dazu die Datenschutz-Seite (Sprache, Angaben zum Anbieter). */
try { var tfT = localStorage.getItem('tf:theme'); if (tfT === 'light' || tfT === 'dark') document.documentElement.dataset.theme = tfT; } catch (e) { /* Standard: wie das Gerät */ }
try { var tfB = JSON.parse(localStorage.getItem('tf:bedienung') || '{}'), tfR = document.documentElement; if (tfB.s === 1.15 || tfB.s === 1.3) { tfR.style.setProperty('--tf-fs', String(tfB.s)); tfR.dataset.schrift = tfB.s === 1.3 ? 'sehr-gross' : 'gross'; } if (tfB.k === 1) tfR.classList.add('tf-kurz'); } catch (e) { /* ohne Speicher: Standard */ }
if (document.documentElement.dataset.seite === 'datenschutz') document.addEventListener('DOMContentLoaded', function () {
  var TEXT = {
    de: { laden: 'Angaben zum Anbieter konnten gerade nicht geladen werden – bitte später noch einmal öffnen.', fehlt: 'Der Anbieter hat seine Angaben noch nicht hinterlegt.', mail: 'E-Mail: ' },
    en: { laden: 'The provider details could not be loaded right now – please try again later.', fehlt: 'The provider has not entered their details yet.', mail: 'Email: ' },
  };
  var sprache = 'de', daten = null, fehler = false;
  try { var s = localStorage.getItem('tf:sprache-datenschutz'); if (s === 'de' || s === 'en') sprache = s; else if (!/^de\b/i.test(navigator.language || 'de')) sprache = 'en'; } catch (e) { /* ohne Speicher: Gerätesprache */ }
  if (/[?&]lang=en\b/.test(location.search)) sprache = 'en';
  if (/[?&]lang=de\b/.test(location.search)) sprache = 'de';

  function betreiber() {
    var t = TEXT[sprache];
    document.querySelectorAll('[data-betreiber]').forEach(function (el) {
      el.textContent = '';
      if (fehler) { el.textContent = t.laden; return; }
      if (!daten) return;
      var b = daten.betreiber || {};
      if (!b.name || !b.kontakt) { var p = document.createElement('span'); p.className = 'fehlt'; p.textContent = t.fehlt; el.appendChild(p); return; }
      el.appendChild(document.createTextNode(b.name + '\n' + (b.anschrift ? b.anschrift.split(/\s*[,;]\s*/).join('\n') + '\n' : '') + t.mail));
      var a = document.createElement('a'); a.href = 'mailto:' + b.kontakt; a.textContent = b.kontakt; el.appendChild(a);
    });
  }
  function setze(l) {
    sprache = l;
    document.documentElement.lang = l;
    document.title = l === 'en' ? 'Privacy · Dreiklang' : 'Datenschutz · Dreiklang';
    document.querySelectorAll('[data-sprache]').forEach(function (m) { m.hidden = m.dataset.sprache !== l; });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    document.querySelectorAll('[data-t-de]').forEach(function (e) { e.textContent = e.getAttribute('data-t-' + l); });
    betreiber();
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setze(b.dataset.lang); try { localStorage.setItem('tf:sprache-datenschutz', b.dataset.lang); } catch (e) { /* nur für diesen Besuch */ } });
  });
  setze(sprache);
  fetch('/api/login', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (j) { daten = j; betreiber(); })
    .catch(function () { fehler = true; betreiber(); });
});
