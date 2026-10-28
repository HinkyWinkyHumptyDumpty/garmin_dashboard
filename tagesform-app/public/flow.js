/* Tagesform · Pilates & Yoga: Anlass oder Fokus wählen → fertige Einheit mit Anleitung → geführt mit Timer und Atemhilfe.
   Grundlagen: Kloubec 2010 (Pilates: Ausdauer der Bauchmuskeln, Beweglichkeit), Yamato et al. 2015 und Wieland et al. 2022
   (Cochrane: Pilates und Yoga bei Rückenschmerzen), Pascoe et al. 2017 (Yoga und Stressmarker), Zaccaro et al. 2018 (langsames
   Atmen), Thomas et al. 2018 (Dehndauer pro Woche), Behm et al. 2016 (Dehnen vor dem Sport), Sherrington et al. 2019
   (Gleichgewicht und Stürze), Polsgrove et al. 2016 (Yoga bei Sportlern), Wang et al. 2020 (Yoga und Schlaf). */
(function () {
  'use strict';
  const T = window.tfApp, S = window.tfSeiten;
  if (!T || !S) return;
  const { $, $$, el, svg, iso, toDay, localDate, DAY, rowsOf, heute, svgIco } = T.ui;
  const { karte, dot } = S;
  const A = () => dash.app;

  const FOKUS = { ganz: 'Ganzkörper', rumpf: 'Rumpf', ruecken: 'Rücken', huefte: 'Hüfte', schulter: 'Schultern & Nacken', beweglich: 'Beweglichkeit', entspannung: 'Entspannung', balance: 'Gleichgewicht' };
  const STIL = {
    pilates: ['Pilates', 'Kontrollierte Übungen für die tiefe Rumpfmuskulatur – kräftigt und stabilisiert.'],
    yoga: ['Yoga', 'Haltungen im Rhythmus der Atmung – für Beweglichkeit, Gleichgewicht und Ruhe.'],
    mix: ['Mix', 'Erst kräftigen wie im Pilates, dann dehnen und entspannen wie im Yoga.'],
  };
  const DAUER = [10, 20, 30, 45];
  const NIVEAU = [['einsteiger', 'Neu dabei'], ['fortgeschritten', 'Geübt'], ['profi', 'Erfahren']];
  const PHASEN = [['ankommen', 'Ankommen'], ['warm', 'Aufwärmen'], ['haupt', 'Hauptteil'], ['aus', 'Ausklang']];
  // Reihenfolge der Positionen: im Yoga vom Stehen zum Liegen, im Pilates klassisch aus der Rückenlage heraus
  const LAGE = { yoga: ['stehen', 'vierf', 'bauch', 'sitzen', 'seite', 'ruecken'], pilates: ['ruecken', 'seite', 'sitzen', 'bauch', 'vierf', 'stehen'] };

  /* ---------- Übungen ----------
     stil: pilates | yoga | beide · fokus: Schwerpunkte · tags: Körperstellen (für Anlässe) · phase: warm | haupt | aus
     stufe 1–3 · zeit: Sekunden (je Seite bei seiten) · wdh: Wiederholungen statt Haltezeit · lage: Ausgangsposition
     atemF: mit Atemhilfe im geführten Modus */
  const L = [
    // Pilates
    { id: 'atmung_pil', name: 'Pilates-Atmung', stil: 'pilates', fokus: ['rumpf', 'entspannung'], tags: [], phase: ['ankommen'], stufe: 1, zeit: 60, lage: 'ruecken', atemF: true,
      schritte: ['Rückenlage, Knie gebeugt, Füße hüftbreit am Boden. Die Hände liegen seitlich an den unteren Rippen.', 'Durch die Nase einatmen: Die Rippen weiten sich zur Seite in deine Hände.', 'Durch den Mund ausatmen: Der Bauch zieht sanft nach innen, als würdest du einen Gürtel ein Loch enger schnallen.'],
      atem: 'Etwa 4 s ein, 6 s aus.', achte: 'Der untere Rücken bleibt locker – weder ins Hohlkreuz noch platt auf den Boden drücken.', leichter: 'Nur beobachten, eine Hand auf dem Bauch.', schwerer: 'Dabei die Beine in der Tischposition halten.', wirkt: 'Weckt die tiefe Bauchmuskulatur und beruhigt.' },
    { id: 'becken', name: 'Becken kippen', stil: 'pilates', fokus: ['ruecken', 'rumpf'], tags: [], phase: ['warm'], stufe: 1, zeit: 50, wdh: '8–10', lage: 'ruecken',
      schritte: ['Rückenlage, Knie gebeugt, Arme neben dem Körper.', 'Ausatmen: Das Schambein Richtung Bauchnabel kippen, der untere Rücken legt sich ab.', 'Einatmen: Zurück in die neutrale Lage mit kleiner Lücke unter dem unteren Rücken.'],
      atem: 'Ausatmen beim Kippen.', achte: 'Die Bewegung kommt aus dem Becken, das Gesäß bleibt locker.', leichter: 'Kleinere Bewegung.', schwerer: 'Langsamer, 3 s pro Richtung.', wirkt: 'Bewegt die Lendenwirbelsäule und weckt den Rumpf.' },
    { id: 'bruecke_pil', name: 'Schulterbrücke Wirbel für Wirbel', stil: 'pilates', fokus: ['ruecken', 'rumpf', 'huefte'], tags: ['gesaess', 'hueftbeuger'], phase: ['warm', 'haupt'], stufe: 1, zeit: 60, wdh: '6–8', lage: 'ruecken',
      schritte: ['Rückenlage, Knie gebeugt, Füße hüftbreit.', 'Ausatmen: Becken kippen und die Wirbelsäule Wirbel für Wirbel abheben, bis Knie, Hüfte und Schultern eine Linie bilden.', 'Oben einatmen, dann ausatmend Wirbel für Wirbel ablegen.'],
      atem: 'Ausatmen beim Hoch- und beim Abrollen.', achte: 'Oben nicht ins Hohlkreuz drücken – das Gesäß ist fest, die Rippen bleiben unten.', leichter: 'Nur das Becken anheben, ohne abzurollen.', schwerer: 'Oben ein Bein anheben und halten.', wirkt: 'Kräftigt Gesäß und Beinrückseite und bewegt die Wirbelsäule.' },
    { id: 'toe_taps', name: 'Zehen tippen (Toe Taps)', stil: 'pilates', fokus: ['rumpf'], tags: [], phase: ['haupt'], stufe: 1, zeit: 55, wdh: '8–10 je Seite', lage: 'ruecken',
      schritte: ['Rückenlage, Beine in der Tischposition: Knie über der Hüfte, Unterschenkel waagerecht.', 'Ausatmen: Einen Fuß langsam absenken und die Zehen am Boden antippen.', 'Einatmen: Zurück in die Tischposition, dann die andere Seite.'],
      atem: 'Ausatmen beim Absenken.', achte: 'Der untere Rücken darf nicht ins Hohlkreuz kippen – lieber weniger tief.', leichter: 'Nur halb absenken.', schwerer: 'Beide Füße gleichzeitig absenken.', wirkt: 'Trainiert die tiefe Bauchmuskulatur, die das Becken stabil hält.' },
    { id: 'hundred', name: 'Hundred', stil: 'pilates', fokus: ['rumpf'], tags: [], phase: ['haupt'], stufe: 2, zeit: 60, wdh: '10 Atemrunden', lage: 'ruecken',
      schritte: ['Rückenlage, Beine in der Tischposition oder schräg gestreckt.', 'Kopf und Schultern einrollen, Arme lang neben dem Körper knapp über dem Boden.', 'Arme kurz und kräftig auf und ab pumpen: 5-mal beim Einatmen, 5-mal beim Ausatmen – 10 Runden.'],
      atem: '5 Schläge ein, 5 Schläge aus.', achte: 'Der Blick geht zum Bauch, der Nacken bleibt lang. Drückt es im Nacken, den Kopf ablegen.', leichter: 'Füße am Boden, Kopf abgelegt.', schwerer: 'Beine tiefer, schräg nach vorn gestreckt.', wirkt: 'Die klassische Pilates-Übung für ausdauernde Bauchmuskeln und Atmung.' },
    { id: 'rollup', name: 'Roll-up', stil: 'pilates', fokus: ['rumpf', 'ruecken', 'beweglich'], tags: ['beinrueckseite'], phase: ['haupt'], stufe: 2, zeit: 60, wdh: '5–6', lage: 'ruecken',
      schritte: ['Rückenlage, Beine gestreckt, Arme über dem Kopf.', 'Arme nach vorn bringen, Kopf einrollen und Wirbel für Wirbel bis in die Vorbeuge aufrollen.', 'Wirbel für Wirbel langsam zurückrollen.'],
      atem: 'Einatmen zum Start, ausatmen beim Aufrollen.', achte: 'Ohne Schwung. Klappt es nicht, die Knie beugen.', leichter: 'Knie gebeugt, die Hände helfen hinter den Oberschenkeln mit.', schwerer: 'Langsamer, 5 s pro Richtung.', wirkt: 'Kräftigt die Bauchmuskeln und macht die Wirbelsäule beweglich.' },
    { id: 'single_leg', name: 'Single Leg Stretch', stil: 'pilates', fokus: ['rumpf'], tags: [], phase: ['haupt'], stufe: 2, zeit: 55, wdh: '8 je Seite', lage: 'ruecken',
      schritte: ['Rückenlage, Kopf und Schultern eingerollt, ein Knie zur Brust, das andere Bein schräg gestreckt.', 'Im Wechsel die Beine tauschen, die Hände greifen jeweils das angezogene Knie.', 'Das Becken bleibt ruhig.'],
      atem: 'Zwei Wechsel ein, zwei aus.', achte: 'Der untere Rücken bleibt am Boden.', leichter: 'Kopf ablegen, gestrecktes Bein höher.', schwerer: 'Gestrecktes Bein tiefer.', wirkt: 'Kräftigt die Bauchmuskeln und schult die Koordination.' },
    { id: 'double_leg', name: 'Double Leg Stretch', stil: 'pilates', fokus: ['rumpf'], tags: [], phase: ['haupt'], stufe: 3, zeit: 50, wdh: '6–8', lage: 'ruecken',
      schritte: ['Rückenlage, Kopf und Schultern eingerollt, Knie zur Brust, Hände an den Schienbeinen.', 'Einatmen: Arme über den Kopf und Beine schräg nach vorn strecken.', 'Ausatmen: Arme seitlich zurückkreisen, Knie zur Brust.'],
      atem: 'Einatmen beim Strecken.', achte: 'Der untere Rücken bleibt am Boden – sonst die Beine höher strecken.', leichter: 'Beine höher.', schwerer: 'Beine tiefer.', wirkt: 'Fordert die Bauchmuskeln stark und koordiniert Arme, Beine und Atmung.' },
    { id: 'criss_cross', name: 'Criss-Cross', stil: 'pilates', fokus: ['rumpf'], tags: [], phase: ['haupt'], stufe: 2, zeit: 55, wdh: '6–8 je Seite', lage: 'ruecken',
      schritte: ['Rückenlage, Hände am Hinterkopf, Kopf und Schultern eingerollt, Beine in der Tischposition.', 'Ausatmen: Den Oberkörper zu einer Seite drehen, das andere Knie kommt heran, das zweite Bein streckt sich.', 'Seite wechseln.'],
      atem: 'Ausatmen bei jeder Drehung.', achte: 'Die Drehung kommt aus dem Brustkorb, nicht aus den Ellbogen. Nicht am Kopf ziehen.', leichter: 'Füße am Boden, nur den Oberkörper drehen.', schwerer: 'Langsamer, 2 s in der Drehung halten.', wirkt: 'Trainiert die schrägen Bauchmuskeln – sie stabilisieren den Rumpf bei jedem Schritt.' },
    { id: 'schere', name: 'Schere (Scissors)', stil: 'pilates', fokus: ['rumpf', 'beweglich'], tags: ['beinrueckseite'], phase: ['haupt'], stufe: 2, zeit: 50, wdh: '6–8 je Seite', lage: 'ruecken',
      schritte: ['Rückenlage, Kopf und Schultern eingerollt, beide Beine senkrecht.', 'Ein Bein Richtung Gesicht holen, die Hände an der Wade, das andere Bein senkt sich ab.', 'In zwei kleinen Schüben, dann die Beine wechseln.'],
      atem: 'Zwei Schübe ein, zwei aus.', achte: 'Das Becken bleibt ruhig am Boden.', leichter: 'Kopf ablegen, Knie leicht gebeugt.', schwerer: 'Unteres Bein tiefer.', wirkt: 'Kräftigt den Bauch und dehnt die Beinrückseite.' },
    { id: 'beinkreise', name: 'Beinkreise', stil: 'pilates', fokus: ['huefte', 'rumpf'], tags: ['hueftbeuger'], phase: ['warm', 'haupt'], stufe: 1, zeit: 40, wdh: '5 pro Richtung', seiten: true, lage: 'ruecken',
      schritte: ['Rückenlage, ein Bein senkrecht nach oben, das andere gebeugt oder gestreckt am Boden.', 'Mit dem oberen Bein kleine, kontrollierte Kreise zeichnen – 5 nach innen, 5 nach außen.', 'Das Becken bleibt ruhig und schwer.'],
      atem: 'Halber Kreis ein, halber Kreis aus.', achte: 'Klein anfangen – das Becken darf nicht mitwackeln.', leichter: 'Oberes Bein leicht gebeugt.', schwerer: 'Größere Kreise.', wirkt: 'Bewegt das Hüftgelenk und schult die Stabilität des Beckens.' },
    { id: 'rolling', name: 'Rolling like a Ball', stil: 'pilates', fokus: ['ruecken', 'balance', 'rumpf'], tags: [], phase: ['haupt'], stufe: 2, zeit: 45, wdh: '6–8', lage: 'sitzen',
      schritte: ['Im Sitzen die Knie zur Brust ziehen, Hände an den Schienbeinen, auf dem Steißbein balancieren, Rücken rund.', 'Einatmen und bis zu den Schulterblättern nach hinten rollen.', 'Ausatmen und zurück in die Balance rollen, ohne die Füße abzusetzen.'],
      atem: 'Einatmen zurück, ausatmen nach vorn.', achte: 'Nie auf den Nacken rollen. Auf hartem Boden eine Matte nehmen.', leichter: 'Nur in der Balance halten.', schwerer: 'Enger zusammen, Fersen näher ans Gesäß.', wirkt: 'Massiert die Rückenmuskulatur und schult die Kontrolle aus dem Rumpf.' },
    { id: 'spine_stretch', name: 'Spine Stretch Forward', stil: 'pilates', fokus: ['ruecken', 'beweglich'], tags: ['beinrueckseite'], phase: ['warm', 'aus'], stufe: 1, zeit: 50, wdh: '5', lage: 'sitzen',
      schritte: ['Aufrecht sitzen, Beine etwas breiter als hüftbreit gestreckt, Füße angezogen.', 'Ausatmen: Den Kopf senken und Wirbel für Wirbel nach vorn rollen, die Arme gleiten nach vorn.', 'Einatmen: Wirbel für Wirbel wieder aufrichten.'],
      atem: 'Ausatmen beim Vorbeugen.', achte: 'Das Becken bleibt senkrecht – die Bewegung ist ein rundes C, kein Klappmesser.', leichter: 'Knie leicht gebeugt oder auf einem Kissen sitzen.', schwerer: 'Am Ende 2 Atemzüge halten.', wirkt: 'Dehnt Rücken und Beinrückseite.' },
    { id: 'saege', name: 'Säge (Saw)', stil: 'pilates', fokus: ['ruecken', 'beweglich'], tags: ['bws', 'beinrueckseite'], phase: ['haupt'], stufe: 2, zeit: 55, wdh: '4 je Seite', lage: 'sitzen',
      schritte: ['Aufrecht sitzen, Beine breit gestreckt, Arme seitlich auf Schulterhöhe.', 'Den Oberkörper zur Seite drehen, dann vorbeugen: Die vordere Hand „sägt“ am äußeren Fuß vorbei.', 'Aufrichten, zurückdrehen, Seite wechseln.'],
      atem: 'Ausatmen beim Vorbeugen.', achte: 'Beide Sitzbeinhöcker bleiben am Boden.', leichter: 'Knie gebeugt, kleinere Drehung.', schwerer: 'Drei kleine Sägebewegungen nach vorn.', wirkt: 'Verbessert die Drehung im Brustkorb und dehnt die Beinrückseite.' },
    { id: 'spine_twist', name: 'Drehung im Sitz (Spine Twist)', stil: 'pilates', fokus: ['ruecken', 'beweglich'], tags: ['bws'], phase: ['warm', 'haupt'], stufe: 1, zeit: 45, wdh: '4 je Seite', lage: 'sitzen',
      schritte: ['Aufrecht sitzen, Beine gestreckt und geschlossen, Arme seitlich auf Schulterhöhe.', 'Ausatmen: Den Oberkörper in zwei kleinen Schüben zur Seite drehen.', 'Einatmen zur Mitte, Seite wechseln.'],
      atem: 'Ausatmen in die Drehung.', achte: 'Das Becken bleibt ruhig, du wächst nach oben.', leichter: 'Im Schneidersitz.', schwerer: 'Langsamer, die Drehung 2 s halten.', wirkt: 'Hält die Brustwirbelsäule drehfähig – wichtig für Schwimmer und Läufer.' },
    { id: 'meerjungfrau', name: 'Meerjungfrau (Mermaid)', stil: 'pilates', fokus: ['beweglich', 'ruecken'], tags: ['bws'], phase: ['warm', 'aus'], stufe: 1, zeit: 35, wdh: '3–4', seiten: true, lage: 'sitzen',
      schritte: ['Seitlich sitzen, beide Knie zur selben Seite gebeugt.', 'Einen Arm über den Kopf strecken und den Oberkörper zur Seite neigen.', 'Zurück zur Mitte, den Arm sinken lassen.'],
      atem: 'Ausatmen beim Neigen.', achte: 'Erst lang nach oben strecken, dann zur Seite – nicht nach vorn kippen.', leichter: 'Im Schneidersitz.', schwerer: 'Am Ende eine kleine Drehung zum Boden.', wirkt: 'Dehnt die Flanke und öffnet die Rippen – das erleichtert die Atmung.' },
    { id: 'schwan', name: 'Schwan (kleine Version)', stil: 'pilates', fokus: ['ruecken', 'schulter'], tags: ['bws'], phase: ['haupt'], stufe: 1, zeit: 50, wdh: '6', lage: 'bauch',
      schritte: ['Bauchlage, Hände neben den Schultern, Ellbogen nah am Körper, Stirn am Boden.', 'Einatmen: Kopf, Brust und Rippen langsam anheben, die Hände drücken nur leicht.', 'Ausatmen: Langsam ablegen.'],
      atem: 'Einatmen beim Anheben.', achte: 'Die Schultern ziehen weg von den Ohren, das Schambein bleibt am Boden. Nur so hoch, wie es angenehm ist.', leichter: 'Nur Stirn und Brust leicht anheben.', schwerer: 'Höher, oben einen Atemzug halten.', wirkt: 'Kräftigt die Rückenstrecker und öffnet den Brustkorb – Ausgleich zum Sitzen.' },
    { id: 'swimming', name: 'Swimming', stil: 'pilates', fokus: ['ruecken', 'schulter', 'rumpf'], tags: [], phase: ['haupt'], stufe: 2, zeit: 40, lage: 'bauch',
      schritte: ['Bauchlage, Arme lang nach vorn, Beine lang nach hinten.', 'Arme, Kopf und Beine leicht anheben.', 'Im Wechsel rechten Arm und linkes Bein heben, dann umgekehrt – kleine, flotte Bewegungen wie beim Kraulen.'],
      atem: '5 Wechsel ein, 5 aus.', achte: 'Lang machen statt hoch heben. Der Nacken bleibt in Verlängerung der Wirbelsäule.', leichter: 'Nur die Arme oder nur die Beine bewegen.', schwerer: 'Länger, gleichmäßig weiteratmen.', wirkt: 'Stärkt die ganze Körperrückseite.' },
    { id: 'side_kick', name: 'Seitlage-Kicks', stil: 'pilates', fokus: ['huefte', 'rumpf'], tags: ['gesaess', 'hueftbeuger'], phase: ['haupt'], stufe: 1, zeit: 40, wdh: '8', seiten: true, lage: 'seite',
      schritte: ['Seitlage, Kopf auf dem Arm, Beine leicht nach vorn, das obere Bein auf Hüfthöhe anheben.', 'Das obere Bein zweimal nach vorn schwingen, dann lang nach hinten führen.', 'Das Becken bleibt übereinander.'],
      atem: 'Einatmen nach vorn, ausatmen nach hinten.', achte: 'Die Taille bleibt vom Boden abgehoben – nicht in die Hüfte sinken.', leichter: 'Kleinerer Bewegungsweg.', schwerer: 'Langsamer, Fuß gestreckt.', wirkt: 'Kräftigt Hüfte und Gesäß und schult die Stabilität des Beckens.' },
    { id: 'muschel', name: 'Muschel (Clam)', stil: 'pilates', fokus: ['huefte'], tags: ['gesaess'], phase: ['haupt'], stufe: 1, zeit: 40, wdh: '10–12', seiten: true, lage: 'seite',
      schritte: ['Seitlage, Hüfte und Knie gebeugt, die Füße aufeinander.', 'Das obere Knie öffnen, die Füße bleiben zusammen.', 'Langsam schließen.'],
      atem: 'Ausatmen beim Öffnen.', achte: 'Das Becken kippt nicht nach hinten.', leichter: 'Kleinere Öffnung.', schwerer: 'Mit Band über den Knien.', wirkt: 'Kräftigt den mittleren Gesäßmuskel – wichtig für stabile Knie beim Laufen.' },
    { id: 'teaser', name: 'Teaser (Vorstufe)', stil: 'pilates', fokus: ['rumpf', 'balance'], tags: [], phase: ['haupt'], stufe: 3, zeit: 50, wdh: '4–5', lage: 'ruecken',
      schritte: ['Rückenlage, Knie gebeugt, Füße am Boden, Arme über dem Kopf.', 'Ausatmen: Arme nach vorn, Wirbel für Wirbel aufrollen und ein Bein strecken, bis du in einer V-Haltung balancierst.', 'Kurz halten, ausatmend langsam zurückrollen.'],
      atem: 'Ausatmen beim Aufrollen.', achte: 'Nur so weit, wie du ohne Schwung kommst.', leichter: 'Beide Füße bleiben am Boden.', schwerer: 'Beide Beine gestreckt.', wirkt: 'Fordert Bauchkraft, Kontrolle und Gleichgewicht zugleich.' },
    // für beide
    { id: 'vierfuessler', name: 'Vierfüßler diagonal', stil: 'beide', fokus: ['rumpf', 'ruecken', 'balance'], tags: ['gesaess'], phase: ['warm', 'haupt'], stufe: 1, zeit: 55, wdh: '8 je Seite', lage: 'vierf',
      schritte: ['Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte.', 'Einen Arm und das gegenüberliegende Bein lang ausstrecken.', 'Kurz halten, zurück, Seite wechseln.'],
      atem: 'Ausatmen beim Strecken.', achte: 'Das Becken bleibt waagerecht – stell dir ein Glas Wasser auf dem Rücken vor.', leichter: 'Nur das Bein oder nur den Arm.', schwerer: 'Ellbogen und Knie unter dem Bauch zusammenführen.', wirkt: 'Schult die Stabilität des Rückens – eine Kernübung bei Rückenschmerzen.' },
    { id: 'brett', kraft: true, name: 'Unterarmstütz (Brett)', stil: 'beide', fokus: ['rumpf', 'schulter'], tags: [], phase: ['haupt'], stufe: 1, zeit: 30, lage: 'bauch',
      schritte: ['Unterarme unter den Schultern, Beine lang nach hinten.', 'Den Körper anheben, bis er eine Linie von Kopf bis Fuß bildet.', 'Halten, Bauch und Gesäß leicht fest.'],
      atem: 'Ruhig weiteratmen.', achte: 'Kein Hohlkreuz und kein hoher Po.', leichter: 'Auf den Knien.', schwerer: 'Abwechselnd ein Bein anheben.', wirkt: 'Kräftigt den ganzen Rumpf.' },
    { id: 'seitstuetz', kraft: true, name: 'Seitstütz', stil: 'beide', fokus: ['rumpf', 'schulter', 'balance'], tags: [], phase: ['haupt'], stufe: 1, zeit: 25, seiten: true, lage: 'seite',
      schritte: ['Seitlage, Ellbogen unter der Schulter, Knie gebeugt oder Beine gestreckt.', 'Das Becken anheben, bis der Körper eine Linie bildet.', 'Halten und ruhig atmen.'],
      atem: 'Ruhig weiteratmen.', achte: 'Das Becken sinkt nicht ab, die Schulter bleibt weg vom Ohr.', leichter: 'Auf den Knien.', schwerer: 'Beine gestreckt, oberes Bein anheben.', wirkt: 'Kräftigt die seitliche Rumpfmuskulatur.' },
    { id: 'kind', name: 'Kindhaltung', sk: 'Balasana', stil: 'beide', fokus: ['entspannung', 'ruecken', 'huefte'], tags: [], phase: ['warm', 'aus'], stufe: 1, zeit: 50, lage: 'vierf', atemF: true,
      schritte: ['Aus dem Vierfüßlerstand das Gesäß zu den Fersen sinken lassen.', 'Die Stirn ablegen, Arme nach vorn oder neben dem Körper.', 'In den Rücken atmen.'],
      atem: 'Spüre, wie sich der Rücken beim Einatmen weitet.', achte: 'Bei Knieproblemen ein Kissen zwischen Gesäß und Fersen.', leichter: 'Knie breit, Kissen unter die Brust.', schwerer: 'Mit den Händen nach rechts und links wandern – dehnt die Flanken.', wirkt: 'Beruhigt und entlastet den Rücken.' },
    { id: 'nacken', name: 'Nacken lösen', stil: 'beide', fokus: ['schulter', 'entspannung'], tags: ['nacken'], phase: ['warm', 'aus'], stufe: 1, zeit: 60, lage: 'sitzen',
      schritte: ['Aufrecht sitzen, Schultern locker.', 'Ein Ohr zur Schulter sinken lassen, die andere Hand zieht sanft Richtung Boden – 3 Atemzüge, dann Seite wechseln.', 'Zum Schluss die Schultern 5-mal langsam nach hinten kreisen.'],
      atem: 'Lange Ausatmung.', achte: 'Nicht mit der Hand am Kopf ziehen.', leichter: 'Kleinerer Weg.', schwerer: 'Das Kinn leicht zur Brust drehen.', wirkt: 'Löst Spannung im Nacken – angenehm nach Bildschirmarbeit.' },
    { id: 'brustoeffner', name: 'Brustöffner', stil: 'beide', fokus: ['schulter', 'ruecken'], tags: ['brust', 'bws'], phase: ['warm', 'haupt'], stufe: 1, zeit: 40, lage: 'stehen',
      schritte: ['Im Stehen die Hände hinter dem Rücken verschränken.', 'Schulterblätter zusammen, Arme sanft nach hinten unten ziehen.', 'Das Brustbein hebt sich nach vorn oben.'],
      atem: '5 Atemzüge.', achte: 'Kein Hohlkreuz – die Rippen bleiben unten.', leichter: 'Ein Handtuch zwischen den Händen.', schwerer: 'Dabei vorbeugen, Arme Richtung Decke.', wirkt: 'Öffnet die Brust – Ausgleich zur gebeugten Haltung auf dem Rad oder am Schreibtisch.' },
    { id: 'atem_46', name: 'Verlängerte Ausatmung', stil: 'beide', fokus: ['entspannung'], tags: [], phase: ['aus'], stufe: 1, zeit: 120, lage: 'sitzen', atemF: true, ende: true,
      schritte: ['Bequem sitzen oder liegen.', 'Durch die Nase etwa 4 s einatmen.', 'Durch Nase oder Mund 6 s ausatmen.'],
      atem: 'Etwa 6 Atemzüge pro Minute.', achte: 'Locker bleiben – wird dir schwindelig, normal weiteratmen.', leichter: '3 s ein, 4 s aus.', schwerer: '4 s ein, 8 s aus.', wirkt: 'Langsames Atmen mit langer Ausatmung beruhigt Puls und Nervensystem.' },
    // Yoga
    { id: 'ankommen', name: 'Ankommen: ruhige Bauchatmung', stil: 'yoga', fokus: ['entspannung'], tags: [], phase: ['ankommen'], stufe: 1, zeit: 60, lage: 'sitzen', atemF: true,
      schritte: ['Bequem sitzen, eine Hand auf dem Bauch.', 'Durch die Nase atmen, der Bauch hebt sich beim Einatmen.', 'Die Ausatmung etwas länger werden lassen.'],
      atem: '4 s ein, 6 s aus – etwa 6 Atemzüge pro Minute.', achte: 'Nichts erzwingen – die Atmung soll leicht bleiben.', leichter: 'Einfach nur beobachten.', schwerer: 'Ausatmung auf 8 s verlängern.', wirkt: 'Langsames Atmen aktiviert den Ruhenerv und senkt den Puls.' },
    { id: 'seitbeuge', name: 'Seitbeuge im Stand', stil: 'yoga', fokus: ['beweglich'], tags: ['bws'], phase: ['warm'], stufe: 1, zeit: 25, seiten: true, lage: 'stehen',
      schritte: ['Aufrecht stehen, Arme über den Kopf, Hände verschränkt.', 'Lang nach oben strecken und zur Seite neigen.', 'Zurück zur Mitte, Seite wechseln.'],
      atem: '3 Atemzüge je Seite.', achte: 'Nicht nach vorn kippen.', leichter: 'Eine Hand an der Hüfte.', schwerer: 'Länger halten.', wirkt: 'Dehnt die Flanken und weckt die Atmung.' },
    { id: 'katze_kuh', name: 'Katze und Kuh', sk: 'Marjaryasana–Bitilasana', stil: 'yoga', fokus: ['ruecken', 'beweglich'], tags: ['bws'], phase: ['warm'], stufe: 1, zeit: 60, lage: 'vierf',
      schritte: ['Vierfüßlerstand, Hände unter den Schultern, Knie unter der Hüfte.', 'Einatmen: Brust nach vorn, Blick leicht nach oben, der Rücken sinkt (Kuh).', 'Ausatmen: Rücken rund, Kinn zur Brust (Katze).'],
      atem: 'Mit dem Atem fließen, 6–8 Runden.', achte: 'Die Bewegung über die ganze Wirbelsäule verteilen.', leichter: 'Kleinere Bewegung.', schwerer: 'Die Hüfte kreisen lassen.', wirkt: 'Bewegt die ganze Wirbelsäule – ideal zum Start.' },
    { id: 'sonnengruss', erst: true, name: 'Sonnengruß (langsam)', sk: 'Surya Namaskar', stil: 'yoga', fokus: ['beweglich', 'ganz'], tags: ['beinrueckseite', 'hueftbeuger'], phase: ['warm', 'haupt'], stufe: 2, zeit: 120, wdh: '3 Runden', lage: 'stehen',
      schritte: ['Aufrecht stehen. Einatmen: Arme nach oben. Ausatmen: Vorbeuge.', 'Einatmen: halb aufrichten. Ausatmen: zurück in den Stütz oder die Knie ablegen und den Körper absenken.', 'Einatmen: Sphinx oder Kobra. Ausatmen: herabschauender Hund, 3 Atemzüge. Nach vorn kommen und aufrollen.'],
      atem: 'Jede Bewegung mit einem Atemzug.', achte: 'Langsam beginnen, in der Vorbeuge die Knie ruhig beugen.', leichter: 'Knie ablegen statt Stütz.', schwerer: '5 Runden, flüssige Übergänge.', wirkt: 'Wärmt den ganzen Körper auf und verbindet Bewegung mit Atmung.' },
    { id: 'hund', name: 'Herabschauender Hund', sk: 'Adho Mukha Svanasana', stil: 'yoga', fokus: ['beweglich', 'schulter'], tags: ['waden', 'beinrueckseite'], phase: ['warm', 'haupt'], stufe: 1, zeit: 45, lage: 'vierf',
      schritte: ['Aus dem Vierfüßlerstand die Zehen aufstellen und das Gesäß nach hinten oben schieben.', 'Die Hände drücken in den Boden, der Rücken wird lang.', 'Die Fersen Richtung Boden sinken lassen – sie müssen ihn nicht berühren.'],
      atem: '5–8 ruhige Atemzüge.', achte: 'Lieber die Knie beugen und den Rücken lang halten als die Beine strecken und rund werden.', leichter: 'Knie deutlich gebeugt.', schwerer: 'Abwechselnd die Fersen senken.', wirkt: 'Dehnt Waden und Beinrückseite und kräftigt Schultern und Arme.' },
    { id: 'tiefer_ausfall', name: 'Tiefer Ausfallschritt', sk: 'Anjaneyasana', stil: 'yoga', fokus: ['huefte', 'beweglich'], tags: ['hueftbeuger'], phase: ['haupt'], stufe: 1, zeit: 45, seiten: true, lage: 'vierf',
      schritte: ['Ein Fuß vorn zwischen den Händen, das hintere Knie am Boden (Kissen darunter).', 'Das Becken sanft nach vorn unten sinken lassen, den Oberkörper aufrichten.', 'Arme nach oben oder die Hände auf das vordere Knie.'],
      atem: '5–8 Atemzüge.', achte: 'Das vordere Knie bleibt über dem Knöchel. Das Gesäß leicht anspannen – das verstärkt die Dehnung vorn an der Hüfte.', leichter: 'Die Hände bleiben am Boden.', schwerer: 'Den hinteren Fuß greifen (dehnt zusätzlich den vorderen Oberschenkel).', wirkt: 'Dehnt den Hüftbeuger – er verkürzt durch langes Sitzen und Radfahren.' },
    { id: 'krieger1', kraft: true, name: 'Krieger I', sk: 'Virabhadrasana I', stil: 'yoga', fokus: ['balance', 'huefte'], tags: ['hueftbeuger'], phase: ['haupt'], stufe: 2, zeit: 35, seiten: true, lage: 'stehen',
      schritte: ['Großer Schritt, vorderes Knie gebeugt, hintere Ferse am Boden, hinterer Fuß leicht nach außen gedreht.', 'Die Hüfte zeigt nach vorn.', 'Arme nach oben, Schultern locker.'],
      atem: '5 Atemzüge.', achte: 'Kein Hohlkreuz – die Rippen bleiben unten.', leichter: 'Hintere Ferse anheben (hoher Ausfallschritt).', schwerer: 'Tiefer beugen.', wirkt: 'Kräftigt die Beine und dehnt den Hüftbeuger des hinteren Beins.' },
    { id: 'krieger2', kraft: true, name: 'Krieger II', sk: 'Virabhadrasana II', stil: 'yoga', fokus: ['balance', 'huefte'], tags: ['adduktoren'], phase: ['haupt'], stufe: 1, zeit: 35, seiten: true, lage: 'stehen',
      schritte: ['Breiter Stand, der vordere Fuß zeigt nach vorn, der hintere leicht nach innen.', 'Das vordere Knie beugen, bis es über dem Knöchel steht.', 'Arme auf Schulterhöhe ausbreiten, Blick über die vordere Hand.'],
      atem: '5 Atemzüge.', achte: 'Das vordere Knie zeigt Richtung mittlere Zehen, nicht nach innen.', leichter: 'Weniger tief beugen.', schwerer: 'Tiefer, länger halten.', wirkt: 'Kräftigt die Beine und öffnet die Hüfte.' },
    { id: 'dreieck', name: 'Dreieck', sk: 'Trikonasana', stil: 'yoga', fokus: ['beweglich', 'huefte'], tags: ['beinrueckseite', 'adduktoren'], phase: ['haupt'], stufe: 1, zeit: 35, seiten: true, lage: 'stehen',
      schritte: ['Breiter Stand, vorderer Fuß nach vorn, Beine gestreckt.', 'Den Oberkörper über das vordere Bein nach vorn schieben und zur Seite kippen.', 'Untere Hand ans Schienbein oder auf einen Block, obere Hand nach oben.'],
      atem: '5 Atemzüge.', achte: 'Lang machen statt tief kommen – beide Körperseiten bleiben lang.', leichter: 'Hand höher am Bein.', schwerer: 'Hand am Boden hinter dem Fuß.', wirkt: 'Dehnt Beinrückseite, Leiste und Flanke.' },
    { id: 'baum', name: 'Baum', sk: 'Vrksasana', stil: 'yoga', fokus: ['balance'], tags: [], phase: ['haupt'], stufe: 1, zeit: 30, seiten: true, lage: 'stehen',
      schritte: ['Auf einem Bein stehen, den anderen Fuß an Knöchel, Wade oder Oberschenkel setzen – nicht ans Knie.', 'Hände vor der Brust oder nach oben.', 'Einen festen Punkt anschauen.'],
      atem: 'Ruhig weiteratmen.', achte: 'Das Standbein ist aktiv, das Becken waagerecht.', leichter: 'Fuß am Knöchel, eine Hand an der Wand.', schwerer: 'Augen kurz schließen.', wirkt: 'Schult das Gleichgewicht – Gleichgewichtstraining senkt nachweislich Stürze.' },
    { id: 'krieger3', kraft: true, name: 'Krieger III', sk: 'Virabhadrasana III', stil: 'yoga', fokus: ['balance', 'rumpf'], tags: ['gesaess', 'beinrueckseite'], phase: ['haupt'], stufe: 3, zeit: 25, seiten: true, lage: 'stehen',
      schritte: ['Auf einem Bein stehen, den Oberkörper nach vorn neigen und das andere Bein nach hinten heben.', 'Oberkörper und hinteres Bein bilden eine Linie, parallel zum Boden.', 'Arme nach vorn oder an die Hüfte.'],
      atem: '3–5 Atemzüge.', achte: 'Die Hüfte bleibt waagerecht, das hintere Bein dreht nicht auf.', leichter: 'Hände auf eine Stuhllehne.', schwerer: 'Arme nach vorn strecken.', wirkt: 'Kräftigt Gesäß und Rumpf und fordert das Gleichgewicht.' },
    { id: 'stuhl', kraft: true, name: 'Stuhl', sk: 'Utkatasana', stil: 'yoga', fokus: ['balance', 'rumpf'], tags: ['gesaess'], phase: ['haupt'], stufe: 2, zeit: 30, lage: 'stehen',
      schritte: ['Füße hüftbreit, in die Knie gehen, als würdest du dich auf einen Stuhl setzen.', 'Arme nach oben, Oberkörper leicht nach vorn.', 'Das Gewicht liegt auf den Fersen.'],
      atem: '5 Atemzüge.', achte: 'Die Knie zeigen nach vorn, kein Hohlkreuz.', leichter: 'Weniger tief, Hände vor der Brust.', schwerer: 'Tiefer, die Fersen kurz anheben.', wirkt: 'Kräftigt Beine und Rumpf.' },
    { id: 'tiefe_hocke', name: 'Tiefe Hocke', sk: 'Malasana', stil: 'yoga', fokus: ['huefte', 'beweglich'], tags: ['adduktoren', 'waden'], phase: ['haupt'], stufe: 2, zeit: 40, lage: 'stehen',
      schritte: ['Füße etwas breiter als hüftbreit, Zehen leicht nach außen.', 'Tief in die Hocke sinken, Hände vor der Brust, die Ellbogen schieben die Knie sanft nach außen.', 'Aufrecht werden.'],
      atem: '6 Atemzüge.', achte: 'Die Fersen dürfen auf einer gefalteten Decke stehen.', leichter: 'Auf einem Block oder Kissen sitzen.', schwerer: 'Die Arme nach vorn strecken.', wirkt: 'Öffnet Hüfte und Sprunggelenke.' },
    { id: 'adlerarme', name: 'Adlerarme', sk: 'Garudasana (Arme)', stil: 'yoga', fokus: ['schulter'], tags: ['nacken', 'bws'], phase: ['warm', 'haupt'], stufe: 1, zeit: 30, seiten: true, lage: 'sitzen',
      schritte: ['Die Arme vor der Brust überkreuzen, Ellbogen übereinander.', 'Die Unterarme umeinander schlingen, Handflächen zueinander.', 'Die Ellbogen leicht anheben und von der Brust wegschieben.'],
      atem: '5 Atemzüge.', achte: 'Die Schultern bleiben unten.', leichter: 'Hände auf die gegenüberliegenden Schultern.', schwerer: 'Dabei sanft vorbeugen.', wirkt: 'Dehnt die Muskeln zwischen den Schulterblättern – angenehm nach Schreibtisch oder Schwimmen.' },
    { id: 'faden', name: 'Faden einfädeln', sk: 'Parsva Balasana', stil: 'yoga', fokus: ['schulter', 'ruecken'], tags: ['bws'], phase: ['haupt', 'aus'], stufe: 1, zeit: 40, seiten: true, lage: 'vierf',
      schritte: ['Vierfüßlerstand.', 'Einen Arm unter dem anderen hindurch zur Seite schieben, Schulter und Schläfe ablegen.', 'Die andere Hand bleibt aufgestützt oder streckt sich nach vorn.'],
      atem: '6 Atemzüge.', achte: 'Die Hüfte bleibt über den Knien.', leichter: 'Kissen unter den Kopf.', schwerer: 'Den oberen Arm über den Rücken legen.', wirkt: 'Dreht die Brustwirbelsäule und löst die hintere Schulter.' },
    { id: 'sphinx', name: 'Sphinx', sk: 'Salamba Bhujangasana', stil: 'yoga', fokus: ['ruecken'], tags: ['bws'], phase: ['haupt', 'aus'], stufe: 1, zeit: 45, lage: 'bauch',
      schritte: ['Bauchlage, Unterarme parallel, Ellbogen unter den Schultern.', 'Die Brust heben, Schultern weg von den Ohren.', 'Bauch und Becken bleiben locker am Boden.'],
      atem: '6–8 Atemzüge.', achte: 'Drückt es im unteren Rücken, die Ellbogen etwas weiter nach vorn setzen.', leichter: 'Die Stirn auf die Hände legen.', schwerer: 'Kobra: auf die Hände hochdrücken.', wirkt: 'Sanfte Rückbeuge – Ausgleich zum vielen Vorbeugen im Alltag.' },
    { id: 'taube', name: 'Taube', sk: 'Eka Pada Rajakapotasana (Vorstufe)', stil: 'yoga', fokus: ['huefte'], tags: ['gesaess', 'hueftbeuger'], phase: ['haupt'], stufe: 2, zeit: 50, seiten: true, lage: 'vierf',
      schritte: ['Aus dem Vierfüßlerstand ein Knie nach vorn hinter die Hand bringen, das Schienbein liegt schräg.', 'Das hintere Bein lang nach hinten strecken.', 'Aufrecht bleiben oder nach vorn auf die Unterarme sinken.'],
      atem: '8 Atemzüge.', achte: 'Bei Knieschmerzen lieber die liegende Taube.', leichter: 'Kissen unter die Hüfte der vorderen Seite.', schwerer: 'Den Oberkörper ganz ablegen.', wirkt: 'Öffnet die Hüfte tief – Gesäß und Hüftbeuger zugleich.' },
    { id: 'drehsitz', name: 'Drehsitz', sk: 'Ardha Matsyendrasana', stil: 'yoga', fokus: ['ruecken', 'beweglich'], tags: ['bws', 'gesaess'], phase: ['haupt'], stufe: 1, zeit: 35, seiten: true, lage: 'sitzen',
      schritte: ['Sitzen, ein Bein gestreckt, den anderen Fuß außen neben das Knie stellen.', 'Einatmen lang werden, ausatmen zum aufgestellten Knie drehen.', 'Der Ellbogen hakt außen am Knie ein.'],
      atem: '5 Atemzüge, mit jedem Einatmen etwas wachsen.', achte: 'Erst aufrichten, dann drehen.', leichter: 'Den Arm um das Knie schlingen statt einhaken.', schwerer: 'Das untere Bein beugen.', wirkt: 'Hält die Wirbelsäule drehbeweglich.' },
    { id: 'vorbeuge', name: 'Sitzende Vorbeuge', sk: 'Paschimottanasana', stil: 'yoga', fokus: ['beweglich', 'entspannung'], tags: ['beinrueckseite'], phase: ['aus'], stufe: 1, zeit: 60, lage: 'sitzen',
      schritte: ['Sitzen, die Beine nach vorn gestreckt.', 'Einatmen lang werden, ausatmen aus der Hüfte nach vorn neigen.', 'Die Hände dort ablegen, wo sie hinkommen.'],
      atem: '8 Atemzüge, mit jeder Ausatmung etwas lösen.', achte: 'Die Knie dürfen gebeugt sein. Die Bewegung kommt aus der Hüfte.', leichter: 'Auf einem Kissen sitzen, Knie gebeugt.', schwerer: 'Länger halten, bis 2 min.', wirkt: 'Dehnt Beinrückseite und Rücken und wirkt beruhigend.' },
    { id: 'schmetterling', name: 'Schmetterling', sk: 'Baddha Konasana', stil: 'yoga', fokus: ['huefte', 'beweglich'], tags: ['adduktoren'], phase: ['aus'], stufe: 1, zeit: 50, lage: 'sitzen',
      schritte: ['Sitzen, die Fußsohlen zusammen, die Knie fallen nach außen.', 'Die Hände um die Füße, aufrecht werden.', 'Ausatmend aus der Hüfte etwas nach vorn neigen.'],
      atem: '8 Atemzüge.', achte: 'Die Knie nicht nach unten drücken.', leichter: 'Kissen unter die Knie oder unter das Gesäß.', schwerer: 'Die Füße näher zum Körper.', wirkt: 'Dehnt die Innenseite der Oberschenkel und die Leiste.' },
    { id: 'bruecke', name: 'Brücke', sk: 'Setu Bandha Sarvangasana', stil: 'yoga', fokus: ['ruecken', 'huefte'], tags: ['hueftbeuger', 'gesaess', 'brust'], phase: ['haupt'], stufe: 1, zeit: 35, lage: 'ruecken',
      schritte: ['Rückenlage, Knie gebeugt, Füße hüftbreit nah am Gesäß.', 'Das Becken heben, die Hände unter dem Rücken verschränken oder neben dem Körper lassen.', 'Die Brust Richtung Kinn schieben.'],
      atem: '5 Atemzüge, dann ablegen und wiederholen.', achte: 'Die Knie zeigen nach vorn. Den Kopf nicht drehen.', leichter: 'Ein Kissen unter das Kreuzbein.', schwerer: 'Ein Bein strecken.', wirkt: 'Öffnet Brust und Hüftbeuger und kräftigt Gesäß und Rücken.' },
    { id: 'liegende_taube', name: 'Liegende Taube', sk: 'Supta Kapotasana', stil: 'yoga', fokus: ['huefte', 'entspannung'], tags: ['gesaess'], phase: ['aus'], stufe: 1, zeit: 50, seiten: true, lage: 'ruecken',
      schritte: ['Rückenlage, einen Knöchel auf das andere Knie legen.', 'Das untere Bein heranziehen, die Hände hinter dem Oberschenkel.', 'Die Dehnung tief im Gesäß spüren.'],
      atem: '8–10 ruhige Atemzüge.', achte: 'Den Fuß des oberen Beins aktiv anziehen – das schützt das Knie.', leichter: 'Der untere Fuß bleibt am Boden.', schwerer: 'Näher heranziehen.', wirkt: 'Dehnt Gesäß und Hüfte – gut nach Laufen und Radfahren.' },
    { id: 'drehung_liegend', name: 'Liegende Drehung', sk: 'Supta Matsyendrasana', stil: 'yoga', fokus: ['ruecken', 'entspannung'], tags: ['bws', 'gesaess'], phase: ['aus'], stufe: 1, zeit: 50, seiten: true, lage: 'ruecken',
      schritte: ['Rückenlage, die Arme seitlich ausgebreitet.', 'Beide Knie angewinkelt zu einer Seite sinken lassen.', 'Den Kopf zur anderen Seite drehen, wenn es angenehm ist.'],
      atem: '8 ruhige Atemzüge.', achte: 'Beide Schultern bleiben möglichst am Boden – kommen die Knie nicht an, ein Kissen darunter.', leichter: 'Kissen unter die Knie.', schwerer: 'Das obere Bein strecken.', wirkt: 'Löst den unteren Rücken und beruhigt.' },
    { id: 'happy_baby', name: 'Glückliches Baby', sk: 'Ananda Balasana', stil: 'yoga', fokus: ['huefte', 'entspannung'], tags: ['adduktoren'], phase: ['aus'], stufe: 1, zeit: 45, lage: 'ruecken',
      schritte: ['Rückenlage, die Knie Richtung Achseln ziehen.', 'Die Außenkanten der Füße oder die Kniekehlen greifen, die Fußsohlen zeigen zur Decke.', 'Sanft hin und her schaukeln.'],
      atem: '6–8 Atemzüge.', achte: 'Das Kreuzbein bleibt am Boden.', leichter: 'Ein Bein nach dem anderen.', schwerer: 'Die Knie näher zum Boden ziehen.', wirkt: 'Öffnet Hüfte und Leiste und entspannt den unteren Rücken.' },
    { id: 'beine_wand', name: 'Beine an die Wand', sk: 'Viparita Karani', stil: 'yoga', fokus: ['entspannung'], tags: ['waden'], phase: ['aus'], stufe: 1, zeit: 120, lage: 'ruecken', atemF: true, ende: true,
      schritte: ['Seitlich an eine Wand setzen, dann auf den Rücken drehen und die Beine an der Wand hochlegen.', 'Die Arme liegen locker neben dem Körper.', 'Augen schließen, ruhig atmen.'],
      atem: 'Lange Ausatmung.', achte: 'Das Gesäß muss nicht ganz an der Wand sein.', leichter: 'Die Unterschenkel auf einen Stuhl legen.', schwerer: 'Länger bleiben, bis 5 min.', wirkt: 'Entspannt und tut nach langen Läufen oder Radtouren gut.' },
    { id: 'savasana', name: 'Endentspannung', sk: 'Savasana', stil: 'yoga', fokus: ['entspannung'], tags: [], phase: ['aus'], stufe: 1, zeit: 120, lage: 'ruecken', atemF: true, ende: true,
      schritte: ['Rückenlage, Beine und Arme locker, die Handflächen zeigen nach oben.', 'Augen schließen, den Körper schwer werden lassen.', 'Den Atem einfach fließen lassen.'],
      atem: 'Nicht steuern – nur beobachten.', achte: 'Zudecken, wenn dir kalt wird.', leichter: 'Ein Kissen unter die Knie.', schwerer: 'Länger liegen bleiben.', wirkt: 'Hier wirkt die Einheit nach: Puls und Muskelspannung sinken.' },
  ];
  const BY = Object.fromEntries(L.map((u) => [u.id, u]));
  // Anlässe: fertige Einheiten für typische Momente – extra gewichtet die passenden Körperstellen
  const ANLASS = {
    morgen: { titel: 'Morgens in Schwung', icon: 'i-sun', stil: 'yoga', fokus: 'beweglich', dauer: 10, extra: ['bws', 'beinrueckseite', 'hueftbeuger'] },
    nach_lauf: { mild: true, titel: 'Nach dem Laufen', icon: 'i-run', stil: 'yoga', fokus: 'huefte', dauer: 20, extra: ['hueftbeuger', 'waden', 'beinrueckseite', 'gesaess'] },
    nach_rad: { mild: true, titel: 'Nach dem Radfahren', icon: 'i-bike', stil: 'yoga', fokus: 'huefte', dauer: 20, extra: ['hueftbeuger', 'brust', 'bws', 'gesaess'] },
    nach_schwimmen: { mild: true, titel: 'Nach dem Schwimmen', icon: 'i-swim', stil: 'yoga', fokus: 'schulter', dauer: 20, extra: ['brust', 'bws', 'nacken'] },
    ruecken: { titel: 'Rücken stärken', icon: 'i-body', stil: 'pilates', fokus: 'ruecken', dauer: 20, extra: ['gesaess'] },
    rumpf: { titel: 'Starker Rumpf', icon: 'i-target', stil: 'pilates', fokus: 'rumpf', dauer: 20, extra: [] },
    buero: { mild: true, titel: 'Schreibtisch-Ausgleich', icon: 'i-monitor', stil: 'mix', fokus: 'schulter', dauer: 10, extra: ['nacken', 'bws', 'hueftbeuger', 'brust'] },
    abend: { mild: true, titel: 'Abends runterkommen', icon: 'i-moon', stil: 'yoga', fokus: 'entspannung', dauer: 20, extra: [] },
  };
  const WARUM = {
    rumpf: ['Pilates kräftigt die tiefe Rumpfmuskulatur: Nach 12 Wochen hielten Teilnehmende ihre Bauchmuskeln deutlich länger unter Spannung und waren in der Beinrückseite beweglicher.', 'Kloubec, J Strength Cond Res 2010'],
    ruecken: ['Bei anhaltenden Rückenschmerzen lindern Pilates und Yoga Schmerzen und verbessern den Alltag – etwa so gut wie andere gezielte Bewegungsprogramme. Entscheidend ist, dranzubleiben.', 'Yamato et al., Cochrane 2015 · Wieland et al., Cochrane 2022'],
    huefte: ['Beweglichkeit wächst mit der Summe: etwa 5 Minuten Dehnen pro Muskelgruppe und Woche, verteilt auf mehrere Tage. Direkt vor schnellen Einheiten besser kurz und dynamisch – lange Haltezeiten davor mindern die Schnellkraft kurzzeitig etwas.', 'Thomas et al., Int J Sports Med 2018 · Behm et al., Appl Physiol Nutr Metab 2016'],
    schulter: ['Regelmäßiges Dehnen macht beweglicher – bei Sportlern verbesserten 10 Wochen Yoga Beweglichkeit und Gleichgewicht.', 'Polsgrove et al., Int J Yoga 2016 · Thomas et al., Int J Sports Med 2018'],
    entspannung: ['Yoga und langsames Atmen mit langer Ausatmung senken Stressmarker wie Cortisol, Ruhepuls und Blutdruck und können den Schlaf verbessern.', 'Pascoe et al., Psychoneuroendocrinology 2017 · Zaccaro et al., Front Hum Neurosci 2018 · Wang et al., BMC Psychiatry 2020'],
    balance: ['Gleichgewichtsübungen senken bei älteren Menschen Stürze um etwa ein Viertel; bei Sportlern verbesserte Yoga das Gleichgewicht schon nach 10 Wochen.', 'Sherrington et al., Cochrane 2019 · Polsgrove et al., Int J Yoga 2016'],
    ganz: ['Pilates kräftigt den Rumpf, Yoga verbessert Beweglichkeit und Gleichgewicht und senkt Stress – zusammen ein guter Ausgleich zu Ausdauer- und Krafttraining.', 'Kloubec 2010 · Polsgrove et al. 2016 · Pascoe et al. 2017'],
  };
  WARUM.beweglich = WARUM.huefte;
  const LAGE_TXT = { stehen: 'im Stehen', vierf: 'im Vierfüßlerstand', bauch: 'in Bauchlage', sitzen: 'im Sitzen', seite: 'in Seitlage', ruecken: 'in Rückenlage' };

  /* ---------- Zustand ---------- */
  const STD = { stil: 'yoga', fokus: 'ganz', dauer: 20, niveau: null, anlass: null, seed: 1, bibStil: 'alle', bibFokus: 'alle', log: [] };
  let F = null, kontoVon = null, saveT = null, offenSpeichern = false;
  function laden() {
    const uid = A().konto().uid || null;
    if (uid !== kontoVon) { kontoVon = uid; F = null; offenSpeichern = false; }
    if (F && offenSpeichern) return;
    const r = (A().state.rechner || {}).flow;
    F = Object.assign({}, STD, r && typeof r === 'object' ? JSON.parse(JSON.stringify(r)) : {});
    if (!STIL[F.stil]) F.stil = 'yoga';
    if (!FOKUS[F.fokus]) F.fokus = 'ganz';
    if (!DAUER.includes(F.dauer)) F.dauer = 20;
    if (F.anlass && !ANLASS[F.anlass]) F.anlass = null;
    if (!Array.isArray(F.log)) F.log = [];
  }
  function speichern(sofort) {
    const kopie = () => JSON.parse(JSON.stringify(F));
    A().setRechner(Object.assign({}, A().state.rechner || {}, { flow: kopie() }));
    clearTimeout(saveT); offenSpeichern = true;
    saveT = setTimeout(() => A().api('POST', '/api/rechner', { flow: kopie() })
      .then(() => { offenSpeichern = false; })
      .catch(() => { offenSpeichern = false; }), sofort ? 0 : 600);
  }
  const athlet = () => (rowsOf('athlet') || [])[0] || {};
  const nivIdx = () => { const v = F.niveau || (athlet().wissen === 'einsteiger' ? 'einsteiger' : 'fortgeschritten'); return Math.max(0, NIVEAU.findIndex((n) => n[0] === v)); };
  const heuteIso = () => { const H = heute(); return (H && H.date) || localDate(); };
  function zufall(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const minTxt = (s) => Math.max(1, Math.round(s / 60)) + ' min';
  const titelVon = () => (F.anlass ? ANLASS[F.anlass].titel : STIL[F.stil][0] + (F.fokus === 'ganz' ? ' für den ganzen Körper' : ': ' + FOKUS[F.fokus]));
  const einsteiger = () => (document.getElementById('tf') || {}).dataset ? document.getElementById('tf').dataset.wissen === 'einsteiger' : false;

  /* ---------- Einheit zusammenstellen ----------
     Ankommen (Atmung) → Aufwärmen → Hauptteil → Ausklang mit einer ruhigen Schlussübung. Je Phase werden Übungen nach
     Fokus, Anlass und Erfahrung gewählt, bis die Zeit gefüllt ist; im Yoga vom Stehen zum Liegen geordnet. */
  const WECHSEL = 8; // Sekunden Übergang zwischen zwei Übungen
  function einheit() {
    const st = F.stil, fk = F.fokus, niv = nivIdx(), D = F.dauer * 60, an = F.anlass ? ANLASS[F.anlass] : null;
    const extra = an ? an.extra : [], ruhig = fk === 'entspannung', mild = ruhig || !!(an && an.mild); // mild: dehnen statt halten
    const halte = (ruhig ? 1.3 : 1) * (F.dauer >= 45 ? 1.25 : F.dauer >= 30 ? 1.1 : 1); // längere Einheiten: länger halten
    const passt = (u) => (st === 'mix' || u.stil === st || u.stil === 'beide') && u.stufe <= niv + 1;
    const rnd = zufall(F.seed * 7919 + F.dauer * 13 + niv * 101 + (an ? 7 : 0));
    const jit = new Map(L.map((u) => [u.id, rnd()]));
    const genutzt = new Set();
    const sekVon = (u) => (u.wdh ? u.zeit : Math.round((u.zeit * halte) / 5) * 5);
    const dauerVon = (u, sek) => (sek || sekVon(u)) * (u.seiten ? 2 : 1) + WECHSEL;
    function wert(u, ph) {
      let w = fk === 'ganz' ? 1 + 0.3 * u.fokus.length : u.fokus.includes(fk) ? 3 : 0;
      w += 1.4 * u.tags.filter((t) => extra.includes(t)).length;
      if (ruhig && ph === 'haupt') { if (u.fokus.includes('entspannung') || u.phase.includes('aus')) w += 1.5; if (u.lage === 'stehen' || u.wdh) w -= 2; }
      if (st === 'mix') w += (u.stil === 'pilates' && ph === 'haupt') || (u.stil === 'yoga' && ph === 'aus') ? 0.6 : 0;
      if (niv === 0) w += u.stufe === 1 ? 0.4 : -0.6;
      if (niv === 2 && u.stufe >= 2) w += 0.3;
      return w + jit.get(u.id) * 1.3;
    }
    function fuellen(ph, budget, verboten) {
      const out = []; let t = 0;
      for (;;) {
        const phOk = (u) => u.phase.includes(ph) || (ruhig && ph === 'haupt' && u.phase.includes('aus'));
        const kand = L.filter((u) => passt(u) && !genutzt.has(u.id) && phOk(u) && !u.ende && !(verboten && verboten(u))).map((u) => [u, wert(u, ph)]).sort((a, b) => b[1] - a[1]);
        const pick = kand.find(([u]) => t + dauerVon(u) <= budget + 20);
        if (!pick || t >= budget - 15) break;
        const u = pick[0]; genutzt.add(u.id); out.push({ u, sek: sekVon(u) }); t += dauerVon(u);
      }
      return out;
    }
    // Ankommen
    const start = BY[st === 'pilates' ? 'atmung_pil' : 'ankommen'];
    const ank = [{ u: start, sek: F.dauer <= 10 ? 40 : F.dauer >= 30 ? 90 : 60 }];
    genutzt.add('atmung_pil'); genutzt.add('ankommen');
    // Schlussübung
    const endeU = BY[st === 'pilates' && !ruhig ? 'kind' : ruhig && F.dauer >= 20 && niv < 2 ? 'beine_wand' : st === 'pilates' || F.dauer <= 10 ? 'atem_46' : 'savasana'];
    genutzt.add(endeU.id);
    const endeSek = Math.max(45, Math.min(ruhig ? 240 : 150, Math.round((D * (ruhig ? 0.14 : 0.08)) / 15) * 15));
    const bAus = Math.max(0, Math.round(D * (ruhig ? 0.3 : 0.18)) - endeSek - WECHSEL);
    const bWarm = Math.round(D * (ruhig ? 0.12 : 0.17));
    const warm = fuellen('warm', bWarm);
    const aus = fuellen('aus', bAus);
    const zeitDer = (items) => items.reduce((x, i) => x + dauerVon(i.u, i.sek), 0);
    const bHaupt = D - zeitDer(ank) - zeitDer(warm) - zeitDer(aus) - (endeSek + WECHSEL);
    const haupt = fuellen('haupt', bHaupt, mild ? (u) => u.kraft || (ruhig && (u.lage === 'stehen' || !!u.wdh)) : null);
    // zu kurz? Haltezeiten verlängern (bis 1,5-fach), bei Pilates sonst eine zweite Runde
    let runden = 1, hz = zeitDer(haupt);
    if (hz && hz < bHaupt - 60) {
      const halten = haupt.filter((i) => !i.u.wdh), fest = hz - zeitDer(halten);
      const f = halten.length ? Math.min(ruhig ? 2 : 1.5, (bHaupt - fest) / Math.max(1, zeitDer(halten))) : 1;
      halten.forEach((i) => { i.sek = Math.round((i.sek * f) / 5) * 5; });
      hz = zeitDer(haupt);
      if (hz < bHaupt * 0.7 && !ruhig) runden = Math.min(3, Math.max(1, Math.round(bHaupt / hz)));
    }
    const ordnung = LAGE[st === 'pilates' ? 'pilates' : 'yoga'];
    const sortiert = (items) => items.slice().sort((a, b) => ordnung.indexOf(a.u.lage) - ordnung.indexOf(b.u.lage) || (a.u.erst ? 0 : 1) - (b.u.erst ? 0 : 1));
    const phasen = [
      { id: 'ankommen', name: 'Ankommen', items: ank, runden: 1 },
      { id: 'warm', name: 'Aufwärmen', items: st === 'pilates' ? sortiert(warm) : warm, runden: 1 },
      { id: 'haupt', name: 'Hauptteil', items: sortiert(haupt), runden },
      { id: 'aus', name: 'Ausklang', items: sortiert(aus).concat([{ u: endeU, sek: endeSek }]), runden: 1 },
    ].filter((p) => p.items.length);
    phasen.forEach((p) => { p.sek = zeitDer(p.items) * p.runden; });
    const gesamt = phasen.reduce((x, p) => x + p.sek, 0);
    return { titel: titelVon(), phasen, sek: gesamt, min: Math.round(gesamt / 60), anzahl: phasen.reduce((x, p) => x + p.items.length, 0), niv, fokus: fk };
  }

  /* ---------- Tagebuch ---------- */
  function woche() {
    const bis = heuteIso(), von = iso(toDay(bis) - 6 * DAY);
    const L7 = F.log.filter((e) => e && e.d >= von && e.d <= bis);
    return { L: L7, min: L7.reduce((x, e) => x + (+e.min || 0), 0) };
  }
  function eintragen(E) {
    F.log = F.log.filter((e) => e && e.d >= iso(toDay(heuteIso()) - 40 * DAY));
    F.log.push({ d: heuteIso(), t: E.titel.slice(0, 40), min: E.min, stil: F.stil });
    if (F.log.length > 30) F.log = F.log.slice(-30);
    speichern(true);
  }

  /* ---------- Darstellung ---------- */
  function ansicht() { const r = T.route(); return r === 'training/flow/einheit' ? 'einheit' : r === 'training/flow/uebungen' ? 'bib' : 'wahl'; }
  function renderFlow() {
    const box = $('#flow-box'); if (!box) return;
    laden();
    const a = ansicht();
    box.replaceChildren(...(a === 'einheit' ? einheitAnsicht() : a === 'bib' ? [bibliothek()] : wahlAnsicht()));
  }
  function neu() { const y = window.scrollY; T.neu(); window.scrollTo(0, y); } // über die App neu zeichnen – so kommen auch die (i)-Erklärungen wieder dazu
  function seg(items, cur, on, label, cls) {
    const box = el('div', { class: 'tf-seg tf-gym-seg ' + (cls || ''), role: 'group', 'aria-label': label || null });
    items.forEach(([v, l, klein]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, l, klein ? el('small', { text: klein }) : null); b.addEventListener('click', () => on(v)); box.appendChild(b); });
    return box;
  }
  function chips(items, cur, on, label, cls) {
    const box = el('div', { class: 'tf-chipset ' + (cls || ''), role: 'group', 'aria-label': label || null });
    items.forEach(([v, l]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, l); b.addEventListener('click', () => on(v)); box.appendChild(b); });
    return box;
  }
  const feld = (titel, ...k) => el('div', { class: 'tf-field' }, el('span', { text: titel }), ...k);
  const selbst = (fn) => (v) => { fn(v); F.anlass = null; speichern(); neu(); };

  function wahlAnsicht() {
    // 1. Anlässe
    const c1 = el('article', { class: 'tf-card tf-fl-anlass', id: 'karte-flow-anlass' });
    const w = woche();
    c1.appendChild(el('div', { class: 'tf-gym-kopf' }, el('h2', { text: 'Wonach ist dir heute?' }), el('p', { text: w.L.length ? 'Diese Woche: ' + w.L.length + (w.L.length === 1 ? ' Einheit' : ' Einheiten') + ' · ' + w.min + ' min' : 'Tippe an – die Einheit steht sofort.' })));
    const raster = el('div', { class: 'tf-fl-anlaesse' });
    Object.entries(ANLASS).forEach(([id, a]) => {
      const b = el('button', { type: 'button', class: 'tf-fl-a', 'aria-pressed': String(F.anlass === id) },
        el('span', { class: 'tf-fl-a-i' }, svgIco(a.icon)), el('span', { class: 'tf-fl-a-t' }, el('b', { text: a.titel }), el('small', { text: a.dauer + ' min · ' + STIL[a.stil][0] })));
      b.addEventListener('click', () => { if (F.anlass === id) { T.geh('training/flow/einheit'); return; } Object.assign(F, { anlass: id, stil: a.stil, fokus: a.fokus, dauer: a.dauer }); speichern(); neu(); });
      raster.appendChild(b);
    });
    c1.appendChild(raster);
    // 2. Selbst zusammenstellen
    const niv = nivIdx();
    const c2 = karte({ farbe: 'teal', icon: 'i-lotus', titel: 'Selbst zusammenstellen', sub: 'Stil, Fokus und Zeit', id: 'karte-flow-selbst' });
    const f = el('div', { class: 'tf-gym-wahl' },
      feld('Stil', seg(Object.entries(STIL).map(([k, s]) => [k, s[0]]), F.stil, selbst((v) => { F.stil = v; }), 'Stil', 'tf-fl-stil'), el('small', { class: 'tf-ich-hint', text: STIL[F.stil][1] })),
      feld('Fokus', chips(Object.entries(FOKUS), F.fokus, selbst((v) => { F.fokus = v; }), 'Fokus')),
      el('div', { class: 'tf-gym-2' },
        feld('Dauer in Minuten', seg(DAUER.map((d) => [d, String(d)]), F.dauer, selbst((v) => { F.dauer = v; }), 'Dauer in Minuten')),
        feld('Erfahrung', seg(NIVEAU, NIVEAU[niv][0], (v) => { F.niveau = v; speichern(); neu(); }, 'Erfahrung'))));
    c2.appendChild(f);
    if (einsteiger()) c2.appendChild(el('div', { class: 'tf-fl-erkl' }, el('p', null, el('b', { text: 'Pilates' }), ' kräftigt vor allem die tiefe Bauch- und Rückenmuskulatur – mit langsamen, genauen Bewegungen.'), el('p', null, el('b', { text: 'Yoga' }), ' verbindet Haltungen mit ruhiger Atmung – für Beweglichkeit, Gleichgewicht und Entspannung.'), el('p', { text: 'Du brauchst nur eine Matte oder einen Teppich. Schmerz ist ein Stoppsignal – ein Ziehen in der Dehnung ist in Ordnung.' })));
    const H = heute();
    if (H && H.ampel === 'rot') c2.appendChild(el('p', { class: 'tf-gym-hinweis' }, dot('green'), el('span', { text: 'Deine Tagesform ist heute niedrig – eine ruhige Einheit ist genau richtig. Lange Haltezeiten und langsames Atmen helfen beim Erholen.' })));
    const bib = el('button', { type: 'button', class: 'tf-btn tf-btn-plain tf-gym-bibknopf' }, svgIco('i-list'), ' Alle ' + L.length + ' Übungen mit Anleitung');
    bib.addEventListener('click', () => T.geh('training/flow/uebungen'));
    c2.appendChild(bib);
    // Leiste unten
    const E = einheit();
    const los = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-play'), ' Einheit zeigen');
    los.addEventListener('click', () => T.geh('training/flow/einheit'));
    const leiste = el('div', { class: 'tf-gym-los tf-fl-los', id: 'flow-los' }, el('span', { class: 'tf-gym-los-t' }, el('b', { text: E.titel }), el('small', { text: E.min + ' min · ' + E.anzahl + ' Übungen · ' + STIL[F.stil][0] })), los);
    return [el('div', { class: 'tf-grid' }, c1, c2), leiste];
  }
  function dauerTxt(u, sek) { return u.wdh ? u.wdh + (u.seiten ? ' je Seite' : '') : sek >= 90 ? minTxt(sek) + (u.seiten ? ' je Seite' : '') : sek + ' s' + (u.seiten ? ' je Seite' : ''); }
  function uebung(u, sek, nr) {
    const d = el('details', { class: 'tf-gym-u tf-fl-u' });
    d.appendChild(el('summary', null, el('span', { class: 'tf-gym-nr tf-fl-nr num', text: String(nr) }), el('span', { class: 'tf-gym-ut' }, el('b', { text: u.name }), el('small', { text: (sek ? dauerTxt(u, sek) + ' · ' : '') + LAGE_TXT[u.lage] })), el('span', { class: 'tf-gym-mu', text: u.sk || '' })));
    d.appendChild(el('div', { class: 'tf-gym-body' },
      el('ol', { class: 'tf-steps' }, ...u.schritte.map((s) => el('li', { text: s }))),
      el('p', { class: 'tf-gym-achte' }, el('b', { text: 'Atmung: ' }), u.atem),
      el('p', { class: 'tf-gym-achte' }, el('b', { text: 'Worauf achten: ' }), u.achte),
      el('div', { class: 'tf-gym-var' }, el('div', null, el('small', { text: 'Leichter' }), el('span', { text: u.leichter })), el('div', null, el('small', { text: 'Schwerer' }), el('span', { text: u.schwerer }))),
      el('p', { class: 'tf-fl-wirkt' }, u.wirkt),
      el('div', { class: 'tf-gym-tags' }, el('span', { class: 'tf-pf-tag tf-fl-tag', text: u.stil === 'beide' ? 'Pilates & Yoga' : STIL[u.stil][0] }), ...u.fokus.map((f) => el('span', { class: 'tf-pf-tag', text: FOKUS[f] })))));
    return d;
  }
  const PH_FARBE = { ankommen: 'var(--tf-mint)', warm: 'var(--tf-yellow)', haupt: 'var(--tf-teal)', aus: 'var(--tf-indigo)' };
  function einheitAnsicht() {
    const E = einheit();
    T.kopf({ sub: STIL[F.stil][0] + ' · ' + FOKUS[E.fokus] + ' · ' + NIVEAU[E.niv][1] });
    const c = el('article', { class: 'tf-card tf-fl-einheit', id: 'karte-flow-einheit' });
    c.appendChild(el('div', { class: 'tf-fl-kopf' },
      el('div', { class: 'tf-fl-kopf-i' }, svgIco(F.anlass ? ANLASS[F.anlass].icon : 'i-lotus')),
      el('div', null, el('h2', { class: 'tf-gym-wk-t', text: E.titel }), el('p', { class: 'tf-gym-wk-z', text: STIL[F.stil][0] + ' · ' + NIVEAU[E.niv][1] }))));
    c.appendChild(el('div', { class: 'tf-gym-zahlen' },
      el('div', null, el('b', { class: 'num', text: String(E.min) }), el('small', { text: 'Minuten' })),
      el('div', null, el('b', { class: 'num', text: String(E.anzahl) }), el('small', { text: 'Übungen' })),
      el('div', null, el('b', { class: 'num', text: String(E.phasen.length) }), el('small', { text: 'Phasen' }))));
    // Zeitleiste der Phasen
    const leiste = el('div', { class: 'tf-fl-leiste', 'aria-hidden': 'true' });
    E.phasen.forEach((p) => { const i = el('i', { title: p.name }); i.style.flexGrow = String(p.sek); i.style.background = PH_FARBE[p.id]; leiste.appendChild(i); });
    const leg = el('div', { class: 'tf-fl-leg' }, ...E.phasen.map((p) => { const i = el('i'); i.style.background = PH_FARBE[p.id]; return el('span', null, i, p.name + ' ' + minTxt(p.sek)); }));
    c.append(leiste, leg);
    const start = el('button', { type: 'button', class: 'tf-btn tf-btn-primary tf-fl-start', id: 'flow-start' }, svgIco('i-play'), ' Geführt starten');
    start.addEventListener('click', () => spieler(E));
    c.append(start, el('p', { class: 'tf-fl-start-t', text: 'Mit Timer, Seitenwechsel und Atemhilfe – der Bildschirm bleibt an.' }));
    // Phasen mit Übungen
    let nr = 0;
    E.phasen.forEach((p) => {
      const kopf = el('div', { class: 'tf-gym-sek-k tf-gym-haupt' }, el('b', null, el('i', { class: 'tf-fl-punkt', style: 'background:' + PH_FARBE[p.id] }), p.name + (p.runden > 1 ? ' · ' + p.runden + ' Runden' : '')), el('span', { text: minTxt(p.sek) }));
      const list = el('div', { class: 'tf-gym-liste' });
      p.items.forEach((i) => list.appendChild(uebung(i.u, i.sek, ++nr)));
      c.append(kopf, list);
    });
    const W = WARUM[E.fokus] || WARUM.ganz;
    c.appendChild(el('div', { class: 'tf-fl-warum' }, el('b', { text: 'Warum das wirkt' }), el('p', { text: W[0] }), el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: W[1] }))));
    const heuteDa = F.log.some((e) => e && e.d === heuteIso() && e.t === E.titel.slice(0, 40));
    const fertig = el('button', { type: 'button', class: 'tf-btn tf-btn-primary', disabled: heuteDa }, svgIco('i-check'), heuteDa ? ' Heute erledigt' : ' Erledigt');
    fertig.addEventListener('click', () => { eintragen(E); A().toast('Gespeichert – ' + E.min + ' min ' + STIL[F.stil][0] + '.'); T.geh('training/flow', { ersetzen: true }); });
    const mischen = el('button', { type: 'button', class: 'tf-btn' }, svgIco('i-shuffle'), ' Neu mischen');
    mischen.addEventListener('click', () => { F.seed = (F.seed % 100000) + 1; speichern(); neu(); });
    c.appendChild(el('div', { class: 'tf-form-actions tf-gym-akt tf-fl-akt' }, fertig, mischen));
    return [c];
  }
  function bibliothek() {
    T.kopf({ sub: L.length + ' Übungen mit Anleitung' });
    const c = el('article', { class: 'tf-card tf-span2', id: 'karte-flow-bib' });
    c.appendChild(chips([['alle', 'Alle'], ['pilates', 'Pilates'], ['yoga', 'Yoga']], F.bibStil, (v) => { F.bibStil = v; speichern(); neu(); }, 'Stil'));
    c.appendChild(chips([['alle', 'Jeder Fokus']].concat(Object.entries(FOKUS).filter(([k]) => k !== 'ganz')), F.bibFokus, (v) => { F.bibFokus = v; speichern(); neu(); }, 'Fokus', 'tf-gym-filter'));
    const liste = L.filter((u) => (F.bibStil === 'alle' || u.stil === F.bibStil || u.stil === 'beide') && (F.bibFokus === 'alle' || u.fokus.includes(F.bibFokus)));
    const box = el('div', { class: 'tf-gym-liste' });
    liste.forEach((u, i) => box.appendChild(uebung(u, u.zeit, i + 1)));
    c.append(el('p', { class: 'tf-gym-anzahl', text: liste.length + ' Übungen' }), box,
      el('p', { class: 'tf-note tf-quelle', text: 'Pilates: Kloubec, J Strength Cond Res 2010 · Yamato et al., Cochrane 2015. Yoga: Wieland et al., Cochrane 2022 · Pascoe et al., Psychoneuroendocrinology 2017 · Polsgrove et al., Int J Yoga 2016. Dehnen: Thomas et al., Int J Sports Med 2018 · Behm et al., Appl Physiol Nutr Metab 2016.' }));
    return c;
  }

  /* ---------- Geführter Modus: Timer, Seitenwechsel, Atemhilfe ---------- */
  function spieler(E) {
    const schritte = [];
    E.phasen.forEach((p) => { for (let r = 0; r < p.runden; r++) p.items.forEach(({ u, sek }) => (u.seiten ? ['links', 'rechts'] : [null]).forEach((s, j) => schritte.push({ u, sek, seite: s, ph: p, runde: p.runden > 1 ? r + 1 : 0, neu: j === 0 }))); });
    const gesamt = schritte.reduce((x, s) => x + s.sek, 0);
    let i = 0, rest = 0, vor = 0, pause = false, letzte = Date.now(), tick = null, sperre = null, fertig = false;
    const vorher = document.activeElement;
    const root = document.getElementById('tf');
    const R = 92, U = 2 * Math.PI * R;
    const ringS = svg('svg', { viewBox: '0 0 220 220', class: 'tf-fp-ring-svg', 'aria-hidden': 'true' });
    svg('circle', { cx: 110, cy: 110, r: R, class: 'tf-fp-ring-bg' }, ringS);
    const bogen = svg('circle', { cx: 110, cy: 110, r: R, class: 'tf-fp-ring-v', 'stroke-dasharray': U.toFixed(1), 'stroke-dashoffset': '0', transform: 'rotate(-90 110 110)' }, ringS);
    const zahl = el('b', { class: 'num' }), zahlK = el('small');
    const atemK = el('div', { class: 'tf-fp-atem', 'aria-hidden': 'true' });
    const ring = el('div', { class: 'tf-fp-ring' }, atemK, ringS, el('div', { class: 'tf-fp-zahl' }, zahl, zahlK));
    const phTxt = el('b'), zaehler = el('span');
    const balken = el('i');
    const name = el('h2', { class: 'tf-fp-name', 'aria-live': 'polite' }), seiteT = el('p', { class: 'tf-fp-seite' }), tipp = el('p', { class: 'tf-fp-tipp' }), naechste = el('p', { class: 'tf-fp-naechste' });
    const anl = el('div', { class: 'tf-fp-anl', hidden: true }), mehrK = el('button', { type: 'button', class: 'tf-fp-mehr', 'aria-expanded': 'false' }, 'Ganze Anleitung');
    mehrK.addEventListener('click', () => { anl.hidden = !anl.hidden; mehrK.setAttribute('aria-expanded', String(!anl.hidden)); mehrK.textContent = anl.hidden ? 'Ganze Anleitung' : 'Anleitung ausblenden'; });
    const knopf = (icon, label, fn, cls) => { const b = el('button', { type: 'button', class: 'tf-fp-k ' + (cls || ''), 'aria-label': label }, svgIco(icon)); b.addEventListener('click', fn); return b; };
    const zurueckK = knopf('i-prev', 'Vorherige Übung', () => springe(-1));
    const pauseK = knopf('i-pause', 'Pause', () => setPause(!pause), 'gross');
    const weiterK = knopf('i-next', 'Nächste Übung', () => springe(1));
    const zu = knopf('i-x', 'Beenden', schliessen, 'zu');
    const mitte = el('div', { class: 'tf-fp-mitte' }, ring, name, seiteT, tipp, mehrK, anl);
    const knoepfe = el('div', { class: 'tf-fp-knoepfe' }, zurueckK, pauseK, weiterK);
    const box = el('div', { class: 'tf-fp', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Geführte Einheit: ' + E.titel },
      el('div', { class: 'tf-fp-kopf' }, el('div', { class: 'tf-fp-ph' }, phTxt, zaehler), zu),
      el('div', { class: 'tf-fp-bar' }, balken), mitte, naechste, knoepfe);
    root.appendChild(box); document.body.classList.add('tf-sheet-offen');
    let ruhigeAnim = false; try { ruhigeAnim = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* egal */ }
    async function wachHalten() { try { if (navigator.wakeLock && !sperre) { sperre = await navigator.wakeLock.request('screen'); sperre.addEventListener('release', () => { sperre = null; }); } } catch (e) { sperre = null; } }
    const sichtbar = () => { if (document.visibilityState === 'visible' && !fertig) wachHalten(); };
    document.addEventListener('visibilitychange', sichtbar);
    function ladeSchritt(n) {
      i = Math.max(0, Math.min(schritte.length - 1, n));
      const s = schritte[i];
      rest = s.sek * 1000; vor = (s.neu ? (i === 0 ? 5 : 6) : 4) * 1000;
      mitte.classList.remove('atemhilfe');
      zeigen(true);
    }
    function vibriere(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* egal */ } }
    function zeigen(neuGeladen) {
      const s = schritte[i];
      phTxt.textContent = s.ph.name + (s.runde ? ' · Runde ' + s.runde : '');
      zaehler.textContent = ' ' + (i + 1) + ' von ' + schritte.length;
      const vorbei = schritte.slice(0, i).reduce((x, t) => x + t.sek, 0) + (s.sek - Math.max(0, rest) / 1000);
      balken.style.width = Math.min(100, (100 * vorbei) / gesamt).toFixed(1) + '%';
      if (neuGeladen) {
        name.textContent = s.u.name;
        seiteT.textContent = s.seite ? (s.seite === 'links' ? 'Linke Seite' : 'Rechte Seite') + (s.u.wdh ? ' · ' + s.u.wdh : '') : s.u.wdh ? s.u.wdh + ' – in deinem Tempo' : (s.u.sk || '');
        tipp.textContent = s.u.schritte[0];
        anl.replaceChildren(el('ol', { class: 'tf-steps' }, ...s.u.schritte.map((t) => el('li', { text: t }))), el('p', null, el('b', { text: 'Atmung: ' }), s.u.atem), el('p', null, el('b', { text: 'Worauf achten: ' }), s.u.achte));
        const n = schritte[i + 1];
        naechste.textContent = n ? 'Als Nächstes: ' + (n.u === s.u ? 'andere Seite' : n.u.name) : 'Danach: geschafft';
      }
      mitte.classList.toggle('atemhilfe', !!s.u.atemF && !ruhigeAnim && vor <= 0); // Atemkreis startet mit der Übung, nicht im Vorlauf
      if (vor > 0) {
        ring.classList.add('vor');
        zahl.textContent = String(Math.ceil(vor / 1000));
        zahlK.textContent = s.neu ? 'Gleich geht’s los' : 'Seite wechseln';
        bogen.setAttribute('stroke-dashoffset', '0');
      } else {
        ring.classList.remove('vor');
        const sek = Math.max(0, Math.ceil(rest / 1000));
        zahl.textContent = sek >= 60 ? Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0') : String(sek);
        if (s.u.atemF) { const t = ((s.sek * 1000 - rest) / 1000) % 10; zahlK.textContent = t < 4 ? 'Einatmen' : 'Ausatmen'; } else zahlK.textContent = sek >= 60 ? 'Minuten' : 'Sekunden';
        bogen.setAttribute('stroke-dashoffset', (U * (1 - rest / (s.sek * 1000))).toFixed(1));
      }
      pauseK.setAttribute('aria-label', pause ? 'Weiter' : 'Pause');
      pauseK.replaceChildren(svgIco(pause ? 'i-play' : 'i-pause'));
      box.classList.toggle('pausiert', pause);
    }
    function schritt() {
      const jetzt = Date.now(), dt = jetzt - letzte; letzte = jetzt;
      if (pause || fertig) return;
      if (vor > 0) { vor -= dt; if (vor <= 0) { vor = 0; vibriere(60); zeigen(true); } else zeigen(false); return; }
      rest -= dt;
      if (rest <= 0) { if (i >= schritte.length - 1) { ende(); return; } vibriere([40, 60, 40]); ladeSchritt(i + 1); return; }
      zeigen(false);
    }
    function springe(d) { if (fertig) return; ladeSchritt(i + d); }
    function setPause(p) { pause = p; letzte = Date.now(); zeigen(false); }
    function ende() {
      fertig = true; clearInterval(tick); vibriere([80, 80, 80]);
      if (sperre) { try { sperre.release(); } catch (e) { /* egal */ } }
      const speichernK = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, svgIco('i-check'), ' Speichern & schließen');
      speichernK.addEventListener('click', () => { eintragen(E); A().toast('Gespeichert – ' + E.min + ' min ' + STIL[F.stil][0] + '.'); schliessen(); T.geh('training/flow', { ersetzen: true }); });
      const nur = el('button', { type: 'button', class: 'tf-btn' }, 'Schließen');
      nur.addEventListener('click', schliessen);
      mitte.replaceChildren(el('div', { class: 'tf-fp-fertig' }, el('span', { class: 'tf-fp-fertig-i' }, svgIco('i-check')), el('h2', { text: 'Geschafft!' }), el('p', { text: E.min + ' min ' + STIL[F.stil][0] + ' – ' + E.titel + '.' }), el('div', { class: 'tf-form-actions' }, speichernK, nur)));
      naechste.textContent = ''; knoepfe.hidden = true; balken.style.width = '100%';
      phTxt.textContent = 'Fertig'; zaehler.textContent = '';
      speichernK.focus();
    }
    function taste(e) {
      if (e.key === 'Escape') { e.preventDefault(); schliessen(); }
      else if (fertig) return;
      else if ((e.key === ' ' && !(e.target && e.target.closest && e.target.closest('button'))) || e.key === 'k') { e.preventDefault(); setPause(!pause); }
      else if (e.key === 'ArrowRight') springe(1);
      else if (e.key === 'ArrowLeft') springe(-1);
      else if (e.key === 'Tab') { // Fokus bleibt im Dialog
        const f = $$('button:not([hidden]):not([disabled])', box).filter((b) => b.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    }
    function schliessen() {
      clearInterval(tick); fertig = true;
      document.removeEventListener('keydown', taste); document.removeEventListener('visibilitychange', sichtbar);
      if (sperre) { try { sperre.release(); } catch (e) { /* egal */ } }
      box.remove(); document.body.classList.remove('tf-sheet-offen');
      if (vorher && vorher.focus && document.contains(vorher)) vorher.focus();
    }
    document.addEventListener('keydown', taste);
    ladeSchritt(0); wachHalten();
    tick = setInterval(schritt, 200);
    pauseK.focus();
  }

  /* ---------- Schnittstellen ---------- */
  function kurz() {
    laden();
    const e = F.log.reduce((x, y) => (y && y.d && (!x || y.d >= x.d) ? y : x), null); // jüngster Eintrag nach Datum
    if (e) { const t = Math.round((toDay(heuteIso()) - toDay(e.d)) / DAY); return { wert: e.t, txt: true, sub: 'zuletzt ' + (t <= 0 ? 'heute' : t === 1 ? 'gestern' : 'vor ' + t + ' Tagen') + ' · ' + woche().L.length + ' in 7 Tagen' }; }
    if (F.anlass) return { wert: ANLASS[F.anlass].titel, txt: true, sub: F.dauer + ' min · ' + STIL[F.stil][0] };
    return null;
  }
  function vorlage(o) { // aus dem Trainingsplan
    laden();
    if (STIL[o.stil]) F.stil = o.stil;
    if (FOKUS[o.fokus]) F.fokus = o.fokus;
    if (o.dauer) F.dauer = DAUER.reduce((b, d) => (Math.abs(d - o.dauer) < Math.abs(b - o.dauer) ? d : b), 20);
    F.anlass = null; speichern();
  }
  T.seite('flow', renderFlow);
  T.routen('training/flow', (rest) => (rest === 'einheit' ? { seite: 'flow', titel: 'Deine Einheit', sub: '', eltern: 'training/flow' } : rest === 'uebungen' ? { seite: 'flow', titel: 'Alle Übungen', sub: '', eltern: 'training/flow' } : null));
  window.tfFlow = { anzahl: L.length, kurz, vorlage, einheit: () => (laden(), einheit()) };
})();
