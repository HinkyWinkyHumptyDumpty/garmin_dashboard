# Dreiklang – deine Garmin-Daten als App

App für Ausdauersport und Fitness: **Tune** – die Zahl für heute – aus HRV, Ruhepuls, Schlaf und Befinden, ein **Gesundheitsbild** aus zwölf Werten, Trainingsbelastung je Disziplin, Fitness-Alter, **Trainingsplan** für jede Sport-Kombination, **Gym** mit antippbarem Körper, **Pilates & Yoga** mit geführtem Timer, **XP, Quests und Trophy Road** zum Dranbleiben, **Dein Tag** mit Zeitfenstern, **Heute notiert** (Trinken, Eiweiß, Koffein, eigener Stack), ein **Wissen**-Lexikon, **Material** (Kette wachsen, Laufschuh-Kilometer), **Renntag** mit Race Card und ein Rennrechner für Triathlon, Laufen, Rad und Schwimmen. Läuft kostenlos auf **Vercel** (App) mit **Upstash Redis** (Speicher) und holt die Daten über die **Garmin Connect Personal API**. Jede Person meldet sich mit E-Mail und Passwort an und verbindet ihren eigenen Garmin-Schlüssel – oder nutzt Plan, Gym, Pilates & Yoga, Rechner und Wissen erst einmal ohne Garmin.

## Was du bekommst

Fünf Bereiche – am Handy unten, am Laptop oben. Jeder Bereich öffnet eine Übersicht mit Kacheln; erst ein Tipp darauf führt eine Ebene tiefer zu Diagrammen und Details. Zurück geht es oben links – in der installierten App auch mit einem Wisch vom linken Rand.

| Bereich | Übersicht → Detailseiten |
|---|---|
| **Heute** | Tune-Ring mit HRV, Ruhepuls und Schlaf auf einen Blick (ohne Uhr: Tune nach Gefühl), Key Facts (Countdown, Fitness-Alter, **Schritte**, Form, Schlafschuld, Belastung, Laufbudget), **Dein Tag** (Fokus-, normaler oder Schon-Tag, Zeitfenster für Licht, Koffein, Essen und Bett, Kohlenhydrate nach Trainingslast, Briefing vor Schlüsseleinheiten), **Heute notiert**, **Level, XP und die drei Quests des Tages**, Wissen für heute, Wochenrückblick, „Heute im Plan“, Piktogramme zu allen Bereichen, Empfehlung und Erkenntnisse · Tipp auf den Ring → **Dreiklang** im Detail |
| **Training** | **Planen & trainieren**: **Trainingsplan** (Assistent: Sportarten kombinieren – Laufen, Rad, Schwimmen, Kraft, Mobilität –, Ziel, Distanz, Rennen, Stunden pro Woche, Trainingstage, Erfahrung → jede Woche fertig geplant mit Phasen, Erholungswochen und Tapering), **Gym** (Muskeln am Körper antippen oder Vorlage wählen, Ort Studio/zuhause mit oder ohne Hanteln, Ziel, Dauer, Erfahrung, Cardio danach → Workout mit Anleitung, Tausch, Sätzen pro Muskel und „Deine Woche im Gym“), **Pilates & Yoga** (**Kurz-Routinen** für Nacken, Schreibtisch, Box-Atmung und Atem-Seufzer; Anlässe wie „Nach dem Laufen“ oder „Abends runterkommen“ oder selbst zusammenstellen → Einheit mit Phasen und geführtem Modus mit Timer, Seitenwechsel und Atemhilfe) · **Deine Sportarten** (Schwimmen, Rad, Laufen) · **Auswertung** (Fitness & Form, Belastungssprünge, Umfang & Intensität, Einheiten-Check, Fueling) · **Ziele & Rennen** (Saison, Rennrechner, **Renntag** mit Race Card und Packliste, Werkzeuge) · **Material & Körper** (Kette wachsen, Laufschuhe, **Schweißrate**) |
| **Gesundheit** | **Gesundheitsbild**: zwölf Werte in vier Bereichen (Erholung, Schlaf, Aktivität, Stress & Energie) mit Ampel, Trend gegen dein Normal und den zwei auffälligsten Punkten · Check-in am Morgen · Tune · HRV mit 7-Tage-Korridor · Ruhepuls & Atmung mit SpO₂ · Schlaf · **Schritte & Bewegung** (Ziel, 30 Tage, Bewegungsminuten nach WHO) · **Stress & Body Battery** · **Heute notiert** (Trinken, Eiweiß, Koffein, Stack mit Bestand, Vergleich „mit / ohne“) · **Laborwerte** · Fitness-Alter (WHOOP-ähnlich) · Körper & Energie |
| **Wissen** | Lexikon mit über 70 Begriffen (HRV, TSS, CTL, Zone 2, RIR, CSS …) in drei Tiefen je nach Wissenslevel, häufige Fragen, Suche, Themen und „So rechnet Dreiklang“ mit allen Formeln und Studien. Auf vielen Karten erklärt ein (i) den Begriff direkt. |
| **Profil** | **Spielerkarte** mit Banner, Profilbild, Titel, Level und XP · **Quests** (täglich und wöchentlich) · **Trophy Road** (70 Level in sieben Stufen von Bronze bis Legende) · **Trophäen** (53 Auszeichnungen, auch rückwirkend aus deinen Daten) · **Profilbild & Banner** (eigenes Foto, Abzeichen, Banner, Rahmen, Titel) · Über dich (**Fokus der App**, Aufstehzeit, Geburtsjahr, Geschlecht, Sportarten, Wissenslevel), Athletenprofil mit Vorschlägen aus Garmin, Garmin & Daten, Morgen-Push, Darstellung, **Bedienungshilfen** (größere Schrift, weniger Text), **Schlaf & Abend** (eigene Bett- und Schlafenszeit), Konto & Datenschutz, Teilen |

Aktualisierung: automatisch dreimal täglich für alle Konten und zusätzlich beim Öffnen, wenn der letzte Abruf älter als zwei Stunden ist. Die App startet sofort mit dem letzten Stand und funktioniert auch ohne Netz.

---

## Eigene Kopie einrichten

So bekommt jede Person ihre eigene Kopie von Dreiklang – mit eigenem Garmin-Schlüssel, eigener Datenbank und eigenen Daten. Kostenlos, etwa 10 Minuten.

