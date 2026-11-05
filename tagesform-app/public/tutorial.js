/* Dreiklang · Tutorial (Version 12, ergänzt in Version 13)
   Jede Funktion in einfachen Worten: was sie bringt, wie du sie nutzt und wo du sie findest – sortiert nach Bereich und
   danach, wie ambitioniert du trainierst (Einsteiger brauchen keinen CdA-Rechner). Dazu eine Tour in 2 Minuten.
   Ab 60 Jahren (Geburtsjahr im Profil) schlägt Heute die Tour einmal vor. Gespeichert wird nur auf dem Gerät
   (localStorage tf:tutorial = { gesehen, weg }). */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, el, svgIco, rowsOf } = T.ui;
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const ALTER_TOUR = 60; // ab diesem Alter schlägt Heute die Tour vor
  const lesen = () => { try { return JSON.parse(localStorage.getItem('tf:tutorial')) || {}; } catch (e) { return {}; } };
  const schreiben = (o) => { try { localStorage.setItem('tf:tutorial', JSON.stringify(Object.assign(lesen(), o))); } catch (e) { /* nur Komfort */ } };

  const STUFEN = [[0, 'Einsteiger', 'Das Wichtigste für jeden Tag'], [1, 'Fortgeschritten', 'Dazu Auswertungen und Muster'], [2, 'Leistung', 'Alles – auch Rennrechner, CdA und Fueling']];
  const BEREICHE = [['start', 'Erste Schritte', 'i-play'], ['heute', 'Heute', 'i-ring'], ['training', 'Training', 'i-bolt'], ['gesundheit', 'Gesundheit', 'i-heart'], ['wissen', 'Wissen & Spiel', 'i-book'], ['profil', 'Profil & Daten', 'i-user']];
  // [Bereich, Stufe (0 alle, 1 ab Fortgeschritten, 2 Leistung), Name, was es bringt, [So geht's], Ziel (Route oder Aktion), braucht Garmin]
  const F = [
    ['start', 0, 'Garmin verbinden', 'Deine Uhr liefert Schlaf, HRV, Ruhepuls und Training – jeden Morgen automatisch.', ['Tippe oben rechts auf dein Profilbild.', 'Wähle „Garmin & Daten“.', 'In Garmin Connect einen Schlüssel erstellen und einfügen – die Anleitung steht direkt dabei.'], 'profil/garmin', false],
    ['start', 0, 'Als App auf dem Handy', 'Dreiklang startet dann wie jede andere App – und kann dir morgens eine Mitteilung schicken.', ['iPhone: in Safari auf „Teilen“ tippen.', '„Zum Home-Bildschirm“ wählen.', 'Dreiklang ab jetzt über das neue Symbol öffnen.'], null, false],
    ['start', 0, 'Über dich', 'Alter, Sportarten und Ziele machen alle Rechnungen persönlich.', ['Profilbild oben rechts → „Über dich“.', 'Geburtsjahr, Sportarten und Wissenslevel eintragen.', 'Für Rad und Laufen zusätzlich im „Athletenprofil“: Gewicht, FTP und Pulsschwellen.'], 'profil/ich', false],
    ['start', 0, 'Fokus der App', 'Alltag & Energie, Fitness & Gym oder Performance – Dreiklang zeigt dann nur, was zu dir passt.', ['Profilbild oben rechts → „Über dich“.', 'Unter „Fokus der App“ wählen.', 'Jederzeit änderbar.'], 'profil/ich', false],
    ['start', 0, 'Morgen-Push', 'Jeden Morgen deinen Tune als Mitteilung – ohne die App zu öffnen.', ['Profilbild oben rechts → „Morgen-Push“.', '„Push aktivieren“ antippen und erlauben.', 'Auf dem iPhone geht das nur in der App vom Home-Bildschirm.'], 'profil/push', false],

    ['heute', 0, 'Tune', 'Eine Zahl für heute: wie bereit dein Körper ist – aus Schlaf, HRV, Ruhepuls und deinem Gefühl.', ['Grün: Training wie geplant.', 'Gelb: lieber kürzer oder lockerer.', 'Rot: Erholung zuerst. Tippe die Karte an, um die Gründe zu sehen.'], 'heute/tagesform', false],
    ['heute', 0, 'Check-in am Morgen', 'Fünf Fragen in 20 Sekunden. Dein Gefühl macht deinen Tune genauer – auch ganz ohne Uhr.', ['Auf Heute „Wie geht’s dir heute?“ antippen.', 'Je Frage 1 bis 5 wählen – 5 ist immer der beste Wert.', 'Unten auf „Speichern“ tippen.'], 'gesundheit/checkin', false],
    ['heute', 0, 'Die Einheit des Tages', 'Oben auf Heute steht, was dein Plan vorsieht – mit Dauer, Zielbereich und Ablauf.', ['Mit „Gestern · Heute · Morgen“ blättern.', '„Details“ zeigt die ganze Einheit im Plan.', 'Gym und Pilates & Yoga startest du direkt mit „Jetzt starten“.'], 'heute', false],
    ['heute', 0, 'Für gestern nachtragen', 'Vergessen? Bis 12 Uhr kannst du den Check-in oder dein Trinken für gestern nachholen.', ['Vormittags erscheint auf Heute „Gestern vergessen?“.', 'Antippen und wie gewohnt ausfüllen.'], 'heute', false],
    ['heute', 0, 'Dein Tag', 'Wann Licht, Konzentration, der letzte Kaffee und das Bett am besten passen – aus deinem Schlaf berechnet.', ['Auf Heute die Karte „Dein Tag“ antippen.', 'Jedes Zeitfenster hat ein (i), das erklärt, warum.'], 'heute/tag', false],
    ['heute', 0, 'Heute notiert', 'Trinken, Eiweiß, Koffein und deine Ergänzungen mit einem Tipp.', ['Auf Heute „Heute notiert“ öffnen.', 'Für ein Glas Wasser auf „+250“, für Eiweiß auf „+20“ tippen.'], 'gesundheit/protokoll', false],
    ['heute', 0, 'Abend-Check', 'Ab 19 Uhr: zwei Minuten zum Abschalten – Kopf leeren, das Wichtigste für morgen, deine Bettzeit.', ['Erscheint abends von selbst auf Heute.', 'Notizen bleiben nur auf deinem Gerät.'], 'heute', false],
    ['heute', 1, 'Startseite anpassen', 'Pinne bis zu vier Karten an, die du immer oben sehen willst.', ['Ganz unten auf Heute „Startseite anpassen“.', 'Die Stecknadel bei deinen Lieblingskarten antippen.'], 'heute', false],

    ['training', 0, 'Mein Plan', 'Fünf Fragen – dann plant Dreiklang jede Woche für dich, passend zu Ziel, Zeit und Tune.', ['Unten auf „Training“ → „Plan erstellen“.', 'Sportarten, Ziel, Zeit und Erfahrung wählen.', 'Im „Feinschliff“ kannst du Entlastung, Kraft und Tests genauer einstellen.'], 'training/plan', false],
    ['training', 0, 'Tage verschieben', 'Passt ein Tag nicht? Tausch ihn – der Plan achtet darauf, dass keine zwei harten Tage nebeneinander liegen.', ['Im Plan eine Einheit nach rechts wischen oder „Verschieben“ antippen.', 'Zieltag wählen: nur diese Woche oder ab jetzt.'], 'training/plan', false],
    ['training', 0, 'In deinen Kalender', 'Deine Einheiten als Termine in Apple Kalender, Google oder Outlook.', ['Training → „Mein Plan“ → „In Kalender“.', 'Zeitraum, Uhrzeit und Erinnerung wählen, dann „Exportieren“.', 'iPhone: „Alle hinzufügen“ antippen, am besten in einen eigenen Kalender „Training“. Ändert sich dein Plan: dort die alten Termine entfernen und neu exportieren.'], 'kalender', false],
    ['training', 0, 'Gym', 'Muskeln antippen, Workout bekommen, Sätze abhaken – mit Gewicht und Pause.', ['Training → „Gym“.', 'Auf der Körperkarte die Muskeln antippen.', '„Workout starten“: Gewicht und Wiederholungen eintragen, „Satz geschafft“ antippen.'], 'training/gym', false],
    ['training', 0, 'Pilates & Yoga', 'Geführte Einheiten mit Timer und Atemkreis – und 5-Minuten-Routinen für zwischendurch.', ['Training → „Pilates & Yoga“.', 'Anlass wählen (Rücken, Hüfte, Entspannung …).', '„Einheit zeigen“ und dem Timer folgen.'], 'training/flow', false],
    ['training', 0, 'Laufen', 'Das Laufbudget schützt vor „zu viel zu schnell“, dazu Schrittfrequenz und Effizienz.', ['Training → „Ausdauer“ → „Laufen“.', 'Rot heißt: diese Woche schon mehr als dein Budget.'], 'training/laufen', true],
    ['training', 1, 'Kraftwerte & Deload', 'Aus deinen Sätzen schätzt Dreiklang deine Maximalkraft – und schlägt eine leichtere Woche vor, wenn es stockt.', ['Sätze im Gym immer mit Gewicht eintragen.', 'Unter jeder Übung steht dein Verlauf; (i) erklärt das Gewicht.'], 'training/gym', false],
    ['training', 1, 'Rad', 'FTP, Leistungskurve und Effizienz – für alle mit Wattmessung.', ['Training → „Ausdauer“ → „Rad“.', 'Deine FTP trägst du im Athletenprofil ein oder testest sie im Plan.'], 'training/rad', true],
    ['training', 1, 'Schwimmen', 'Tempo, Technik und dein Schwellentempo (CSS).', ['Training → „Ausdauer“ → „Schwimmen“.', 'Einen CSS-Test kannst du direkt dort eintragen.'], 'training/schwimmen', true],
    ['training', 1, 'Fitness & Form', 'Wie fit du bist und wie frisch – wichtig für gutes Timing vor einem Rennen.', ['Training → „Ausdauer“ → „Fitness & Form“.', 'Form im Plus heißt: ausgeruht.'], 'training/form', true],
    ['training', 1, 'Belastungssprünge', 'Warnt, wenn deine Last schneller steigt, als der Körper mitkommt.', ['Training → „Ausdauer“ → „Belastungssprünge“.', 'Über 1,5 lieber eine ruhigere Woche einlegen.'], 'training/last', true],
    ['training', 1, 'Einheiten-Check', 'Prüft jede Einheit: War locker wirklich locker, hart wirklich hart?', ['Training → „Ausdauer“ → „Einheiten-Check“.'], 'training/einheiten', true],
    ['training', 1, 'Saison & Rennen', 'Rennen eintragen – mit Countdown, Phasen und Tapering.', ['Training → „Ausdauer“ → „Saison“.', 'Rennen mit Datum und Distanz anlegen.'], 'training/saison', false],
    ['training', 1, 'Material', 'Kette wachsen, Laufschuh-Kilometer – zählt mit Garmin automatisch mit.', ['Training → „Ausdauer“ → „Material“.'], 'training/material', false],
    ['training', 2, 'Rennrechner', 'Zielzeit rein – Splits, Watt, Tempo und Verpflegung raus.', ['Training → „Ausdauer“ → „Rennrechner“.', 'Distanz wählen und Zielzeiten anpassen.'], 'training/rechner', false],
    ['training', 2, 'Renntag-Karte', 'Alle Splits, Watt-Grenzen und Verpflegungszeiten auf einer Karte – zum Ausdrucken, dazu die Packliste.', ['Training → „Ausdauer“ → „Renntag“.'], 'training/renntag', false],
    ['training', 2, 'Werkzeuge: W/kg, CdA, TSS', 'Kleine Rechner für Leistung, Aerodynamik und Trainingsbelastung.', ['Training → „Ausdauer“ → „Werkzeuge“.'], 'training/werkzeuge', false],
    ['training', 2, 'Fueling', 'Wie viele Kohlenhydrate pro Stunde du in langen Einheiten aufnimmst.', ['Training → „Ausdauer“ → „Fueling“.'], 'training/fueling', true],
    ['training', 2, 'Schweißrate', 'Wiegen vor und nach dem Training – die Grundlage für dein Trinken im Rennen.', ['Training → „Ausdauer“ → „Schweißrate“.', 'Test eintragen: Gewicht vorher, nachher, getrunken.'], 'training/schweiss', false],

    ['gesundheit', 0, 'Gesundheitsbild', 'Zwölf Werte gegen dein eigenes Normal – auf einen Blick, mit den zwei wichtigsten Tipps.', ['Unten auf „Gesundheit“.'], 'gesundheit', false],
    ['gesundheit', 0, 'Schlaf', 'Dauer, Phasen, Rhythmus und Schlafschuld.', ['Gesundheit → „Schlaf“.'], 'gesundheit/schlaf', true],
    ['gesundheit', 0, 'Schritte & Stress', 'Dein Tagesziel, Bewegung im Alltag, Stress und Body Battery.', ['Gesundheit → „Schritte & Bewegung“ oder „Alltag & Stress“.'], 'gesundheit/aktivitaet', false],
    ['gesundheit', 0, 'Frühwarnung & Pause', 'Dreiklang warnt oft, bevor du dich krank fühlst. Im Pause-Modus ist deine Serie geschützt.', ['Bei einer Warnung erscheint sie oben auf Heute.', 'Krank oder Auszeit? Pause-Modus starten – Quests werden zu Erholungs-Quests.'], 'pause', false],
    ['gesundheit', 0, 'Fitness-Alter', 'Wie alt dein Körper wirkt – aus Ausdauer und Ruhepuls geschätzt.', ['Gesundheit → „Fitness-Alter“.', 'Dafür braucht es dein Geburtsjahr im Profil.'], 'gesundheit/fitness', false],
    ['gesundheit', 1, 'HRV & Ruhepuls', 'Wie erholt dein Nervensystem ist – mit deinem persönlichen Korridor.', ['Gesundheit → „HRV im Verlauf“.', 'Ein einzelner Tag ist kein Grund zur Sorge – achte auf mehrere Tage.'], 'gesundheit/hrv', true],
    ['gesundheit', 1, 'Was dich beeinflusst', 'Welche Gewohnheiten dir guttun und welche Energie rauben – aus deinen eigenen Daten.', ['Gesundheit → „Was dich beeinflusst“.', 'Je mehr du notierst, desto eher zeigen sich Muster (meist nach 3–4 Wochen).'], 'gesundheit/einfluss', false],
    ['gesundheit', 1, 'Deine Trends', 'Was sich über 30, 90 und 365 Tage verändert hat – ruhig, ohne täglichen Alarm.', ['Gesundheit → „Deine Trends“.'], 'gesundheit/trends', false],
    ['gesundheit', 2, 'Laborwerte', 'Nur zum Mitschreiben – mit dem Referenzbereich deines Labors, ohne Bewertung.', ['Gesundheit → „Laborwerte“.'], 'gesundheit/labor', false],

    ['wissen', 0, 'Lexikon & Fragen', 'Jeder Begriff einfach erklärt – in der App kannst du unterstrichene Wörter antippen.', ['Unten auf „Wissen“.', 'Oben suchen oder ein Thema wählen.'], 'wissen', false],
    ['wissen', 0, 'Merkliste', 'Artikel und Fragen für später speichern – auf allen Geräten.', ['Im Artikel auf „Merken“ tippen.', 'Wiederfinden unter Wissen → „Gemerkt“.'], 'wissen', false],
    ['wissen', 0, 'Quests & XP', 'Jeden Tag drei kleine Aufgaben. Alles, was dir guttut, bringt XP – auch Schritte und Schlaf.', ['Profilbild oben rechts → „Quests“.'], 'profil/quests', false],
    ['wissen', 0, 'Trophy Road & Trophäen', 'Level, Abzeichen und Banner – einmal erreicht, bleiben sie.', ['Profilbild oben rechts → „Trophy Road“.'], 'profil/road', false],
    ['wissen', 1, 'Mini-Experimente', '7 Tage eine Sache ausprobieren – danach zeigen deine Daten, was es gebracht hat.', ['Wissen → „Mini-Experimente“.', 'Experiment starten; der Check-in fragt jeden Morgen nach.'], 'wissen', false],

    ['profil', 0, 'Profilbild & Banner', 'Dein Bild oben rechts – mit Rahmen deiner Stufe.', ['Profilbild oben rechts → „Profilbild & Banner“.'], 'profil/avatar', false],
    ['profil', 0, 'Darstellung', 'Hell, dunkel oder wie dein Gerät.', ['Profilbild oben rechts → „Darstellung“.'], 'profil/darstellung', false],
    ['profil', 0, 'Deine Daten', 'Alles herunterladen oder dein Konto mit allen Daten löschen.', ['Profilbild oben rechts → „Konto & Datenschutz“.'], 'profil/konto', false],
    ['profil', 1, 'Teilen', 'Dreiklang mit Freunden teilen – jede Person nutzt ihr eigenes Konto.', ['Profilbild oben rechts → „Teilen“.'], 'profil/teilen', false],
    // Version 13
    ['start', 0, 'Geführte Tour', 'Die App mit Beispieldaten kennenlernen – je nach Erfahrung in Alltagssprache oder mit Formeln. Es wird nichts gespeichert.', ['Wissen → Tutorial → „Tour starten“.', 'Wählen, wie gut du dich mit Training auskennst.', 'Mit „Weiter“ über die Seiten – „Beenden“ führt zurück zu deinen Daten.'], 'tour', false],
    ['start', 0, 'Ohne Netz eintragen', 'Im Funkloch? Check-in, Sätze und Notizen warten auf dem Gerät und gehen raus, sobald du wieder Netz hast.', ['Einfach wie immer eintragen.', 'Unter deinem Namen steht dann „1 Änderung wartet“ – sie wird automatisch gesendet.'], null, false],
    ['heute', 0, 'Heute angepasst', 'Ist dein Tune gelb oder rot, wird nur die heutige Einheit leichter – konkret: weniger Intervalle oder kurz und locker.', ['Auf Heute steht bei der Einheit „Heute angepasst“ mit allen Änderungen.', '„Original zeigen“ stellt die geplante Einheit wieder her.'], 'heute', true],
    ['heute', 1, 'Überlastungs-Wächter', 'Fällt dein Tune drei Tage in Folge, während die Last hoch ist, schlägt Dreiklang einen Entlastungstag vor.', ['Der Hinweis erscheint oben auf Heute.', '„Heute entlasten“ oder „Morgen entlasten“ – im Plan steht dann höchstens 30 min locker.'], 'heute', true],
    ['training', 0, 'Eigene Einheiten', 'Spontan im Gym, beim Tennis oder Wandern? Trag es in den Plan ein – es zählt in Woche, Belastung und Form.', ['Training → „Mein Plan“ → „Plan öffnen“.', 'Unter der Woche „Einheit hinzufügen“ antippen.', 'Tag, Sportart, wie hart und wie lange wählen – bei Bedarf „Schon erledigt“.'], 'training/plan', false],
    ['training', 1, 'Deine Werte am Renntag', 'FTP, Schwellentempo und CSS als Spanne bis zum Rennen – dazu die passende Zielzeit. Nach jedem Test siehst du, ob du auf Kurs bist.', ['Training → „Mein Plan“ → „Plan öffnen“.', 'Unter der Woche steht „Deine Werte am Renntag“.', 'Nach einem Test die neuen Werte im Profil eintragen – die Prognose ordnet sie ein.'], 'training/plan', false],
    ['training', 1, 'Was wäre, wenn …?', 'Eine Einheit verschieben und sehen, wie frisch du am Wochenende wärst – und wie sich die Woche neu ordnet.', ['Training → „Mein Plan“ → „Plan öffnen“.', 'Unter der Woche „Was wäre, wenn …?“ antippen.', 'Einheit wählen, den Regler auf einen anderen Tag ziehen, dann „So verschieben“.'], 'training/plan', false],
    ['training', 1, 'Doppeltage & Bein-Hinweise', 'Zwei Einheiten an einem Tag oder ein harter Lauf direkt nach dem Beintag? Der Plan sagt, worauf du achten solltest.', ['Hinweise stehen im Plan direkt unter dem Tag.', 'Das Etikett „24 h nach Beintag“ heißt: Kraft lieber auf einen anderen Tag legen.'], 'training/plan', false],
    ['training', 1, 'Gym: Rekord-Radar & Verlauf', 'Schon beim Eintippen siehst du, ob der Satz ein neuer Rekord wäre – aufgeklappt zeigt jede Übung ihren Verlauf.', ['Training → „Gym“ → Workout.', 'Gewicht und Wiederholungen eintragen – darunter steht zum Beispiel „Noch 1 Wiederholung bis zum Rekord“.', 'Übung aufklappen: Maximum und Volumen der letzten Wochen.'], 'training/gym/workout', false],
    ['training', 2, 'Beine gegen Kreislauf', 'Zeigt getrennt, was Beine und Sehnen tragen und was dein Kreislauf leistet – wichtig, wenn du mehr läufst.', ['Training → „Ausdauer“ → „Belastungssprünge“.', 'Bei „Beine gegen Kreislauf“: über 1,3 heißt aufpassen, über 1,5 ist ein Sprung.'], 'training/last', true],
    ['training', 2, 'Renn-Zeitachse', 'Mit dem Finger über dein Rennen fahren: Splits, Verpflegung und wann die Speicher knapp werden.', ['Training → „Ausdauer“ → „Renntag“.', 'Unter der Race Card über die Zeitachse fahren.'], 'training/renntag', false],
    ['gesundheit', 1, 'Rückblick als Poster', 'Dein Monat oder Jahr als ruhiges Bild im Hochformat – zum Teilen als Story.', ['Gesundheit → „Deine Trends“ → „Monatsrückblick ansehen“.', 'Unten „Als Poster“, dann „Teilen“ oder „Bild speichern“.'], 'gesundheit/trends', false],
    ['profil', 1, 'Schwellen mit Datum', 'Neue FTP oder CSS gelten ab einem Datum – alte Einheiten behalten ihre Werte von damals.', ['Profilbild oben rechts → „Athletenprofil“.', 'Werte ändern, darunter „Neue Schwellen gelten ab“ wählen und speichern.'], 'profil/athlet', false],
  ];

  function stufeStandard() {
    const a = athlet(), w = a.wissen, m = window.tfAlltag && tfAlltag.modus ? tfAlltag.modus() : null;
    if (w === 'profi' || m === 'performance') return 2;
    if (w === 'einsteiger' || m === 'alltag') return 0;
    return 1;
  }
  let stufe = null;
  function oeffne(ziel) {
    if (!ziel) return;
    if (ziel === 'tour') { tour(); return; } // Version 16
    if (ziel === 'pause') { if (window.tfTageslauf && tfTageslauf.pauseBlatt) tfTageslauf.pauseBlatt(); return; }
    if (ziel === 'kalender') { if (window.tfPlan && tfPlan.hat && tfPlan.hat() && tfPlan.kalender) { tfPlan.kalender(); return; } T.geh('training/plan'); return; }
    T.geh(ziel);
  }

  /* ---------- Seite „Tutorial“ ---------- */
  function render() {
    const box = $('#tutorial-box'); if (!box) return;
    if (stufe == null) stufe = stufeStandard();
    const ohne = T.ohne ? T.ohne() : false;
    const kopf = el('article', { class: 'tf-card tf-held tf-buehne tf-b-plan tf-tut-kopf' },
      el('h2', { class: 'tf-held-t', text: 'Geführte Tour' }),
      el('p', { class: 'tf-held-f', text: 'Mit Beispieldaten über die echten Seiten – je nach Erfahrung in Alltagssprache oder mit Formeln. Deine eigenen Daten bleiben, wie sie sind. Darunter steht jede Funktion einzeln.' }));
    const los = el('button', { type: 'button', class: 'tf-btn tf-held-los' }, svgIco('i-play'), ' Tour starten');
    los.addEventListener('click', tour);
    kopf.appendChild(el('div', { class: 'tf-held-k' }, los));
    const sg = el('div', { class: 'tf-seg tf-tut-stufe', role: 'group', 'aria-label': 'Wie ambitioniert trainierst du?' });
    STUFEN.forEach(([v, t]) => { const b = el('button', { type: 'button', 'aria-pressed': String(stufe === v) }, t); b.addEventListener('click', () => { stufe = v; render(); }); sg.appendChild(b); });
    const frag = [kopf, el('div', { class: 'tf-field tf-tut-filter' }, el('span', { text: 'Zeig mir die Funktionen für' }), sg, el('small', { class: 'tf-ich-hint', text: STUFEN[stufe][2] + ' · ' + F.filter((f) => f[1] <= stufe).length + ' von ' + F.length + ' Funktionen' }))];
    BEREICHE.forEach(([id, name, icon]) => {
      const L = F.filter((f) => f[0] === id && f[1] <= stufe); if (!L.length) return;
      frag.push(el('h2', { class: 'tf-hub-sek', id: 'tut-' + id }, name, el('small', { text: L.length === 1 ? '1 Funktion' : L.length + ' Funktionen' })));
      frag.push(el('div', { class: 'tf-faqs tf-tut-liste' }, ...L.map(([, st, titel, kurz, schritte, ziel, garmin]) => {
        const d = el('details', { class: 'tf-faq tf-tut' });
        d.appendChild(el('summary', null, el('span', { class: 'tf-tut-s' }, svgIco(icon), el('span', null, el('b', { text: titel }), el('small', { text: kurz }))), svgIco('i-chev')));
        const body = el('div', { class: 'tf-faq-a' }, el('p', { class: 'tf-tut-h', text: 'So geht’s' }), el('ol', { class: 'tf-w-liste tf-tut-schritte' }, ...schritte.map((t) => el('li', { text: t }))));
        const fuss = el('div', { class: 'tf-form-actions tf-tut-fuss' });
        if (ziel) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-btn-klein' }, 'Hinbringen'); b.addEventListener('click', () => oeffne(ziel)); fuss.appendChild(b); }
        const tags = [st === 1 ? 'ab Fortgeschritten' : st === 2 ? 'für Leistung' : null, garmin ? (ohne ? 'braucht Garmin' : 'mit Garmin') : null].filter(Boolean);
        if (tags.length) fuss.appendChild(el('small', { class: 'tf-tut-tag', text: tags.join(' · ') }));
        body.appendChild(fuss);
        d.appendChild(body);
        return d;
      })));
    });
    frag.push(el('div', { class: 'tf-links', style: 'margin-top:18px' }, T.ui.zeile('wissen/methodik', 'So rechnet Dreiklang', 'i-book', 'gold', 'Jede Kennzahl mit Formel, Deutung und Studie')));
    box.replaceChildren(el('div', { class: 'tf-hub tf-tut-seite' }, ...frag));
  }

  /* ---------- Version 16: Die Tour läuft im Beispielmodus über die echten Seiten (tour.js) ---------- */
  function tour() {
    schreiben({ gesehen: new Date().toISOString().slice(0, 10) });
    if (window.tfTour && window.tfTour.frage) window.tfTour.frage();
  }

  /* ---------- Heute: ab 60 Jahren einmal die Tour vorschlagen ---------- */
  function alter() { const g = +athlet().geburtsjahr; return g > 1900 ? new Date().getFullYear() - g : null; }
  function vorschlag() {
    const box = $('#home-tutorial'); if (!box) return;
    const st = lesen(), a = alter();
    if (a == null || a < ALTER_TOUR || st.gesehen || st.weg) { box.replaceChildren(); return; }
    const los = el('button', { type: 'button', class: 'tf-btn tf-held-los' }, svgIco('i-play'), ' Tour starten');
    los.addEventListener('click', tour);
    const spaeter = el('button', { type: 'button', class: 'tf-btn tf-held-det' }, 'Nein, danke');
    spaeter.addEventListener('click', () => { schreiben({ weg: new Date().toISOString().slice(0, 10) }); box.replaceChildren(); });
    box.replaceChildren(el('article', { class: 'tf-card tf-held tf-buehne tf-b-flieder', id: 'karte-tutorial' },
      el('h2', { class: 'tf-held-t', text: 'In ein paar Minuten erklärt' }),
      el('p', { class: 'tf-held-f', text: 'Wir zeigen dir Schritt für Schritt, was die App kann – mit Beispieldaten, in Ruhe und in einfachen Worten. Du findest die Tour später jederzeit unter Wissen → Tutorial.' }),
      el('div', { class: 'tf-held-k' }, los, spaeter)));
  }

  // „So rechnet Dreiklang“: oben ein Weg zu den Funktionen
  function methodikLink() {
    const box = $('#methodik-tutorial'); if (!box || box.childElementCount) return;
    box.appendChild(T.ui.zeile('wissen/tutorial', 'Tutorial: jede Funktion erklärt', 'i-question', 'blue', 'Was die App kann und wie du es nutzt – nach Anspruch sortiert'));
  }

  T.seite('tutorial', render);
  T.zusatz('heute', vorschlag);
  T.zusatz('methodik', methodikLink);
  window.tfTutorial = { tour, F, BEREICHE, ALTER_TOUR };
})();
