/* Dreiklang · Regeneration (Version 23)
   Gutes Training braucht gute Erholung. Hier sagst du dem Körper-Diagramm, wo es zwickt – Muskelkater, verspannt, müde,
   gereizt oder krampfig –, und bekommst für jede Stelle das, was nach Studienlage hilft: Rollen, Dehnen, Massagepistole,
   Übungen, Wärme oder Kälte, Bewegung, Schlaf und Essen – mit Anleitung, Dauer, Grenzen und Quelle. Eine Routine mit Timer
   führt dich durch; was du notierst, bleibt als Verlauf (rechner.regeneration) und zeigt, welche Stelle sich häuft.
   Keine Diagnose: Warnzeichen führen zur Ärztin, nicht zur Rolle. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, $$, el, svg, svgIco, localDate, toDay, iso, DAY } = T.ui;
  const A = () => window.dash.app;
  const S = () => window.tfSeiten;
  const kart = (o) => S().karte(o); // einheitlicher Kartenkopf (Symbol, Titel, Untertitel)
  const rowsOf = (n) => (window.dash && dash.data ? dash.data(n) : null) && dash.data(n).rows;

  /* ---------- Zustände ---------- */
  const ZUSTAND = { // satz: Form im Satz – Adjektive klein, Substantive groß („Waden · Muskelkater“, „Nacken (verspannt)“)
    kater: { name: 'Muskelkater', kurz: 'Muskelkater', satz: 'Muskelkater', farbe: 'orange', was: 'Dumpf, bei Druck und Bewegung, 1–3 Tage nach ungewohnter oder harter Belastung. Kleine Risse in den Muskelfasern – normal, heilt in zwei bis vier Tagen von selbst. Durchblutung und leichte Bewegung helfen, Härte schadet.', methoden: ['aktiv', 'massage', 'rollen', 'kompression', 'kalt', 'schlaf', 'pistole', 'waerme', 'dehnen'] },
    verspannt: { name: 'Verspannt / steif', kurz: 'Verspannt', satz: 'verspannt', farbe: 'purple', was: 'Der Muskel bleibt angespannt, die Bewegung ist eingeschränkt – oft Haltung (Aero-Position, Schreibtisch), Stress oder einseitige Belastung. Wärme, Bewegung in die Länge und lösende Übungen bringen ihn zurück.', methoden: ['waerme', 'dehnen', 'rollen', 'uebungen', 'pistole', 'flow', 'massage', 'aktiv', 'schlaf'] },
    muede: { name: 'Müde / schwer', kurz: 'Müde', satz: 'müde', farbe: 'blue', was: 'Beine wie Blei nach großen Umfängen oder einem harten Block – keine Verletzung, sondern leere Speicher und Ermüdung des Nervensystems. Erholung, Essen, Schlaf und lockere Bewegung sind das Programm.', methoden: ['schlaf', 'aktiv', 'kompression', 'massage', 'rollen', 'waerme', 'flow', 'kalt'] },
    reizung: { name: 'Reizung / Schmerz', kurz: 'Reizung', satz: 'Reizung', farbe: 'red', was: 'Punktueller Schmerz, der beim Training da ist oder danach kommt – Sehne, Knochenhaut oder Gelenk statt Muskel. Hier zählt: Last runter, Ursache suchen, sanft laden statt rollen. Warnzeichen gehören zur Ärztin.', methoden: ['last', 'uebungen', 'kalt', 'schlaf', 'dehnen', 'waerme'] },
    krampf: { name: 'Krampfneigung', kurz: 'Krampf', satz: 'Krampf', farbe: 'gold', was: 'Der Muskel zieht sich unwillkürlich zusammen – meist, weil er ermüdet ist und die Steuerung aus dem Takt gerät, seltener durch Flüssigkeit oder Salz. Dehnen des Muskels stoppt den Krampf; Kraft und Tempo-Gewöhnung beugen vor.', methoden: ['dehnen', 'uebungen', 'rollen', 'aktiv', 'schlaf', 'waerme', 'massage'] },
  };

  /* ---------- Methoden (allgemein, mit Evidenz) ---------- */
  const METHODE = {
    rollen: { name: 'Foam Rolling', icon: 'i-rope', dauer: '60–90 s je Muskel', sek: 90, timer: true,
      wirkt: 'Beweglichkeit kurzfristig besser, Muskelkater fühlt sich leichter an. Auf die Leistung am nächsten Tag kein messbarer Effekt.', evidenz: 'mittel',
      wie: ['Langsam – etwa 2 bis 3 cm pro Sekunde – über die ganze Länge des Muskels.', 'Auf einer empfindlichen Stelle 20–30 s bleiben und ruhig weiteratmen.', 'Druck so, dass du noch sprechen könntest: 6 von 10, nicht 10 von 10.'],
      nicht: 'Nicht über Knochen, Gelenke, Kniekehle oder den unteren Rücken direkt, nicht auf einer frischen Verletzung oder einer gereizten Sehne.',
      quelle: 'Wiewelhove et al., Front Physiol 2019 · Cheatham et al., Int J Sports Phys Ther 2015', wissen: 'foam_rolling' },
    dehnen: { name: 'Dehnen', icon: 'i-body', dauer: '30–60 s je Seite', sek: 40, timer: true,
      wirkt: 'Beweglichkeit wächst mit Wochen (ab etwa 5 Minuten pro Muskel und Woche). Gegen Muskelkater hilft Dehnen nicht – aber es löst verspannte Muskeln und stoppt Krämpfe.', evidenz: 'mittel',
      wie: ['Nach dem Training oder abends, nie kalt und nie vor harten Intervallen länger als 30 s.', 'Langsam in die Dehnung, bis es zieht, aber nicht sticht – dort atmen.', 'Beide Seiten, 2 Durchgänge.'],
      nicht: 'Nicht in einen stechenden Schmerz hinein, nicht bei akuter Sehnenreizung über das Ziehen hinaus, keine Wippbewegungen.',
      quelle: 'Herbert, de Noronha & Kamper, Cochrane 2011 · Behm et al., Appl Physiol Nutr Metab 2016 · Thomas et al., Int J Sports Med 2018', wissen: 'dehnen' },
    pistole: { name: 'Massagepistole', icon: 'i-tool', dauer: '45–60 s je Muskel', sek: 60, timer: true,
      wirkt: 'Lockert kurzfristig und macht beweglicher, ohne die Kraft zu schwächen – deshalb auch vor dem Training brauchbar. Erholungseffekt wie Massage: angenehm, klein.', evidenz: 'klein',
      wie: ['Mittlere Stufe, der Aufsatz gleitet über den Muskelbauch – nicht auf einer Stelle bohren.', 'Langsam entlang der Faserrichtung, 45–60 s je Muskel.', 'Aufhören, wenn es taub wird oder schmerzt.'],
      nicht: 'Nie auf Knochen, Gelenke, Sehnen, Nacken-Vorderseite, Bauch oder eine frische Verletzung; nicht bei Blutverdünnern oder Krampfadern.',
      quelle: 'Konrad et al., J Sports Sci Med 2020 · Sams et al., Int J Sports Phys Ther 2023', wissen: 'massagepistole' },
    waerme: { name: 'Wärme', icon: 'i-flame', dauer: '15–20 min', sek: 0,
      wirkt: 'Warmes Bad, Dusche, Wärmflasche oder Sauna entspannen verspannte Muskeln, erhöhen die Durchblutung und die Beweglichkeit – gut abends und bei Steifheit, nicht auf einer frischen Reizung.', evidenz: 'klein',
      wie: ['Warmes Bad oder Dusche 15–20 min, danach dehnen – der Muskel ist dann weich.', 'Wärmflasche oder Wärmepflaster auf Nacken, Rücken oder Oberschenkel, 20 min.', 'Sauna 2 × 10–15 min, danach trinken.'],
      nicht: 'Nicht auf Schwellungen, frische Verletzungen (erste 48 h) oder entzündete Stellen; nicht bei Fieber oder Kreislaufproblemen.',
      quelle: 'McGorm et al., Sports Med 2018 · Scoon et al., J Sci Med Sport 2007', wissen: 'sauna' },
    kalt: { name: 'Kaltes Wasser', icon: 'i-drop', dauer: '10–15 min bei 10–15 °C', sek: 0,
      wirkt: 'Kaltes Wasser nach sehr harten Einheiten senkt Muskelkater und Ermüdungsgefühl. Die Kehrseite: Regelmäßig nach Krafttraining bremst es den Muskelaufbau. Daher nur, wenn morgen wieder Leistung gefragt ist.', evidenz: 'mittel',
      wie: ['10–15 min im 10–15 °C kalten Wasser, Beine bis zur Hüfte – kalte Dusche ist die kleine Variante.', 'Für eine akute Reizung: 10–15 min kühlen, mit Tuch dazwischen, mehrmals am Tag.', 'Nicht länger als 15 min, danach warm anziehen.'],
      nicht: 'Nicht nach Kraft- oder Aufbauphasen, in denen die Anpassung zählt; nicht bei Herz-Kreislauf-Problemen oder Raynaud.',
      quelle: 'Dupuy et al., Front Physiol 2018 · Roberts et al., J Physiol 2015 · Bieuzen, Bleakley & Costello, PLoS One 2013', wissen: 'kaltwasser' },
    aktiv: { name: 'Aktive Erholung', icon: 'i-bike', dauer: '20–40 min ganz locker', sek: 0,
      wirkt: 'Lockeres Radfahren, Schwimmen oder Gehen pumpt Blut durch den Muskel, ohne neue Schäden zu setzen – Muskelkater und Schwere lassen schneller nach als auf dem Sofa.', evidenz: 'klein',
      wie: ['20–40 min Rad oder Schwimmen im Plauderpuls, Laufen nur, wenn die Beine nicht wund sind.', 'Hoher Tritt, kleiner Gang, keine Anstiege, keine Spitzen.', 'Danach essen und trinken.'],
      nicht: 'Nicht bei Reizung an Sehne, Knochen oder Gelenk, die unter Belastung weh tut – dann die Sportart wechseln (Schwimmen statt Laufen).',
      quelle: 'Dupuy et al., Front Physiol 2018 · Ortiz et al., J Strength Cond Res 2019', wissen: 'aktive_erholung' },
    kompression: { name: 'Kompression', icon: 'i-shoe', dauer: 'Stunden bis über Nacht', sek: 0,
      wirkt: 'Kompressionsstrümpfe oder -hosen nach der Einheit senken Muskelkater und das Schweregefühl etwas – am ehesten nach langen Läufen und bei Reisen.', evidenz: 'klein',
      wie: ['Nach der Einheit anziehen, mehrere Stunden tragen, bei langen Reisen die ganze Fahrt.', 'Über Nacht nur, wenn sie bequem sind.'],
      nicht: 'Nicht bei Durchblutungsstörungen oder offenen Stellen; während des Laufens kein Leistungseffekt.',
      quelle: 'Hill et al., Br J Sports Med 2014 · Dupuy et al., Front Physiol 2018', wissen: 'kompression' },
    massage: { name: 'Massage', icon: 'i-user', dauer: '20–30 min', sek: 0,
      wirkt: 'Die wirksamste Methode gegen Muskelkater und Ermüdungsgefühl in der großen Meta-Analyse – und sie entspannt. Auf die Leistung am nächsten Tag kleiner Effekt.', evidenz: 'stark',
      wie: ['Nach einem harten Block, in der Entlastungswoche oder zwei, drei Tage vor dem Rennen.', 'Druck angenehm, nicht schmerzhaft; auf Beine und Rücken konzentrieren.'],
      nicht: 'Nicht direkt vor einer harten Einheit und nicht am Vorabend des Rennens als Premiere.',
      quelle: 'Dupuy et al., Front Physiol 2018 · Poppendieck et al., Sports Med 2016', wissen: 'massage' },
    uebungen: { name: 'Übungen', icon: 'i-dumbbell', dauer: '5–10 min', sek: 45, timer: true,
      wirkt: 'Lösende und kräftigende Übungen für die Stelle – das, was in Studien bei Rücken, Hüfte, Knie, Sehnen und Fuß am besten abschneidet: Belastung in der richtigen Dosis, nicht Schonung.', evidenz: 'stark',
      wie: ['Langsam und kontrolliert, Schmerz bis 3 von 10 ist erlaubt, wenn er am nächsten Morgen nicht schlimmer ist.', 'Jeden zweiten Tag, über Wochen – Sehnen und Knochen brauchen Zeit.'],
      nicht: 'Nicht bei Schwellung, Blockade, Taubheit oder Schmerz, der nachts weckt – erst abklären.',
      quelle: 'Rio et al., Br J Sports Med 2015 · Beyer et al., Am J Sports Med 2015 · Steffens et al., JAMA Intern Med 2016 · Gross et al., Cochrane 2015', wissen: 'exzentrisch' },
    schlaf: { name: 'Schlaf & Essen', icon: 'i-moon', dauer: 'heute Abend', sek: 0,
      wirkt: 'Die zwei Hebel, die alles andere schlagen: Im Schlaf werden Muskeln, Sehnen und Knochen repariert; Eiweiß liefert das Material, Kohlenhydrate füllen die Speicher.', evidenz: 'stark',
      wie: ['Heute früher ins Bett – dein Schlafbedarf steht in Dreiklang.', 'In den zwei Stunden nach der Einheit eine Mahlzeit mit Eiweiß und Kohlenhydraten, dein Eiweiß-Ziel über den Tag verteilt.', 'Trinken nach Durst, Alkohol weglassen – er verschlechtert Schlaf und Erholung.'],
      nicht: '',
      quelle: 'Vitale et al., Int J Sports Med 2019 · Moore et al., Am J Clin Nutr 2009 · Milewski et al., J Pediatr Orthop 2014', wissen: 'schlafbedarf' },
    last: { name: 'Last runter', icon: 'i-gauge', dauer: '3–7 Tage', sek: 0,
      wirkt: 'Eine Reizung entsteht, wenn die Last schneller wächst als die Belastbarkeit. Der erste Schritt ist immer: die Sportart, die weh tut, drei bis sieben Tage reduzieren oder tauschen – nicht die Zähne zusammenbeißen.', evidenz: 'stark',
      wie: ['Laufen halbieren oder durch Rad und Schwimmen ersetzen, keine Intervalle, keine Berge.', 'Schmerz-Regel: bis 3 von 10 während der Einheit und am nächsten Morgen nicht schlimmer – sonst weiter runter.', 'Ursache prüfen: Umfangssprung, neue Schuhe, Sattelhöhe, harte Böden, wenig Schlaf.'],
      nicht: 'Nicht mit Schmerzmitteln weitertrainieren.',
      quelle: 'Bertelsen et al., Scand J Med Sci Sports 2017 · Gabbett, Br J Sports Med 2016', wissen: 'laufbudget' },
    flow: { name: 'Pilates & Yoga', icon: 'i-lotus', dauer: '10–20 min', sek: 0,
      wirkt: 'Geführte Einheiten für Rücken, Hüfte, Schultern und Entspannung – Beweglichkeit und Rumpf mit Atmung, in Dreiklang mit Timer und Seitenwechsel.', evidenz: 'mittel',
      wie: ['Unter Training → Pilates & Yoga eine Einheit mit passendem Fokus wählen.', 'Abends oder an Ruhetagen, langsam, mit langer Ausatmung.'],
      nicht: 'Keine Endpositionen in einen stechenden Schmerz hinein.',
      quelle: 'Kloubec, J Strength Cond Res 2010 · Polsgrove et al., Int J Yoga 2016', wissen: 'pilates', ziel: 'training/flow' },
  };
  const EVIDENZ = { stark: 'Wirkung stark', mittel: 'Wirkung mittel', klein: 'Wirkung klein', keine: 'keine Wirkung' };

  /* ---------- Regionen mit Anleitungen je Methode ---------- */
  const DE = (name, wie, sek, seiten) => ({ name, wie, sek: sek || 40, seiten: !!seiten });
  const UE = (name, wie, sek, art, wdh) => ({ name, wie, sek: sek || 45, art: art || 'loesen', wdh: wdh || null });
  const REGION = {
    nacken: { name: 'Nacken', m: ['nacken'], flow: ['nacken', 'schulter'],
      typisch: 'Aero-Position mit dem Blick nach vorn, Schwimmen mit hoch gezogenem Kopf, lange Bildschirmtage.',
      rollen: null, pistole: 'Nur auf die Muskelstränge seitlich am Nacken und oben an den Schultern, nie vorn am Hals, 45 s je Seite.',
      dehnen: [DE('Kopf zur Seite neigen', 'Ohr Richtung Schulter, die andere Hand zieht sanft nach unten, Blick geradeaus – atmen.', 30, true), DE('Kinn zur Brust', 'Hände hinter dem Kopf, nur das Gewicht der Arme, 30 s.', 30)],
      uebungen: [UE('Kinn einziehen (Chin Tucks)', 'Aufrecht sitzen, Kinn gerade nach hinten schieben (Doppelkinn), 3 s halten, 10 ×.', 45, 'kraft', '10'), UE('Schulterkreisen', 'Große, langsame Kreise nach hinten, 10 ×, dann Schulterblätter zusammenziehen, 3 s halten, 10 ×.', 45)],
      warn: 'Nackenschmerz mit Taubheit oder Kribbeln im Arm, nach einem Sturz, mit Fieber oder Nackensteife – ärztlich abklären.',
      wissen: ['aeroposition', 'bikefit', 'schwimmtechnik'] },
    schultern: { name: 'Schultern', m: ['schulter'], flow: ['schulter', 'brust'],
      typisch: 'Der Schwimmzug (vor allem mit Paddles), Stützen auf dem Aero-Lenker, Liegestütze und Überkopf-Übungen.',
      rollen: 'Mit dem Ball an der Wand: Rückseite der Schulter und oberer Rücken, 60 s je Seite.', pistole: 'Hintere Schulter und oberer Rücken, 45 s je Seite – nicht auf das Gelenk, nicht auf das Schlüsselbein.',
      dehnen: [DE('Arm quer vor die Brust', 'Arm auf Schulterhöhe, der andere drückt ihn sanft zur Brust, 30 s.', 30, true), DE('Brustöffner im Türrahmen', 'Unterarme am Rahmen, einen Schritt vor, Brust öffnet, 40 s.', 40)],
      uebungen: [UE('Außenrotation mit Band', 'Ellbogen am Körper, Band nach außen drehen, langsam zurück, 12–15 ×.', 50, 'kraft', '12–15'), UE('Schulterblatt-Liegestütz', 'In Stützposition nur die Schulterblätter zusammen und auseinander, 12 ×.', 45, 'kraft', '12'), UE('Wandengel', 'Rücken an der Wand, Arme als „W“ langsam hoch zum „Y“ und zurück, 10 ×.', 45)],
      warn: 'Nachtschmerz in der Schulter, Kraftverlust beim Heben, Schmerz nach einem Sturz – abklären (Schwimmerschulter wird mit Last und Technik behandelt, nicht mit Weitermachen).',
      wissen: ['schwimmtechnik', 'maximalkraft'] },
    oberer_ruecken: { name: 'Oberer Rücken', m: ['ruecken_oben', 'lat'], flow: ['ruecken', 'bws'],
      typisch: 'Stunden gebeugt auf dem Rad, Schwimmen, Schreibtisch – der Brustwirbelsäule fehlt die Streckung.',
      rollen: 'Rolle quer unter die Schulterblätter, Hände hinter dem Kopf, langsam auf und ab – nicht in den Lendenbereich, 60–90 s.', pistole: 'Links und rechts neben der Wirbelsäule, nie auf die Wirbel, 45 s je Seite.',
      dehnen: [DE('Katze–Kuh', 'Im Vierfüßler den Rücken rund und hohl machen, mit dem Atem, 8 ×.', 45), DE('Kindhaltung', 'Gesäß auf die Fersen, Arme lang nach vorn, Stirn ab, 45 s atmen.', 45), DE('Drehung im Liegen', 'Rückenlage, Knie zur Seite, Arme offen, Blick zur Gegenseite, 40 s.', 40, true)],
      uebungen: [UE('Streckung über der Rolle', 'Rolle quer unter dem oberen Rücken, Hände hinter dem Kopf, über die Rolle strecken, 5 Atemzüge, 3 Stellen.', 60), UE('Rudern mit Band', 'Band vor dir, Ellbogen nach hinten, Schulterblätter zusammen, 15 ×.', 50, 'kraft', '15'), UE('Vierfüßler-Drehung', 'Hand hinter den Kopf, Ellbogen zur Decke drehen, 8 × je Seite.', 45)],
      warn: 'Schmerz zwischen den Schulterblättern mit Atemnot, Brustschmerz oder nach einem Sturz – sofort abklären.',
      wissen: ['aeroposition', 'core'] },
    unterer_ruecken: { name: 'Unterer Rücken', m: ['ruecken_unten'], flow: ['ruecken', 'rumpf', 'huefte'],
      typisch: 'Aero-Position mit gekipptem Becken, kurze Hüftbeuger vom Radfahren und Sitzen, lange Läufe mit müdem Rumpf.',
      rollen: 'Nicht direkt auf die Lendenwirbelsäule – stattdessen Gesäß und Hüftbeuger rollen, die ziehen am Rücken.', pistole: 'Nicht auf die Wirbelsäule; die Muskelstränge daneben nur sanft, 30 s je Seite – Gesäß ist die bessere Stelle.',
      dehnen: [DE('Knie zur Brust', 'Rückenlage, ein Knie zur Brust ziehen, das andere Bein lang, 30 s.', 30, true), DE('Hüftbeuger im Ausfallschritt', 'Knie am Boden, Becken nach vorn schieben, Gesäß anspannen, 40 s.', 40, true), DE('Kindhaltung', 'Gesäß auf die Fersen, Arme lang, 45 s.', 45)],
      uebungen: [UE('Schulterbrücke', 'Rückenlage, Füße aufgestellt, Becken heben, Gesäß anspannen, 2 s halten, 12 ×.', 50, 'kraft', '12'), UE('Bird Dog', 'Vierfüßler, Arm und Gegenbein lang, 3 s halten, 8 × je Seite.', 50, 'kraft', '8 je Seite'), UE('Katze–Kuh', 'Rücken rund und hohl mit dem Atem, 8 ×.', 40)],
      warn: 'Rückenschmerz mit Ausstrahlung ins Bein, Taubheit, Problemen beim Wasserlassen, Fieber oder nach einem Sturz – sofort abklären.',
      wissen: ['core', 'aeroposition', 'bikefit'] },
    brust: { name: 'Brust', m: ['brust'], flow: ['brust', 'schulter'],
      typisch: 'Liegestütze, Bankdrücken, Schwimmen – und die runde Haltung auf dem Rad.',
      rollen: 'Mit dem Ball an der Wand oder am Türrahmen, unterhalb des Schlüsselbeins, 45 s je Seite.', pistole: 'Großer Brustmuskel, nicht auf Rippen oder Schlüsselbein, 45 s je Seite.',
      dehnen: [DE('Brustöffner im Türrahmen', 'Unterarm am Rahmen, Ellbogen auf Schulterhöhe, einen Schritt vor, 40 s.', 40, true)],
      uebungen: [UE('Wandengel', 'Rücken an der Wand, Arme als „W“ hoch zum „Y“, 10 ×.', 45), UE('Rudern mit Band', 'Ellbogen nach hinten, Schulterblätter zusammen, 15 ×.', 50, 'kraft', '15')],
      warn: 'Brustschmerz bei Belastung, Druck, Atemnot oder Ausstrahlung in Arm oder Kiefer – das ist kein Muskel: Notruf.',
      wissen: ['herz_screening'] },
    arme: { name: 'Arme & Unterarme', m: ['bizeps', 'trizeps', 'unterarm'], flow: ['schulter'],
      typisch: 'Schwimmen mit Paddles, fester Griff am Lenker, Klimmzüge, Kraft für den Oberkörper.',
      rollen: 'Unterarme auf der kleinen Rolle oder dem Ball, 45 s je Seite.', pistole: 'Unterarm und Oberarm-Muskelbäuche, nicht die Ellbogen-Innenseite, 30–45 s.',
      dehnen: [DE('Handgelenk-Beuger', 'Arm lang, Handfläche nach oben, die andere Hand zieht die Finger nach unten, 30 s.', 30, true), DE('Handgelenk-Strecker', 'Arm lang, Handrücken oben, die Finger nach unten ziehen, 30 s.', 30, true)],
      uebungen: [UE('Handgelenk-Kreisen', 'Lockere Kreise, Finger spreizen und schließen, 30 s.', 30), UE('Griff lockern', 'Auf dem Rad alle 10 min die Hände wechseln, Finger ausschütteln.', 20)],
      warn: 'Taubheit oder Kribbeln in Fingern (Ulnarisnerv am Lenker), die nicht vergeht – Griffposition ändern, bei Bestehen abklären.',
      wissen: ['aeroposition'] },
    rumpf: { name: 'Bauch & Rumpf', m: ['bauch', 'seite'], flow: ['rumpf'],
      typisch: 'Core-Training, Schwimmen, Seitenstiche, lange Läufe mit müdem Rumpf.',
      rollen: null, pistole: null,
      dehnen: [DE('Kobra', 'Bauchlage, Hände unter den Schultern, Oberkörper sanft heben, Hüfte am Boden, 30 s.', 30), DE('Seitbeuge im Stand', 'Arm über den Kopf, zur Gegenseite neigen, 30 s.', 30, true)],
      uebungen: [UE('Totes Käfer (Dead Bug)', 'Rückenlage, Arme hoch, Knie 90°, Arm und Gegenbein langsam strecken, 8 × je Seite.', 50, 'kraft', '8 je Seite'), UE('Seitstütz', 'Auf dem Unterarm, Hüfte hoch, 20–30 s je Seite.', 30, 'kraft'), UE('Atmung in den Bauch', 'Rückenlage, Hand auf dem Bauch, 4 s ein, 6 s aus, 10 Atemzüge.', 60)],
      warn: 'Bauchschmerz, der mit Übelkeit, Fieber oder Druckschmerz einhergeht, ist kein Muskel – abklären.',
      wissen: ['core', 'atmung'] },
    hueftbeuger: { name: 'Hüftbeuger & Leiste', m: ['adduktoren'], t: ['hueftbeuger'], flow: ['huefte', 'hueftbeuger'],
      typisch: 'Stunden mit gebeugter Hüfte auf dem Rad, Sitzen, Intervalle bergauf – die Hüftbeuger werden kurz, die Leiste zieht.',
      rollen: 'Bauchlage, Rolle unter der Hüftvorderseite (nicht auf dem Beckenknochen), 60 s je Seite; Adduktoren: Bein zur Seite, Rolle innen am Oberschenkel.', pistole: 'Innenseite des Oberschenkels und Hüftvorderseite, nicht in der Leiste selbst (Gefäße, Nerven), 45 s.',
      dehnen: [DE('Hüftbeuger im Ausfallschritt', 'Hinteres Knie am Boden, Becken nach vorn, Gesäß anspannen, Arm hoch, 40 s.', 40, true), DE('Schmetterling', 'Fußsohlen aneinander, Knie sinken, Rücken lang, 40 s.', 40)],
      uebungen: [UE('Schulterbrücke', 'Becken heben, Gesäß anspannen – der Gegenspieler der Hüftbeuger, 12 ×.', 50, 'kraft', '12'), UE('Copenhagen-Stütz (leicht)', 'Seitstütz, oberes Bein auf einer Bank, Hüfte heben, 20 s je Seite – Adduktoren kräftigen.', 25, 'kraft'), UE('Beinpendel', 'An der Wand festhalten, Bein locker vor und zurück schwingen, 15 ×.', 30)],
      warn: 'Leistenschmerz, der beim Gehen, Husten oder nachts bleibt, Schmerz im Beckenknochen oder nach einem Umfangssprung – Knochen-Stressreaktion ausschließen lassen.',
      wissen: ['aeroposition', 'knochen_stress', 'kurbellaenge'] },
    gesaess: { name: 'Gesäß', m: ['gesaess'], flow: ['huefte', 'gesaess'],
      typisch: 'Berge auf dem Rad, Treppen, Hip Thrust, lange Läufe – und der tief sitzende Schmerz vom Piriformis nach viel Sitzen.',
      rollen: 'Auf der Rolle oder dem Ball sitzen, Knöchel auf das andere Knie, zur Seite kippen, 60–90 s je Seite.', pistole: 'Großer Gesäßmuskel und seitlich darüber, 60 s je Seite – nicht auf dem Sitzbein.',
      dehnen: [DE('Vierer-Dehnung', 'Rückenlage, Knöchel auf das andere Knie, das Bein zur Brust ziehen, 40 s.', 40, true), DE('Taube', 'Vorderes Bein angewinkelt vor dem Körper, hinteres lang, Oberkörper nach vorn, 45 s.', 45, true)],
      uebungen: [UE('Schulterbrücke einbeinig', 'Ein Bein lang, Becken heben, 2 s halten, 10 × je Seite.', 50, 'kraft', '10 je Seite'), UE('Muschel (Clam)', 'Seitlage, Knie 90°, oberes Knie öffnen, Füße zusammen, 15 ×.', 40, 'kraft', '15'), UE('Seitliches Beinheben', 'Seitlage, oberes Bein lang heben, Zehen nach vorn, 15 ×.', 40, 'kraft', '15')],
      warn: 'Gesäßschmerz mit Ausstrahlung bis in den Fuß, Taubheit oder Kraftverlust – Nerv statt Muskel, abklären.',
      wissen: ['itbs', 'core'] },
    huefte: { name: 'Hüfte außen & IT-Band', m: ['abduktoren'], flow: ['huefte'],
      typisch: 'Umfangssprünge, bergab laufen, immer dieselbe Straßenseite – Hüftabduktoren schwach, das Band an der Außenseite reizt am Knie.',
      rollen: 'Nicht das Band selbst quälen – die Muskeln davor und dahinter rollen: Oberschenkel-Außenseite, Gesäß und Oberschenkel-Vorderseite, je 60 s, Druck moderat.', pistole: 'Seitliche Hüfte (Muskel über dem Hüftknochen) und Oberschenkel-Außenseite, 45 s – nicht am Knie.',
      dehnen: [DE('IT-Band im Stand', 'Bein hinter das andere kreuzen, Arm über den Kopf, zur Gegenseite neigen, 30 s.', 30, true), DE('Vierer-Dehnung', 'Rückenlage, Knöchel aufs Knie, Bein zur Brust, 40 s.', 40, true)],
      uebungen: [UE('Seitliches Beinheben', 'Seitlage, oberes Bein lang heben, langsam senken, 15 ×.', 45, 'kraft', '15'), UE('Muschel mit Band', 'Seitlage, Band um die Knie, Knie öffnen, 15 ×.', 40, 'kraft', '15'), UE('Einbeiniges Stehen', 'Auf einem Bein, Becken waagerecht halten, 30 s je Seite – vor dem Spiegel.', 30, 'kraft')],
      warn: 'Hüftschmerz tief in der Leiste beim Gehen, nachts oder nach einem Umfangssprung – Knochen und Gelenk abklären lassen.',
      wissen: ['itbs', 'praevention', 'kadenz'] },
    oberschenkel_vorn: { name: 'Oberschenkel vorn', m: ['quad'], flow: ['huefte', 'beweglich'],
      typisch: 'Sweet Spot und Berge auf dem Rad, bergab laufen, Kniebeugen, Koppeltraining – der Muskel, der am meisten Muskelkater kennt.',
      rollen: 'Bauchlage auf der Rolle, Oberschenkel-Vorderseite von oberhalb des Knies bis zur Hüfte, 60–90 s je Seite, dann leicht nach außen kippen.', pistole: 'Vorder- und Außenseite des Oberschenkels, 60 s je Seite – nicht auf die Kniescheibe.',
      dehnen: [DE('Ferse zum Gesäß', 'Im Stand oder in Seitlage die Ferse zum Gesäß ziehen, Knie zeigen nebeneinander, Becken nach vorn, 40 s.', 40, true), DE('Hüftbeuger im Ausfallschritt', 'Hinteres Knie am Boden, Becken nach vorn, 40 s.', 40, true)],
      uebungen: [UE('Kniebeuge leicht', 'Ohne Gewicht, langsam runter (3 s), locker hoch, 12 × – Durchblutung statt Reiz.', 50, 'loesen', '12'), UE('Wandsitz', 'Rücken an der Wand, Knie 90°, 30 s – isometrisch, gut bei vorderem Knieschmerz.', 30, 'kraft'), UE('Ausfallschritt rückwärts', 'Langsam, 10 × je Seite.', 45, 'kraft', '10 je Seite')],
      warn: 'Plötzlicher Stich im Oberschenkel mit Kraftverlust (Zerrung), Schwellung oder Bluterguss – Pause und abklären.',
      wissen: ['muskelkater', 'bergab_laufen', 'koppeltraining'] },
    oberschenkel_hinten: { name: 'Oberschenkel hinten', m: ['beinbeuger'], flow: ['beinrueckseite', 'beweglich'],
      typisch: 'Tempoläufe, Sprints, Bergauf, Kreuzheben – und kurze Hüftbeuger, die den Gegenspieler überlasten.',
      rollen: 'Auf der Rolle sitzen, Oberschenkel-Rückseite vom Knie bis zum Sitzbein, 60–90 s je Seite; andere Bein darauf für mehr Druck.', pistole: 'Rückseite des Oberschenkels, nicht in der Kniekehle, nicht am Sitzbein, 60 s.',
      dehnen: [DE('Bein hoch im Liegen', 'Rückenlage, Bein mit Band oder Handtuch hochziehen, Knie fast gestreckt, 40 s.', 40, true), DE('Vorbeuge im Sitz', 'Ein Bein lang, Rücken lang nach vorn, 40 s.', 40, true)],
      uebungen: [UE('Nordic-Hamstring-Vorstufe', 'Kniend, Fersen fixiert, langsam nach vorn sinken, mit den Händen abfangen, 5 ×.', 45, 'kraft', '5'), UE('Schulterbrücke mit Fersen', 'Fersen weit weg, Becken heben, 12 ×.', 50, 'kraft', '12'), UE('Rumänisches Kreuzheben leicht', 'Hüfte nach hinten, Rücken lang, 10 ×.', 45, 'kraft', '10')],
      warn: 'Plötzlicher Stich beim Sprint mit Kraftverlust (Muskelfaserriss), Bluterguss, Schmerz am Sitzbein, der beim Sitzen bleibt – abklären.',
      wissen: ['muskelkater', 'plyometrie', 'exzentrisch'] },
    knie: { name: 'Knie', t: ['knie'], flow: ['huefte'],
      typisch: 'Vorderer Knieschmerz (Kniescheibe) bei Treppen und Bergab, außen (IT-Band) nach immer gleichen Kilometern, falsche Sattelhöhe auf dem Rad.',
      rollen: 'Nie auf das Knie – die Muskeln drumherum: Oberschenkel vorn, außen und hinten, Waden, je 60 s.', pistole: null,
      dehnen: [DE('Ferse zum Gesäß', 'Oberschenkel-Vorderseite, 40 s.', 40, true), DE('IT-Band im Stand', 'Bein kreuzen, zur Gegenseite neigen, 30 s.', 30, true)],
      uebungen: [UE('Wandsitz (isometrisch)', 'Rücken an der Wand, Knie 60–90°, 5 × 30 s – senkt Sehnenschmerz akut.', 30, 'iso'), UE('Seitliches Beinheben', 'Hüftkraft für die Kniescheiben-Führung, 15 ×.', 45, 'kraft', '15'), UE('Step-down langsam', 'Von einer Stufe mit einem Bein langsam absenken, Knie über dem Fuß, 10 × je Seite.', 50, 'kraft', '10 je Seite'), UE('Spanische Kniebeuge', 'Band hinter den Knien an einem Pfosten, aufrecht in die Hocke, 5 × 30 s – Patellasehne.', 30, 'iso')],
      iso: true,
      warn: 'Schwellung, Blockade, Einknicken, Schmerz nach einem Verdrehen oder Sturz, Schmerz in Ruhe und nachts – ärztlich abklären, nicht rollen.',
      wissen: ['pfps', 'itbs', 'bikefit', 'kadenz'] },
    schienbein: { name: 'Schienbein', m: ['schienbein'], flow: [],
      typisch: 'Laufumfang schnell hoch, harte Böden, neue oder flache Schuhe – Schmerz an der Innenkante (MTSS) oder vorn außen (Schienbeinmuskel).',
      rollen: 'Nur die Muskeln außen neben dem Schienbein und die Wade, nicht die Knochenkante, 45 s.', pistole: 'Schienbeinmuskel außen neben dem Knochen, 30–45 s – nie auf den Knochen.',
      dehnen: [DE('Fußrücken-Dehnung kniend', 'Kniend, Füße gestreckt, Gesäß auf die Fersen, 30 s.', 30), DE('Wade an der Wand', 'Knie gestreckt, Ferse am Boden, 40 s.', 40, true)],
      uebungen: [UE('Zehenheben', 'Fersen am Boden, Zehen hochziehen, 20 ×.', 40, 'kraft', '20'), UE('Wadenheben beidbeinig', 'Langsam hoch, 3 s runter, 15 ×.', 50, 'kraft', '15'), UE('Fersengang', 'Auf den Fersen 30 s gehen.', 30, 'kraft')],
      iso: false,
      warn: 'Punktueller Schmerz an einer Stelle des Knochens (Daumenbreite), der beim Hüpfen auf einem Bein sticht, nachts oder beim Gehen weh tut – Stressreaktion ausschließen lassen, nicht weiterlaufen.',
      wissen: ['mtss', 'knochen_stress', 'laufbudget', 'fussaufsatz'] },
    waden: { name: 'Waden', m: ['waden'], flow: ['beinrueckseite'],
      typisch: 'Laufen nach dem Rad, Vorfuß und Carbonschuhe, Sprünge, Zehenstand beim Radfahren – und der Klassiker für Krämpfe im Rennen.',
      rollen: 'Auf der Rolle sitzen, Wade von der Achillessehne bis zur Kniekehle, Fuß kreisen lassen, 60–90 s je Seite; anderes Bein darauf für mehr Druck.', pistole: 'Wadenbauch innen und außen, 60 s – nicht auf die Achillessehne, nicht in die Kniekehle.',
      dehnen: [DE('Wade mit gestrecktem Knie', 'An der Wand, hinteres Bein lang, Ferse am Boden, 40 s.', 40, true), DE('Wade mit gebeugtem Knie', 'Gleiche Position, hinteres Knie beugen (Soleus), 40 s.', 40, true)],
      uebungen: [UE('Wadenheben langsam', 'Auf einer Stufe, 2 s hoch, 3 s runter, 15 ×, auch mit gebeugtem Knie.', 60, 'kraft', '15'), UE('Fußkreisen', 'Lockere Kreise in beide Richtungen, 30 s.', 30), UE('Krampf-Dehnung', 'Im Krampf: Zehen zum Schienbein ziehen, Knie strecken, halten bis er nachlässt.', 30)],
      warn: 'Plötzlicher Schlag in die Wade (Faserriss), Schwellung mit Wärme und Druckschmerz in der Tiefe (Thrombose ausschließen, besonders nach Reisen) – ärztlich abklären.',
      wissen: ['koppeltraining', 'carbonschuhe', 'muskelkrampf'] },
    achilles: { name: 'Achillessehne', t: ['achilles'], flow: ['beinrueckseite'],
      typisch: 'Tempo und Berge, Schuhwechsel mit flacher Sohle, Vorfußlauf, zu schnell gesteigerter Umfang – Morgensteifigkeit ist das erste Zeichen.',
      rollen: 'Nicht die Sehne – die Wade darüber rollen, 60 s je Seite.', pistole: null,
      dehnen: [DE('Wade mit gestrecktem Knie', 'An der Wand, Ferse am Boden, 40 s – sanft, nicht in den Schmerz.', 40, true)],
      uebungen: [UE('Isometrischer Zehenstand', 'Beidbeinig auf einer Stufe hoch, 5 × 45 s halten – Schmerz lässt akut nach.', 45, 'iso'), UE('Schweres langsames Wadenheben', 'Beidbeinig hoch, einbeinig 3 s runter, 15 ×, alle zwei Tage, über 12 Wochen.', 60, 'kraft', '15'), UE('Exzentrisch nach Alfredson', 'Auf der Stufe einbeinig langsam die Ferse absenken, mit dem anderen Bein hoch, 15 ×, Knie gestreckt und gebeugt.', 60, 'kraft', '15')],
      iso: true,
      warn: 'Plötzlicher Knall mit Kraftverlust (Riss), Schwellung, Schmerz, der auch beim Gehen bleibt – ärztlich abklären. Kein Rollen, keine Pistole auf der Sehne.',
      wissen: ['sehnen', 'exzentrisch', 'fussaufsatz'] },
    fuss: { name: 'Fuß & Fußsohle', t: ['fuss'], flow: [],
      typisch: 'Plantarfaszie (erster Schritt am Morgen), Mittelfuß nach langen Läufen, Barfuß- oder flache Schuhe, viel Stehen.',
      rollen: 'Fußsohle auf einem Ball (Tennis- oder Igelball), langsam von der Ferse zu den Zehen, 60 s je Fuß.', pistole: null,
      dehnen: [DE('Zehen zum Schienbein', 'Im Sitz die Zehen mit der Hand zurückziehen, bis die Sohle zieht, 30 s.', 30, true), DE('Wade an der Wand', 'Knie gestreckt, 40 s.', 40, true)],
      uebungen: [UE('Handtuch greifen', 'Mit den Zehen ein Handtuch heranziehen, 10 ×.', 40, 'kraft', '10'), UE('Zehenstand mit Handtuch', 'Handtuch unter den Zehen, einbeinig 3 s hoch, 2 s halten, 3 s runter, 12 ×, jeden zweiten Tag.', 60, 'kraft', '12'), UE('Kurzer Fuß', 'Im Stand das Fußgewölbe anheben, ohne die Zehen zu krallen, 10 × 5 s.', 45, 'kraft')],
      iso: true,
      warn: 'Punktueller Schmerz am Mittelfußknochen, der beim Gehen bleibt und nachts weh tut, Schwellung auf dem Fußrücken – Stressfraktur ausschließen lassen.',
      wissen: ['plantarfasziitis', 'knochen_stress', 'laufschuhe', 'schuh_rotation'] },
  };
  const REGION_IDS = Object.keys(REGION);
  const MUSKEL_REGION = {}; REGION_IDS.forEach((id) => { (REGION[id].m || []).forEach((m) => { MUSKEL_REGION[m] = id; }); (REGION[id].t || []).forEach((t) => { MUSKEL_REGION['t:' + t] = id; }); });
  const ORT_REGION = { schienbein: 'schienbein', knie: 'knie', achilles: 'achilles', fuss: 'fuss', huefte: 'huefte', ruecken: 'unterer_ruecken', schulter: 'schultern' }; // Check-in → Region

  /* ---------- Zustand speichern (heute) ---------- */
  const W = { wahl: {}, tag: localDate(), offen: null, ok: false }; // wahl: region → zustand; ok: „heute alles gut“ bewusst notiert (Version 24)
  let speicherT = null;
  function laden() {
    const h = localDate();
    const r = A().state.rechner || {}, R = r.regeneration || {}, tage = R.tage || {};
    let aus = null;
    try { aus = JSON.parse(localStorage.getItem('tf:regen')); } catch (e) { aus = null; }
    W.tag = h; W.wahl = {}; W.ok = false;
    (Array.isArray(tage[h]) ? tage[h] : []).forEach((e) => { if (REGION[e.r] && ZUSTAND[e.z]) W.wahl[e.r] = e.z; if (e && e.r === 'ok') W.ok = true; });
    if (aus && aus.tag === h && aus.wahl && !Object.keys(W.wahl).length) Object.entries(aus.wahl).forEach(([k, v]) => { if (REGION[k] && ZUSTAND[v]) W.wahl[k] = v; });
  }
  function speichern() { // sofort in den App-Zustand (damit jedes Neuzeichnen die Wahl kennt), gebündelt zum Server
    try { localStorage.setItem('tf:regen', JSON.stringify({ tag: W.tag, wahl: W.wahl })); } catch (e) { /* egal */ }
    const r = A().state.rechner || {}, R = Object.assign({}, r.regeneration || {}), tage = Object.assign({}, R.tage || {});
    const grenze = iso(toDay(localDate()) - 90 * DAY);
    Object.keys(tage).forEach((k) => { if (k < grenze) delete tage[k]; });
    const liste = Object.entries(W.wahl).map(([rg, z]) => ({ r: rg, z }));
    if (!liste.length && W.ok) liste.push({ r: 'ok' }); // Version 24: „alles gut“ zählt als notiert
    if (liste.length) tage[W.tag] = liste; else delete tage[W.tag];
    R.tage = tage; r.regeneration = R; A().setRechner(r);
    clearTimeout(speicherT);
    speicherT = setTimeout(() => { A().api('POST', '/api/rechner', { regeneration: R }).catch(() => {}); }, 800);
  }
  function verlauf(tageN) { // → [{ tag, r, z }] der letzten n Tage (ohne heute? mit)
    const r = A().state.rechner || {}, tage = (r.regeneration || {}).tage || {}, grenze = iso(toDay(localDate()) - (tageN - 1) * DAY), out = [];
    Object.keys(tage).sort().forEach((t) => { if (t < grenze) return; (tage[t] || []).forEach((e) => { if (REGION[e.r]) out.push({ tag: t, r: e.r, z: ZUSTAND[e.z] ? e.z : 'kater' }); }); });
    return out;
  }

  /* ---------- Körperkarte ---------- */
  let figNr = 0;
  function figur(ansicht, o) {
    const K = window.tfGym && tfGym.koerperDaten; if (!K) return svg('svg', { class: 'tf-gk-svg' });
    const nr = ++figNr, gid = 'tf-rgk-' + nr;
    const s = svg('svg', { viewBox: '24 4 152 428', class: 'tf-gk-svg', 'aria-hidden': 'true', focusable: 'false', 'data-gid': gid, 'data-fig': String(nr) });
    if (tfGym.koerperTiefe) tfGym.koerperTiefe(s, gid); // Version 24: Licht von oben, Bodenschatten
    const spiegel = 'matrix(-1 0 0 1 200 0)';
    const L = svg('g', null, s), R = svg('g', { transform: spiegel }, s), Mi = svg('g', null, s), hL = svg('g', null), hR = svg('g', { transform: spiegel });
    K[ansicht].forEach((t) => {
      const reg = t.t ? MUSKEL_REGION['t:' + t.t] : t.m ? MUSKEL_REGION[t.m] : null;
      (t.mitte ? [Mi] : [L, R]).forEach((g) => {
        if (!reg) { svg('path', { d: t.d, class: 'tf-gk-n', style: tfGym.koerperTiefe ? 'fill:url(#' + gid + '-n)' : null }, g); return; }
        const p = svg('path', { d: t.d, class: 'tf-gk-m tf-rg-m', 'data-r': reg }, g);
        faerben(p, reg, o);
        if (o.klick && (t.klein || t.t)) svg('path', { d: t.d, class: 'tf-gk-hit', 'data-r': reg }, g === R ? hR : hL);
        if (t.linien && g !== R) svg('path', { d: t.linien, class: 'tf-gk-l' }, g);
      });
    });
    if (o.klick) { s.append(hL, hR); s.addEventListener('click', (e) => { const p = e.target.closest('[data-r]'); if (p) o.klick(p.getAttribute('data-r')); }); }
    return s;
  }
  function faerben(p, reg, o) {
    const z = o.wahl && o.wahl[reg], h = o.heat ? o.heat[reg] || 0 : 0;
    p.setAttribute('class', 'tf-gk-m tf-rg-m' + (z ? ' an' : '') + (!z && h ? ' h' + Math.min(3, h) : '') + (o.offen === reg ? ' offen' : ''));
    // Version 24: Zustand mit Licht von oben; neutral ebenso – Häufigkeit (h1–h3) kommt weiter aus dem Stylesheet
    const sv = p.ownerSVGElement, gid = sv && sv.getAttribute('data-gid'), tief = !!(gid && window.tfGym && tfGym.zustandVerlauf);
    p.style.fill = z ? (tief ? tfGym.zustandVerlauf(sv, gid, ZUSTAND[z].farbe) : 'var(--tf-' + ZUSTAND[z].farbe + ')') : !h && tief ? 'url(#' + gid + '-m)' : '';
  }
  function karte(o) {
    return el('div', { class: 'tf-gk ' + (o.cls || 'tf-rg-karte') + (o.klein ? ' tf-gk-klein' : '') + (o.klick ? ' tf-gk-klick' : '') },
      el('figure', null, figur('vorne', o), el('figcaption', { text: 'Vorne' })),
      el('figure', null, figur('hinten', o), el('figcaption', { text: 'Hinten' })));
  }
  function umfaerben(box) { $$('.tf-rg-m', box).forEach((p) => faerben(p, p.getAttribute('data-r'), { wahl: W.wahl, offen: W.offen })); }

  /* ---------- Plan je Region und Zustand ---------- */
  function schritte(reg, z) { // Timer-Schritte: [{ name, sek, text, art }]
    const R = REGION[reg], S = [];
    const dehn = (n, leicht) => (R.dehnen || []).slice(0, n).forEach((d) => { const sek = leicht ? Math.min(30, d.sek) : d.sek; if (d.seiten) { S.push({ name: R.name + ': ' + d.name + ' links', sek, text: d.wie, m: 'dehnen' }); S.push({ name: R.name + ': ' + d.name + ' rechts', sek, text: d.wie, m: 'dehnen' }); } else S.push({ name: R.name + ': ' + d.name, sek, text: d.wie, m: 'dehnen' }); });
    const roll = (sek) => { if (R.rollen && !/^Nicht|^Nie/.test(R.rollen)) S.push({ name: R.name + ' rollen', sek, text: R.rollen, m: 'rollen', seiten: true }); };
    const pist = (sek) => { if (R.pistole && !/^Nicht|^Nie|^Nur/.test(R.pistole)) S.push({ name: R.name + ': Massagepistole', sek, text: R.pistole, m: 'pistole', seiten: true }); };
    const ueb = (art, n) => (R.uebungen || []).filter((u) => !art || u.art === art).slice(0, n).forEach((u) => S.push({ name: u.name, sek: u.sek, text: u.wie, m: 'uebungen' }));
    if (z === 'kater') { roll(90); pist(60); dehn(1, true); }
    else if (z === 'verspannt') { roll(60); dehn(2); ueb('loesen', 1); pist(45); }
    else if (z === 'muede') { roll(60); dehn(1, true); ueb('loesen', 1); }
    else if (z === 'reizung') { if (R.iso) ueb('iso', 1); else ueb('loesen', 1); dehn(1, true); }
    else if (z === 'krampf') { dehn(2); roll(60); ueb('kraft', 1); }
    // Seiten: Rollen und Pistole je Seite
    const out = [];
    S.forEach((s) => { if (s.seiten) { out.push(Object.assign({}, s, { name: s.name + ' links' })); out.push(Object.assign({}, s, { name: s.name + ' rechts' })); } else out.push(s); });
    return out;
  }
  function routinePlan() { // alle gewählten Regionen → Schritte, Dauer
    const S = []; Object.entries(W.wahl).forEach(([r, z]) => S.push(...schritte(r, z)));
    const gesamt = S.reduce((x, s) => x + s.sek, 0);
    return { schritte: S, min: Math.round(gesamt / 60), sek: gesamt };
  }
  function methodenFuer(reg, z) { // sortierte Methoden mit regionsspezifischer Anleitung
    const R = REGION[reg], Z = ZUSTAND[z];
    return Z.methoden.map((m) => {
      const M = METHODE[m]; let txt = null, liste = null, aus = false;
      if (m === 'rollen') { txt = R.rollen; aus = !R.rollen; if (txt && /^Nicht|^Nie/.test(txt) && z === 'reizung') aus = false; }
      else if (m === 'pistole') { txt = R.pistole; aus = !R.pistole || z === 'reizung'; }
      else if (m === 'dehnen') liste = (R.dehnen || []).map((d) => ({ t: d.name + (d.seiten ? ' · je Seite' : ''), s: d.wie + ' (' + d.sek + ' s)' }));
      else if (m === 'uebungen') liste = (R.uebungen || []).filter((u) => z !== 'reizung' || u.art !== 'loesen' || !R.iso).map((u) => ({ t: u.name + (u.wdh ? ' · ' + u.wdh : '') + (u.art === 'iso' ? ' · isometrisch' : u.art === 'kraft' ? ' · Kraft' : ''), s: u.wie }));
      else if (m === 'flow') txt = R.flow && R.flow.length ? 'Passende Einheiten: Fokus ' + R.flow.map((f) => FLOW_NAME[f] || f).join(', ') + ' – unter Training → Pilates & Yoga.' : null;
      return aus ? null : { id: m, M, txt, liste };
    }).filter(Boolean);
  }
  const FLOW_NAME = { nacken: 'Nacken', schulter: 'Schultern', brust: 'Brust', ruecken: 'Rücken', bws: 'Brustwirbelsäule', rumpf: 'Rumpf', huefte: 'Hüfte', hueftbeuger: 'Hüftbeuger', gesaess: 'Gesäß', beinrueckseite: 'Beinrückseite', beweglich: 'Beweglichkeit', entspannung: 'Entspannung' };

  /* ---------- Heute empfohlen (ohne Auswahl) ---------- */
  function gestern() {
    const g = iso(toDay(localDate()) - DAY), B = (rowsOf('belastung') || []).filter((b) => b.date === g && b.sport !== 'wechsel');
    const min = B.reduce((x, b) => x + (+b.min || 0), 0), tss = B.reduce((x, b) => x + (+b.tss || 0), 0), lauf = B.filter((b) => b.sport === 'run').reduce((x, b) => x + (+b.min || 0), 0);
    const bef = (rowsOf('befinden') || []).filter((b) => b.date === localDate())[0] || null;
    return { min, tss, lauf, n: B.length, hart: tss >= 120 || min >= 150, bef };
  }
  function empfehlungHeute() {
    const G = gestern(), out = [];
    if (G.bef && G.bef.schmerz >= 3 && ORT_REGION[G.bef.schmerz_ort]) out.push({ titel: 'Dein Check-in meldet Schmerz: ' + G.bef.ort_txt, text: 'Markiere die Stelle als „Reizung“ – du bekommst sanfte Übungen und die Warnzeichen. Laufen heute nur, wenn es beim Gehen nicht weh tut.', region: ORT_REGION[G.bef.schmerz_ort], z: 'reizung', farbe: 'red' });
    if (G.bef && G.bef.muskeln <= 2) out.push({ titel: 'Muskeln schwer und wund (Check-in)', text: 'Markiere die Beine als „Muskelkater“ oder „Müde“ – lockere Bewegung, Rollen und früh ins Bett sind heute das Training.', region: 'oberschenkel_vorn', z: G.bef.muskeln === 1 ? 'kater' : 'muede', farbe: 'orange' });
    if (G.hart) out.push({ titel: 'Gestern war viel: ' + Math.round(G.min) + ' min' + (G.tss ? ' · ' + Math.round(G.tss) + ' TSS' : ''), text: (G.lauf >= 60 ? 'Nach dem langen Lauf: Waden und Oberschenkel rollen, Kompression, ' : 'Beine rollen, ') + '20–30 min ganz locker bewegen und eine Mahlzeit mit Eiweiß und Kohlenhydraten – das verkürzt den Muskelkater messbar.', region: G.lauf >= 60 ? 'waden' : 'oberschenkel_vorn', z: 'muede', farbe: 'blue' });
    if (!out.length) out.push({ titel: 'Nichts drückt – die beste Erholung heute', text: 'Schlaf nach Bedarf, Eiweiß über den Tag verteilt, ein lockerer Ausgleich und zehn Minuten Rücken und Hüfte lösen – das hält dich im Training, bevor etwas zwickt.', region: null, z: null, farbe: 'green' });
    return out;
  }

  /* ---------- Version 27: Pinsel – erst den Zustand wählen, dann beliebig viele Stellen antippen ----------
     Ein Tipp färbt die Stelle im gewählten Zustand, ein zweiter Tipp im selben Zustand nimmt sie wieder weg, ein Tipp mit einem
     anderen Zustand ändert sie. Alles bleibt an Ort und Stelle – kein Neuzeichnen, die Karte springt nicht. */
  let pinsel = (() => { try { const z = localStorage.getItem('tf:regen-pinsel'); return ZUSTAND[z] ? z : 'kater'; } catch (e) { return 'kater'; } })();
  function pinselLeiste() {
    const box = el('div', { class: 'tf-rg-pinsel', role: 'radiogroup', 'aria-label': 'Zustand zum Markieren' });
    Object.entries(ZUSTAND).forEach(([id, Z]) => {
      const b = el('button', { type: 'button', role: 'radio', 'aria-checked': String(pinsel === id), 'data-z': id, style: '--z:var(--tf-' + Z.farbe + ')' }, el('i', { class: 'tf-rg-dot', 'aria-hidden': 'true' }), el('span', { text: Z.kurz.replace('Muskelkater', 'Muskel\u00adkater') })); // weiches Trennzeichen: bricht nur, wenn es eng wird
      b.addEventListener('click', () => { pinsel = id; try { localStorage.setItem('tf:regen-pinsel', id); } catch (e) { /* egal */ } $$('.tf-rg-pinsel button').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.z === id))); });
      box.appendChild(b);
    });
    return box;
  }
  function tippe(reg) { // → neuer Zustand der Stelle oder null
    if (W.wahl[reg] === pinsel) delete W.wahl[reg]; else W.wahl[reg] = pinsel;
    speichern();
    return W.wahl[reg] || null;
  }
  const puls = (box, reg) => $$('.tf-rg-m[data-r="' + reg + '"]', box).forEach((p) => { p.classList.add('pop'); setTimeout(() => p.classList.remove('pop'), 360); }); // kurze Rückmeldung am Körper
  function markiert(box, nachher) { // die markierten Stellen als Chips: Name öffnet die Stelle, × nimmt sie weg
    box.replaceChildren();
    Object.entries(W.wahl).forEach(([r, z]) => {
      const Z = ZUSTAND[z], t = el('button', { type: 'button', class: 'tf-rg-mk-t' }, el('i', { class: 'tf-rg-dot', 'aria-hidden': 'true' }), el('b', { text: REGION[r].name }), el('small', { text: Z.kurz }));
      const x = el('button', { type: 'button', class: 'tf-rg-mk-x', 'aria-label': REGION[r].name + ' entfernen' }, svgIco('i-x'));
      t.addEventListener('click', () => T.geh('training/regeneration/' + r));
      x.addEventListener('click', () => { delete W.wahl[r]; speichern(); nachher(); });
      box.appendChild(el('span', { class: 'tf-rg-mk', 'data-r': r, style: '--z:var(--tf-' + Z.farbe + ')' }, t, x));
    });
  }

  /* ---------- Darstellung: Hub ---------- */
  function karteTeil() {
    const c = kart({ id: 'karte-regen', cls: 'tf-rg-wahl', farbe: 'teal', icon: 'i-body', titel: 'Wie fühlt sich dein Körper an?', sub: 'Zustand wählen, dann jede Stelle antippen – so viele du willst' });
    const listeBox = el('div', { class: 'tf-rg-mks', id: 'regen-liste', 'aria-live': 'polite' }), fuss = el('div', { class: 'tf-rg-fuss' });
    const aktual = () => { umfaerben(c); markiert(listeBox, aktual); zeichneFuss(); planNeu(); };
    const zeichneFuss = () => {
      fuss.replaceChildren();
      if (!Object.keys(W.wahl).length) { fuss.appendChild(el('p', { class: 'tf-note', text: 'Zum Beispiel Waden und Oberschenkel nach dem langen Lauf, Nacken nach dem Zeitfahrrad. Noch einmal antippen nimmt die Stelle weg.' })); return; }
      const leer = el('button', { type: 'button', class: 'tf-link-btn tf-rg-leer' }, 'Heute alles gut – Auswahl leeren');
      leer.addEventListener('click', () => { W.wahl = {}; W.ok = true; speichern(); aktual(); });
      fuss.append(el('p', { class: 'tf-note tf-rg-gespeichert', text: 'Für heute notiert – bleibt im Verlauf.' }), leer);
    };
    c.append(pinselLeiste(), el('div', { class: 'tf-rg-kartenbox' }, karte({ wahl: W.wahl, klick: (reg) => { tippe(reg); aktual(); puls(c, reg); } })), listeBox, fuss);
    markiert(listeBox, aktual); zeichneFuss();
    return c;
  }
  function planNeu() { const alt = $('#karte-regen-plan'); const neu = planTeil(); if (alt) { if (neu) alt.replaceWith(neu); else alt.remove(); } else if (neu) { const k = $('#karte-regen'); if (k) k.after(neu); } const h = $('#karte-regen-heute'); if (h) h.hidden = !!Object.keys(W.wahl).length; }
  function methodeZeile(m, M, txt, liste, offen) {
    const d = el('details', { class: 'tf-rg-methode', open: offen ? '' : null });
    const sum = el('summary', null, el('span', { class: 'tf-rg-mi' }, svgIco(M.icon)), el('span', { class: 'tf-rg-mt' }, el('b', { text: M.name }), el('small', { text: M.dauer + ' · ' + EVIDENZ[M.evidenz] })), svgIco('i-chev'));
    d.appendChild(sum);
    const body = el('div', { class: 'tf-rg-mbody' });
    if (txt) body.appendChild(el('p', { class: 'tf-rg-hier', text: txt }));
    if (liste && liste.length) body.appendChild(el('ul', { class: 'tf-rg-ul' }, ...liste.map((x) => el('li', null, el('b', { text: x.t }), ' – ', x.s))));
    body.appendChild(el('p', { class: 'tf-rg-wirkt', text: M.wirkt }));
    if (!txt && !liste) body.appendChild(el('ul', { class: 'tf-rg-ul' }, ...M.wie.map((w) => el('li', { text: w }))));
    if (M.nicht) body.appendChild(el('p', { class: 'tf-rg-nicht' }, svgIco('i-warn'), ' ', M.nicht));
    const fuss = el('p', { class: 'tf-rg-quelle' }, el('span', { text: M.quelle }));
    if (M.wissen && window.tfWissen && tfWissen.begriff(M.wissen)) { const b = el('button', { type: 'button', class: 'tf-link-btn' }, 'Im Wissen'); b.addEventListener('click', () => T.geh('wissen/' + M.wissen)); fuss.append(' · ', b); }
    if (M.ziel) { const b = el('button', { type: 'button', class: 'tf-link-btn' }, 'Öffnen'); b.addEventListener('click', () => T.geh(M.ziel)); fuss.append(' · ', b); }
    body.appendChild(fuss);
    d.appendChild(body);
    return d;
  }
  function planTeil() {
    const E = Object.entries(W.wahl); if (!E.length) return null;
    const P = routinePlan();
    const c = kart({ id: 'karte-regen-plan', cls: 'tf-rg-plan', farbe: 'teal', icon: 'i-feder', titel: 'Dein Plan für heute', sub: E.map(([r, z]) => REGION[r].name + ' (' + ZUSTAND[z].satz + ')').join(' · ') });
    if (P.schritte.length) {
      const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-rg-los' }, svgIco('i-play'), ' Routine starten', el('small', { class: 'num', text: P.min + ' min · ' + P.schritte.length + ' Schritte' }));
      los.addEventListener('click', () => T.geh('training/regeneration/routine'));
      c.appendChild(el('div', { class: 'tf-rg-losbox' }, los, el('small', { class: 'tf-note', text: 'Mit Timer, Schritt für Schritt – Rollen, Dehnen, Übungen für die markierten Stellen.' })));
    }
    E.forEach(([r, z]) => {
      const R = REGION[r], Z = ZUSTAND[z];
      const sek = el('section', { class: 'tf-rg-sek', style: '--z:var(--tf-' + Z.farbe + ')' });
      sek.append(el('h3', null, el('i', { class: 'tf-rg-dot', 'aria-hidden': 'true' }), R.name, el('small', { text: Z.name })), el('p', { class: 'tf-rg-was', text: Z.was }));
      if (z === 'reizung' && R.warn) sek.appendChild(el('p', { class: 'tf-held-warn tf-rg-warn' }, svgIco('i-warn'), el('span', { text: R.warn })));
      methodenFuer(r, z).forEach((x, i) => sek.appendChild(methodeZeile(x.id, x.M, x.txt, x.liste, i === 0)));
      c.appendChild(sek);
    });
    c.appendChild(el('p', { class: 'tf-note tf-bleibt', text: 'Reihenfolge nach Studienlage für diesen Zustand. Dreiklang stellt keine Diagnose – bei Warnzeichen zuerst ärztlich abklären.' }));
    return c;
  }
  function heuteTeil() {
    const c = kart({ id: 'karte-regen-heute', cls: 'tf-rg-heute', farbe: 'green', icon: 'i-spark', titel: 'Heute empfohlen', sub: 'Aus gestern und deinem Check-in' });
    c.hidden = !!Object.keys(W.wahl).length;
    empfehlungHeute().forEach((e) => {
      const row = el('div', { class: 'tf-rg-emp', style: '--z:var(--tf-' + e.farbe + ')' }, el('i', { class: 'tf-rg-dot', 'aria-hidden': 'true' }), el('div', null, el('b', { text: e.titel }), el('p', { text: e.text })));
      if (e.region) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, REGION[e.region].name + ' als ' + ZUSTAND[e.z].satz + ' markieren'); b.addEventListener('click', () => { W.wahl[e.region] = e.z; W.offen = null; speichern(); render(); }); row.querySelector('div').appendChild(b); }
      c.appendChild(row);
    });
    return c;
  }
  const WIRKT = [['Massage', 'stark', 3], ['Kompression', 'mittel', 2], ['Kaltes Wasser', 'mittel', 2], ['Kontrastbad', 'mittel', 2], ['Aktive Erholung', 'klein', 1], ['Foam Rolling', 'klein', 1], ['Dehnen', 'keine', 0], ['Kältekammer', 'keine', 0]];
  function wirktTeil() {
    const c = kart({ cls: 'tf-rg-wirkt', farbe: 'teal', icon: 'i-bars', titel: 'Was gegen Muskelkater wirkt', sub: 'Meta-Analyse über 99 Studien – Effekt auf Muskelkater und Ermüdungsgefühl' });
    const ul = el('div', { class: 'tf-rg-rang' });
    WIRKT.forEach(([n, ev, st]) => ul.appendChild(el('div', { class: 'tf-rg-rz' }, el('span', { text: n }), el('span', { class: 'tf-rg-stufe', 'aria-label': EVIDENZ[ev] }, ...[1, 2, 3].map((i) => el('i', { class: i <= st ? 'an' : '' }))), el('small', { text: EVIDENZ[ev] }))));
    c.append(ul, el('p', { class: 'tf-note', text: 'Schlaf und Essen stehen über allem – sie sind keine „Methode“, sondern die Grundlage. Kaltes Wasser nur, wenn morgen Leistung zählt; in Aufbauphasen bremst es die Anpassung.' }), el('p', { class: 'tf-rg-quelle', text: 'Dupuy et al., Front Physiol 2018 · Roberts et al., J Physiol 2015' }));
    return c;
  }
  function arztTeil() {
    const c = kart({ cls: 'tf-rg-arzt', farbe: 'red', icon: 'i-cross', titel: 'Wann zur Ärztin statt zur Rolle', sub: 'Diese Zeichen klärt Dreiklang nicht – sie gehören in eine Praxis' });
    c.appendChild(el('ul', { class: 'tf-rg-ul' }, ...['Schmerz, der nachts weckt oder in Ruhe bleibt', 'Punktueller Druckschmerz auf einem Knochen (Schienbein, Mittelfuß, Becken) – Stressreaktion', 'Schwellung, Wärme, Rötung oder ein Gelenk, das blockiert oder einknickt', 'Taubheit, Kribbeln oder Kraftverlust', 'Plötzlicher Knall oder Stich mit sofortigem Kraftverlust (Riss)', 'Schmerz nach Sturz oder Unfall', 'Wadenschwellung mit Druckschmerz in der Tiefe, besonders nach Reisen (Thrombose)', 'Brustschmerz, Atemnot, Herzrasen, Schwindel bei Belastung – Notruf'].map((t) => el('li', { text: t }))));
    c.appendChild(el('p', { class: 'tf-note', text: 'Schmerz bis 3 von 10, der am nächsten Morgen nicht schlimmer ist, darf mit angepasster Last trainiert werden. Alles darüber: Last runter, nach einer Woche ohne Besserung abklären.' }));
    return c;
  }
  function verlaufTeil() {
    const V = verlauf(28); if (!V.length) return null;
    const je = {}; V.forEach((e) => { je[e.r] = (je[e.r] || 0) + 1; });
    const tage = new Set(V.map((e) => e.tag)).size;
    const c = kart({ cls: 'tf-rg-verlauf', farbe: 'teal', icon: 'i-cal', titel: 'Dein Verlauf', sub: '28 Tage · ' + tage + (tage === 1 ? ' Tag' : ' Tage') + ' mit Einträgen' });
    const heat = {}; Object.entries(je).forEach(([r, n]) => { heat[r] = n >= 4 ? 3 : n >= 2 ? 2 : 1; });
    const top = Object.entries(je).sort((a, b) => b[1] - a[1]).slice(0, 5);
    c.appendChild(el('div', { class: 'tf-rg-vgrid' }, karte({ heat, klein: true }), el('div', { class: 'tf-rg-vliste' }, ...top.map(([r, n]) => { const b = el('button', { type: 'button', class: 'tf-rg-vz' }, el('b', { text: REGION[r].name }), el('span', { class: 'num', text: n + ' ×' })); b.addEventListener('click', () => T.geh('training/regeneration/' + r)); return b; }))));
    const haeufig = top.filter(([, n]) => n >= 3);
    if (haeufig.length) {
      const [r] = haeufig[0], R = REGION[r];
      const hinweis = el('p', { class: 'tf-note tf-rg-hinweis' }, svgIco('i-info'), ' ', R.name + ' taucht in vier Wochen ' + je[r] + '-mal auf. Das ist kein Zufall mehr: Umfang, Material oder Position prüfen' + (R.wissen && R.wissen.length ? ' – im Wissen: ' : '.'));
      if (R.wissen && R.wissen.length) R.wissen.slice(0, 2).forEach((w, i) => { const B = window.tfWissen && tfWissen.begriff(w); if (!B) return; const b = el('button', { type: 'button', class: 'tf-link-btn' }, B.name); b.addEventListener('click', () => T.geh('wissen/' + w)); hinweis.append(i ? ', ' : '', b); });
      c.appendChild(hinweis);
    }
    return c;
  }
  function wissenTeil() {
    const c = kart({ cls: 'tf-rg-wissen', farbe: 'gold', icon: 'i-book', titel: 'Wissen dazu', sub: 'Studien hinter den Methoden' });
    const L = [['massage', 'Massage'], ['massagepistole', 'Massagepistole'], ['foam_rolling', 'Foam Rolling'], ['dehnen', 'Dehnen'], ['kaltwasser', 'Kaltes Wasser'], ['kompression', 'Kompression'], ['sauna', 'Sauna'], ['exzentrisch', 'Exzentrisches Training'], ['schlaf_verletzung', 'Schlaf & Verletzungen'], ['muskelkater', 'Muskelkater'], ['aktive_erholung', 'Aktive Erholung'], ['muskelkrampf', 'Muskelkrämpfe']];
    c.appendChild(el('div', { class: 'tf-links' }, ...L.filter(([id]) => window.tfWissen && tfWissen.begriff(id)).map(([id, n]) => { const b = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-t' }, el('b', { text: n })), svgIco('i-chev')); b.addEventListener('click', () => T.geh('wissen/' + id)); return b; })));
    return c;
  }
  /* ---------- Version 24: Körper-Check auf Heute – abends zuerst, bis er notiert ist ---------- */
  function notiert() { laden(); return W.ok || !!Object.keys(W.wahl).length; }
  function heuteKarte() {
    const box = $('#home-koerper'); if (!box) return;
    if (!window.tfGym || !tfGym.koerperDaten) { box.replaceChildren(); return; }
    laden();
    const abend = (window.tfStart && tfStart.tageszeit ? tfStart.tageszeit() : 'tag') === 'abend';
    const c = el('article', { class: 'tf-card tf-kc', id: 'karte-koerper' });
    const kT = el('h2'), kS = el('div', { class: 'tf-sub' }), okI = el('span', { class: 'tf-kc-ok', 'aria-label': 'notiert' }, svgIco('i-check'));
    c.appendChild(el('div', { class: 'tf-card-head' }, el('span', { class: 'tf-badge', style: '--c:var(--tf-teal)' }, svgIco('i-body')), el('div', null, kT, kS), okI));
    const kartenBox = el('div', { class: 'tf-kc-karte' }), liste = el('div', { class: 'tf-rg-mks tf-kc-mks', 'aria-live': 'polite' }), aktionen = el('div', { class: 'tf-kc-aktionen' });
    const note = el('p', { class: 'tf-note', text: 'Gutes Training braucht gute Erholung: Was du abends notierst, bekommt morgen Rollen, Dehnen und Übungen – und zeigt im Verlauf, wo es sich häuft.' });
    // Version 27: alles an Ort und Stelle aktualisieren – mehrere Stellen hintereinander antippen, ohne dass die Karte springt
    const aktual = (erstes) => {
      const fertig = W.ok || !!Object.keys(W.wahl).length, E = Object.entries(W.wahl);
      c.classList.toggle('tf-jetzt', abend && !fertig); c.classList.toggle('tf-kc-fertig', fertig); okI.hidden = !fertig;
      kT.textContent = fertig ? (E.length ? 'Körper notiert' : 'Heute alles gut') : 'Wie fühlt sich dein Körper an?';
      kS.textContent = fertig ? (E.length ? E.length + (E.length === 1 ? ' Stelle' : ' Stellen') + ' · Plan für morgen steht' : 'Nichts drückt – auch das steht im Verlauf') : abend ? 'Dein Abend-Check: Zustand wählen, dann antippen, wo es zwickt' : 'Zustand wählen, dann antippen, wo es zwickt – mehrere gehen';
      umfaerben(c); markiert(liste, () => aktual()); aktionen.replaceChildren(); note.hidden = fertig;
      if (E.length) {
        const P = routinePlan();
        if (P.schritte.length) { const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-play'), ' Relief-Routine', el('small', { class: 'tnum', text: P.min + ' min' })); los.addEventListener('click', () => T.geh('training/regeneration/routine')); aktionen.appendChild(los); }
        const mehr = el('button', { type: 'button', class: 'tf-btn' }, 'Plan ansehen'); mehr.addEventListener('click', () => T.geh('training/regeneration')); aktionen.appendChild(mehr);
      } else if (!fertig) {
        const gut = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-check'), ' Heute alles gut'); gut.addEventListener('click', () => { W.ok = true; speichern(); aktual(); if (A().toast) A().toast('Notiert – gute Erholung'); }); aktionen.appendChild(gut);
        const mehr = el('button', { type: 'button', class: 'tf-btn' }, 'Regeneration'); mehr.addEventListener('click', () => T.geh('training/regeneration')); aktionen.appendChild(mehr);
      } else { const mehr = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Verlauf'); mehr.addEventListener('click', () => T.geh('training/regeneration')); aktionen.appendChild(mehr); }
      if (!erstes && window.tfTageslauf && tfTageslauf.abendNeu) { try { tfTageslauf.abendNeu(); } catch (e) { console.error(e); } } // Checkliste „Körper-Check notiert“ zieht mit
    };
    kartenBox.appendChild(karte({ wahl: W.wahl, cls: 'tf-kc-figur', klick: (reg) => { tippe(reg); aktual(); puls(c, reg); } })); // eigene Klasse: die Karte auf Heute bleibt im DOM, wenn die Regenerationsseite offen ist
    c.append(pinselLeiste(), kartenBox, liste, aktionen, note);
    aktual(true);
    box.replaceChildren(c);
  }
  T.zusatz('heute', () => { try { heuteKarte(); } catch (e) { console.error(e); } });
  function renderHub(box) {
    const frag = [karteTeil()];
    const p = planTeil(); if (p) frag.push(p);
    frag.push(heuteTeil());
    const v = verlaufTeil(); if (v) frag.push(v);
    frag.push(wirktTeil(), arztTeil(), wissenTeil());
    box.replaceChildren(el('div', { class: 'tf-hub tf-rg' }, ...frag));
  }

  /* ---------- Darstellung: Region im Detail ---------- */
  function renderRegion(box, reg) {
    const R = REGION[reg];
    const frag = [];
    const kopf = kart({ cls: 'tf-rg-rkopf', farbe: 'teal', icon: 'i-body', titel: 'Woher es meist kommt', sub: R.name + ' im Triathlon' });
    kopf.append(el('div', { class: 'tf-rg-rgrid' }, karte({ wahl: { [reg]: W.wahl[reg] || 'verspannt' }, klein: true }), el('p', { class: 'tf-rg-typisch', text: R.typisch })));
    const chips = el('div', { class: 'tf-chipset tf-rg-chips', role: 'group', 'aria-label': 'Zustand heute' });
    Object.entries(ZUSTAND).forEach(([id, Z]) => { const b = el('button', { type: 'button', 'aria-pressed': String(W.wahl[reg] === id), style: '--z:var(--tf-' + Z.farbe + ')' }, el('i', { class: 'tf-rg-dot', 'aria-hidden': 'true' }), Z.kurz); b.addEventListener('click', () => { if (W.wahl[reg] === id) delete W.wahl[reg]; else W.wahl[reg] = id; speichern(); render(); }); chips.appendChild(b); });
    kopf.append(el('p', { class: 'tf-rg-heutehier', text: 'Heute hier' }), chips);
    if (W.wahl[reg]) { const b = el('button', { type: 'button', class: 'tf-btn tf-btn-klein' }, 'Zum Plan für heute'); b.addEventListener('click', () => T.geh('training/regeneration')); kopf.appendChild(el('div', { class: 'tf-rg-losbox' }, b)); }
    frag.push(kopf);
    if (R.warn) { const wk = kart({ cls: 'tf-rg-warnkarte', farbe: 'red', icon: 'i-warn', titel: 'Warnzeichen', sub: 'Dann nicht rollen, sondern abklären' }); wk.appendChild(el('p', { class: 'tf-held-warn tf-rg-warn' }, svgIco('i-warn'), el('span', { text: R.warn }))); frag.push(wk); }
    const z = W.wahl[reg] || 'verspannt';
    const mk = kart({ cls: 'tf-rg-plan', farbe: 'teal', icon: 'i-feder', titel: 'Was hilft', sub: 'Für „' + ZUSTAND[z].name + '“ – andere Zustände oben wählen' });
    const sek = el('section', { class: 'tf-rg-sek', style: '--z:var(--tf-' + ZUSTAND[z].farbe + ')' });
    sek.appendChild(el('p', { class: 'tf-rg-was', text: ZUSTAND[z].was }));
    methodenFuer(reg, z).forEach((x, i) => sek.appendChild(methodeZeile(x.id, x.M, x.txt, x.liste, i < 2)));
    mk.appendChild(sek); frag.push(mk);
    // alle Übungen der Region
    if (R.uebungen && R.uebungen.length) {
      const u = kart({ farbe: 'purple', icon: 'i-dumbbell', titel: 'Übungen für ' + R.name, sub: 'Lösen, kräftigen, isometrisch halten' });
      u.appendChild(el('div', { class: 'tf-rg-ueb' }, ...R.uebungen.map((x) => el('div', { class: 'tf-rg-uz' }, el('span', { class: 'tf-rg-ua ' + x.art, text: x.art === 'iso' ? 'Isometrisch' : x.art === 'kraft' ? 'Kraft' : 'Lösen' }), el('div', null, el('b', { text: x.name + (x.wdh ? ' · ' + x.wdh : '') }), el('p', { text: x.wie }))))));
      frag.push(u);
    }
    if (R.wissen && R.wissen.length && window.tfWissen) {
      const w = kart({ farbe: 'gold', icon: 'i-book', titel: 'Wissen dazu', sub: 'Begriffe mit Studie' });
      w.appendChild(el('div', { class: 'tf-links' }, ...R.wissen.map((id) => { const B = tfWissen.begriff(id); if (!B) return null; const b = el('button', { type: 'button', class: 'tf-zeile' }, el('span', { class: 'tf-zeile-t' }, el('b', { text: B.name }), el('small', { text: B.kurz })), svgIco('i-chev')); b.addEventListener('click', () => T.geh('wissen/' + id)); return b; }).filter(Boolean)));
      frag.push(w);
    }
    box.replaceChildren(el('div', { class: 'tf-hub tf-rg' }, ...frag));
  }

  /* ---------- Darstellung: Routine mit Timer ---------- */
  let poll = null;
  function renderRoutine(box) {
    const P = routinePlan();
    if (!P.schritte.length) { T.geh('training/regeneration', { ersetzen: true }); return; }
    const c = kart({ cls: 'tf-rg-routine', farbe: 'teal', icon: 'i-timer', titel: 'Relief-Routine', sub: P.min + ' min · ' + P.schritte.length + ' Schritte · ' + Object.entries(W.wahl).map(([r, z]) => REGION[r].name + ' (' + ZUSTAND[z].satz + ')').join(' · ') });
    const liste = el('ol', { class: 'tf-rg-schritte' });
    P.schritte.forEach((s, i) => liste.appendChild(el('li', { 'data-i': String(i) }, el('span', { class: 'tf-rg-sn num', text: String(i + 1) }), el('div', null, el('b', { text: s.name }), el('p', { text: s.text })), el('span', { class: 'tf-rg-ssek num', text: s.sek + ' s' }))));
    const laeuft = window.tfTimer && tfTimer.laeuft() && tfTimer.zustand() && tfTimer.zustand().titel === 'Relief-Routine';
    const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-play'), ' Starten');
    const status = el('p', { class: 'tf-rg-laeuft' }, el('i', { class: 'tf-rg-live', 'aria-hidden': 'true' }), 'Läuft – der Timer unten führt dich durch, Ton und Vibration beim Wechsel');
    los.hidden = !!laeuft; status.hidden = !laeuft;
    los.addEventListener('click', () => {
      if (!window.tfTimer) return;
      tfTimer.start({ titel: 'Relief-Routine', sub: 'Regeneration', farbe: 'teal', phasen: P.schritte.map((s) => ({ name: s.name, sek: s.sek, art: 'arbeit' })), beimEnde: () => { markiere(-1); const f = $('#regen-fertig'); if (f) f.hidden = false; los.hidden = false; status.hidden = true; } });
      los.hidden = true; status.hidden = false; markiere(0);
    });
    const fertig = el('p', { class: 'tf-note tf-rg-fertigtext', id: 'regen-fertig', text: 'Fertig – gut gemacht. Trink etwas, und heute Abend zählt der Schlaf.' }); fertig.hidden = true;
    c.append(el('div', { class: 'tf-rg-losbox' }, los, status, el('small', { class: 'tf-note', text: 'Der Timer läuft unten weiter, auch wenn du die Seite wechselst.' })), liste, fertig);
    box.replaceChildren(el('div', { class: 'tf-hub tf-rg' }, c));
    clearInterval(poll); poll = setInterval(() => {
      if (!window.tfTimer || T.route() !== 'training/regeneration/routine') { clearInterval(poll); return; }
      const z = tfTimer.zustand(); if (!z || z.titel !== 'Relief-Routine') return;
      const i = P.schritte.findIndex((s) => s.name === z.name); if (i >= 0) markiere(i, z);
    }, 500);
  }
  function markiere(i, z) {
    $$('.tf-rg-schritte li').forEach((li) => { const k = +li.dataset.i; li.classList.toggle('jetzt', k === i); li.classList.toggle('vorbei', i >= 0 && k < i); const s = li.querySelector('.tf-rg-ssek'); if (s && k === i && z) s.textContent = Math.ceil(z.rest / 1000) + ' s'; });
  }

  function render() {
    const box = $('#regeneration-box'); if (!box) return;
    laden();
    const r = T.route(), info = T.routeInfo(r) || {};
    if (r === 'training/regeneration/routine') renderRoutine(box);
    else if (info.region) renderRegion(box, info.region);
    else renderHub(box);
  }
  function kurz() { // für den Training-Hub
    laden();
    const n = Object.keys(W.wahl).length, G = gestern();
    if (n) return { wert: n === 1 ? REGION[Object.keys(W.wahl)[0]].name : n + ' Stellen', sub: n === 1 ? ZUSTAND[W.wahl[Object.keys(W.wahl)[0]]].name + ' · Plan bereit' : 'markiert · Plan bereit' };
    if (W.ok) return { wert: 'Alles gut', sub: 'Heute notiert – nichts drückt' };
    const abend = (window.tfStart && tfStart.tageszeit ? tfStart.tageszeit() : 'tag') === 'abend';
    if (abend) return { wert: 'Heute offen', sub: 'Abend-Check: Stelle antippen oder „alles gut“', offen: true }; // Version 24
    if (G.hart) return { wert: 'Lockern', sub: 'Gestern ' + Math.round(G.min) + ' min – heute rollen und locker bewegen' };
    return null;
  }
  T.seite('regeneration', render);
  T.routen('training/regeneration', (id) => (REGION[id] ? { seite: 'regeneration', titel: REGION[id].name, sub: 'Regeneration', eltern: 'training/regeneration', region: id } : null));
  window.tfRegeneration = { REGION, ZUSTAND, METHODE, schritte, routinePlan, methodenFuer, kurz, wahl: () => (laden(), Object.assign({}, W.wahl)), verlauf, karte, render, notiert, heuteKarte };
})();