**Du brauchst:** ein kostenloses Konto bei [github.com](https://github.com) und bei [vercel.com](https://vercel.com) (mit GitHub anmelden) sowie einen Garmin-Connect-Account.

### 1. Garmin-Schlüssel erstellen
1. Im Browser [Personal API Key in Garmin Connect](https://connect.garmin.com/app/settings/personalApiToken) öffnen und anmelden.
2. **Create Key** wählen und Garmins Bedingungen lesen und akzeptieren.
3. Die **längste Laufzeit** wählen – danach braucht es einen neuen Schlüssel (die App sagt Bescheid).
4. Den Schlüssel **sofort kopieren** und sicher ablegen (z. B. im Passwort-Manager) – Garmin zeigt ihn nur einmal.

### 2. App auf Vercel anlegen
[![Mit Vercel veröffentlichen](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHinkyWinkyHumptyDumpty%2Fgarmin_dashboard&root-directory=tagesform-app&project-name=tagesform&repository-name=tagesform)

Auf den Knopf tippen → GitHub verbinden → **Create**. Vercel legt eine Kopie des Codes in deinem GitHub an und veröffentlicht sie. Danach die angezeigte Adresse öffnen (`https://<name>.vercel.app`).

> Ohne Knopf: Code als ZIP herunterladen, in ein eigenes GitHub-Repository hochladen, in Vercel **Add New… → Project** → importieren. Liegt die App in einem Unterordner, unter **Root Directory** `tagesform-app` eintragen.

### 3. Einrichtung abschließen
Beim ersten Öffnen zeigt die App **„Noch nicht fertig eingerichtet“** – mit Vorschlägen für die geheimen Werte, die nur in deinem Browser erzeugt werden:

1. **Storage** → **Upstash for Redis** (kostenloser Plan, Region **Frankfurt**) → mit dem Projekt verbinden. Vercel trägt `KV_REST_API_URL` und `KV_REST_API_TOKEN` selbst ein.
2. **Settings → Environment Variables** → `AUTH_SECRET` und `CRON_SECRET` mit den Vorschlägen aus der App anlegen.
3. **Deployments** → beim obersten Eintrag „…“ → **Redeploy**.

### 4. Konto anlegen und Garmin verbinden
App neu laden → **Konto erstellen** (das erste Konto ist frei) → **Notfall-Code notieren** (einziger Weg, ein vergessenes Passwort zurückzusetzen) → Garmin-Schlüssel einfügen. Der erste Import holt 12 Monate und dauert 2–3 Minuten.

### 5. Aufs iPhone und Morgen-Push
In **Safari** öffnen → **Teilen** → **Zum Home-Bildschirm**. Danach vom Home-Bildschirm starten → **Profil → Morgen-Push → Push aktivieren** (ab iOS 16.4).

---

## Wer sich anmelden darf

| Einstellung in Vercel | Wirkung |
|---|---|
| nichts weiter | Das **erste Konto** kann sich frei anmelden, danach ist die Registrierung geschlossen. Andere sehen einen Hinweis auf diese Anleitung. |
| `EINLADUNGSCODE` = ein Wort deiner Wahl | Neue Konten nur mit diesem Code (z. B. für Familie oder Trainingsgruppe). |
| `REGISTRIERUNG` = `offen` | Jeder kann ohne Freigabe ein Konto anlegen und seinen eigenen persönlichen Garmin-Schlüssel eintragen – sobald `BETREIBER_NAME` und `BETREIBER_KONTAKT` gesetzt sind (sie stehen dann in der Datenschutzerklärung). Siehe den Hinweis zu Garmins Regeln. |

Jede Registrierung braucht ein Häkchen zur **Einwilligung** in die Verarbeitung der Gesundheitsdaten (gespeichert mit Datum und Version der [Datenschutzerklärung](public/datenschutz.html)). Gegen Massenanmeldungen: höchstens 6 neue Konten pro Stunde und Anschluss, höchstens `REG_MAX_TAG` (Standard 50) pro Tag, dazu ein unsichtbares Feld als Falle für Formular-Roboter.

Änderungen an Variablen gelten erst nach einem **Redeploy**.

### Hinweis zu Garmins Regeln
Bei offener Registrierung trägt jede Person ihren **eigenen persönlichen Garmin-Schlüssel** ein. Garmin beschreibt diesen Schlüssel als Zugang zu den eigenen Daten – nicht für Apps mit vielen Nutzern; Garmin könnte solche Schlüssel deshalb sperren. Für Dienste mit vielen Nutzern sieht Garmin die Business-Stufen des [Connect Developer Program](https://developer.garmin.com/gc-developer-program/overview/) vor (Starter: mit Antrag, laut Berichten kostenlos bis etwa 1.000 Nutzer). Ganz ohne Antrag und ohne diesen Konflikt geht es, wenn **jeder seine eigene Kopie einrichtet** (Abschnitt oben). Wer fremde Konten zulässt, speichert Gesundheitsdaten anderer Personen – dafür gibt es die Datenschutzerklärung (`/datenschutz.html`) mit deinen Angaben und die Einwilligung beim Registrieren.

---

## Umgebungsvariablen

| Name | Pflicht? | Wert |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | ja | trägt Vercel beim Verbinden von Upstash selbst ein (`UPSTASH_REDIS_REST_URL`/`_TOKEN` gehen auch) |
| `AUTH_SECRET` | ja | mind. 32 zufällige Zeichen. Signiert die Anmeldung und verschlüsselt die gespeicherten Garmin-Schlüssel. **Nicht mehr ändern, sobald es Konten gibt** – sonst sind alle abgemeldet und müssen ihren Garmin-Schlüssel neu eintragen. Zu leicht zu erratende Werte (z. B. nur Ziffern) lehnt die App ab. |
| `CRON_SECRET` | empfohlen | mind. 16 zufällige Zeichen. Ohne sie gibt es keine automatischen Abrufe und keinen Morgen-Push. |
| `EINLADUNGSCODE` | nein | siehe „Wer sich anmelden darf“ |
| `REGISTRIERUNG` | nein | `offen` öffnet die Registrierung für alle (nur mit Betreiberangaben) |
| `BETREIBER_NAME` | für offene Registrierung | dein Name – erscheint in der Datenschutzerklärung als Verantwortlicher |
| `BETREIBER_KONTAKT` | für offene Registrierung | E-Mail-Adresse für Datenschutzfragen |
| `BETREIBER_ANSCHRIFT` | nein | Anschrift fürs Impressum, z. B. `Musterstraße 1, 12345 Musterstadt` (Kommas werden zu Zeilen) |
| `REG_MAX_TAG` | nein | neue Konten pro Tag, Standard 50 |

Den Garmin-Schlüssel trägt jede Person **in der App** ein (Profil → Konto), nicht in Vercel.

## Konten und Daten

- **Anmeldung**: E-Mail und Passwort (mind. 10 Zeichen). Die Anmeldung hält 180 Tage pro Gerät. Wer das Passwort ändert, ist auf allen anderen Geräten abgemeldet.
- **Passwort vergessen**: Mit dem **Notfall-Code** aus der Registrierung (E-Mails verschickt die App nicht). Einen neuen Code gibt es unter Profil → Konto.
- **Gespeichert** werden: E-Mail, das Passwort nur als Prüfwert (scrypt), der Garmin-Schlüssel verschlüsselt (AES-256-GCM), die Garmin-Daten der letzten 12 Monate und eigene Einträge – dazu, falls festgelegt, Anzeigename und Profilbild (im Browser auf 256 × 256 Pixel verkleinert, höchstens 50 KB) sowie der Spielstand. Jedes Konto sieht nur seine eigenen Daten; Ranglisten oder einen Austausch zwischen Konten gibt es nicht.
- **Konto löschen** (Profil → Konto) entfernt sofort alles, was zu diesem Konto gehört. Die Daten bei Garmin bleiben unberührt.
- **Daten herunterladen** (Profil → Konto) liefert alles Gespeicherte als JSON-Datei (Auskunft und Datenübertragbarkeit nach DSGVO).
- **Datenschutzerklärung**: öffentlich unter `/datenschutz.html` (Deutsch und Englisch), verlinkt beim Anmelden und Registrieren. Name, Kontakt und Anschrift kommen aus den `BETREIBER_*`-Variablen.
- **Aufbewahrung**: Garmin-Daten und Einheiten-Auswertungen höchstens 400 Tage, alles andere bis zum Löschen des Kontos.
- **Auf dem Gerät** liegt nur der zuletzt geladene Stand des angemeldeten Kontos; beim Abmelden wird er gelöscht.

## Gut zu wissen

- **Garmin-Schlüssel abgelaufen**: Die App meldet sich mit „Garmin nimmt den Schlüssel nicht mehr an“ – neuen Schlüssel in Garmin Connect erstellen und eintragen.
- **Profilwerte**: Neue Konten starten mit Standardwerten; nach dem ersten Import kommen Vorschläge aus den Garmin-Daten dazu (Gewicht, Pulszonen, FTP). Im Profil ist markiert, was „aus Garmin“ und was „Standard“ ist.
- **Ernährung & Fueling**: aus dem Ernährungsprotokoll von Garmin Connect (Connect+). Kohlenhydrate langer Einheiten lassen sich unter **Training → Einheiten** auch direkt eintragen.
- **Fitness-Alter**: braucht Geburtsjahr und Geschlecht (Profil → Über dich oder direkt auf der Seite). Es ist eine Schätzung aus deinen Daten, keine medizinische Diagnose.
- **Sportarten**: Unter Profil → Über dich wählst du, welche Sportarten unter Training erscheinen (Schwimmen, Rad, Laufen, Gym).
- **Rennen**: Unter Training → Saison eintragen. Das nächste A-Rennen bestimmt Countdown und Trainingsphase – auch für Trainingsplan und Gym; aus jeder Zeile öffnet „Rechner“ die passende Distanz.
- **Ohne Garmin**: Beim Verbinden „Erst mal ohne Garmin“ wählen. Dann gehen Trainingsplan, Gym, Pilates & Yoga, Check-in, Rennrechner und Wissen sofort; Seiten, die Garmin-Daten brauchen, zeigen stattdessen „Garmin verbinden“. Verbinden geht jederzeit über den Knopf oben oder Profil → Garmin & Daten.
- **Wissenslevel**: Einsteiger, Fortgeschritten oder Profi (Profil → Über dich oder Wissen). Einsteiger sehen unter vielen Karten eine kurze Erklärung, Profis die Fachbegriffe und Formeln.
- **Trainingsplan, Gym, Pilates & Yoga** werden pro Konto gespeichert (`/api/rechner`, Schlüssel `plan`, `gym`, `flow`) und sind auf allen Geräten gleich. Erledigte Workouts und Einheiten landen im Tagebuch des jeweiligen Bereichs (die letzten 30).
- **XP und Level**: Jede Minute Training bringt 1 XP – jede Sportart, die die Uhr erkennt, und jedes in der App erledigte Gym- oder Pilates/Yoga-Workout (am selben Tag wie Kraft bzw. Yoga auf der Uhr nur als Bonus). Dazu Schritte (bis 75 XP am Tag), Schlaf (7 Stunden, Schlafziel), Check-ins, Plan-Einheiten, Quests und Trophäen. Ab 2 Stunden Training am Tag zählt jede Minute halb, an roten Tagen gibt es Erholungs-Quests – seit Version 8 bringen harte Minuten an roten Tagen keine XP, wer sich schont, bekommt +20 XP „klug erholt“ (vergangene Tage behalten ihre XP). Startguthaben: die 30 Tage vor dem ersten Öffnen; Trophäen aus älteren Daten zählen mit. Die Regeln stehen unter Profil → Quests und in „So rechnet Dreiklang“.
- **Spielstand** (`/api/rechner`, Schlüssel `spiel`): Start, XP-Summen abgeschlossener Monate (so bleiben XP erhalten, wenn Garmin-Daten nach 400 Tagen gelöscht werden), Trophäen-Daten, gelesene Begriffe und die Auswahl für Profilbild, Banner, Rahmen und Titel. Stände mehrerer Geräte führt der Server zusammen (früherer Start, früheste Trophäendaten, abgeschlossene Monate bleiben). Das Profilbild liegt getrennt unter dem Schlüssel `avatar` (`/api/profil` mit `bild`, `null` löscht); Anzeigename und Schrittziel stehen im Profil.
- **Schrittziel**: Standard 8.000, unter Gesundheit → Schritte & Bewegung änderbar (2.000–30.000) – oder **dynamisch**: Schnitt der letzten 4 Wochen plus 500 (5.000–12.000), an roten Tagen 20 % weniger. Es gilt auch für Quests und XP.
- **Fokus der App**: Alltag & Energie (ohne Trainingszahlen, „Bewegung“ statt „Training“), Fitness & Gym oder Performance (alles). Ohne Wahl zeigt die App alles wie bisher. Ändern unter Profil → Über dich.
- **Heute notiert, Laborwerte, Material, Schweißrate, Renntag** liegen ebenfalls unter `/api/rechner` (Schlüssel `alltag`, `labor`, `material`, `schweiss`, `renntag`), das Tagesprotokoll selbst unter `/api/checkin` mit `art: "tagebuch"` (die letzten 400 Tage). Dreiklang gibt **keine Empfehlungen zu Nahrungsergänzung** und bewertet Laborwerte nicht – beides ist nur zum Mitschreiben.
- **Mitteilungen**: neben dem Morgen-Push eine Erinnerung, wenn Kette oder Schuhe fällig sind (7–22 Uhr), und am Sonntagabend der Wochenrückblick.
- **Zeitplan**: Cron-Zeiten in `vercel.json` in UTC (`0 6`, `0 8`, `0 19`); im kostenlosen Plan startet Vercel jeden Job irgendwann innerhalb dieser Stunde. Pro Lauf werden die Konten reihum aktualisiert, je vier gleichzeitig (jeder Schlüssel hat sein eigenes Garmin-Limit); ein Lauf hat 4,5 Minuten. Bei sehr vielen Konten kommt nicht jedes in jedem Lauf dran – die App holt beim Öffnen selbst nach, wenn der letzte Abruf älter als zwei Stunden ist. Konten, die die App 30 Tage nicht geöffnet haben, ruhen bis zum nächsten Öffnen (spart Abrufe und Speicher-Befehle).
- **Viele Nutzer**: Der kostenlose Upstash-Plan reicht für einige hundert aktive Konten (Speicher und Befehle pro Monat); danach den Bezahlplan nach Verbrauch wählen.
- **Offline & Updates**: Die App-Dateien liegen nach dem ersten Start auf dem Gerät. Gibt es eine neue Version, erscheint unten „Neue Version da – Neu laden“.

## Wenn etwas hakt

| Meldung | Lösung |
|---|---|
| „Noch nicht fertig eingerichtet“ | den Schritten auf dem Bildschirm folgen, dann **Redeploy** |
| „AUTH_SECRET … zu leicht zu erraten“ | in Vercel durch den Vorschlag aus der App ersetzen, Redeploy |
| „Diese Kopie von Dreiklang ist privat“ | Registrierung ist geschlossen – Einladungscode vom Betreiber oder eigene Kopie einrichten |
| Registrierung bleibt zu, obwohl `REGISTRIERUNG=offen` | `BETREIBER_NAME` und `BETREIBER_KONTAKT` setzen, Redeploy (Profil → „Dreiklang für andere“ zeigt den Grund) |
| „Garmin lehnt diesen Schlüssel ab“ | Schlüssel vollständig kopiert? Sonst neuen in Garmin Connect erstellen |
| Daten werden morgens nicht neu | `CRON_SECRET` gesetzt? In Vercel unter **Settings → Cron Jobs** die Logs ansehen |
| „Zu viele Versuche“ | 15 Minuten (Anmelden) bzw. eine Stunde (neue Konten) warten |
| Push kommt nicht | Profil → „Test senden“; Push nur aus der installierten App (Home-Bildschirm) |

## Aufbau

```
api/        Serverfunktionen: login (Anmelden, Registrieren, Zurücksetzen), konto, data, refresh (Cron + Morgen-Push),
            checkin, profil, css, fueling, rechner, wettkampf, push
lib/        nutzer (Konten, Passwörter, Verschlüsselung), auth (Sitzung), store (Upstash REST, je Konto getrennt),
            garmin (Abruf je Konto), push (VAPID + Verschlüsselung), daten, profil, distanzen, methoden, rechnen,
            betreiber (Angaben für Datenschutz und Impressum)
public/     App: index.html, styles.css, shim.js (Anmeldung, Daten, Offline), calcs.js (alle Formeln), app.js (Darstellung),
            seiten.js (Fitness-Alter, Saison, Werkzeuge, Belastung und Korridor), hubs.js (Bereichs-Übersichten),
            plan.js (Trainingsplan), gym.js (Körperkarte, 91 Übungen, Workouts), flow.js (Pilates & Yoga, geführter Modus),
            wissen.js (Lexikon, Fragen, Wissenslevel), spiel-motor.js (Regeln für XP, Level, Quests, Trophäen – läuft auch in Node),
            spiel.js (Quests, Trophy Road, Trophäen, Profilbild & Banner, Feiern), gesund.js (Gesundheitsbild, Schritte, Stress),
            alltag-motor.js (Regeln für Zeitfenster, Ziele, Kohlenhydrate, Schweißrate, Material, Wochenbilanz – läuft auch in Node),
            alltag.js (Fokus, Dein Tag, Heute notiert, Laborwerte, Wochenrückblick), leistung.js (Material, Schweißrate, Renntag),
            einblick.js (Was dich beeinflusst, Frühwarnung, Wetter, Termine, Wochenende, Morgen in 3 Karten),
            timer.js (Timer-Leiste mit Ton für Gym-Pausen, Fokus-Blöcke und Kurz-Routinen),
            rueckblick.js (Trend-Pfeile, Deine Trends über 30/90/365 Tage, Rückblicke, Monats- und Jahres-Story),
            tageslauf.js (Abend-Check mit Tagesabschluss, Schlaf & Abend, Heute wichtig, Nachmittagstief, Pause-Modus, Schnellstart, Willkommen zurück, Nachtragen),
            experimente.js (Mini-Experimente), tutorial.js (Tutorial), tour.js (geführte Tour), beispiel.js (ausgedachte Beispieldaten für die Tour), fonts/ (Plus Jakarta Sans – SIL Open Font License), bedienung.js (Bedienungshilfen),
            steuerung.js (Überlastungs-Wächter, Beine gegen Kreislauf, „Was wäre, wenn …?“),
            start.js (Startseite nach Tageszeit, Favoriten, „Mehr für heute“),
            rennen-daten.js (Katalog mit ~130 Rennen und Profilen), rennen.js (Bereich Rennen: Karte, Kalender, Strecke, Prognose, Pacing), faden.js (der Faden auf Heute),
            bibliothek.js (Trainingsbibliothek), teilen.js (Bilder zum Teilen), vendor/ (d3, topojson-client, welt.json),
            sw.js (Offline-Start, Updates, Mitteilungen, Hintergrund-Sync der Warteschlange), datenschutz.html (öffentlich, Deutsch/Englisch)
scripts/    nur lokal: Testserver, alle Tests (run-all-tests.js), Formeltest, Spieltests, Randfälle, Push-Test, Icons
```

Keine Pakete nötig (Node 22). Lokal testen:
```bash
AUTH_SECRET=lokal-0123456789-abcdefghijklmnopqrst TF_DEV_STORE=./data/dev.json node scripts/dev-server.js
```
Dann http://localhost:3000 öffnen, Konto anlegen, Garmin-Schlüssel eintragen. Alle Tests auf einmal: `node scripts/run-all-tests.js [ordner-mit-json]` (ohne Ordner zusätzlich mit leerem Profil und ganz ohne Garmin-Daten). Einzeln: `node scripts/test-calcs.js <ordner-mit-json>` (alle Formeln), `node scripts/test-spiel.js <ordner-mit-json>` (Spielregeln: XP sinken nie, nichts geht verloren, Quests fest je Tag) und `node scripts/test-push.js` (Push-Verschlüsselung gegen RFC 8291), `node scripts/test-alltag.js` (Zeitfenster, Ziele, Kohlenhydrate, Schweißrate, Material) `node scripts/test-spiel-v8.js` (Regeln aus Version 8), `node scripts/test-spiel-v9.js` (Streak-Schutz), `node scripts/test-spiel-v10.js` (Mini-Experimente und Pause-Modus) und `node scripts/test-randfaelle.js` (leere und kaputte Eingaben).

## Neu in dieser Version (21)

- **Heute nur noch Key Facts** – wie bei Whoop: Datum, der Faden zum Rennen, dann **der Tune als dunkle Bühne** (Ring in der Ampelfarbe, Zahl, Zustand, Grund, Empfehlung, HRV · Ruhepuls · Schlaf, die letzten 14 Tage mit Teilen-Knopf) und darunter **die Einheit des Tages**. Alles andere – Kacheln, Dein Tag, Wasser & Eiweiß, Level, Tipps, Rückblicke, Bereiche – liegt hinter „Mehr für heute“. Was nur jetzt dran ist (Nachmittagstief, Dein Abend mit Tagesabschluss, Heute wichtig, ein laufendes Experiment), bleibt offen. Ohne Favoriten einstellen zu müssen.
- **Karte zoombar**: zwei Finger zum Zoomen und Schieben (am Laptop Strg + Mausrad, Ziehen mit der Maus), Knöpfe + − ⌂, Punkte bleiben gleich groß, der Ausschnitt bleibt beim Filtern erhalten.
- **Viele Filter**: Chips Ironman · Challenge · 70.3 & Half · Marathon · Halbmarathon; unter „Filter“: Profil (flach, wellig, hügelig, bergig), Wasser (See, Meer, Fluss & Kanal, nur Laufen), Monat – kombinierbar, mit Zähler und Zurücksetzen.
- **„Passt zu mir“**: Für jede Strecke rechnet Dreiklang deine Prognose und vergleicht sie mit dem Schnitt der Distanz – der Schalter zeigt die 15 Strecken mit deinem größten Vorteil (z. B. „6 % schneller“) auf Karte und Kalender, mit einem Satz, warum (Watt pro Luftwiderstand gegen Watt pro Kilo).
- **Kalender-Abo statt Datei**: Unter Plan → „In Kalender“ steht jetzt „Kalender abonnieren“ – dein Kalender holt sich die Termine über eine Abo-Adresse (`webcal://…/api/kalender?t=…`) selbst und **bleibt von allein aktuell**, wenn sich der Plan ändert (die App lädt die neue Fassung leise hoch, höchstens einmal am Tag). Auf dem iPhone öffnet sich der Kalender mit „Abonnieren?“; Android/Outlook bekommen die Adresse zum Kopieren. Der alte iPhone-Weg (neues Fenster mit einer Textseite) ist weg; einmalig als Datei teilen (Web Share) oder laden geht weiter.
- **Deine Sportarten nach Umfang**: Die meistgemachte Sportart steht groß mit 12 Wochen als Balken (Ø-Linie, laufende Woche satt), die anderen klein mit 8 Wochen – statt nur einer Stundenzahl. Dazu **„Dein Wochenvolumen“**: 12 Wochen gestapelt nach Sportart.
- **Gesundheitsbild**: HRV, Ruhepuls, Schlafdauer, Schritte und Stress zeigen die letzten sieben Tage als kleine Balken mit deiner Normal- bzw. Ziel-Linie.
- Technik: `api/kalender.js` (Abo-Token im Nutzerdatensatz, Datei unter `u:<uid>:kalender`, `kal:<token>` → uid; Löschen des Kontos räumt den Token mit auf), `rechner.kalender` (Beginnzeiten, Erinnerung), `d3.zoom` auf der Karte, `wochenVolumen` in hubs.js.

### Davor (Version 20)

- **Bereich „Rennen“** als fünfter Tab unten: Dein Ziel als Bühne (Countdown, Höhenmeter, Mini-Profil), eine **Welt- und Europakarte mit rund 130 Rennen** (Ironman, 70.3, Challenge, die großen Marathons und Halbmarathons in Deutschland, die Marathon Majors), ein **Kalender nach Monat** mit Suche und Filtern (Langdistanz, Mitteldistanz, Marathon, Halbmarathon · Deutschland, Europa, Welt) und eine **Statistik** (Rennen je Monat, härteste Radstrecken, flachste Langdistanzen, Läufe mit den meisten Höhenmetern). Saison & Rennen, Rennrechner, Renntag und Schweißrate wohnen jetzt hier (alte Links leiten um).
- **Jede Strecke hat eine eigene Seite**: Bühne mit Distanzen und Höhenmetern, **Höhenprofil Rad und Laufen** mit nummerierten Anstiegen (Kilometer, Höhenmeter, Steigung), **deine Prognose Abschnitt für Abschnitt** aus CSS, FTP, CdA und VT1-Tempo (Radmodell nach Martin 1998, Laufen am Berg nach Minetti 2002, Hitze und Wind als Faktoren), **Pacing für diese Strecke** (Watt flach und am Anstieg, Lauf-Tempo), Fakten, ähnliche Strecken – und **„Als Ziel setzen“**, das die Strecke als Hauptrennen in deine Saison einträgt. Profile sind nach Streckenbeschreibungen gebaut oder schematisch – das steht jeweils dabei.
- **Der Faden**: Auf Heute liegt unter dem Datum eine dünne Linie vom Saisonstart bis zum Renntag – Phasen als Abschnitte, du als pinker Punkt, die Flagge am Ziel. Ohne Ziel zeigt er den Weg zur Rennauswahl.
- **Heute ist kürzer**: Die ersten drei Blöcke stehen offen, alles Weitere liegt hinter „Mehr für heute“ – statt vorher über 5.000 Pixel auf einmal.
- **Form der Einheit**: Jede Plan-Einheit hat jetzt eine kleine Form (Breite = Zeit, Höhe = Anstrengung, harte Teile in der Farbe der Art) – in der Wochenliste, im Detail als Diagramm mit Zeitachse und auf dem Poster. Für Laufen, Rad und Schwimmen (in Metern).
- **Trainingsbibliothek** (Training → Trainingsbibliothek): jede Einheit, die der Plan vergeben kann, einmal in Ruhe erklärt – Form, Wozu, So geht’s, Zielbereich aus deinem Profil, Studie und der Weg ins Wissen. Mit einer Legende, wie man eine Einheit liest.
- **Teilen als Bild** (1080 × 1350, Hochformat): dein Tune mit den letzten 14 Tagen und dem Faden (Knopf an den 14 Tagen auf Heute), eine Einheit mit ihrer Form (im Plan-Detail) und eine Strecke mit Höhenprofil (auf der Streckenseite). Über die Teilen-Funktion des Geräts oder als Bild gespeichert – nur das Bild verlässt das Gerät.
- **Wissen: „Rennen & Strecken“** – 33 neue Begriffe (Windschattenregel, Rolling Start, Neoprenregel, Cut-off, Höhenmeter, Pacing am Berg, Negative Split, Durability, Critical Power, Laktat, Fatmax, RED-S, Hitzeakklimatisation, Höhentraining, Kaltwasser, Sauna, Kompression, Foam Rolling, Schlaf verlängern, Powernap, Chronotyp, Alkohol, offenes Fenster, Knochen-Stressreaktion, Sehnen, Laufökonomie, Hitze am Renntag, Wechselzone, Marathon Majors …) und 20 neue Fragen (Rennwoche, Rennmorgen, Berge im Rennen, Neopren, Krämpfe, Beine nach dem Rad, Rennen pro Saison, erstes Rennen, passende Strecke, Zeitzone, Prognose vs. Ziel …), jeweils mit Studie. Methodik: Streckenmodell, Prognose auf einer Strecke, Form der Einheit.
- **Gesundheit: „Belastung und Erholung“** – 28 Tage Last je Tag oben, Schlaf der Nacht danach unten, mit Bedarfslinie; dazu Morgen nach harten gegen Morgen nach ruhigen Tagen (HRV, Ruhepuls, Schlaf) und die Anpassung über 12 Wochen (Fitness gegen Ruhepuls).
- **Design**: Linien zeichnen sich einmal, wenn eine Seite steht (Faden, Höhenprofile; ohne Bewegung sofort da). Karte als dunkle Bühne mit Rennen in Bedeutungsfarbe, dein Ziel in Pink. Keine zusätzlichen Schriften, keine Verläufe als Schmuck – die Bühnen (Poster, Ziel, Strecke, Teilen-Bilder) tragen die Farbe.
- Technik: `rennen-daten.js` (Katalog), `rennen.js`, `faden.js`, `bibliothek.js`, `teilen.js`, Welt- und Europakarte als TopoJSON (`vendor/welt.json`, ~100 KB, aus Natural Earth / world-atlas, ISC) mit `topojson-client`; `/api/wettkampf` speichert die Strecken-Kennung. Gemessen: erste Anzeige nach 0,4 s, jede Seite rendert in unter 25 ms.

### Davor (Version 19)

- **Eine Schrift für alles**: Titel, Text, Zahlen und kleine Beschriftungen stehen jetzt in **Plus Jakarta Sans** – statt vorher vier Schriften (Serif-Titel, Mono-Beschriftungen, Systemschrift und runde Zahlen). Gewichte 400 und 500, 600 nur noch selten. Die Schrift liegt in `fonts/` (SIL Open Font License), es gibt keine Anfrage an fremde Server; auch die Datenschutzseite und das Rückblick-Poster nutzen sie.
- **Bedienungshilfen** (Profil → Bedienungshilfen): vier Ansichten – Standard, **Weniger Text**, **Größere Schrift** und **Groß und einfach** (größere Schrift und weniger Text, gut lesbar auch ohne Brille). Größere Schrift gibt es in zwei Stufen (×1,15 und ×1,3); Diagramm-Beschriftungen wachsen höchstens um 10 %, die untere Leiste um 15 %. Weniger Text blendet Erklärungen, Quellen und Feld-Hinweise aus, Erkenntnisse zeigen nur ihren Titel (Antippen klappt sie auf). Gilt nur auf diesem Gerät und schon vor dem ersten Bild.
- **Schlaf & Abend** (Profil → Schlaf & Abend): **Bettgehzeit und Schlafenszeit selbst festlegen** – oder automatisch wie bisher aus Aufstehzeit und Schlafbedarf. Danach richten sich Koffein-Stopp, letzte große Mahlzeit, Licht dimmen und der Beginn des Abends (drei Stunden vor dem Bett, sonst 19 Uhr). An roten Tagen oder vor einem frühen Morgen bleibt deine Zeit stehen; Dreiklang schlägt dann nur eine frühere vor.
- **Tagesabschluss** in „Dein Abend“ auf Heute: wie dein Tag war – Plan gegen erledigt, ob jede Einheit ihren Zweck getroffen hat („Locker wie geplant“, „Härter als geplant“, „Reiz gesetzt“ aus dem Einheiten-Check), Schritte, was morgen ansteht –, dazu Ins Bett, Schlafen und Aufstehen. „Wie war dein Tag?“ und **„Tag abschließen“** beenden den Tag mit einer ruhigen Gute-Nacht-Ansicht. Die Einschätzung bleibt auf dem Gerät.

### Davor (Version 18)

- **Kalender-Termine so lang wie die Einheit**: Jeder exportierte Termin dauert genau so lange wie die Einheit im Plan – auch an langen Tagen. Früher wurde ein Termin um 23:59 abgeschnitten, und eine weitere Einheit danach landete als fast ganztägiger Termin am Morgen. Jetzt beginnt ein Tag, der bis Mitternacht nicht mehr passt, entsprechend früher; nichts wird gekürzt oder auf den nächsten Tag geschoben.
- Mehrere Einheiten an einem Tag kommen nacheinander mit 15 Minuten Pause, der **Koppellauf direkt im Anschluss** an das Rad. Heute angepasste Einheiten haben im Kalender dieselbe Dauer wie im Plan. Im Titel steht die Dauer, lange Einheiten in Stunden („Lange Ausfahrt · 3:35 h“).
- **Beginn unter der Woche und am Wochenende** getrennt wählbar (Standard 18:00 und 9:00) – lange Einheiten liegen meist am Wochenende. Das Blatt zeigt die nächsten drei Termine mit Uhrzeit von–bis.

### Davor (Version 17)

- **Sportart einer Einheit ändern**: Kein Rad diese Woche oder das Bad hat zu? In den Details einer Einheit „Sportart ändern“ – stattdessen Laufen, Rad, Schwimmen, Kraft, Pilates & Yoga oder frei. Wahlweise nur diese Einheit oder alle Einheiten dieser Sportart in der Woche (ab heute). Der Rest des Plans bleibt unverändert. Die Rolle bleibt (hart bleibt hart, lang bleibt lang, locker mit kurzen Reizen bleibt so), die Dauer passt sich an: Rad → Laufen × 0,6 (nie länger als der längste Lauf der Woche), Laufen → Rad × 1,3, Kraft und Pilates & Yoga kürzer. Wer sonst nicht läuft, bekommt Laufen und Gehen (höchstens 45 min). Vorschau vorher, Etikett „Ersetzt“, „Zurücknehmen“ in den Details; frei gelassene Einheiten stehen als Hinweis am Tag. Verschiebst du den Tag, wandert der Ersatz mit.
- Kleinigkeit: ausgeblendete Formularfelder (z. B. „Gewicht in kg“ bei Übungen mit Körpergewicht im Kraftwerte-Rechner) sind jetzt wirklich ausgeblendet.

### Davor (Version 16)

- **Neuer Name: Dreiklang.** Die tägliche Zahl heißt jetzt **Tune** (1–99) – wie gut dein Körper heute gestimmt ist, Belastung zu vertragen. Interne Schlüssel bleiben gleich: Konten, Daten, Kalender-Termine und Links funktionieren weiter.
- **Eigene Einheiten im Plan**: „Einheit hinzufügen“ unter der Woche – Tag, Sportart (auch Wandern, Tennis, Fußball …), wie hart, wie lange, schon erledigt. Die Einheit zählt in der Woche (Zeit, Einheiten, erledigt), in der geplanten Last und Formprognose und – abgehakt und ohne Aufzeichnung der Uhr – geschätzt in Fitness, Ermüdung und Form (IF² × 100 je Stunde, Kraft 30/45/60, Pilates & Yoga 15). Hat die Uhr sie aufgezeichnet, zählt die Messung. Eine harte eigene Einheit macht die harte Plan-Einheit direkt davor oder danach locker. „Hinzufügen und starten“ öffnet bei Kraft und Pilates & Yoga gleich das Workout; gespeichert ist die Einheit dann abgehakt.
- **Deine Werte am Renntag**: Im Plan eine Prognose für FTP (mit W/kg beim Referenzgewicht), Schwellentempo (dazu die 5-km-Zeit) und CSS als Spanne – und die Zielzeit, die mit diesen Werten im Rennrechner herauskommt. Zuwachs je Niveau mit abnehmendem Ertrag bis zum Tapering; das untere Ende richtet sich nach deiner Plan-Treue der letzten vier Wochen. Nach einem neuen Test steht dort, ob du über, im oder unter dem erwarteten Bereich liegst, und vor dem nächsten Test, ab welchem Wert du auf Kurs bist.
- **Geführte Tour mit Beispieldaten**: Vorher eine Frage – Einsteiger, Grundkenntnisse, Fortgeschritten oder Profi. Dann läuft die App mit Lisas ausgedachten Daten, und die Tour zeigt auf den echten Seiten, was wo ist: für Einsteiger in Alltagssprache, für Profis mit Formeln. Nichts wird gespeichert oder an den Server geschickt; „Beenden“ führt zurück zu den eigenen Daten. Auch ohne Konto über „Beispiel ansehen“ auf der Anmeldung.

### Davor (Version 15)

- **Seitenleiste am Laptop**: statt einzelner Karten, die am linken Rand kleben, eine schwebende Leiste mit gleichem Abstand zu allen Rändern – oben Logo, Name und Datum, dann die vier Bereiche als ruhige Liste mit Icons. Unten die **Zeitnahme-Tafel** wie an der Startlinie: Tage bis zu deinem Rennen in Punkt-Ziffern (sie schalten sich beim ersten Öffnen einmal von links nach rechts ein), darunter dein Stand im Plan (der pinke Punkt bist du, heute) und dein Nordstern. Ganz unten die Verbindung mit Status-Punkt.
- **Inhalt mittig**: Auf großen Bildschirmen steht der Inhalt mittig im Platz neben der Leiste statt am linken Rand.

### Davor (Version 14)

Ruhiger und klarer – Inhalte, Seiten und Reihenfolge bleiben, nur das Aussehen wird aufgeräumt („unslop“):

- **Eine Bühne pro Seite**: Der farbige Verlauf mit Korn bleibt das eine Bild jeder Seite (Heute: Einheit des Tages, Training: Mein Plan, Sportseiten: das Band). Leuchten, Korn und Milchglas hinter allem anderen sind weg; Karten sind deckend mit feiner Kante. „Deine Erholung“ ist eine ruhige Karte – die Dreiklang steht dort als Punkt-Ziffern (die Signatur der App).
- **Ein Akzent**: Sky Blue für Knöpfe, Auswahl und Links (gefüllte Knöpfe etwas dunkler, damit weiße Schrift gut lesbar ist; im Dunkeln hell mit dunkler Schrift). Pink nur noch für „heute“ und „du“: der heutige Punkt, XP und Quest-Fortschritt, deine Bestwerte.
- **Icons in der Textfarbe** statt jedes in einer eigenen Farbe; „Bereiche“ ohne bunte Kacheln; kein Pfeil mehr in jeder Kachel; Mini-Diagramme aus den Übersichtskacheln entfernt (die Detailseiten zeigen die echten Diagramme).
- **Schrift**: keine Großbuchstaben-Zeilen mit Sperrung mehr, Gewichte 400/500/600, Ziffern gleich breit (springen nicht beim Aktualisieren).
- **Text**: große Titel ohne Schlusspunkt („Kraft: Beine & Rumpf“), keine Ausrufezeichen, „Kraft · Kraft“ doppelt entfernt, kürzeres Suchfeld.
- **Heute**: Kein zweiter Start-Knopf mehr über der Einheit des Tages – zeigt die Bühne die Gym- oder Pilates-Einheit, startet sie dort. Nebeneinander liegende Hinweise (Wissensstand, Rückblick) sind zu einer Gruppe verbunden; der Renn-Countdown steht breit über den Kacheln.
- **Raster**: alle Abstände im 4-px-Raster, Ecken einheitlich (Knöpfe 10, Karten 16, Bühne 20), keine Pillen-Knöpfe; Leiste unten fest angedockt; Laptop-Seitenleiste als ruhige Liste.
- **Bewegung**: Dauerschleifen ohne Grund entfernt (drehender Glanz am Profilbild, pulsierender Ring, drehende Strahlen).

### Davor (Version 13)

- **Heute angepasst**: Ist Tune gelb oder rot (oder schlagen Frühwarnung, Überlastungs-Wächter oder eine hohe Bein-Last an), passt sich die heutige Einheit konkret an – gelb: ein Drittel weniger Intervalle, höchstens Schwelle bzw. unteres Ende des Zielbereichs, lange Einheiten 20 % kürzer, Tests verschieben; rot: kurz und locker, Kraft als leichte Aktivierung. „Original zeigen“ schaltet zurück.
- **Doppeltage und Koppel**: Zwei Einheiten an einem Tag zeigen ihre gemeinsame Last und worauf es ankommt (Reihenfolge, Abstand, Essen dazwischen); zwei harte Einheiten an einem Tag werden als sehr harter Tag markiert.
- **Bein-Etikett im Plan**: Harte oder lange Läufe 24–48 h nach Kraft für die Beine bekommen das Etikett „24 h nach Beintag“ – aus echten Gym-Sätzen und aus dem Plan.
- **Was wäre, wenn …?**: Im Plan eine Einheit dieser Woche verschieben (Regler) und live sehen, wie sich die Form bis zum Wochenende bzw. Renntag verändert – mit Domino-Vorschau, wie sich die Woche neu ordnet. Die Vorschau erscheint auch beim normalen „Verschieben“.
- **Überlastungs-Wächter**: Tune drei Tage in Folge gesunken bei hoher Last → Vorschlag „Heute/Morgen entlasten“; der Entlastungstag steht dann im Plan (höchstens 30 min locker, möglichst Rad oder Schwimmen).
- **Beine gegen Kreislauf**: neue Karte unter Belastungssprünge – mechanische Last (Laufen, Beintraining) und metabolische Last (alle Ausdauer) getrennt, je 7 gegen 28 Tage, dazu die geplanten Tage gestrichelt.
- **Was dich beeinflusst**: Training, volle Tage, späte Abende, Alkohol und Stress werden zusätzlich gegen die zweite Nacht geprüft (Lag 2); was beide Nächte anhält, steht einmal mit Hinweis da.
- **Schwellen mit Datum**: FTP, CSS, Schwellenpuls, VT1/VT2 und Maximalpuls gelten ab einem Datum (auch rückwirkend bis 365 Tage) – alte Einheiten behalten TSS und IF von damals. Verlauf im Athletenprofil.
- **Gym**: Rekord-Radar beim Eintippen („Noch 1 Wiederholung bis zum Rekord“), der Satz vom letzten Mal als Geist unter jeder Zeile, Mini-Verlauf (Maximum und Volumen) beim Aufklappen einer Übung, Satzpause als kleine schwebende Pille.
- **Renn-Zeitachse** unter Renntag: Splits, Flaschen und Gels und der geschätzte Glykogen-Speicher auf einer Linie – mit dem Finger darüberfahren.
- **Rückblick als Poster**: Monats- und Jahresrückblick als Hochformat-Bild (1080 × 1920) zum Teilen.
- **Ohne Netz**: Check-ins, „Heute notiert“, Gym-Sätze und Einstellungen warten im Funkloch auf dem Gerät (IndexedDB) und gehen automatisch raus – beim Wieder-online-Gehen, beim Öffnen der App und, wo der Browser es kann, im Hintergrund.
- **Wissen**: 5 neue Artikel (Training, das sich anpasst, Beine gegen Kreislauf, Zwei Einheiten an einem Tag, Was wäre, wenn …?, Glykogen im Rennen), 2 neue Fragen, 10 neue Einträge im Tutorial, 8 in der Methodik.
- Bereits vorhanden und unverändert genutzt: Phasen mit Tapering auf das A-Rennen (Plan ↔ Saison), Decoupling im Einheiten-Check, Effizienz-Trend für Rad und Laufen, Satzpause beim Abhaken.

### Davor (Version 12)

- **Aussehen wie ein Club** (Vorbild: das Dashboard „Clubhouse“), in den Dreiklang-Farben Sky Blue, Weiß und Hot Pink: seit Version 19 eine Schrift für alles (Plus Jakarta Sans), große leichte Zahlen, durchscheinende Karten auf hellem Grund mit blauem und pinkem Schimmer. Was zählt, steht auf einer **Bühne** – einem verwischten Farbbild mit Korn und Bewegungs-Streifen, Farbe nach Bedeutung (locker blau, Schwelle blau→pink, hart pink, Kraft Tinte, Mobilität Flieder). Die Schriften liegen in der App (keine Google-Server).
- **Navigation**: unten Heute, Training, Gesundheit, Wissen – dein **Profilbild oben rechts** führt ins Profil. Am Laptop eine Seitenleiste mit Datum und deinem „Nordstern“ (FTP, Fitness-Alter oder Tune als Punktmatrix).
- **Training mit Untermenü**: oben **Mein Plan** (Woche, Phase, erledigt, heute), darunter **Gym | Pilates & Yoga | Ausdauer** – die Wahl merkt sich das Gerät.
- **Heute**: die **Einheit des Tages** als große Karte mit *Gestern · Heute · Morgen*, Fokus, Dauer, Zielbereich und dem Ablauf als Balken oder Lineal; „Letzte 14 Tage“ als Punkte; **Deine Erholung** mit Tune als Punktmatrix und den letzten 7 Tagen.
- **Plan-Einladung bei jedem Öffnen**: Wer noch keinen Plan hat, sieht „Noch kein Plan.“ – „Später“ gilt nur bis zum nächsten Öffnen.
- **In den Kalender**: alle kommenden Einheiten als Termine für Apple Kalender, Google oder Outlook (Zeitraum, Uhrzeit, Erinnerung). Auf dem iPhone öffnet sich direkt „Alle hinzufügen“; dafür schickt die App die Kalenderdatei einmal über den eigenen Server zurück – gespeichert wird nichts.
- **Tiefere Planung**: neuer Schritt **Feinschliff** – Entlastung alle 3 oder 4 Wochen, mehr Schwelle (pyramidal) oder mehr Spitze (polarisiert), Kraft und Pilates & Yoga pro Woche, Leistungstests in jeder zweiten Entlastungswoche.
- **Tutorial** unter Wissen (ganz unten): jede Funktion mit „So geht’s“ und „Hinbringen“, sortiert nach Bereich und Anspruch (Einsteiger · Fortgeschritten · Leistung), dazu eine Tour in sechs Schritten. Ab 60 Jahren (Geburtsjahr im Profil) schlägt Heute die Tour einmal vor. „So rechnet Dreiklang“ verweist darauf.
- **Mehr Wissen**: 21 neue Artikel zu Trainingsinhalten (Schwellentraining, VO2max-Intervalle, lange Einheit, Aufwärmen, Pacing, Koppeltraining, Trainingsprinzipien, So entsteht dein Plan, Leistungstests, Übertraining, Lauftechnik, Bergläufe, Wiedereinstieg ins Laufen, Trittfrequenz, Aero-Position, Schwimmtechnik, Training nach CSS, Freiwasser, Krafttraining übers Jahr, Essen vor und nach dem Training) und zwei neue Fragen – jetzt 106 Begriffe.
- Sicherheit: Die Ursprungsprüfung der Schnittstelle versteht jetzt auch Formulare, die der Browser mit „Origin: null“ schickt (dann zählt die Browser-Angabe Sec-Fetch-Site), statt mit einem Fehler 500 abzubrechen. Die Referrer-Policy ist jetzt `same-origin`: fremde Seiten erfahren weiter nichts, die eigene Seite erkennt ihre Formulare. Der lokale Testserver setzt dieselben Kopfzeilen wie Vercel.
- Behoben: Die Legende „Normalbereich“ in den HRV- und Belastungs-Diagrammen war seit Version 11 riesig.

### Davor (Version 11)

- **Ruhigeres Aussehen in einer Spalte**: Weiß auf hellem Grau, feines Filmkorn, Listen als ein weißer Block mit feinen Linien, Überschriften in normaler Schreibweise, große schlanke Zahlen mit kleiner grauer Einheit, Kopf- und Fußleiste aus Milchglas. Farbe nur noch als Punkt, dünne Linie oder ein Hauptknopf. Das Wichtigste – dein Tune und die Sportseiten – steht auf einer schwarzen Bühne mit Bewegungs-Streifen wie bei einem Mitzieher-Foto.
- **Startseite denkt mit**: Morgens steht der Check-in groß oben. Zur gewohnten Zeit (oder wenn der Plan es vorsieht) erscheint oben **„Gym-Einheit jetzt starten“** bzw. Pilates & Yoga – ein Tipp und die Fokus-Ansicht ist offen.
- **Zusammenhänge**: Nach einer schlechten Nacht oder bei viel Stress (Check-in oder Uhr) rät die App zu einem früheren Koffein-Stopp und schlägt abends die passende **Atemübung** vor (Atem-Seufzer oder Box-Atmung), direkt startbar.
- **Mini-Experiment im Check-in**: „Gestern eingehalten? Ja / Nein“ – ohne Umweg über Wissen.
- **Für gestern nachtragen**: Bis 12 Uhr lässt sich der Check-in oder „Heute notiert“ für gestern nachholen.
- **Willkommen zurück**: Nach 4 Tagen ohne Eintrag eine freundliche Karte statt Warnungen – auf Wunsch eine **sanfte Woche**: Plan und Gym rechnen dann etwa zwei Drittel der Zeit, nichts Hartes, weniger Sätze.
- **„Warum?“ (i)**: Jede Anpassung erklärt sich mit einem Satz – im Plan, bei Gewichten im Gym, beim früheren Koffein-Stopp, beim dynamischen Schrittziel und in der sanften Woche.
- **Leere Seiten zeigen den Weg**: ruhige Fortschrittsbalken wie „Noch 3 Morgen-Check-ins, bis …“ (Was dich beeinflusst, HRV-Korridor, Trends, Mit-und-ohne-Vergleich, Mini-Experimente).
- **Ruhiges Laden**: Neue Werte blenden sanft über, ein kleiner Punkt zeigt „Aktualisiert vor 1 Min.“.
- **Ein Daumen reicht**: „Satz geschafft“ sitzt in der Fokus-Ansicht unten, „Speichern“ im Check-in bleibt am Handy unten erreichbar. Der Bildschirm bleibt an, solange ein Timer oder ein Workout läuft. Ziffern bei Timern und Zählern springen nicht mehr.
- **Wissen übersichtlicher**: Artikel mit nummerierten Listen, kurzen Absätzen, Warnsätzen mit eigener Linie und aufklappbaren Quellen; Themen als Liste statt enger Kacheln; Fragen und Antworten gleich gegliedert.
- Behoben: ein „null“ unter Mini-Experimenten, eine farbige Linie, die im dunklen Modus bei Pause-Karte, Frühwarnung und erledigten Quests fehlte, und verlorene Eingaben im Abend-Check, wenn während des Tippens neue Daten kamen.

### Davor (Version 10)

- **Neues Aussehen**: Sky Blue, Weiß und Hot Pink, flache Flächen ohne Plastik-Glanz, ruhige Symbole – aufgeräumt wie eine Apple-App, ohne Inhalte wegzunehmen. Quests und Wissen sind größer und leichter lesbar.
- **Startseite, die mit der Tageszeit atmet**: Morgens Check-in, Tune, „Heute wichtig“ und dein Plan; tagsüber dein Tag und das Nachmittagstief; ab 19 Uhr der Abend-Check. Mit der Stecknadel legst du bis zu 4 **Favoriten** fest, der Rest liegt unter „Alle Kategorien einblenden“.
- **Gym: Gewicht je Satz eintragen** – Tabelle mit kg und Wiederholungen, Vorschlag aus dem letzten Mal, „Letztes Mal“, Abhaken startet die Pause. Der Kraftwert kommt direkt aus dem besten Satz, dazu Bestleistungen und ein **Deload-Hinweis**, wenn eine Grundübung über drei Einheiten stagniert. Neu: **Fokus-Ansicht** („Workout starten“) auf hellem Weiß mit großen **+/−-Knöpfen** (gedrückt halten zählt schnell) und **Wischen** zum Abhaken.
- **Trainingsplan: Tage verschieben** – per Knopf oder nach rechts wischen, nur diese Woche oder ab jetzt. Der Plan passt sich an: Liegen zwei harte Tage nebeneinander, wird der andere locker; Hinweise zeigen, was sich geändert hat, und alles lässt sich zurücknehmen.
- **Trend-Pfeile mit Kontext** wie in Apple Health (letzte 4 Wochen gegen die Monate davor): Ruhepuls, HRV, Schlaf, Schritte, Tune, Lauftempo, Rad-Leistung und Kraft. Die Seite **„Deine Trends“** vergleicht 30, 90 und 365 Tage mit dem Zeitraum davor und nennt deine beständigste Gewohnheit. Ein Pfeil erscheint erst, wenn eine Veränderung größer ist als das übliche Auf und Ab.
- **Rückblicke**: besondere Momente auf Heute (stärkste Woche, runde Einheiten-Zahl, erholteste Woche, Schritte-Rekord) und ein ruhiger **Monats- und Jahresrückblick** im Story-Format.
- **Auszeichnungen statt Konfetti**: ruhige Karten mit Datum für Bestleistungen und geschaffte Ziele – gesammelt unter Trophäen.
- **Check-in: „Was war gestern?“** – mit einem Tipp Ursachen wie spätes Essen, Alkohol, Bildschirm, Stress oder viel draußen. „Was dich beeinflusst“ wertet sie mit aus, und **„Was bringt dir am meisten?“** zeigt deine Top 3.
- **Pause-Modus** (Profil oder Frühwarnung): krank, angeschlagen oder Auszeit. Die Wochenserie ist geschützt, Quests werden zu Erholungs-Quests, Plan und Morgen-Push machen keinen Druck – und nach einer Krankheit führen vier **Stufen zurück ins Training** (in Anlehnung an den IOC-Konsens).
- **Abend-Check** (ab 19 Uhr): dein Tag in Zahlen, Licht dimmen, Bett- und Aufstehzeit, „Kopf leeren“, das Wichtigste für morgen und eine kurze Abschalt-Liste. Die Notizen bleiben **nur auf deinem Gerät**; morgens steht „Heute wichtig“ oben.
- **Nachmittagstief-Retter** (12:30–18 Uhr): 15-Minuten-Power-Nap mit Wecker – nur früh genug und wenn Schlaf fehlt – sonst 10 Minuten zügig raus, mit Koffein-Hinweis passend zu deiner Schlafenszeit.
- **Wissen**: **Merkliste** für Begriffe und Fragen (auf allen Geräten), **Schnellfilter** und **Mini-Experimente**: 7 Tage eine Sache ausprobieren (Koffein nur bis 14 Uhr, Bildschirm aus, gleiche Bettzeit, langsam atmen, Trinkziel, Pausen, ohne Alkohol) – danach zeigt Dreiklang, was sich bei Schlaf, HRV, Ruhepuls, Tune und Befinden verändert hat (Selbstversuch: ein Hinweis, kein Beweis). Jeder geschaffte Tag bringt 15 XP.
- Behoben: ein Kraftwert, der nach dem Wechsel von „nur Körpergewicht“ zu „mit Hanteln“ nicht auf Kilo umstellte, und abgeschnittene Kennzahlen auf sehr schmalen Handys (320 px). Die iPhone-Push-Meldung „BadWebPushTopic“ ist seit Version 9 behoben.

### Davor (Version 9)

- **Was dich beeinflusst** (Gesundheit): Dreiklang vergleicht, was du an einem Tag tust – spätes Koffein, Trinkziel, dein Stack, ein voller Tag, harte oder lange Einheiten, Beintag, spät ins Bett – mit HRV, Ruhepuls, Schlaf, Tiefschlaf, Tune und Befinden am Morgen danach. Gezeigt wird nur, was nach strenger Prüfung nicht nach Zufall aussieht (mindestens 8 Tage mit und ohne, Korrektur für viele Vergleiche) – als Beobachtung, nicht als Beweis.
- **Frühwarnung und Schutzmodus**: Steigen Ruhepuls und Atmung und fällt die HRV, warnt Heute – oft bevor du dich krank fühlst. Im Schutzmodus (oder mit „Ich fühle mich krank“ im Check-in): Tipps für heute, eine Anleitung zum Wiedereinstieg nach dem IOC-Konsens, ein Hinweis im Plan (der Plan selbst bleibt) und die **Wochenserie ist geschützt**: An zwei kranken Tagen einer Woche reißt sie nicht (gilt ab dieser Woche, nichts rückwirkend, XP sinken nie).
- **Wetter** (freiwillig, unter Dein Tag): Ort suchen, dann Tipps für Morgenlicht, Regen, Hitze, UV und Glätte; an heißen Tagen rechnet das Trinkziel mit deiner Schweißrate bei Hitze. Der Ort bleibt auf dem Gerät, die Vorhersage kommt direkt von Open-Meteo.
- **Wie voll ist dein Tag?** – ein Tipp auf Heute. Vollgepackt: Mini-Pausen, Bewegung in kleinen Stücken, kurzes Training statt unerreichbarer Ziele.
- **Wichtiger Termin** (Prüfung, Präsentation, Bergtour, Wettkampf, Reise): Countdown und eine Woche vorher ein Fahrplan – Aufstehzeit in kleinen Schritten vorverlegen, Bettzeit, Training, was am Vortag und am Tag selbst hilft. Die Zeitfenster übernehmen die frühere Bettzeit.
- **Wochenende gegen Wochentag**: Verschiebt sich deine Schlafmitte am Wochenende um mehr als eine Stunde, zeigt Dein Tag den Unterschied und am Wochenende einen Sonntag-Fahrplan für einen leichteren Montag.
- **Timer mit Ton**: Im Gym „Satz geschafft“ antippen – die Pause läuft mit Ton und Vibration; Fokus-Timer passend zum Tag (2 × 50, 3 × 25 oder 2 × 25 Minuten); Kurz-Routinen und Pilates/Yoga zählen mit Tönen herunter. Ton jederzeit abschaltbar.
- **Dein Morgen in 3 Karten**: Status, Fokus und ein Quick-Win zum Durchtippen in 10 Sekunden – auf Wunsch vorgelesen.
- **Grundlagen-Trend in Klartext** unter Laufen und Rad, z. B. „Bei gleichem Puls bist du etwa 6 s pro km schneller als vor 6–12 Wochen“.
- Neue Lexikon-Einträge (Frühwarnung, Muster in deinen Daten, Kurze Pausen, Training bei Hitze, Vor einem wichtigen Tag) und „Training bei Erkältung“ mit Stufen zum Wiedereinstieg; ein Testlauf für alles (`scripts/run-all-tests.js`).
- Bewusst **nicht** gebaut: Buddy-Quests und Team-Challenges (die App tauscht keine Daten zwischen Konten aus), Skill-Bäume (Analysen bleiben für alle offen), automatische Natrium-Empfehlungen und Watt-/Tempo-Abschläge bei Hitze (keine verlässliche Formel – stattdessen Hinweise), Kalender-Import (.ics), 4-7-8-Atmung (schwache Studienlage; Box-Atmung und Atem-Seufzer gibt es).

### Davor (Version 8)

- **Fokus der App**: Alltag & Energie, Fitness & Gym oder Performance – die App zeigt nur, was passt (im Alltag z. B. keine Trainingskacheln, „Bewegung“ statt „Training“).
- **Ohne Uhr**: Tune nach Gefühl aus dem Check-in, auf Wunsch mit Ruhepuls und Schlafdauer von Hand.
- **Dein Tag**: Fokus-, normaler oder Schon-Tag aus Tune und Schlaf, Zeitfenster für Tageslicht, Konzentration, Koffein-Stopp, letzte Mahlzeit, Licht dimmen und Bettzeit, dazu Kurz-Routinen für zwischendurch.
- **Heute notiert**: Trinken, Eiweiß und Koffein mit einem Tipp, eigener Stack zum Abhaken mit Bestandswarnung, 14-Tage-Verlauf und ein vorsichtiger Vergleich „mit / ohne“ (HRV, Tiefschlaf, Schlaf, Befinden). Neue Quests und Trophäen für Trinken, Eiweiß, Routinen und Check-in-Serien.
- **Kohlenhydrate nach Trainingslast** und ein **Briefing** am Vortag von Schlüsseleinheiten mit Flaschenrezept (Maltodextrin : Fruktose 1 : 0,8).
- **Gym für Erfahrene**: fünf Stufen bis Leistungssport, **Kraftwerte** (z. B. „Kniebeuge 100 kg × 5“) → Gewicht je Übung, nach dem Workout „zu leicht / passt / zu schwer“ und Anstrengung (RPE) – das Gewicht passt sich an. Zuhause gibt es schwerere Varianten mit langsamem Absenken.
- **Kraft und Laufen**: Hinweis im Plan, wenn nach schwerem Beintag ein harter Lauf ansteht.
- **Material**: Kilometer seit dem Kettenwachsen und je Laufschuh automatisch aus Garmin, mit Erinnerung.
- **Schweißrate-Test** je Bedingung – fließt in Trinkziel, Rennrechner und Briefing ein.
- **Renntag**: Race Card zum Ausdrucken (Splits, Pacing-Korridore, Verpflegung alle 20 Minuten) und Packliste für die Wechselzonen.
- **Zwift**: Rad-Einheiten aus dem Plan als `.zwo`-Datei.
- **Wochenrückblick** mit Vergleich zur Vorwoche und einer Sache für nächste Woche, Push am Sonntagabend.
- **Laborwerte** mitschreiben (ohne Bewertung), **Wissen für heute** und neue Lexikon-Einträge (Besser schlafen, Koffein, HRV im Alltag, Pausen bei Intervallen, Kohlenhydrate nach Bedarf, Trinken, Laufschuhe, Kraftwerte).

### Davor (Version 7)

- **XP sammeln**: Jede Bewegung zählt – alle Einheiten von der Uhr, jedes Gym- und Pilates/Yoga-Workout aus der App, Schritte, guter Schlaf, Check-ins und Plan-Einheiten. Wer gerade keinen Sport machen kann, sammelt über Schritte, Schlaf und Quests weiter.
- **Quests**: jeden Tag drei (Bewegung, Schlaf oder Erholung, ein Extra – z. B. „Heute Nacht 8 Stunden schlafen“, „8.000 Schritte“, „Geplante Einheit erledigen“), jede Woche drei größere (150 Minuten Bewegung nach WHO, 2× Kraft, 5 Nächte mit 7 Stunden …) mit Tages-, Wochen- und Serienbonus. An roten Tagen gibt es Erholungs-Quests.
- **Trophy Road**: 70 Level in sieben Stufen (Bronze, Silber, Gold, Platin, Diamant, Meister, Legende). Jedes Level schaltet etwas frei – 56 Abzeichen, 14 Banner, 7 Rahmen, 15 Titel. Level-ups und neue Trophäen werden gefeiert.
- **Trophäen**: 53 Auszeichnungen wie „Halbmarathon“, „Wandertag“ (30.000 Schritte) oder „Wie ein Uhrwerk“ – auch rückwirkend aus deinen Garmin-Daten. Jede Trophäe und jedes Abzeichen taugt als Profilbild.
- **Profilbild & Banner**: eigenes Foto hochladen (wird im Browser verkleinert), Anzeigename, Banner und Rahmen deiner Stufe, Titel.
- **Gesundheitsbild**: zwölf Werte auf einen Blick – HRV, Ruhepuls, Befinden, Schlafdauer, Schlafrhythmus, Atmung, Schritte, Bewegungsminuten, Fitness-Alter, Stress, Body Battery und SpO₂ – jeweils gegen dein eigenes Normal, mit den zwei auffälligsten Punkten und einem Tipp. Neue Seiten **Schritte & Bewegung** und **Stress & Body Battery**, SpO₂ unter Ruhepuls & Atmung, Schritte als Key Fact auf Heute.
- „Auf Standard zurücksetzen“ im Athletenprofil lässt Name, Schrittziel und „Über dich“ jetzt stehen.

### Davor (Version 6)

- **Neue Navigation fürs Handy**: Heute, Training, Gesundheit, Wissen, Profil – jeweils eine aufgeräumte Übersicht mit Kacheln und Piktogrammen, Details eine Ebene tiefer, Zurück-Knopf (in der installierten App auch per Wisch vom linken Rand). Die wichtigsten Zahlen (Dreiklang, HRV, Ruhepuls, Schlaf, Fitness-Alter, Form, Countdown) stehen sofort auf Heute.
- **Trainingsplan**: Assistent in vier Schritten für jede Kombination aus Laufen, Rad, Schwimmen, Kraft und Mobilität – vom 5-km-Lauf bis zur Langdistanz oder einfach „fit bleiben“. Polarisierte Verteilung, Erholungswochen, Tapering vor dem Rennen, Einheiten mit Aufbau, Zielbereich und Begründung.
- **Gym mit Körperkarte**: Muskeln vorne und hinten antippen, Vorlagen (Leg Day, Push, Pull, Ganzkörper, für Läufer/Schwimmer/Radfahrer …), Ort (Studio, zuhause mit oder ohne Hanteln, Band), Ziel, Dauer, Erfahrung, Cardio danach (Stairmaster, Laufband, Rad, Rudern …). Das Workout passt Sätze, Pausen und Reihenfolge an, jede Übung lässt sich tauschen; „Deine Woche im Gym“ zeigt die Sätze pro Muskel als Wärmebild.
- **Pilates & Yoga**: 54 Übungen, acht Anlässe, freie Wahl von Stil, Fokus und Dauer, geführter Modus mit Timer, Seitenwechsel und Atemhilfe (Bildschirm bleibt an).
- **Wissen**: Lexikon mit Wissenslevel, häufigen Fragen und (i)-Erklärungen auf den Karten.
- **Ohne Garmin nutzbar**: für alle, die (noch) keine Garmin-Uhr verbinden möchten.

### Davor

- **Für alle öffnen**: Mit `REGISTRIERUNG=offen` legt sich jeder ohne Freigabe ein Konto an und trägt seinen eigenen Garmin-Schlüssel ein. Dazu öffentliche Datenschutzerklärung (Deutsch/Englisch) mit Betreiberangaben, Pflicht-Einwilligung beim Registrieren, Daten-Download, Schutz vor Massenanmeldungen, „Link zur App kopieren“ und ein Cron für viele Konten (vier gleichzeitig, ruhende Konten ausgelassen).

- **Rennrechner für alle Sportarten**: erst Sportart, dann Distanz – Triathlon, Laufen, Rad, Schwimmen und Mehrkampf mit denselben Kennzahlen.
- **Fitness-Alter** mit Alterungstempo, Faktoren in Lebensjahren, VO2max-Schätzung und Tipps.
- **Belastung je Disziplin**: TSS, CTL, ATL, TSB und ACWR getrennt für Schwimmen, Rad, Laufen und Kraft, dazu interne gegen externe Last.
- **HRV-Korridor**: 7-Tage-Schnitt gegen deinen Normalbereich – sympathisch, parasympathisch, Sättigung und Overreaching unterscheiden.
- **Saison**: Rennen mit A/B/C-Priorität, Countdown, Trainingsphasen und Fahrplan bis zum Renntag.
- **Werkzeuge**: W/kg, CdA- und Zeitfahr-Setups mit Pacing für eine Zielzeit, NP/IF/TSS für geplante Rennen.
- **Gym**: Workouts nach Tag, Schwerpunkt, Ausrüstung und Dauer mit Anleitungen.
- Davor: Konten für mehrere Personen, Einrichtung in der App, Profil mit Garmin-Vorschlägen, steuerbare Registrierung.
