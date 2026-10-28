/* Tagesform · Wissen: Lexikon, häufige Fragen, Begriffe zum Antippen und das Wissenslevel.
   Jeder Eintrag: einfache Erklärung für alle, „Genauer“ für Fortgeschrittene und Profis, Quellen.
   Einsteiger sehen zusätzlich unter vielen Karten eine Ein-Satz-Erklärung. */
(function () {
  'use strict';
  const T = window.tfApp;
  if (!T) return;
  const { $, $$, el, rowsOf, setMsg, svgIco } = T.ui;
  const A = () => dash.app;

  const KAT = {
    erholung: ['Erholung & Schlaf', 'i-moon', 'indigo'],
    belastung: ['Belastung & Steuerung', 'i-gauge', 'orange'],
    ausdauer: ['Ausdauer & Intensität', 'i-heart', 'pink'],
    laufen: ['Laufen', 'i-run', 'mint'],
    rad: ['Rad', 'i-bike', 'orange'],
    schwimmen: ['Schwimmen', 'i-swim', 'blue'],
    kraft: ['Kraft & Beweglichkeit', 'i-dumbbell', 'purple'],
    flow: ['Pilates, Yoga & Atmung', 'i-lotus', 'teal'],
    ernaehrung: ['Ernährung', 'i-drop', 'green'],
    gesundheit: ['Gesundheit & Fitness-Alter', 'i-hourglass', 'teal'],
  };

  /* ---------- Begriffe ---------- */
  const B = [
    // Erholung & Schlaf
    { id: 'tagesform', name: 'Tagesform', kat: 'erholung', kurz: 'Dein Bereitschafts-Wert von 1 bis 99: wie gut dein Körper heute Belastung verträgt.',
      text: 'Tagesform vergleicht jede Nacht deine HRV, deinen Ruhepuls und deinen Schlaf – und morgens dein Befinden aus dem Check-in – mit deinem eigenen Normal. Liegen die Werte im oder über dem Normal, bist du bereit für eine harte Einheit (grün). Weichen sie deutlich ab, ist heute lockeres Training oder Erholung klüger (gelb oder rot). Es zählt immer der Vergleich mit dir selbst, nie mit anderen.',
      profi: 'Gewichtete z-Werte gegen die eigene Basis: 0,4 HRV (70 % letzte Nacht, 30 % 7-Tage-Schnitt), je 0,2 Ruhepuls, Schlafleistung und Befinden (Basis: 60 Nächte bzw. 28 Check-ins). Ohne Check-in 0,5 / 0,25 / 0,25. Absolute Grenzen bei sehr kurzem Schlaf, Infektzeichen und Schmerz. Ampel: 67–99 bereit, 34–66 moderat, 1–33 erholen.',
      app: ['heute/tagesform', 'Deine Tagesform'], quelle: 'Buchheit, Front Physiol 2014 · Saw et al., Br J Sports Med 2016 · Bellenger et al., Sports Med 2016', siehe: ['hrv', 'ruhepuls', 'checkin', 'schlafbedarf'] },
    { id: 'hrv', name: 'HRV', lang: 'Herzfrequenzvariabilität', kat: 'erholung', kurz: 'Wie unregelmäßig dein Herz schlägt – ein Fenster in dein Nervensystem.',
      text: 'Dein Herz schlägt nicht wie ein Metronom: Der Abstand zwischen zwei Schlägen schwankt um Millisekunden. Ist dein Erholungsnerv (Parasympathikus) aktiv, sind die Schwankungen groß und die HRV ist hoch. Harte Einheiten, Stress, Alkohol, wenig Schlaf oder ein beginnender Infekt senken sie. Eine hohe HRV ist nicht „besser“ als die eines anderen – vergleiche nur mit deinem eigenen Normal, und achte auf den Trend über mehrere Tage statt auf eine einzelne Nacht.',
      profi: 'Garmin misst nachts den RMSSD (Wurzel des Mittels der quadrierten Differenzen aufeinanderfolgender RR-Intervalle). Tagesform rechnet mit ln(RMSSD), weil die Werte schief verteilt sind, und bewertet den 7-Tage-Schnitt gegen Mittelwert ± 0,5 SD der letzten 60 Nächte. Einzelnächte haben eine hohe Tag-zu-Tag-Streuung.',
      app: ['gesundheit/hrv', 'Deine HRV'], quelle: 'Plews et al., Sports Med 2013 · Buchheit, Front Physiol 2014', siehe: ['hrv_korridor', 'ruhepuls', 'atmung', 'tagesform'] },
    { id: 'hrv_korridor', name: 'HRV-Korridor', kat: 'erholung', kurz: 'Dein persönlicher Normalbereich der HRV über 7 Tage.',
      text: 'Der Korridor ist das Band, in dem dein 7-Tage-Schnitt der HRV normalerweise liegt. Rutscht der Schnitt darunter, verarbeitest du Belastung gerade schlechter – dann lieber locker trainieren und gut schlafen. Liegt er deutlich darüber, ist das meist gute Erholung. Bei sehr hoher Trainingslast kann es aber auch eine „Sättigung“ sein; dann hilft der Blick auf Ruhepuls und Befinden.',
      profi: 'Korridor = Basis ± 0,5 SD (ln RMSSD). Einordnung mit Ruhepuls-z und Last (ACWR, TSB): sympathische Belastung (HRV ↓, Puls ↑), parasympathische Sättigung (HRV ↑↑ bei hoher Last und schlechtem Befinden). HRV-gesteuertes Training brachte in Studien gleich große oder größere Fortschritte als starre Pläne.',
      app: ['gesundheit/hrv', 'Dein Korridor'], quelle: 'Plews et al., Eur J Appl Physiol 2012 · Kiviniemi et al., Eur J Appl Physiol 2007 · Javaloyes et al., IJSPP 2019', siehe: ['hrv', 'acwr', 'tsb'] },
    { id: 'ruhepuls', name: 'Ruhepuls', kat: 'erholung', kurz: 'Dein Puls in völliger Ruhe – nachts gemessen.',
      text: 'Ausdauertraining senkt den Ruhepuls über Monate, weil das Herz mit jedem Schlag mehr Blut pumpt. Kurzfristig steigt er durch Ermüdung, Hitze, Alkohol, Stress oder einen Infekt. Liegt dein Ruhepuls mehrere Nächte deutlich über deinem Normal, ist eine lockere Phase oft klug – besonders wenn gleichzeitig die HRV fällt.',
      profi: 'Tagesform vergleicht den nächtlichen Ruhepuls mit Mittelwert und Streuung der letzten 60 Nächte. Etwa +5 bpm über mehrere Tage gelten als Warnzeichen; zusammen mit sinkender HRV spricht das für sympathische Belastung.',
      app: ['gesundheit/puls', 'Dein Ruhepuls'], quelle: 'Buchheit, Front Physiol 2014 · Achten & Jeukendrup, Sports Med 2003', siehe: ['hrv', 'atemfrequenz'] },
    { id: 'atemfrequenz', name: 'Atemfrequenz im Schlaf', kat: 'erholung', kurz: 'Wie oft du nachts pro Minute atmest – sehr stabil und darum ein gutes Warnsignal.',
      text: 'Die Atemfrequenz im Schlaf ändert sich normalerweise kaum. Steigt sie deutlich über deine Basis, kann das ein früher Hinweis auf einen Infekt sein – manchmal schon, bevor du dich krank fühlst. Dann lieber einen Gang zurückschalten.',
      profi: 'In Wearable-Studien stieg die nächtliche Atemfrequenz bei Covid-19 bei vielen Betroffenen schon vor Symptombeginn. Tagesform nutzt eine Warnschwelle über der persönlichen Basis.',
      app: ['gesundheit/puls', 'Deine Atemfrequenz'], quelle: 'Miller et al., PLoS One 2020', siehe: ['ruhepuls', 'krank'] },
    { id: 'schlafbedarf', name: 'Schlafbedarf & Schlafschuld', kat: 'erholung', kurz: 'Wie viel Schlaf du brauchst – und wie viel dir in den letzten 7 Nächten gefehlt hat.',
      text: 'Erwachsene brauchen für die Gesundheit mindestens 7 Stunden, Sportler mit viel Training oft 8 bis 9. Die Schlafschuld zählt zusammen, wie viel dir in den letzten 7 Nächten gegenüber deinem Bedarf gefehlt hat. Schon wenige zu kurze Nächte verschlechtern Reaktion, Ausdauer und Erholung – und man merkt es selbst oft kaum.',
      profi: 'Van Dongen et al.: 14 Nächte mit 6 h Schlaf verschlechterten die Leistung so stark wie eine durchwachte Nacht, die Probanden schätzten sich aber kaum müder ein. Schlafverlängerung verbesserte bei Basketballern Sprintzeiten und Trefferquote.',
      app: ['gesundheit/schlaf', 'Dein Schlaf'], quelle: 'Watson et al., Sleep 2015 · Van Dongen et al., Sleep 2003 · Mah et al., Sleep 2011 · Walsh et al., Br J Sports Med 2021', siehe: ['schlafphasen', 'schlafrhythmus'] },
    { id: 'schlafphasen', name: 'Schlafphasen', kat: 'erholung', kurz: 'Leicht-, Tief- und REM-Schlaf – jede Phase hat eine Aufgabe.',
      text: 'Im Tiefschlaf schüttet der Körper Wachstumshormon aus und repariert Gewebe – er liegt vor allem in der ersten Nachthälfte. Im REM-Schlaf verarbeitet das Gehirn Erlebtes und Gelerntes, er häuft sich gegen Morgen. Wer zu früh aufsteht, verliert vor allem REM-Schlaf. Die Phasen aus einer Uhr sind eine Schätzung: Dauer und Regelmäßigkeit sind verlässlicher.',
      profi: 'Wearables schätzen Phasen aus Bewegung und Puls(variabilität). Gegenüber der Polysomnographie sind Gesamtschlaf und Wachzeiten ordentlich, die Zuordnung der Phasen nur mäßig genau.',
      app: ['gesundheit/schlaf', 'Deine Schlafphasen'], quelle: 'Fullagar et al., Sports Med 2015 · Chinoy et al., Sleep 2021', siehe: ['schlafbedarf'] },
    { id: 'schlafrhythmus', name: 'Regelmäßigkeit & Social Jetlag', kat: 'erholung', kurz: 'Wie gleichmäßig du schlafen gehst und aufstehst.',
      text: 'Gehst du jeden Tag etwa zur gleichen Zeit ins Bett, schläfst du meist schneller ein und erholter. „Social Jetlag“ nennt man den Unterschied zwischen Werktagen und Wochenende – wie eine kleine Zeitverschiebung jede Woche. Regelmäßigkeit hängt in Studien mit besserer Stimmung und Leistung zusammen.',
      app: ['gesundheit/schlaf', 'Dein Schlafrhythmus'], quelle: 'Wittmann et al., Chronobiol Int 2006 · Phillips et al., Sci Rep 2017', siehe: ['schlafbedarf'] },
    { id: 'checkin', name: 'Check-in (Befinden)', kat: 'erholung', kurz: 'Fünf Fragen am Morgen: Schlaf, Energie, Muskeln, Stress, Stimmung.',
      text: 'Dein eigenes Gefühl ist erstaunlich genau: Kurze Fragebögen zeigen Überlastung oft früher und zuverlässiger als viele Messwerte. Darum fließt der Check-in in die Tagesform ein. Schmerz ab 3 von 10 an Schienbein, Knie, Achillessehne, Fuß oder Hüfte stoppt für den Tag das Laufen.',
      profi: 'Fünf Items nach McLean et al. (je 1–5). Systematisches Review von Saw et al.: Subjektive Maße reagierten auf akute und chronische Belastung sensibler und konsistenter als objektive Marker wie Blutwerte oder Puls.',
      app: ['gesundheit/checkin', 'Zum Check-in'], quelle: 'McLean et al., IJSPP 2010 · Saw et al., Br J Sports Med 2016', siehe: ['tagesform', 'interne_last'] },

    // Belastung & Steuerung
    { id: 'tss', name: 'TSS', lang: 'Training Stress Score', kat: 'belastung', kurz: 'Wie viel Belastung eine Einheit war – 100 entspricht einer Stunde an deiner Schwelle.',
      text: 'TSS fasst Dauer und Intensität in einer Zahl zusammen. Eine Stunde locker ergibt etwa 40–60, eine Stunde Vollgas an der Schwelle 100. So lassen sich Radfahren, Laufen und Schwimmen auf eine Skala bringen und addieren.',
      profi: 'TSS = Dauer (s) × NP × IF ÷ (FTP × 3600) × 100, mit IF = NP ÷ FTP. Ohne Leistungsmesser schätzt Tagesform über Lauftempo zu VT2 (rTSS), Schwimmtempo zur CSS (sTSS) oder den Puls (hrTSS).',
      app: ['training/einheiten', 'Deine Einheiten'], quelle: 'Allen & Coggan, Training and Racing with a Power Meter 2010', siehe: ['ctl', 'np_if', 'ftp'] },
    { id: 'ctl', name: 'Fitness', lang: 'CTL, Chronic Training Load', kat: 'belastung', kurz: 'Deine durchschnittliche Trainingslast der letzten etwa 6 Wochen.',
      text: 'Die Fitness steigt, wenn du über Wochen regelmäßig trainierst, und sinkt langsam in Pausen. Sie misst nicht Talent, sondern wie viel Training dein Körper gewohnt ist. Je höher, desto mehr verträgst du – vorausgesetzt, sie ist langsam gewachsen.',
      profi: 'Exponentiell gewichteter Mittelwert der täglichen TSS mit Zeitkonstante 42 Tage (Fitness-Ermüdungs-Modell nach Banister). Ein Anstieg von etwa 3–7 Punkten pro Woche gilt als gut verträglich.',
      app: ['training/form', 'Deine Fitness'], quelle: 'Banister et al., Aust J Sports Med 1975 · Allen & Coggan 2010', siehe: ['atl', 'tsb', 'rampe'] },
    { id: 'atl', name: 'Ermüdung', lang: 'ATL, Acute Training Load', kat: 'belastung', kurz: 'Deine Trainingslast der letzten etwa 7 Tage.',
      text: 'Die Ermüdung reagiert schnell: Nach einer harten Woche ist sie hoch, nach ein paar ruhigen Tagen wieder niedrig. Sie ist die Gegenspielerin der Fitness.',
      profi: 'Exponentiell gewichteter Mittelwert der täglichen TSS mit Zeitkonstante 7 Tage.',
      app: ['training/form', 'Deine Ermüdung'], quelle: 'Banister et al., Aust J Sports Med 1975 · Allen & Coggan 2010', siehe: ['ctl', 'tsb'] },
    { id: 'tsb', name: 'Form', lang: 'TSB, Training Stress Balance', kat: 'belastung', kurz: 'Fitness minus Ermüdung – wie frisch du gerade bist.',
      text: 'Ist die Form negativ, trainierst du gerade mehr, als du gewohnt bist – im Aufbau ist das normal und nötig. Vor einem Rennen soll sie positiv werden: Dann ist die Ermüdung weg, die Fitness aber noch da. Über Wochen sehr negativ (unter etwa −25 bis −30) steigt das Risiko für Überlastung.',
      profi: 'TSB = CTL − ATL (Vortag). Für Rennen werden meist +5 bis +25 angestrebt, je nach Distanz und Athlet.',
      app: ['training/form', 'Deine Form'], quelle: 'Allen & Coggan 2010 · Mujika & Padilla, Med Sci Sports Exerc 2003', siehe: ['ctl', 'atl', 'tapering'] },
    { id: 'acwr', name: 'ACWR', lang: 'Akut-zu-chronisch-Verhältnis', kat: 'belastung', kurz: 'Wie viel du diese Woche trainierst – verglichen mit den Wochen davor.',
      text: 'Ein Wert von 1,0 heißt: diese Woche so viel wie sonst. Zwischen 0,8 und 1,3 passen sich Muskeln, Sehnen und Knochen gut an. Springt der Wert über 1,5, war das Verletzungsrisiko in Studien höher – besonders beim Laufen. Das Prinzip dahinter: lieber regelmäßig etwas mehr als plötzlich viel mehr.',
      profi: 'Tagesform: 7-Tage-Last gegen die 28 Tage davor (entkoppelt), auch je Disziplin. Das Konzept ist umstritten (statistische Kopplung, Artefakte von Quotienten). Es taugt als einfache Warnlampe für Sprünge, nicht als präzises Risikomodell.',
      app: ['training/last', 'Deine Belastungssprünge'], quelle: 'Gabbett, Br J Sports Med 2016 · Williams et al., Br J Sports Med 2017 · Impellizzeri et al., IJSPP 2020', siehe: ['laufbudget', 'rampe'] },
    { id: 'rampe', name: 'Rampe', kat: 'belastung', kurz: 'Wie schnell deine Fitness pro Woche steigt.',
      text: 'Die Rampe ist die Änderung der Fitness in 7 Tagen. Etwa 3–7 Punkte pro Woche vertragen die meisten gut. Nach einer Pause oder als Einsteiger lieber weniger.',
      app: ['training/form', 'Deine Rampe'], quelle: 'Allen & Coggan 2010', siehe: ['ctl', 'acwr'] },
    { id: 'monotonie', name: 'Monotonie & Strain', kat: 'belastung', kurz: 'Ob deine Woche abwechslungsreich war – oder jeden Tag gleich hart.',
      text: 'Training braucht harte und lockere Tage. Sind alle Tage ähnlich belastend, steigt die Monotonie. Zusammen mit hoher Last ging das in Studien mit mehr Infekten und Überlastung einher.',
      profi: 'Monotonie = Ø Tageslast ÷ Standardabweichung der Woche; Strain = Wochenlast × Monotonie. Foster beschrieb Probleme ab etwa Monotonie 2.',
      app: ['training/umfang', 'Deine Monotonie'], quelle: 'Foster, Med Sci Sports Exerc 1998', siehe: ['polarisiert'] },
    { id: 'interne_last', name: 'Interne und externe Last', kat: 'belastung', kurz: 'Was du trainiert hast – und wie dein Körper darauf reagiert.',
      text: 'Externe Last ist die Arbeit: Kilometer, Watt, Minuten. Interne Last ist, was sie mit dir macht: Puls, HRV, Schlaf, Befinden. Dieselbe Einheit kann an einem guten Tag leicht und an einem schlechten schwer sein. Erst beides zusammen zeigt, ob die Belastung passt.',
      app: ['training/last', 'Deine Last-Bilanz'], quelle: 'Impellizzeri et al., IJSPP 2019 · Halson, Sports Med 2014', siehe: ['rpe', 'hrv'] },
    { id: 'rpe', name: 'RPE', lang: 'Anstrengungsgefühl, 0–10', kat: 'belastung', kurz: 'Wie anstrengend sich eine Einheit angefühlt hat.',
      text: 'RPE ist dein Anstrengungsgefühl auf einer Skala von 0 bis 10: 1–2 sehr leicht, 3–4 locker, 5–6 mittel, 7–8 hart, 9–10 maximal. Mal Dauer ergibt das die Session-RPE – eine einfache und gut belegte Art, Trainingslast zu messen, ganz ohne Uhr.',
      profi: 'sRPE = CR-10-Wert × Minuten. Korreliert gut mit pulsbasierten Lastmaßen und funktioniert auch für Kraft- und Intervalltraining.',
      quelle: 'Foster et al., J Strength Cond Res 2001', siehe: ['sprechtest', 'interne_last'] },
    { id: 'superkompensation', name: 'Superkompensation', kat: 'belastung', kurz: 'Training ermüdet – stärker wirst du in der Erholung danach.',
      text: 'Nach einer Belastung sinkt deine Leistungsfähigkeit kurz, danach baut der Körper über das alte Niveau hinaus auf. Kommt die nächste Belastung zur richtigen Zeit, wächst die Form Schritt für Schritt. Zu früh – und die Ermüdung stapelt sich; zu spät – und der Effekt verpufft.',
      profi: 'Ein vereinfachtes Bild. Muskeln, Sehnen, Enzyme und Nervensystem passen sich unterschiedlich schnell an; das Fitness-Ermüdungs-Modell nach Banister beschreibt das genauer.',
      quelle: 'Banister et al., Aust J Sports Med 1975 · Kiely, IJSPP 2012', siehe: ['entlastungswoche', 'ctl'] },
    { id: 'periodisierung', name: 'Periodisierung', kat: 'belastung', kurz: 'Training in Phasen planen: Grundlage, Aufbau, Spitze, Tapering.',
      text: 'Statt jede Woche dasselbe zu tun, wechseln Phasen mit unterschiedlichem Schwerpunkt. In der Grundlage viel lockeres Training, im Aufbau mehr Rennspezifisches, vor dem Rennen weniger Umfang. Dazwischen liegen Entlastungswochen. Der Trainingsplan in Tagesform baut genau so auf.',
      profi: 'Klassisch-linear, in Blöcken oder wellenförmig: Keine Form ist eindeutig überlegen. Entscheidend sind Progression, Abwechslung und Erholung – viele Details sind eher Erfahrungswissen als streng belegt.',
      app: ['training/plan', 'Zum Trainingsplan'], quelle: 'Issurin, Sports Med 2010 · Kiely, IJSPP 2012', siehe: ['entlastungswoche', 'tapering'] },
    { id: 'entlastungswoche', name: 'Entlastungswoche', kat: 'belastung', kurz: 'Eine leichtere Woche nach 2–3 harten – damit die Anpassung ankommt.',
      text: 'In einer Entlastungswoche trainierst du etwa 30–40 % weniger, aber nicht gar nicht. Die Ermüdung sinkt, die Fitness bleibt. Üblich sind 3 Wochen Aufbau und 1 Woche leichter; Einsteiger und Ältere fahren oft mit 2 + 1 besser.',
      profi: 'Bewährte Praxis der Periodisierung; der genaue Rhythmus ist eher Erfahrung als in Studien festgelegt.',
      app: ['training/plan', 'Im Trainingsplan'], quelle: 'Issurin, Sports Med 2010', siehe: ['periodisierung', 'superkompensation'] },
    { id: 'tapering', name: 'Tapering', kat: 'belastung', kurz: 'Vor dem Rennen das Training reduzieren, um frisch an den Start zu gehen.',
      text: 'In den letzten 1–3 Wochen vor einem wichtigen Rennen sinkt der Umfang deutlich, die Intensität bleibt. So verschwindet die Ermüdung, die Fitness bleibt. Eine Meta-Analyse fand den größten Effekt bei etwa 2 Wochen mit 41–60 % weniger Umfang.',
      profi: 'Bosquet et al.: im Mittel ~2–3 % Leistungsgewinn; Intensität und Häufigkeit halten, Umfang progressiv senken. Längere Rennen und höhere Trainingslast sprechen für ein längeres Taper.',
      app: ['training/saison', 'Deine Saison'], quelle: 'Bosquet et al., Med Sci Sports Exerc 2007 · Mujika & Padilla, Med Sci Sports Exerc 2003', siehe: ['tsb', 'carboloading'] },

    // Ausdauer & Intensität
    { id: 'zonen', name: 'Trainingszonen', kat: 'ausdauer', kurz: 'Bereiche der Intensität – von ganz locker bis maximal.',
      text: 'Zonen teilen die Anstrengung in Stufen. Tagesform nutzt drei, die sich an deinen Schwellen orientieren: Zone 1 unter der ersten Schwelle (locker, du kannst dich unterhalten), Zone 2 zwischen den Schwellen (zügig, nur noch kurze Sätze), Zone 3 über der zweiten Schwelle (hart, nur noch einzelne Worte). Garmin zeigt fünf Zonen – Garmins Zonen 1–3 entsprechen hier ungefähr Zone 1.',
      profi: '3-Zonen-Modell nach Seiler: Z1 < VT1/LT1, Z2 zwischen VT1 und VT2, Z3 > VT2/MLSS.',
      app: ['profil/athlet', 'Deine Schwellen'], quelle: 'Seiler, IJSPP 2010', siehe: ['schwellen', 'zone2', 'polarisiert'] },
    { id: 'zone2', name: 'Zone 2', lang: 'Grundlagenausdauer', kat: 'ausdauer', kurz: 'Das lockere, lange Training – die Basis jeder Ausdauer.',
      text: 'Gemeint ist ein Tempo, bei dem du noch ganze Sätze sprechen kannst. Hier wächst die Ausdauer deiner Muskeln (mehr Mitochondrien und Kapillaren, bessere Fettverbrennung), ohne dass du stark ermüdest. Achtung Verwechslung: „Zone 2“ im 5-Zonen-Modell ist dieses lockere Training; im 3-Zonen-Modell von Tagesform liegt es in Zone 1.',
      profi: 'Knapp unter VT1/LT1, je nach Person etwa 60–75 % der maximalen Herzfrequenz. Der Sprechtest trifft die erste Schwelle erstaunlich gut und kostet nichts.',
      quelle: 'Seiler, IJSPP 2010 · Persinger et al., Med Sci Sports Exerc 2004', siehe: ['sprechtest', 'zonen', 'polarisiert'] },
    { id: 'sprechtest', name: 'Sprechtest', kat: 'ausdauer', kurz: 'Kannst du noch ganze Sätze sprechen? Dann bist du im lockeren Bereich.',
      text: 'Ganze Sätze ohne Mühe: locker, unter der ersten Schwelle. Nur noch kurze Sätze: zügig, zwischen den Schwellen. Nur noch einzelne Worte: hart. Der Test funktioniert ohne Uhr und passt in Studien gut zu den im Labor gemessenen Schwellen.',
      quelle: 'Persinger et al., Med Sci Sports Exerc 2004 · Foster et al., Kinesiology 2018', siehe: ['zone2', 'rpe'] },
    { id: 'schwellen', name: 'VT1 und VT2', lang: 'die zwei Schwellen', kat: 'ausdauer', kurz: 'Die zwei Grenzen, an denen sich Atmung und Stoffwechsel deutlich ändern.',
      text: 'An der ersten Schwelle (VT1) fängst du an, tiefer zu atmen – bis dahin ist alles locker. An der zweiten (VT2) kippt es: Die Atmung wird schnell und schwer, lange hältst du das nicht durch. Viele Trainingsvorgaben beziehen sich auf diese zwei Punkte. Ohne Labortest schätzt Tagesform sie aus deinen Garmin-Pulszonen; im Profil kannst du sie anpassen.',
      profi: 'Ventilatorische Schwellen aus der Spiroergometrie; entsprechen ungefähr LT1 (erster Laktatanstieg) und LT2/MLSS bzw. Critical Power.',
      app: ['profil/athlet', 'Deine Schwellen im Profil'], quelle: 'Seiler, IJSPP 2010', siehe: ['zonen', 'ftp', 'css'] },
    { id: 'polarisiert', name: 'Polarisiertes Training', lang: '80/20-Prinzip', kat: 'ausdauer', kurz: 'Etwa 80 % locker, 20 % hart – das Muster der besten Ausdauersportler.',
      text: 'Spitzensportler trainieren erstaunlich viel locker und nur wenig wirklich hart. Das Mittelmaß („immer ein bisschen zügig“) ermüdet, bringt aber weniger. Für dich heißt das: Lockere Einheiten wirklich locker halten, damit die harten wirklich hart sein können.',
      profi: 'Seiler: ~80 % der Einheiten unter VT1. Stöggl & Sperlich: polarisiert besser als Schwelle, HIIT oder reiner Umfang (9 Wochen, gut Trainierte). Meta-Analyse Rosenblat et al.: Vorteil vor allem bei gut trainierten Athleten; bei weniger Trainierten ist pyramidal ähnlich gut.',
      app: ['training/umfang', 'Deine Verteilung'], quelle: 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014 · Rosenblat et al., J Strength Cond Res 2019', siehe: ['grauzone', 'zone2', 'intervalle'] },
    { id: 'grauzone', name: 'Grauzone', kat: 'ausdauer', kurz: 'Zu hart für Erholung, zu locker für einen echten Reiz.',
      text: 'Viele trainieren fast immer „mittel“ – etwas zu schnell für locker, zu langsam für Intervalle. Das macht müde, ohne die Ausdauer oder die Schwelle gezielt zu verbessern. Der Einheiten-Check zeigt dir, wann das passiert.',
      app: ['training/einheiten', 'Dein Einheiten-Check'], quelle: 'Seiler, IJSPP 2010', siehe: ['polarisiert'] },
    { id: 'vo2max', name: 'VO2max', kat: 'ausdauer', kurz: 'Wie viel Sauerstoff dein Körper maximal pro Minute verwerten kann.',
      text: 'Die VO2max ist der Motor deiner Ausdauer, angegeben in Millilitern pro Kilogramm Körpergewicht und Minute. Sie steigt durch Training – am stärksten durch harte Intervalle wie 4 × 4 Minuten – und sinkt mit dem Alter und in Pausen. Sie gehört zu den stärksten bekannten Markern für ein langes, gesundes Leben.',
      profi: 'Garmin schätzt sie aus Tempo bzw. Leistung und Puls. Helgerud et al.: 4 × 4 min bei 90–95 % HFmax steigerte die VO2max stärker als lockeres Training oder Schwellentraining. Kodama et al.: je +1 MET (≈ 3,5 ml/kg/min) etwa 13 % geringeres Sterberisiko.',
      app: ['gesundheit/fitness', 'Dein Fitness-Alter'], quelle: 'Helgerud et al., Med Sci Sports Exerc 2007 · Kodama et al., JAMA 2009', siehe: ['fitnessalter', 'intervalle'] },
    { id: 'hfmax', name: 'Maximale Herzfrequenz', kat: 'ausdauer', kurz: 'Der höchste Puls, den du erreichen kannst – sehr individuell.',
      text: 'Die Formel „220 minus Alter“ ist ungenau: Bei vielen liegt der echte Wert 10 Schläge oder mehr daneben. Besser ist der höchste Wert aus harten Einheiten oder ein Test. Ein hoher Maximalpuls bedeutet nicht mehr Fitness.',
      profi: 'Tanaka et al.: HFmax ≈ 208 − 0,7 × Alter, Standardabweichung etwa 10 bpm.',
      app: ['profil/athlet', 'Im Profil'], quelle: 'Tanaka et al., J Am Coll Cardiol 2001', siehe: ['zonen'] },
    { id: 'intervalle', name: 'Intervalltraining', lang: 'HIIT', kat: 'ausdauer', kurz: 'Harte Abschnitte mit Pausen dazwischen.',
      text: 'Intervalle setzen einen starken Reiz in kurzer Zeit, zum Beispiel 4 × 4 Minuten hart mit 3 Minuten locker dazwischen. Sie heben VO2max und Schwelle. Ein bis zwei solcher Einheiten pro Woche reichen – mehr ermüdet stärker, als es bringt.',
      quelle: 'Helgerud et al., Med Sci Sports Exerc 2007 · Seiler, IJSPP 2010', siehe: ['vo2max', 'polarisiert'] },
    { id: 'effizienz', name: 'Aerobe Effizienz', kat: 'ausdauer', kurz: 'Wie viel Tempo oder Watt du pro Herzschlag bekommst.',
      text: 'Steigt die aerobe Effizienz, schaffst du bei gleichem Puls mehr – ein gutes Zeichen, dass deine Grundlage wächst. Am aussagekräftigsten ist der Vergleich ähnlicher lockerer Einheiten.',
      profi: 'EF = NP ÷ Ø HF (Rad) bzw. Geschwindigkeit ÷ Ø HF (Lauf).',
      app: ['training/rad', 'Deine Effizienz'], quelle: 'Allen & Coggan 2010', siehe: ['decoupling', 'zone2'] },
    { id: 'decoupling', name: 'Entkopplung', lang: 'Decoupling', kat: 'ausdauer', kurz: 'Wie stark dein Puls in einer langen Einheit bei gleichem Tempo nach oben driftet.',
      text: 'Bleibt der Puls in der zweiten Hälfte einer langen, gleichmäßigen Einheit fast gleich, ist deine Ausdauer für diese Dauer stabil. Steigt er um mehr als etwa 5 %, fehlt für diese Länge noch Grundlage – oder es war heiß, oder du hast zu wenig getrunken.',
      profi: 'Pa:HR bzw. Pw:HR: Verhältnis von Tempo bzw. Leistung zu Puls, erste gegen zweite Hälfte; unter 5 % gilt als aerob stabil.',
      app: ['training/einheiten', 'In deinen Einheiten'], quelle: 'Friel, The Triathlete’s Training Bible 2016 · Allen & Coggan 2010', siehe: ['effizienz'] },

    // Laufen
    { id: 'kadenz', name: 'Schrittfrequenz', lang: 'Kadenz', kat: 'laufen', kurz: 'Schritte pro Minute beim Laufen.',
      text: 'Kürzere, schnellere Schritte senken die Stoßbelastung auf Knie und Hüfte. Schon 5–10 % mehr Schritte pro Minute bei gleichem Tempo entlasten messbar. Eine feste „ideale“ Zahl wie 180 gibt es nicht – sie hängt von Tempo und Körpergröße ab.',
      profi: 'Heiderscheit et al.: +5–10 % Schrittrate verringerte Energieaufnahme an Knie und Hüfte deutlich.',
      app: ['training/laufen', 'Deine Schrittfrequenz'], quelle: 'Heiderscheit et al., Med Sci Sports Exerc 2011', siehe: ['laufbudget', 'mtss'] },
    { id: 'laufbudget', name: 'Laufbudget', kat: 'laufen', kurz: 'Wie viele Kilometer diese Woche noch gut verträglich sind.',
      text: 'Knochen und Sehnen passen sich langsamer an als Herz und Lunge. Darum ist ein zu schneller Anstieg der Kilometer der häufigste Grund für Laufverletzungen. Das Laufbudget rechnet aus deinen letzten Wochen aus, wie viel diese Woche noch gut verträglich ist.',
      profi: 'Nielsen et al.: Bei Laufeinsteigern ging eine Steigerung um mehr als 30 % in zwei Wochen mit mehr bestimmten Verletzungen einher. Tagesform nutzt eine einstellbare Rampe (Standard 10 % pro Woche) gegen den Schnitt der 4 Wochen davor.',
      app: ['training/laufen', 'Dein Laufbudget'], quelle: 'Nielsen et al., J Orthop Sports Phys Ther 2014 · Videbæk et al., Sports Med 2015', siehe: ['acwr', 'mtss', 'kadenz'] },
    { id: 'mtss', name: 'Schienbeinkantensyndrom', lang: 'MTSS', kat: 'laufen', kurz: 'Schmerz an der Innenkante des Schienbeins – typische Überlastung bei Läufern.',
      text: 'Es entsteht meist durch zu viel, zu schnell, zu hart: plötzlich mehr Kilometer, mehr Tempo oder harter Boden. Hilfreich sind weniger Laufumfang, kräftige Waden und Schienbeinmuskeln, eine etwas höhere Schrittfrequenz und langsames Steigern. Bleibt der Schmerz auch beim Gehen oder ist er punktuell, lass ihn ärztlich abklären – ein Ermüdungsbruch muss ausgeschlossen werden.',
      profi: 'Risikofaktoren u. a. weibliches Geschlecht, höherer BMI, frühere MTSS, wenig Lauferfahrung. Belastungssteuerung ist die wichtigste Maßnahme; passive Therapien sind schwach belegt.',
      app: ['training/gym', 'Läufer-Workout'], quelle: 'Moen et al., Sports Med 2009 · Winters et al., Sports Med 2013', siehe: ['laufbudget', 'kadenz', 'praevention'] },
    { id: 'laufoekonomie', name: 'Laufökonomie', kat: 'laufen', kurz: 'Wie viel Energie du für ein bestimmtes Tempo brauchst.',
      text: 'Zwei Läufer mit gleicher VO2max können sehr unterschiedlich schnell sein – der ökonomischere braucht weniger Sauerstoff pro Kilometer. Schweres Krafttraining und Sprünge verbessern die Ökonomie, ohne dich schwerer zu machen.',
      quelle: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014 · Berryman et al., IJSPP 2018', siehe: ['maximalkraft', 'kadenz'] },
    { id: 'steigerungen', name: 'Steigerungen', lang: 'Strides', kat: 'laufen', kurz: 'Kurze, lockere Sprints von 15–20 Sekunden am Ende eines lockeren Laufs.',
      text: 'Du beschleunigst über 80–100 m bis fast zum Sprint, bleibst dabei locker und gehst oder trabst danach voll zurück. Das schult Technik und Schnelligkeit, ohne müde zu machen – ideal auch in der Grundlagenphase.',
      siehe: ['laufoekonomie', 'zone2'] },

    // Rad
    { id: 'ftp', name: 'FTP', lang: 'Functional Threshold Power', kat: 'rad', kurz: 'Die Leistung in Watt, die du etwa eine Stunde lang halten kannst.',
      text: 'Die FTP ist der Bezugspunkt fürs Radtraining: Zonen und Trainingsbelastung (TSS) rechnen in Prozent davon. Testen kannst du sie mit einem 20-Minuten-Test (FTP ≈ 95 % des Schnitts). Tagesform schätzt sie zusätzlich aus deinen besten Leistungen.',
      profi: 'Näherung an die Leistung an der MLSS bzw. Critical Power. Der Faktor 0,95 ist eine Konvention und kann individuell einige Prozent danebenliegen.',
      app: ['training/rad', 'Deine FTP'], quelle: 'Allen & Coggan 2010 · Jones et al., Med Sci Sports Exerc 2010', siehe: ['wkg', 'np_if', 'sweetspot'] },
    { id: 'wkg', name: 'Watt pro Kilo', lang: 'W/kg', kat: 'rad', kurz: 'Leistung geteilt durch Körpergewicht – entscheidend am Berg.',
      text: 'Am Berg zählt, wie viel Leistung du pro Kilogramm bewegst. In der Ebene zählen vor allem die absolute Leistung und deine Aerodynamik. Rechne W/kg immer mit einem festen, aktuellen Referenzgewicht – sonst vergleichst du Werte, die nicht zusammenpassen.',
      app: ['training/werkzeuge', 'W/kg-Rechner'], quelle: 'Allen & Coggan 2010', siehe: ['ftp', 'cda'] },
    { id: 'cda', name: 'CdA', lang: 'Luftwiderstandsfläche', kat: 'rad', kurz: 'Wie groß und windschlüpfig du auf dem Rad bist.',
      text: 'Ab etwa 25 km/h ist der Luftwiderstand der größte Widerstand auf dem Rad. CdA ist Stirnfläche mal Luftwiderstandsbeiwert. Eine flachere Position, enge Kleidung und ein Aero-Helm senken ihn – das bringt in der Ebene oft mehr als ein paar Watt mehr Training. Große Athleten profitieren besonders, weil ihre Stirnfläche größer ist.',
      profi: 'Leistung für den Luftwiderstand = ½ · ρ · CdA · v³. Typisch: Oberlenker ~0,40 m², gute Aero-Position 0,20–0,28 m².',
      app: ['training/werkzeuge', 'CdA-Rechner'], quelle: 'Martin et al., J Appl Biomech 1998 · Debraux et al., Int J Sports Med 2011', siehe: ['wkg', 'ftp'] },
    { id: 'np_if', name: 'NP und IF', lang: 'Normalisierte Leistung, Intensitätsfaktor', kat: 'rad', kurz: 'Wie hart eine Fahrt für deinen Körper wirklich war.',
      text: 'Die Durchschnittsleistung unterschätzt wechselhafte Fahrten. Die normalisierte Leistung (NP) gewichtet harte Abschnitte stärker. Der Intensitätsfaktor (IF) ist NP geteilt durch FTP: 0,65–0,75 ist eine typische Langdistanz-Vorgabe, 1,0 wäre eine Stunde am Limit.',
      quelle: 'Allen & Coggan 2010', siehe: ['ftp', 'tss'] },
    { id: 'sweetspot', name: 'Sweet Spot', kat: 'rad', kurz: 'Zügig knapp unter der Schwelle (88–94 % FTP) – viel Wirkung pro Stunde.',
      text: 'Sweet-Spot-Intervalle wie 3 × 12 Minuten sind hart genug, um die Schwelle zu heben, aber gut zu erholen. Ideal, wenn wenig Zeit da ist. Jeden Tag gefahren, wird daraus allerdings Grauzone.',
      quelle: 'Allen & Coggan 2010', siehe: ['ftp', 'grauzone'] },

    // Schwimmen
    { id: 'css', name: 'CSS', lang: 'Critical Swim Speed', kat: 'schwimmen', kurz: 'Dein Schwellentempo im Wasser – pro 100 m.',
      text: 'Du schwimmst 400 m und 200 m jeweils so schnell wie möglich. Aus der Differenz ergibt sich das Tempo, das du lange halten kannst. Danach richten sich deine Trainingstempos: Grundlage einige Sekunden langsamer als CSS, Schwellen-Intervalle genau im CSS-Tempo.',
      profi: 'CSS = (400 − 200) m ÷ (t400 − t200); entspricht etwa der Geschwindigkeit an der Laktatschwelle.',
      app: ['training/schwimmen', 'CSS-Test eintragen'], quelle: 'Wakayoshi et al., Eur J Appl Physiol 1992', siehe: ['swolf', 'schwellen'] },
    { id: 'swolf', name: 'SWOLF & Strecke pro Zug', kat: 'schwimmen', kurz: 'Wie effizient du schwimmst.',
      text: 'SWOLF zählt Sekunden und Armzüge pro Bahn zusammen – weniger ist besser. Die Strecke pro Zug zeigt, wie weit du mit jedem Zug kommst. Beides wird durch Technik mehr besser als durch Kraft.',
      app: ['training/schwimmen', 'Deine Technik'], quelle: 'Costill et al., Int J Sports Med 1985', siehe: ['css'] },

    // Kraft & Beweglichkeit
    { id: 'rir', name: 'RIR', lang: 'Wiederholungen in Reserve', kat: 'kraft', kurz: 'Wie viele Wiederholungen am Ende eines Satzes noch gegangen wären.',
      text: 'RIR 2 heißt: Zwei Wiederholungen hättest du noch geschafft. So steuerst du die Anstrengung, ohne dein Maximalgewicht zu kennen. Für Muskelaufbau wirken 0–3 RIR, für saubere Technik und am Anfang eher 2–3.',
      profi: 'RIR-basierte RPE-Skala nach Zourdos et al. Für Hypertrophie ist die Nähe zum Muskelversagen wichtiger als die absolute Last.',
      app: ['training/gym', 'Zum Gym'], quelle: 'Zourdos et al., J Strength Cond Res 2016 · Schoenfeld et al., J Strength Cond Res 2017', siehe: ['hypertrophie', 'progressive'] },
    { id: 'hypertrophie', name: 'Muskelaufbau', lang: 'Hypertrophie', kat: 'kraft', kurz: 'Muskeln wachsen durch genug Sätze nahe an der Grenze.',
      text: 'Muskeln wachsen, wenn sie regelmäßig hart arbeiten und danach Eiweiß und Erholung bekommen. Dafür funktionieren schwere und leichte Gewichte – solange die Sätze nah an die Grenze gehen. Mehr Sätze pro Woche bringen mehr, etwa ab 10 pro Muskel; jeden Muskel zweimal pro Woche zu trainieren wirkt besser als einmal.',
      profi: 'Schoenfeld et al.: Dosis-Wirkung bis ≥ 10 Sätze pro Muskel und Woche (2017); Frequenz 2× > 1× pro Woche bei gleichem Volumen (2016); Lasten ab ~30 % 1RM bis zum Versagen ähnlich hypertroph wie schwere (2017).',
      app: ['training/gym', 'Workout bauen'], quelle: 'Schoenfeld et al., J Sports Sci 2017 · Schoenfeld et al., Sports Med 2016 · Schoenfeld et al., J Strength Cond Res 2017', siehe: ['rir', 'protein', 'progressive'] },
    { id: 'maximalkraft', name: 'Maximalkraft', lang: '1RM', kat: 'kraft', kurz: 'Wie viel Gewicht du einmal bewegen kannst.',
      text: 'Maximalkraft trainierst du mit schweren Gewichten (etwa 3–6 Wiederholungen) und langen Pausen von 2–3 Minuten. Für Ausdauersportler lohnt sie sich besonders: Sie verbessert die Lauf- und Radökonomie, ohne viel Masse aufzubauen.',
      profi: 'ACSM: für Kraft 1–6 Wdh. bei 80–100 % 1RM, Pausen von 3–5 min bei Hauptübungen. Längere Pausen (> 2 min) bringen mehr Kraftzuwachs.',
      app: ['training/gym', 'Kraft-Workout'], quelle: 'ACSM Position Stand, Med Sci Sports Exerc 2009 · Grgic et al., Sports Med 2018 · Rønnestad & Mujika, Scand J Med Sci Sports 2014', siehe: ['laufoekonomie', 'concurrent'] },
    { id: 'progressive', name: 'Progressive Überlastung', kat: 'kraft', kurz: 'Den Reiz langsam steigern – mehr Wiederholungen, mehr Gewicht oder mehr Sätze.',
      text: 'Der Körper passt sich nur an, wenn der Reiz etwas größer ist als gewohnt. Steigere darum in kleinen Schritten: erst die Wiederholungen bis zum oberen Ende der Spanne, dann etwas mehr Gewicht und wieder vom unteren Ende starten.',
      quelle: 'ACSM Position Stand, Med Sci Sports Exerc 2009', siehe: ['rir', 'hypertrophie'] },
    { id: 'concurrent', name: 'Kraft und Ausdauer kombinieren', kat: 'kraft', kurz: 'Beides geht gut zusammen – mit ein paar Regeln.',
      text: 'Ausdauertraining bremst den Kraftzuwachs nur wenig, am ehesten bei der Schnellkraft und wenn viel gelaufen wird. Radfahren stört weniger als Laufen. Ist Kraft dein Hauptziel: erst Kraft, dann Cardio – oder mit einigen Stunden Abstand.',
      profi: 'Wilson et al.: Interferenz vor allem für Kraft und Power, stärker bei Laufen und bei hoher Frequenz und Dauer. Schumann et al.: keine Einbußen bei Muskelmasse und Maximalkraft, aber bei Explosivkraft, besonders in derselben Einheit. Eddens et al.: Kraft vor Ausdauer brachte mehr Kraft im Unterkörper.',
      app: ['training/gym', 'Workout mit Cardio'], quelle: 'Wilson et al., J Strength Cond Res 2012 · Schumann et al., Sports Med 2022 · Eddens et al., Sports Med 2018', siehe: ['maximalkraft', 'hypertrophie'] },
    { id: 'dehnen', name: 'Dehnen & Mobilität', kat: 'kraft', kurz: 'Beweglichkeit verbessern – richtig dosiert.',
      text: 'Kurzes Dehnen (unter etwa 60 Sekunden pro Muskel) als Teil des Aufwärmens schadet der Leistung kaum; langes statisches Dehnen direkt vor Sprints oder Sprüngen kann sie etwas senken. Vor dem Sport ist dynamisches Aufwärmen besser. Regelmäßiges Dehnen, Mobilität, Yoga oder Pilates verbessern langfristig die Beweglichkeit.',
      app: ['training/flow', 'Pilates & Yoga'], quelle: 'Behm et al., Appl Physiol Nutr Metab 2016', siehe: ['praevention', 'yoga'] },
    { id: 'core', name: 'Rumpf', lang: 'Core', kat: 'kraft', kurz: 'Die Muskeln rund um Bauch, Rücken und Becken.',
      text: 'Ein kräftiger Rumpf überträgt die Kraft der Beine auf den Oberkörper und stabilisiert die Wirbelsäule. Stütz-Übungen wie Unterarm- und Seitstütz, Übungen gegen Verdrehen und Pilates trainieren ihn gezielt.',
      app: ['training/flow', 'Rumpf-Einheit'], quelle: 'Kloubec, J Strength Cond Res 2010', siehe: ['pilates'] },
    { id: 'grunduebung', name: 'Grundübungen', lang: 'Mehrgelenkige Übungen', kat: 'kraft', kurz: 'Übungen, die mehrere Gelenke und große Muskeln zugleich bewegen – Kniebeuge, Kreuzheben, Rudern, Drücken.',
      text: 'Sie trainieren viel Muskulatur in wenig Zeit und übertragen gut auf Alltag und Sport. Darum stehen sie am Anfang des Workouts, solange du frisch bist. Kleine Übungen wie Curls oder Seitheben kommen danach, Rumpfübungen zum Schluss.',
      profi: 'ACSM: große vor kleinen Muskelgruppen, mehrgelenkig vor eingelenkig, damit die Last in den Hauptübungen hoch bleibt. Für Ausdauersportler sind schwere Grundübungen der Kern des Krafttrainings (Beattie et al.; Rønnestad & Mujika).',
      app: ['training/gym', 'Workout bauen'], quelle: 'ACSM Position Stand, Med Sci Sports Exerc 2009 · Beattie et al., Sports Med 2014', siehe: ['maximalkraft', 'hypertrophie'] },
    { id: 'plyometrie', name: 'Sprungkraft', lang: 'Plyometrie', kat: 'kraft', kurz: 'Explosive Sprünge, bei denen Muskeln und Sehnen wie eine Feder arbeiten.',
      text: 'Beim Landen speichern die Sehnen Energie und geben sie beim Absprung zurück. Sprungtraining macht dich spritziger und kann die Laufökonomie verbessern. Wenige, hochwertige Sprünge mit voller Pause reichen – Qualität vor Menge, und erst, wenn Kniebeugen sauber sitzen.',
      profi: 'Mehrwöchiges plyometrisches Training verbesserte bei gut trainierten Läufern die Laufökonomie; Übersichtsarbeiten zu Kraft- und Sprungtraining bei Ausdauersportlern bestätigen den Effekt.',
      app: ['training/gym', 'Schnellkraft-Workout'], quelle: 'Saunders et al., J Strength Cond Res 2006 · Beattie et al., Sports Med 2014', siehe: ['laufoekonomie', 'maximalkraft'] },
    { id: 'gleichgewicht', name: 'Gleichgewicht', kat: 'flow', kurz: 'Die Fähigkeit, auf einem Bein oder in Bewegung stabil zu bleiben – trainierbar in jedem Alter.',
      text: 'Gleichgewichtsübungen wie Einbeinstand, Baum oder Krieger III schulen das Zusammenspiel von Füßen, Hüfte und Rumpf. Bei älteren Menschen senken sie Stürze deutlich, bei Sportlern stabilisieren sie Knie und Sprunggelenk.',
      profi: 'Cochrane-Review: Übungsprogramme mit Gleichgewichts- und Alltagsübungen senkten die Sturzrate bei älteren Menschen um etwa ein Viertel. Bei College-Sportlern verbesserten 10 Wochen Yoga Beweglichkeit und Gleichgewicht.',
      app: ['training/flow', 'Pilates & Yoga'], quelle: 'Sherrington et al., Cochrane 2019 · Polsgrove et al., Int J Yoga 2016', siehe: ['yoga', 'praevention'] },
    { id: 'praevention', name: 'Verletzungsprävention', kat: 'kraft', kurz: 'Kraft- und Stabilitätstraining senkt Sportverletzungen deutlich.',
      text: 'Eine große Meta-Analyse fand: Krafttraining senkte Sportverletzungen auf weniger als ein Drittel, Dehnen allein brachte dagegen kaum etwas. Besonders wirksam sind gezielte Übungen wie Nordic Hamstring Curls gegen Zerrungen hinten am Oberschenkel und die Copenhagen-Übung für die Leiste.',
      app: ['training/gym', 'Präventions-Workout'], quelle: 'Lauersen et al., Br J Sports Med 2014 · van der Horst et al., Am J Sports Med 2015 · Harøy et al., Br J Sports Med 2019', siehe: ['dehnen', 'mtss'] },

    // Pilates, Yoga & Atmung
    { id: 'pilates', name: 'Pilates', kat: 'flow', kurz: 'Kontrollierte Übungen für Rumpf, Haltung und Beweglichkeit.',
      text: 'Pilates trainiert langsam und präzise – mit Fokus auf Atmung, Körpermitte und saubere Bewegung. Nach einigen Wochen verbessern sich in Studien Rumpfkraft, Beweglichkeit und Balance. Bei chronischen Rückenschmerzen hilft Pilates ähnlich gut wie andere gezielte Übungsprogramme.',
      app: ['training/flow', 'Pilates-Einheit'], quelle: 'Kloubec, J Strength Cond Res 2010 · Yamato et al., Cochrane Database Syst Rev 2015', siehe: ['core', 'yoga'] },
    { id: 'yoga', name: 'Yoga', kat: 'flow', kurz: 'Haltungen, Atmung und Entspannung – für Beweglichkeit und Ruhe.',
      text: 'Yoga verbindet Dehnung, Kraft und Balance mit ruhiger Atmung. Es verbessert Beweglichkeit und Gleichgewicht, senkt Stressmarker und kann bei chronischen Rückenschmerzen helfen. Für Sportler eignet es sich an lockeren Tagen als aktive Erholung.',
      app: ['training/flow', 'Yoga-Einheit'], quelle: 'Wieland et al., Cochrane Database Syst Rev 2022 · Pascoe et al., Psychoneuroendocrinology 2017 · Polsgrove et al., Int J Yoga 2016 · Wang et al., BMC Psychiatry 2020', siehe: ['atmung', 'dehnen', 'pilates'] },
    { id: 'atmung', name: 'Langsames Atmen', kat: 'flow', kurz: 'Etwa 6 Atemzüge pro Minute beruhigen das Nervensystem – messbar an der HRV.',
      text: 'Atmest du langsam und tief – etwa 4–5 Sekunden ein, 5–6 Sekunden aus –, steigt die Herzfrequenzvariabilität schon während der Übung. Ein paar Minuten am Abend können beim Abschalten und Einschlafen helfen.',
      profi: 'Bei ~6 Atemzügen pro Minute schwingen Atmung, Herzfrequenz und Baroreflex in Resonanz; die kurzfristige HRV steigt deutlich.',
      app: ['training/flow', 'Entspannung'], quelle: 'Lehrer & Gevirtz, Front Psychol 2014', siehe: ['hrv', 'yoga'] },

    // Ernährung
    { id: 'kh_stunde', name: 'Kohlenhydrate pro Stunde', kat: 'ernaehrung', kurz: 'Wie viel Kohlenhydrate du in langen Einheiten zuführen solltest.',
      text: 'Unter einer Stunde brauchst du nichts. Bei 1 bis 2,5 Stunden helfen 30–60 g pro Stunde, darüber bis 90 g – am besten als Mischung aus Glukose und Fruktose, weil der Darm beide über verschiedene Wege aufnimmt. Mehr als 90 g pro Stunde vertragen viele erst nach Übung („Darmtraining“).',
      profi: 'Jeukendrup: Empfehlungen nach Dauer; über 2,5 h bis 90 g/h mit mehreren transportablen Kohlenhydraten. Mit trainiertem Darm berichten Studien und Praxis von 100–120 g/h.',
      app: ['training/fueling', 'Dein Fueling'], quelle: 'Jeukendrup, Sports Med 2014 · Jeukendrup, Sports Med 2017', siehe: ['carboloading', 'schweiss'] },
    { id: 'carboloading', name: 'Carboloading', kat: 'ernaehrung', kurz: 'Vor langen Rennen die Kohlenhydratspeicher füllen.',
      text: 'Für Rennen über etwa 90 Minuten lohnt es sich, in den 36–48 Stunden davor viele Kohlenhydrate zu essen – etwa 10–12 g pro Kilogramm Körpergewicht am Tag – und dabei wenig Ballaststoffe und Fett. Für kürzere Rennen reicht eine normale, kohlenhydratreiche Mahlzeit.',
      quelle: 'Burke et al., J Sports Sci 2011 · Thomas et al., Med Sci Sports Exerc 2016', siehe: ['kh_stunde', 'tapering'] },
    { id: 'protein', name: 'Eiweiß', lang: 'Protein', kat: 'ernaehrung', kurz: 'Baustoff für Muskeln – etwa 1,6 g pro kg Körpergewicht am Tag reichen den meisten.',
      text: 'Für Muskelaufbau und Erholung brauchen Sportler mehr Eiweiß als Nichtsportler. Eine Meta-Analyse fand: Mehr als etwa 1,6 g pro Kilogramm und Tag bringt im Mittel keinen zusätzlichen Muskelzuwachs. Verteilt auf mehrere Mahlzeiten mit je 20–40 g wirkt es gut.',
      quelle: 'Morton et al., Br J Sports Med 2018 · Thomas et al., Med Sci Sports Exerc 2016', siehe: ['hypertrophie'] },
    { id: 'schweiss', name: 'Schweißverlust & Trinken', kat: 'ernaehrung', kurz: 'Wie viel Flüssigkeit du pro Stunde verlierst.',
      text: 'Wiege dich vor und nach einer Stunde Training ohne Trinken: Jedes verlorene Kilogramm ist etwa ein Liter Schweiß. Im Rennen solltest du nicht mehr als etwa 2 % des Körpergewichts verlieren – aber auch nicht mehr trinken, als du schwitzt.',
      quelle: 'Sawka et al., ACSM Position Stand, Med Sci Sports Exerc 2007', siehe: ['kh_stunde'] },

    // Gesundheit & Fitness-Alter
    { id: 'fitnessalter', name: 'Fitness-Alter', kat: 'gesundheit', kurz: 'Wie alt dein Herz-Kreislauf-System im Vergleich zu anderen ist.',
      text: 'Das Fitness-Alter vergleicht vor allem deine VO2max mit Normwerten für dein Geschlecht. Hast du die VO2max eines durchschnittlichen 30-Jährigen, ist dein Fitness-Alter 30 – egal, wie alt du bist. Ruhepuls und Körperfett verschieben den Wert etwas. Gute Ausdauer ist einer der stärksten Schutzfaktoren für ein langes Leben.',
      profi: 'Nach den HUNT-Daten (Nes et al.); Zusammenhang mit der Sterblichkeit: Kodama et al., Mandsager et al.',
      app: ['gesundheit/fitness', 'Dein Fitness-Alter'], quelle: 'Nes et al., Med Sci Sports Exerc 2013 · Kodama et al., JAMA 2009 · Mandsager et al., JAMA Netw Open 2018', siehe: ['vo2max', 'who'] },
    { id: 'who', name: 'Bewegungsempfehlung der WHO', kat: 'gesundheit', kurz: '150–300 Minuten moderat oder 75–150 Minuten intensiv pro Woche – plus Kraft an 2 Tagen.',
      text: 'Moderat heißt: Du kommst ins Schwitzen, kannst aber noch reden – etwa zügiges Gehen oder lockeres Radfahren. Intensiv heißt: Reden geht nur noch in kurzen Sätzen. Dazu kommen an mindestens zwei Tagen Kraftübungen für alle großen Muskelgruppen. Jede Bewegung zählt – auch weniger ist besser als nichts.',
      app: ['training/plan', 'Plan „Fit & gesund“'], quelle: 'Bull et al., Br J Sports Med 2020 (WHO-Leitlinie)', siehe: ['zone2', 'fitnessalter'] },
    { id: 'krank', name: 'Training bei Erkältung', kat: 'gesundheit', kurz: 'Faustregel: nur Schnupfen – locker geht; Fieber oder Gliederschmerzen – Pause.',
      text: 'Bei leichtem Schnupfen ohne Fieber ist lockere Bewegung meist in Ordnung. Bei Fieber, Gliederschmerzen, Husten mit Auswurf oder Beschwerden „unterhalb des Halses“ solltest du pausieren – Training kann dann gefährlich werden. Steig nach einer Erkrankung langsam wieder ein und frag bei Unsicherheit ärztlich nach.',
      profi: 'Die „Neck Check“-Regel ist Expertenkonsens, nicht durch Studien bewiesen. Der IOC-Konsens beschreibt Belastung und Infektrisiko sowie Kriterien für die Rückkehr.',
      app: ['gesundheit/checkin', 'Check-in: krank melden'], quelle: 'Schwellnus et al., Br J Sports Med 2016', siehe: ['atemfrequenz', 'ruhepuls'] },
    { id: 'schritte', name: 'Schritte', kat: 'gesundheit', kurz: 'Deine Alltagsbewegung – einer der einfachsten und stärksten Gesundheitswerte.',
      text: 'Mehr Schritte am Tag hängen klar mit weniger Herz-Kreislauf-Erkrankungen und einem längeren Leben zusammen. Der Nutzen steigt bis etwa 8.000–10.000 Schritte bei unter 60-Jährigen und 6.000–8.000 ab 60, danach flacht er ab. Schon 1.000 Schritte mehr pro Tag zählen. Wer gerade keinen Sport machen kann, bleibt mit Gehen trotzdem aktiv – in Tagesform bringen Schritte auch XP.',
      profi: 'Meta-Analyse von 15 Kohorten mit 47.471 Erwachsenen: Sterberisiko im obersten gegenüber dem untersten Quartil um 40–53 % niedriger, Plateau bei 8.000–10.000 (< 60 J.) bzw. 6.000–8.000 Schritten (≥ 60 J.). Das Gehtempo hatte nach Berücksichtigung der Menge keinen klaren Zusatznutzen.',
      app: ['gesundheit/aktivitaet', 'Deine Schritte'], quelle: 'Paluch et al., Lancet Public Health 2022 · Saint-Maurice et al., JAMA 2020 · Banach et al., Eur J Prev Cardiol 2023', siehe: ['intensitaetsminuten', 'who', 'xp'] },
    { id: 'intensitaetsminuten', name: 'Intensitätsminuten', kat: 'gesundheit', kurz: 'Minuten, in denen du dich mindestens zügig bewegst – intensive zählen doppelt.',
      text: 'Deine Uhr zählt Minuten mit mindestens moderater Belastung, meist in Abschnitten ab 10 Minuten. Intensive Minuten (Puls deutlich erhöht, Reden nur in kurzen Sätzen) zählen doppelt. So lässt sich die Empfehlung der WHO direkt ablesen: 150 bis 300 Minuten pro Woche.',
      profi: 'Garmin wertet Puls und Bewegung aus; moderat entspricht etwa 3–6 MET, intensiv über 6 MET. Die 2:1-Gewichtung folgt den WHO-Leitlinien, nach denen 75 intensive Minuten 150 moderaten entsprechen.',
      app: ['gesundheit/aktivitaet', 'Deine Bewegungsminuten'], quelle: 'Bull et al., Br J Sports Med 2020 (WHO-Leitlinie)', siehe: ['who', 'schritte', 'zonen'] },
    { id: 'stress_uhr', name: 'Stresswert der Uhr', kat: 'erholung', kurz: 'Eine Schätzung von 0 bis 100, wie angespannt dein Nervensystem gerade ist.',
      text: 'Die Uhr leitet den Stresswert aus deiner Herzfrequenzvariabilität ab: Ist der Sympathikus aktiv, sinkt die HRV und der Wert steigt. 0–25 heißt Ruhe, 26–50 niedrig, 51–75 mittel, über 75 hoch. Nicht nur Ärger treibt ihn hoch, sondern auch Training, Kaffee, Alkohol, Hitze oder ein Infekt. Aussagekräftig ist vor allem der Vergleich mit deinem eigenen Üblichen.',
      profi: 'Firstbeat-Algorithmus auf Basis von Herzfrequenz und HRV in Ruhephasen; Bewegungsphasen werden ausgeblendet (−1/−2 = zu wenig Messzeit). Eine klinische Stressmessung ist das nicht.',
      app: ['gesundheit/stress', 'Dein Stress'], quelle: 'Firstbeat Technologies, Stress- und Recovery-Analyse · Kim et al., Psychiatry Investig 2018', siehe: ['body_battery', 'hrv', 'atmung'] },
    { id: 'body_battery', name: 'Body Battery', kat: 'erholung', kurz: 'Deine geschätzte Energiereserve von 0 bis 100 – lädt im Schlaf, sinkt durch Belastung.',
      text: 'Body Battery verbindet Stress, Erholung und Bewegung zu einem Akku-Wert. Im Schlaf und in ruhigen Phasen lädt er, Training und Stress verbrauchen ihn. Wachst du deutlich unter deinem Üblichen auf, war die Nacht weniger erholsam – ein guter Grund für einen lockeren Tag.',
      profi: 'Firstbeat-Modell aus HRV, Stress und Aktivität. Absolute Werte unterscheiden sich zwischen Personen stark; vergleiche daher mit deinem eigenen Normal (z. B. Median der letzten 4 Wochen).',
      app: ['gesundheit/stress', 'Deine Body Battery'], quelle: 'Firstbeat Technologies, White Paper zu Body Battery', siehe: ['stress_uhr', 'schlafbedarf', 'tagesform'] },
    { id: 'spo2', name: 'SpO₂ (Sauerstoffsättigung)', kat: 'gesundheit', kurz: 'Wie viel Sauerstoff dein Blut transportiert – nachts meist 95–100 %.',
      text: 'Die Uhr misst die Sauerstoffsättigung mit Licht am Handgelenk. Gesunde Menschen liegen meist bei 95–100 %, in der Höhe etwas darunter. Uhren sind dafür nicht so genau wie ein Fingerclip – einzelne tiefe Werte sind oft Messfehler. Wichtig ist der Trend über Wochen. Schnarchst du mit Atemaussetzern und bist tagsüber müde, lass das ärztlich abklären.',
      profi: 'Reflexions-Pulsoximetrie am Handgelenk hat eine größere Streuung als die Transmissionsmessung am Finger, besonders bei Bewegung, kalten Händen und dunkler Haut. Für eine Diagnose (z. B. Schlafapnoe) braucht es eine Schlafuntersuchung.',
      app: ['gesundheit/puls', 'Deine Werte im Schlaf'], quelle: 'Schiefer et al., Sensors 2021 · Sjoding et al., N Engl J Med 2020', siehe: ['atemfrequenz', 'ruhepuls'] },
    { id: 'xp', name: 'XP, Level & Quests', kat: 'gesundheit', kurz: 'Punkte für Bewegung, Schlaf und Regelmäßigkeit – sie bringen dich die Trophy Road hinauf.',
      text: 'Jede Minute Training bringt 1 XP – egal welche Sportart, ob von der Uhr erkannt oder in der App erledigt. Dazu kommen XP für Schritte, guten Schlaf, Check-ins, Plan-Einheiten, Quests und Trophäen. Mit genug XP steigst du ein Level auf und schaltest Abzeichen, Banner, Rahmen und Titel frei. Lange Einheiten zählen ab 2 Stunden nur halb, und an roten Tagen gibt es Quests fürs Erholen: Belohnt wird, was dich gesünder macht – nicht Übertraining.',
      profi: 'Level n → n+1 braucht 250 + 50 · (n − 1) XP; Level 70 liegt bei 134.550 XP, danach gibt es alle 10.000 XP einen Stern. Abgeschlossene Monate werden als Summe gespeichert, damit nichts verloren geht, wenn Garmin-Daten nach 400 Tagen gelöscht werden.',
      app: ['profil/quests', 'Deine Quests'], quelle: '', siehe: ['schritte', 'who', 'schlafbedarf'] },
  ];
  const BY = Object.fromEntries(B.map((b) => [b.id, b]));

  /* ---------- Häufige Fragen ---------- */
  const FAQ = [
    { id: 'xp_wie', frage: 'Wie bekomme ich XP – auch ohne Sport?', antwort: 'Mit allem, was dir guttut: jede Minute Training (1 XP, jede Sportart), Schritte (bis 75 XP am Tag), 7 Stunden Schlaf und dein Schlafziel, Check-ins, Gym- und Pilates/Yoga-Einheiten aus der App, Plan-Einheiten, drei Tagesquests und drei Wochenquests. Wer gerade keinen Sport machen kann, sammelt über Schritte, Schlaf und Quests weiter.', quelle: '', siehe: ['xp', 'schritte'] },
    { id: 'wie_oft', frage: 'Wie oft sollte ich pro Woche trainieren?', antwort: 'Für die Gesundheit: an 3–5 Tagen, zusammen 150–300 Minuten moderat, dazu zweimal Kraft. Für Leistung: so oft, wie du dich erholst – meist 4–6 Tage mit mindestens einem Ruhetag. Wichtiger als einzelne harte Tage ist, dass du über Monate dranbleibst.', quelle: 'Bull et al., Br J Sports Med 2020', siehe: ['who', 'entlastungswoche'] },
    { id: 'locker', frage: 'Warum soll ich so viel locker trainieren?', antwort: 'Weil lockeres Training die Ausdauer der Muskeln aufbaut, ohne dich stark zu ermüden. So bleibt Kraft für wenige, wirklich harte Einheiten. Die besten Ausdauersportler trainieren etwa 80 % locker. „Immer ein bisschen zügig“ macht müde und bringt weniger.', quelle: 'Seiler, IJSPP 2010 · Stöggl & Sperlich, Front Physiol 2014', siehe: ['polarisiert', 'zone2', 'grauzone'] },
    { id: 'rot', frage: 'Meine Tagesform ist rot, aber ich fühle mich gut – was nun?', antwort: 'Eine einzelne Nacht kann durch Alkohol, ein spätes Essen, Hitze oder Stress verzerrt sein. Mach den Check-in: Dein Gefühl zählt mit. Bei Rot ist eine lockere Einheit fast immer in Ordnung – nur die harte schiebst du besser auf einen besseren Tag. Bleibt sie mehrere Tage rot oder kommen Fieber oder Halskratzen dazu, gönn dir Ruhe.', quelle: 'Plews et al., Sports Med 2013 · Saw et al., Br J Sports Med 2016', siehe: ['tagesform', 'hrv', 'checkin'] },
    { id: 'hrv_niedrig', frage: 'Was bedeutet eine niedrige HRV am Morgen?', antwort: 'Meist, dass dein Körper gerade mit etwas beschäftigt ist: Training, Stress, wenig Schlaf, Alkohol oder ein Infekt. Eine einzelne niedrige Nacht ist wenig aussagekräftig. Liegt der 7-Tage-Schnitt unter deinem Korridor – und der Ruhepuls ist zusätzlich erhöht –, ist eine lockere Phase sinnvoll.', quelle: 'Plews et al., Sports Med 2013 · Buchheit, Front Physiol 2014', siehe: ['hrv', 'hrv_korridor', 'ruhepuls'] },
    { id: 'steigern', frage: 'Wie schnell darf ich mein Laufpensum steigern?', antwort: 'Die 10-%-Regel ist eine grobe Orientierung. Wichtiger ist: keine Sprünge. Wer plötzlich deutlich mehr läuft als in den Wochen davor, verletzt sich öfter – besonders als Einsteiger. Steigere also in kleinen Schritten und plane alle 3–4 Wochen eine leichtere Woche ein.', quelle: 'Nielsen et al., J Orthop Sports Phys Ther 2014 · Gabbett, Br J Sports Med 2016', siehe: ['laufbudget', 'acwr', 'entlastungswoche'] },
    { id: 'dehnen_vorher', frage: 'Muss ich mich vor dem Sport dehnen?', antwort: 'Besser ist ein dynamisches Aufwärmen: locker einlaufen, Beinpendel, Ausfallschritte, ein paar Steigerungen. Kurzes Dehnen schadet nicht, langes statisches Dehnen direkt vor Sprints kann die Schnellkraft etwas senken. Gegen Verletzungen hilft Krafttraining deutlich mehr als Dehnen.', quelle: 'Behm et al., Appl Physiol Nutr Metab 2016 · Lauersen et al., Br J Sports Med 2014', siehe: ['dehnen', 'praevention'] },
    { id: 'muskelkater', frage: 'Ist Muskelkater ein gutes Zeichen?', antwort: 'Muskelkater zeigt eine ungewohnte Belastung – vor allem beim Abbremsen, etwa bergab oder beim langsamen Absenken. Er ist aber kein Maß für den Trainingserfolg und wird weniger, je öfter du die Übung machst. Mit leichtem Muskelkater ist lockere Bewegung in Ordnung, mit starkem lieber einen Tag warten.', quelle: 'Schoenfeld & Contreras, Strength Cond J 2013 · McHugh, Scand J Med Sci Sports 2003', siehe: ['progressive'] },
    { id: 'schlaf', frage: 'Wie viel Schlaf brauche ich als Sportler?', antwort: 'Mindestens 7 Stunden, bei viel Training eher 8–9. Regelmäßige Zeiten helfen beim Einschlafen. Wer seinen Schlaf über Wochen verlängert, wird in Studien schneller und reaktionsschneller – Schlaf ist das billigste Leistungsmittel.', quelle: 'Watson et al., Sleep 2015 · Mah et al., Sleep 2011', siehe: ['schlafbedarf', 'schlafrhythmus'] },
    { id: 'kh', frage: 'Wie viele Kohlenhydrate brauche ich bei langen Einheiten?', antwort: 'Unter einer Stunde: keine. 1–2,5 Stunden: 30–60 g pro Stunde. Länger: bis 90 g pro Stunde, am besten Glukose und Fruktose gemischt. Höhere Mengen musst du im Training üben, sonst rebelliert der Magen.', quelle: 'Jeukendrup, Sports Med 2014', siehe: ['kh_stunde', 'carboloading'] },
    { id: 'kraft_schwer', frage: 'Werde ich vom Krafttraining zu schwer für den Ausdauersport?', antwort: 'Nein – richtig gemacht nicht. Schweres Krafttraining mit wenigen Wiederholungen verbessert die Lauf- und Radökonomie, ohne dass du nennenswert zunimmst. Zwei Einheiten pro Woche in der Grundlage, eine im Aufbau reichen.', quelle: 'Rønnestad & Mujika, Scand J Med Sci Sports 2014 · Beattie et al., Sports Med 2014 · Berryman et al., IJSPP 2018', siehe: ['maximalkraft', 'laufoekonomie'] },
    { id: 'saetze', frage: 'Wie viele Sätze pro Muskel brauche ich?', antwort: 'Am Anfang bringen schon 4–6 Sätze pro Muskel und Woche viel. Für maximalen Muskelaufbau sind 10 oder mehr Sätze pro Woche wirksamer – verteilt auf zwei Einheiten. Wichtig ist, dass die Sätze nah an die Grenze gehen (1–3 Wiederholungen in Reserve).', quelle: 'Schoenfeld et al., J Sports Sci 2017 · Schoenfeld et al., Sports Med 2016', siehe: ['hypertrophie', 'rir'] },
    { id: 'reihenfolge', frage: 'Kraft oder Cardio zuerst?', antwort: 'Ist Kraft dein Ziel: erst Kraft, dann Cardio – das brachte in Studien mehr Kraftzuwachs in den Beinen. Für Ausdauer und Muskelmasse ist die Reihenfolge ziemlich egal. Nach einem schweren Beintag ist lockeres Radfahren schonender als Laufen.', quelle: 'Eddens et al., Sports Med 2018 · Wilson et al., J Strength Cond Res 2012', siehe: ['concurrent'] },
    { id: 'ruecken', frage: 'Helfen Pilates oder Yoga gegen Rückenschmerzen?', antwort: 'Bei chronischen, unspezifischen Rückenschmerzen: ja, moderat – ähnlich gut wie andere Übungsprogramme. Am wichtigsten ist, dass du regelmäßig dranbleibst. Bei frischen, sehr starken oder ins Bein ausstrahlenden Schmerzen erst ärztlich abklären lassen.', quelle: 'Yamato et al., Cochrane 2015 · Wieland et al., Cochrane 2022', siehe: ['pilates', 'yoga', 'core'] },
    { id: 'taper', frage: 'Wann reduziere ich vor dem Rennen das Training?', antwort: 'Meist etwa 1–2 Wochen vorher, bei Marathon und Langdistanz eher 2–3. Den Umfang senkst du stufenweise um insgesamt 40–60 %, die Intensität bleibt: kurze, flotte Abschnitte halten dich spritzig.', quelle: 'Bosquet et al., Med Sci Sports Exerc 2007', siehe: ['tapering', 'tsb'] },
    { id: 'erkaeltet', frage: 'Soll ich trainieren, wenn ich erkältet bin?', antwort: 'Nur Schnupfen, kein Fieber: lockere Bewegung ist meist in Ordnung. Fieber, Gliederschmerzen oder Husten: Pause, bis du wieder fit bist – dann langsam einsteigen. Im Zweifel ärztlich nachfragen.', quelle: 'Schwellnus et al., Br J Sports Med 2016', siehe: ['krank'] },
    { id: 'zone2_ohne', frage: 'Woran erkenne ich ohne Uhr, dass ich locker genug bin?', antwort: 'Am Sprechtest: Kannst du ganze Sätze sprechen, bist du im lockeren Bereich. Nur noch kurze Sätze: zügig. Nur noch einzelne Worte: hart. Bergauf darf es ruhig langsamer werden.', quelle: 'Persinger et al., Med Sci Sports Exerc 2004', siehe: ['sprechtest', 'zone2'] },
    { id: 'ftp_test', frage: 'Wie bestimme ich meine FTP?', antwort: 'Nach gutem Aufwärmen 20 Minuten so gleichmäßig und hart wie möglich fahren; 95 % der Durchschnittsleistung sind deine FTP. Alternativ zeigt Tagesform Schätzungen aus deinen besten Leistungen der letzten 12 Monate.', quelle: 'Allen & Coggan 2010', siehe: ['ftp', 'wkg'] },
    { id: 'protein', frage: 'Wie viel Eiweiß brauche ich?', antwort: 'Für Sportler etwa 1,4–1,6 g pro Kilogramm Körpergewicht am Tag, verteilt auf mehrere Mahlzeiten. Mehr bringt im Mittel keinen zusätzlichen Muskelaufbau.', quelle: 'Morton et al., Br J Sports Med 2018', siehe: ['protein'] },
    { id: 'wirkung', frage: 'Wie lange dauert es, bis Training wirkt?', antwort: 'Technik und Koordination verbessern sich nach Tagen bis Wochen, Kraft schon nach wenigen Wochen – zuerst durch das Nervensystem, sichtbares Muskelwachstum folgt. Die VO2max steigt nach etwa 6–8 Wochen messbar. Fitness ist eine Sache von Monaten, nicht von Tagen.', quelle: 'Seynnes et al., J Appl Physiol 2007 · Helgerud et al., Med Sci Sports Exerc 2007', siehe: ['superkompensation', 'vo2max'] },
    { id: 'ruhetag', frage: 'Brauche ich Ruhetage?', antwort: 'Ja. Stärker wirst du in der Erholung nach dem Training. Die meisten profitieren von mindestens einem Ruhetag pro Woche und einer leichteren Woche alle 3–4 Wochen. Sind alle Tage gleich hart, steigt das Risiko für Infekte und Überlastung.', quelle: 'Foster, Med Sci Sports Exerc 1998 · Issurin, Sports Med 2010', siehe: ['superkompensation', 'monotonie', 'entlastungswoche'] },
    { id: 'checkin_warum', frage: 'Warum ein Check-in, wenn die Uhr doch misst?', antwort: 'Weil dein Gefühl vieles erfasst, was Sensoren nicht sehen: Muskelschmerz, Stress, Stimmung. In Studien zeigten kurze Fragebögen Überlastung sogar zuverlässiger als Blutwerte oder Puls. Zusammen mit HRV und Schlaf wird die Tagesform deutlich genauer.', quelle: 'Saw et al., Br J Sports Med 2016', siehe: ['checkin', 'tagesform'] },
  ];

  /* ---------- Wissenslevel ---------- */
  const LEVEL = [['einsteiger', 'Einsteiger', 'Alles in einfachen Worten, mit kurzen Erklärungen unter den Karten'], ['fortgeschritten', 'Fortgeschritten', 'Fachbegriffe mit Erklärung zum Antippen'], ['profi', 'Profi', 'Kompakt, mit Formeln und Studiendetails']];
  const athlet = () => (rowsOf('athlet') || [])[0] || null;
  const level = () => { const a = athlet(); return (a && a.wissen) || 'fortgeschritten'; };
  let gewaehlt = null; // sofortige Wirkung, bevor der Server antwortet
  async function setzeLevel(v, msg) {
    gewaehlt = v; document.getElementById('tf').dataset.wissen = v;
    try { const j = await A().api('POST', '/api/profil', { wissen: v }); A().patch('athlet', [j.profil]); if (msg) setMsg(msg, 'Gespeichert.'); }
    catch (e) { if (msg) setMsg(msg, e.message, true); else A().toast(e.message); }
  }
  function levelAnwenden() { const v = gewaehlt || level(); document.getElementById('tf').dataset.wissen = v; return v; }
  function levelWahl(msg) { // Segmente Einsteiger · Fortgeschritten · Profi
    const box = el('div', { class: 'tf-seg tf-wissen-seg', role: 'group', 'aria-label': 'Wissenslevel' });
    const cur = levelAnwenden();
    LEVEL.forEach(([v, name]) => { const b = el('button', { type: 'button', 'aria-pressed': String(v === cur) }, name); b.addEventListener('click', () => { setzeLevel(v, msg); $$('button', box).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); const h = box.parentElement && box.parentElement.querySelector('.tf-wissen-hint'); if (h) h.textContent = LEVEL.find((l) => l[0] === v)[2]; }); box.appendChild(b); });
    return box;
  }

  /* ---------- Suche ---------- */
  const norm = (s) => String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
  function treffer(q) {
    const w = norm(q).split(/\s+/).filter(Boolean);
    if (!w.length) return null;
    const passt = (txt) => { const t = norm(txt); return w.every((x) => t.includes(x)); };
    const bs = B.map((b) => ({ b, s: (passt(b.name + ' ' + (b.lang || '')) ? 3 : 0) + (passt(b.kurz) ? 2 : 0) + (passt(b.text + ' ' + (b.profi || '')) ? 1 : 0) })).filter((x) => x.s > 0).sort((x, y) => y.s - x.s).map((x) => x.b);
    const fs = FAQ.filter((f) => passt(f.frage + ' ' + f.antwort));
    return { bs, fs };
  }

  /* ---------- Darstellung ---------- */
  const quelleEl = (q) => (q ? el('p', { class: 'tf-w-quelle' }, svgIco('i-book'), el('span', { text: q })) : null);
  function begriffZeile(b, onClick) {
    const k = KAT[b.kat];
    const btn = el('button', { type: 'button', class: 'tf-zeile' },
      el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + k[2] + ')' }, svgIco(k[1])),
      el('span', { class: 'tf-zeile-t' }, el('b', { text: b.name + (b.lang ? ' · ' + b.lang : '') }), el('small', { text: b.kurz })), svgIco('i-chev'));
    btn.lastChild.classList.add('tf-chev');
    btn.addEventListener('click', onClick || (() => T.geh('wissen/' + b.id)));
    return btn;
  }
  function faqEl(f, offen) {
    const d = el('details', { class: 'tf-faq', id: 'faq-' + f.id });
    if (offen) d.open = true;
    d.appendChild(el('summary', null, el('span', { text: f.frage }), svgIco('i-chev')));
    const body = el('div', { class: 'tf-faq-a' }, el('p', { text: f.antwort }), quelleEl(f.quelle));
    if (f.siehe && f.siehe.length) body.appendChild(el('div', { class: 'tf-w-chips' }, ...f.siehe.filter((s) => BY[s]).map((s) => chip(s))));
    d.appendChild(body);
    return d;
  }
  function chip(id) { const b = BY[id], c = el('button', { type: 'button', class: 'tf-w-chip' }, b.name); c.addEventListener('click', () => T.geh('wissen/' + id)); return c; }
  function inhalt(b, imBlatt) { // Text eines Begriffs (Seite und Blatt)
    const lv = levelAnwenden(), k = KAT[b.kat];
    const box = el('div', { class: 'tf-w-inhalt' });
    box.appendChild(el('div', { class: 'tf-w-kat' }, el('span', { class: 'tf-zeile-ico', style: '--c:var(--tf-' + k[2] + ')' }, svgIco(k[1])), el('span', { text: k[0] })));
    if (imBlatt) box.appendChild(el('h2', { class: 'tf-w-titel', id: 'sheet-titel', text: b.name }));
    if (b.lang && imBlatt) box.appendChild(el('div', { class: 'tf-w-lang', text: b.lang }));
    box.appendChild(el('p', { class: 'tf-w-kurz', text: b.kurz }));
    box.appendChild(el('p', { class: 'tf-w-text', text: b.text }));
    if (b.profi) { const d = el('details', { class: 'tf-w-genauer' }, el('summary', { text: 'Genauer' }), el('p', { text: b.profi })); if (lv === 'profi') d.open = true; box.appendChild(d); }
    box.appendChild(quelleEl(b.quelle));
    const akt = el('div', { class: 'tf-form-actions' });
    if (b.app) { const a = el('button', { type: 'button', class: 'tf-btn tf-btn-primary' }, b.app[1]); a.addEventListener('click', () => { schliessen(); T.geh(b.app[0]); }); akt.appendChild(a); }
    if (imBlatt) { const m = el('button', { type: 'button', class: 'tf-btn' }, 'Im Lexikon öffnen'); m.addEventListener('click', () => { schliessen(); T.geh('wissen/' + b.id); }); akt.appendChild(m); }
    if (akt.childElementCount) box.appendChild(akt);
    const sie = (b.siehe || []).filter((s) => BY[s]);
    if (sie.length) box.append(el('div', { class: 'tf-ctrl-l', style: 'margin-top:16px', text: 'Hängt zusammen mit' }), el('div', { class: 'tf-w-chips' }, ...sie.map((s) => { const c = el('button', { type: 'button', class: 'tf-w-chip' }, BY[s].name); c.addEventListener('click', () => (imBlatt ? zeige(s) : T.geh('wissen/' + s))); return c; })));
    const fq = FAQ.filter((f) => (f.siehe || []).includes(b.id));
    if (fq.length && !imBlatt) box.append(el('div', { class: 'tf-ctrl-l', style: 'margin-top:18px', text: 'Fragen dazu' }), el('div', { class: 'tf-faqs' }, ...fq.map((f) => faqEl(f))));
    return box;
  }

  // Blatt von unten: Begriff überall in der App antippen
  let letzterFokus = null;
  function blatt(node) { // beliebiger Inhalt im Blatt (auch für Trophäen und Level)
    const sh = document.getElementById('sheet'), box = document.getElementById('sheet-inhalt');
    if (sh.hidden) letzterFokus = document.activeElement;
    box.replaceChildren(node);
    sh.hidden = false; document.body.classList.add('tf-sheet-offen');
    const x = sh.querySelector('.tf-sheet-x'); if (x) x.focus({ preventScroll: true });
    sh.querySelector('.tf-sheet-box').scrollTop = 0;
  }
  function zeige(id) {
    const b = BY[id]; if (!b) return;
    blatt(inhalt(b, true));
    if (window.tfSpiel) tfSpiel.gelesen(id);
  }
  function schliessen() {
    const sh = document.getElementById('sheet'); if (!sh || sh.hidden) return;
    sh.hidden = true; document.body.classList.remove('tf-sheet-offen');
    if (letzterFokus && letzterFokus.focus) letzterFokus.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-sheet-zu]')) schliessen(); const t = e.target.closest('[data-begriff-auf]'); if (t) { e.preventDefault(); e.stopPropagation(); zeige(t.dataset.begriffAuf); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') schliessen(); });

  /* ---------- Seite „Wissen“ ---------- */
  const W = { q: '', kat: null, alleFragen: false };
  function renderWissen() {
    const box = $('#wissen-box'); if (!box) return;
    const R = T.routeInfo(T.route()) || {};
    levelAnwenden();
    if (R.begriff) { // Detailseite eines Begriffs
      const b = BY[R.begriff];
      if (!b) { box.replaceChildren(el('p', { class: 'tf-empty', text: 'Diesen Begriff gibt es nicht (mehr).' })); return; }
      T.kopf({ titel: b.name, sub: b.lang || KAT[b.kat][0] });
      box.replaceChildren(el('article', { class: 'tf-card tf-w-seite' }, inhalt(b, false)));
      if (window.tfSpiel) tfSpiel.gelesen(b.id);
      return;
    }
    // Übersicht: Suche, Level, Fragen, Themen, A–Z
    let suche = box.querySelector('#wissen-suche');
    if (!suche) {
      const inp = el('input', { class: 'tf-input', id: 'wissen-suche', type: 'search', placeholder: 'Begriff oder Frage suchen – z. B. HRV, Zone 2, Muskelkater', 'aria-label': 'Wissen durchsuchen', autocomplete: 'off', enterkeyhint: 'search' });
      inp.value = W.q;
      inp.addEventListener('input', () => { W.q = inp.value; liste(); });
      const msg = el('p', { class: 'tf-form-msg', role: 'status' });
      const lv = el('article', { class: 'tf-card tf-w-level' }, el('div', { class: 'tf-w-level-k' }, el('b', { text: 'Wie ausführlich soll Tagesform erklären?' }), el('small', { class: 'tf-wissen-hint', text: LEVEL.find((l) => l[0] === levelAnwenden())[2] })), levelWahl(msg), msg);
      box.replaceChildren(
        el('div', { class: 'tf-w-such' }, svgIco('i-search'), inp),
        el('div', { id: 'wissen-liste' }),
        lv,
        el('div', { class: 'tf-links', style: 'margin-top:14px' }, T.ui.zeile('wissen/methodik', 'So rechnet Tagesform', 'i-book', 'gold', 'Jede Kennzahl mit Formel, Deutung und Studie')),
        el('p', { class: 'tf-note tf-w-hinweis', text: 'Tagesform erklärt Trainingswissen nach aktuellem Stand der Forschung. Es ersetzt keine ärztliche Beratung – bei Schmerzen, Krankheit oder Beschwerden frag bitte deine Ärztin oder deinen Arzt.' }));
    }
    liste();
  }
  function liste() {
    const box = $('#wissen-liste'); if (!box) return;
    const t = treffer(W.q);
    box.replaceChildren();
    if (t) { // Suchergebnis
      if (!t.bs.length && !t.fs.length) { box.appendChild(el('p', { class: 'tf-empty', text: 'Nichts gefunden. Versuch ein anderes Wort – z. B. „Puls“, „Kraft“ oder „Schlaf“.' })); return; }
      if (t.bs.length) box.append(el('h2', { class: 'tf-hub-sek', text: 'Begriffe' }), el('div', { class: 'tf-links' }, ...t.bs.map((b) => begriffZeile(b))));
      if (t.fs.length) box.append(el('h2', { class: 'tf-hub-sek', text: 'Fragen' }), el('div', { class: 'tf-faqs' }, ...t.fs.map((f) => faqEl(f, t.fs.length === 1))));
      return;
    }
    // Häufige Fragen
    const zahl = W.alleFragen ? FAQ.length : 6;
    const mehr = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, W.alleFragen ? 'Weniger Fragen' : 'Alle ' + FAQ.length + ' Fragen');
    mehr.addEventListener('click', () => { W.alleFragen = !W.alleFragen; liste(); });
    box.append(el('h2', { class: 'tf-hub-sek' }, 'Häufige Fragen'), el('div', { class: 'tf-faqs' }, ...FAQ.slice(0, zahl).map((f) => faqEl(f))), el('div', { class: 'tf-form-actions', style: 'margin-top:6px' }, mehr));
    // Themen: erst die Übersicht, nach dem Antippen die Begriffe des Themas
    const kopf = el('h2', { class: 'tf-hub-sek', id: 'wissen-themen' }, 'Begriffe nach Thema', el('small', { text: B.length + ' Einträge' }));
    const wahl = (k) => { W.kat = k; liste(); requestAnimationFrame(() => { const h = $('#wissen-themen'); if (h && h.getBoundingClientRect().top < 60) h.scrollIntoView({ block: 'start', behavior: 'smooth' }); }); };
    if (!W.kat) {
      const kacheln = Object.entries(KAT).map(([k, v]) => {
        const L = B.filter((b) => b.kat === k);
        const t = el('button', { type: 'button', class: 'tf-kachel', style: '--c:var(--tf-' + v[2] + ')' },
          el('span', { class: 'tf-kachel-kopf' }, el('span', { class: 'tf-kachel-ico' }, svgIco(v[1])), el('b', { text: v[0] })),
          el('span', { class: 'tf-kachel-wert', text: L.slice(0, 3).map((b) => b.name).join(' · ') }),
          el('span', { class: 'tf-kachel-sub' }, el('span', { text: L.length + (L.length === 1 ? ' Begriff' : ' Begriffe') })));
        t.addEventListener('click', () => wahl(k));
        return t;
      });
      const alle = el('button', { type: 'button', class: 'tf-btn tf-btn-plain' }, 'Alle Begriffe von A bis Z');
      alle.addEventListener('click', () => wahl('alle'));
      box.append(kopf, el('div', { class: 'tf-kacheln tf-w-themen' }, ...kacheln), el('div', { class: 'tf-form-actions', style: 'margin-top:6px' }, alle));
      return;
    }
    const chips = el('div', { class: 'tf-chipset tf-w-kats', role: 'group', 'aria-label': 'Thema' });
    [[null, 'Alle Themen'], ['alle', 'A–Z']].concat(Object.entries(KAT).map(([k, v]) => [k, v[0]])).forEach(([k, name]) => { const c = el('button', { type: 'button', 'aria-pressed': String(W.kat === k) }, name); c.addEventListener('click', () => wahl(k)); chips.appendChild(c); });
    const L = B.filter((b) => W.kat === 'alle' || b.kat === W.kat).slice().sort((x, y) => x.name.localeCompare(y.name, 'de'));
    box.append(kopf, chips, el('div', { class: 'tf-links' }, ...L.map((b) => begriffZeile(b))));
    requestAnimationFrame(() => { const c = chips.querySelector('[aria-pressed="true"]'); if (c && c.offsetLeft > chips.clientWidth - 60) chips.scrollLeft = c.offsetLeft - 16; });
  }

  /* ---------- Begriffe an Karten: (i) zum Antippen, für Einsteiger ein Satz darunter ---------- */
  const KARTE_BEGRIFF = {
    'karte-tagesform': 'tagesform', 'karte-hrv': 'hrv', 'karte-korridor': 'hrv_korridor', 'karte-ruhepuls': 'ruhepuls', 'karte-atmung': 'atemfrequenz', 'karte-status': 'hrv',
    'karte-phasen': 'schlafphasen', 'karte-dauer': 'schlafbedarf', 'karte-fenster': 'schlafrhythmus', 'karte-pmc': 'ctl', 'karte-bilanz': 'interne_last', 'karte-acwr': 'acwr',
    'karte-verteilung': 'polarisiert', 'karte-monotonie': 'monotonie', 'karte-check': 'grauzone', 'karte-fueling': 'kh_stunde', 'karte-schwimm-technik': 'swolf', 'karte-css': 'css',
    'karte-kurve': 'ftp', 'karte-ftp': 'ftp', 'karte-effizienz': 'effizienz', 'karte-bedarf': 'cda', 'karte-laufwaechter': 'laufbudget', 'karte-kadenz': 'kadenz', 'karte-ef-lauf': 'effizienz',
    'karte-checkin': 'checkin', 'karte-gewicht': 'wkg', 'karte-ernaehrung': 'protein', 'karte-schwimm-tempo': 'css', 'karte-wochen': 'periodisierung',
    'karte-gym-einstellung': 'rir', 'karte-gym-woche': 'hypertrophie',
    'karte-schritte-heute': 'schritte', 'karte-bewegung-woche': 'intensitaetsminuten', 'karte-stress-verlauf': 'stress_uhr', 'karte-bb-verlauf': 'body_battery', 'karte-spo2': 'spo2', 'karte-xp-verlauf': 'xp',
  };
  function beschriften(seite) {
    const sec = document.getElementById(seite); if (!sec) return;
    const lv = levelAnwenden();
    Object.entries(KARTE_BEGRIFF).forEach(([id, bid]) => {
      const k = sec.querySelector('#' + id); if (!k || !BY[bid]) return;
      const h2 = k.querySelector('.tf-card-head h2'); if (!h2) return;
      if (!h2.querySelector('.tf-i')) h2.appendChild(el('button', { type: 'button', class: 'tf-i', 'data-begriff-auf': bid, 'aria-label': BY[bid].name + ' erklärt' }, svgIco('i-info')));
      let e = k.querySelector(':scope > .tf-erkl');
      if (lv === 'einsteiger') { if (!e) { e = el('p', { class: 'tf-erkl' }, el('b', { text: BY[bid].name + ': ' }), BY[bid].kurz); k.querySelector('.tf-card-head').after(e); } }
      else if (e) e.remove();
    });
  }

  /* ---------- Heute: einmal nach dem Wissenslevel fragen ---------- */
  function heuteLevel() { // unter den Key Facts, damit oben zuerst die Tagesform steht
    const box = $('#home-hinweise2'); if (!box) return;
    const a = athlet(); let h = box.querySelector('#hinweis-level');
    let weg = false; try { weg = localStorage.getItem('tf:level-gefragt') === '1'; } catch (e) { /* egal */ }
    if (!a || a.wissen || gewaehlt || weg) { if (h) h.remove(); return; }
    if (h) return;
    const ch = el('div', { class: 'tf-chipset' });
    LEVEL.forEach(([v, name]) => { const b = el('button', { type: 'button' }, name); b.addEventListener('click', () => { setzeLevel(v); h.remove(); A().toast('Gespeichert – ändern kannst du das unter Profil oder Wissen.'); }); ch.appendChild(b); });
    const x = el('button', { type: 'button', class: 'tf-hinweis-x', 'aria-label': 'Später' }, svgIco('i-x'));
    x.addEventListener('click', () => { try { localStorage.setItem('tf:level-gefragt', '1'); } catch (e) { /* egal */ } h.remove(); });
    h = el('article', { class: 'tf-card tf-hinweis', id: 'hinweis-level' },
      el('span', { class: 'tf-badge', style: 'background:var(--tf-gold)' }, svgIco('i-book')),
      el('div', null, el('b', { text: 'Wie gut kennst du dich aus?' }), el('p', { text: 'Dann erklärt Tagesform Begriffe wie HRV oder TSS so ausführlich, wie es für dich passt.' }), ch), x);
    box.appendChild(h);
  }

  /* ---------- Profil „Über dich“: Wissenslevel ---------- */
  function profilLevel() {
    const k = $('#karte-ich'); if (!k) return;
    let w = k.querySelector('#ich-wissen');
    if (!w) {
      const msg = el('p', { class: 'tf-form-msg', role: 'status' });
      w = el('div', { class: 'tf-field tf-ich-wissen', id: 'ich-wissen' }, el('span', { text: 'Wissenslevel' }), levelWahl(msg), el('small', { class: 'tf-ich-hint tf-wissen-hint', text: LEVEL.find((l) => l[0] === levelAnwenden())[2] }), msg);
      k.appendChild(w);
    } else {
      const cur = levelAnwenden();
      $$('.tf-wissen-seg button', w).forEach((b, i) => b.setAttribute('aria-pressed', String(LEVEL[i][0] === cur)));
    }
  }

  T.seite('wissen', renderWissen);
  T.routen('wissen', (id) => (id === 'methodik' ? null : { seite: 'wissen', titel: BY[id] ? BY[id].name : 'Wissen', sub: BY[id] ? (BY[id].lang || KAT[BY[id].kat][0]) : '', begriff: id }));
  T.zusatz('*', beschriften);
  T.zusatz('heute', heuteLevel);
  T.zusatz('profil', profilLevel);
  window.tfWissen = { zeige, blatt, schliessen, begriff: (id) => BY[id] || null, level: levelAnwenden, chip: (id, text) => el('button', { type: 'button', class: 'tf-term', 'data-begriff-auf': id }, text || (BY[id] ? BY[id].name : id)), anzahl: { begriffe: B.length, fragen: FAQ.length } };
})();
