# Tagesform – deine Garmin-Daten als App

Persönliches Dashboard für die Sub-9-Vorbereitung: Tagesform aus HRV, Ruhepuls, Schlaf und Befinden, Training, Schwimmen, Leistung und ein Rennrechner für Lang- und Mitteldistanz. Läuft kostenlos auf **Vercel** (App) mit **Upstash Redis** (Speicher) und holt deine Daten über die **Garmin Connect Personal API**.

## Was du bekommst

| Bereich | Inhalt |
|---|---|
| **Heute** | Tagesform-Score, Treiber (HRV, Ruhepuls, Schlaf, Befinden), Empfehlung, 14-Tage-Leiste, Laufbudget der Woche, Erkenntnisse |
| **Befinden** | Morgen-Check-in (5 Fragen + Schmerz + Krankheitsgefühl), Verlauf, Gewicht und Ernährung aus Garmin |
| **Erholung / Schlaf** | HRV- und Ruhepuls-Trends, autonomer Status, Atemfrequenz, Schlafphasen, Rhythmus |
| **Training** | Fitness/Ermüdung/Form, **Einheiten-Check** (hat jede Rad- und Laufeinheit ihren Reiz getroffen – mit Verlauf von Leistung/Tempo und Puls), Wochenumfang, Intensitätsverteilung, **Lauf-Belastungswächter** (Wochenkilometer gegen dein Budget, Schmerz, Schrittfrequenz), Monotonie, Fueling langer Einheiten |
| **Schwimmen** | Tempo zur CSS, Umfang, Strecke pro Zug, CSS-Test eintragen |
| **Leistung** | Leistungskurve, FTP-Schätzungen, Kadenz, aerobe Effizienz |
| **Rennrechner** | Schwimm-, Rad- und Laufzeiten für Lang- und Mitteldistanz: Tempo, Watt, Intensität, Pace-Verlauf, Gesamtzeit; Vorlagen „Sub-9-Plan“, „Aus meinen Daten“ und dein letztes Rennen; **Verpflegungsplan** (Kohlenhydrate und Trinken pro Stunde, Gel-Zeiten, Flaschen) |
| **Profil / Methodik** | Referenzwerte (Gewicht, FTP, Schwellen, Ziele), **Morgen-Push** aufs Handy und die Herleitung jeder Kennzahl mit Quellen |

Aktualisierung: automatisch dreimal täglich (morgens 7–9 Uhr, vormittags, abends) und zusätzlich beim Öffnen, wenn der letzte Abruf älter als zwei Stunden ist. Die App startet sofort mit dem letzten Stand und funktioniert auch ohne Netz.

---

## Online stellen (ca. 15 Minuten, einmalig)

Du brauchst: einen kostenlosen Account bei **vercel.com** und deinen Garmin-API-Schlüssel (steht in deinem Claude-Projekt im Dokument „API key For Garmin“).

### 1. Projekt zu Vercel bringen – such dir einen Weg aus

**Weg A – über GitHub (ohne Terminal, empfohlen)**
1. Auf github.com ein neues, **privates** Repository anlegen, z. B. `tagesform`.
2. Im leeren Repository auf „uploading an existing file“ klicken und den **Inhalt** dieses Ordners (alle Dateien und Unterordner) hineinziehen → „Commit changes“.
3. Auf vercel.com mit GitHub anmelden → **Add New… → Project** → das Repository importieren → Framework: **Other** → **Deploy**.

**Weg B – mit dem Terminal (braucht Node.js auf dem Mac)**
```bash
cd ~/Downloads/tagesform-app      # Pfad zu diesem Ordner
npx vercel@latest                 # anmelden, Fragen mit Enter bestätigen
```

Der erste Aufruf der App zeigt danach noch einen Hinweis – das ist normal, es fehlen Speicher und Variablen.

### 2. Speicher verbinden
Im Vercel-Projekt: **Storage → Create Database → Upstash (Redis)** → kostenlosen Plan wählen → Region **Frankfurt (eu-central-1)** → mit dem Projekt verbinden. Vercel trägt die Zugangsdaten (`KV_REST_API_URL`, `KV_REST_API_TOKEN` bzw. `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) automatisch ein.

> Wichtig: **Upstash** wählen (nicht „Redis Cloud“) – die App spricht die Upstash-REST-Schnittstelle.

### 3. Vier Umgebungsvariablen anlegen
**Settings → Environment Variables** (für Production, Preview und Development):

| Name | Wert |
|---|---|
| `GARMIN_API_KEY` | dein Garmin-Personal-API-Schlüssel |
| `APP_PASSWORD` | dein Passwort für die App (lang und nur dafür) |
| `AUTH_SECRET` | eine zufällige Zeichenkette, mind. 32 Zeichen (z. B. aus einem Passwortgenerator) |
| `CRON_SECRET` | eine weitere zufällige Zeichenkette, mind. 16 Zeichen – ohne sie läuft die automatische Aktualisierung nicht |

### 4. Neu veröffentlichen
**Deployments** → beim obersten Eintrag „…“ → **Redeploy**. Erst danach gelten Speicher und Variablen.

### 5. Öffnen und erster Import
`https://<dein-projekt>.vercel.app` öffnen → Passwort eingeben → der erste Import holt 12 Monate und dauert 2–3 Minuten (Garmin erlaubt nur 100 Abrufe pro Minute; die App wartet selbstständig).

### 6. Aufs iPhone
In **Safari** öffnen → **Teilen** → **Zum Home-Bildschirm**. Danach startet Tagesform wie eine App. Einmal neu anmelden, die Anmeldung hält dann 180 Tage.

### 7. Morgen-Push einschalten (optional)
Tagesform **vom Home-Bildschirm** öffnen (in Safari selbst gibt es keine Mitteilungen) → **Profil → Morgen-Push → Push aktivieren** → Mitteilungen erlauben → **Test senden**. Ab dann kommt jeden Morgen nach dem automatischen Abruf eine Mitteilung mit Tagesform, Empfehlung und – falls offen – der Erinnerung an den Check-in. Dafür ist nichts weiter einzurichten: Die Schlüssel erzeugt die App selbst und legt sie in Upstash ab. Voraussetzung: iOS 16.4 oder neuer.

---

## Gut zu wissen

- **Ernährung & Fueling**: kommen aus dem Ernährungsprotokoll von Garmin Connect (Funktion von Garmin Connect+). Ohne Einträge dort bleibt der Bereich leer; Kohlenhydrate langer Einheiten kannst du unter **Training → Fueling** auch direkt eintragen.
- **Gewicht**: aus Garmin Connect (Waage oder manueller Eintrag). Alle W/kg rechnen mit dem **Referenzgewicht** aus dem Profil.
- **Zeitplan**: Die Cron-Zeiten stehen in `vercel.json` in UTC (`0 6`, `0 8`, `0 19`). Im kostenlosen Plan startet Vercel jeden Job irgendwann innerhalb der angegebenen Stunde. Der Morgen-Push geht mit dem ersten Abruf raus, wenn deine Nacht schon synchronisiert ist, sonst mit dem zweiten (gegen 9–10 Uhr) – höchstens einmal am Tag.
- **Einheiten-Check**: Die App lädt für Rad- und Laufeinheiten ab 15 min die Sekundendaten (bis zu 40 Einheiten pro Abruf, rückwirkend 120 Tage). Ändern sich FTP oder Schwellen im Profil, werden die Auswertungen nach und nach neu gerechnet.
- **Offline & Updates**: Die App-Dateien liegen nach dem ersten Start auf dem Gerät. Gibt es eine neue Version, erscheint unten „Neue Version da – Neu laden“. Deine Daten (Garmin, Check-ins) kommen weiterhin immer vom Server; ohne Netz siehst du den zuletzt geladenen Stand.
- **Alle Geräte abmelden**: `AUTH_SECRET` ändern und neu deployen.
- **Garmin-Schlüssel erneuern**: in Garmin Connect neu erzeugen, in Vercel `GARMIN_API_KEY` ersetzen, neu deployen.
- **Datenschutz**: Der Schlüssel liegt nur in den Vercel-Variablen, deine Daten nur in deiner Upstash-Datenbank. Die App ist passwortgeschützt und für Suchmaschinen gesperrt.

## Wenn etwas hakt

| Meldung | Lösung |
|---|---|
| „Kein Speicher verbunden“ | Schritt 2 erledigen und neu deployen |
| „In Vercel fehlt noch die Variable APP_PASSWORD“ | Schritt 3, dann neu deployen |
| „Garmin lehnt den Schlüssel ab“ | neuen API-Schlüssel in Garmin Connect erzeugen und `GARMIN_API_KEY` ersetzen |
| Daten werden morgens nicht neu | `CRON_SECRET` gesetzt? In Vercel unter **Settings → Cron Jobs** die Logs ansehen |
| Neue Daten sofort | Knopf „Aktualisieren“ oben rechts oder **Profil → Jetzt aktualisieren** |
| „Erst als App installieren“ beim Push | Tagesform über Safari → Teilen → „Zum Home-Bildschirm“ hinzufügen und von dort öffnen |
| „Mitteilungen blockiert“ | iPhone: Einstellungen → Mitteilungen → Tagesform → Mitteilungen erlauben |
| Push kommt nicht | Profil → „Test senden“; in Vercel unter **Logs** nach „Push“ suchen. Läuft die Anmeldung ab, „Push aktivieren“ erneut tippen |

## Aufbau

```
api/        Serverfunktionen: login, data, refresh (Cron + Morgen-Push), checkin, profil, css, fueling, rechner, push
lib/        Garmin-Abruf, Einheiten-Analyse, Speicher (Upstash REST), Anmeldung, Web-Push (VAPID + Verschlüsselung),
            Daten laden, Formeln auf dem Server, Profil-Standardwerte, Methodik
public/     App: index.html, styles.css, shim.js (Daten, Anmeldung, Offline), calcs.js (alle Formeln), app.js (Darstellung),
            sw.js (Offline-Start, Updates, Mitteilungen)
scripts/    nur lokal: Testserver, Formeltest, Push-Test, Icons
```

Keine Pakete nötig (Node 22). Lokal testen:
```bash
APP_PASSWORD=test AUTH_SECRET=lokal123 TF_DEV_STORE=./data/dev.json GARMIN_API_KEY=… node scripts/dev-server.js
```
Dann http://localhost:3000 öffnen. Tests: `node scripts/test-calcs.js <ordner-mit-json>` (alle Formeln) und `node scripts/test-push.js` (Push-Verschlüsselung gegen den Testvektor aus RFC 8291 und Ende-zu-Ende gegen einen lokalen Push-Dienst).

## Neu in dieser Version

- **Einheiten-Check** (Training): Jede Rad- und Laufeinheit wird aus den Sekundendaten eingeordnet – Locker, Locker mit Spitzen, Grauzone, Qualität, Renntempo – mit Normalized Power, IF, VI, Decoupling und dem Verlauf von Leistung bzw. Tempo und Puls. Dazu eine Bilanz der letzten 4 Wochen.
- **Lauf-Belastungswächter** (Training + Kachel auf Heute): Wochenkilometer gegen dein Budget (4-Wochen-Schnitt + Steigerungsgrenze aus dem Profil), Wiedereinstieg nach Pausen, Schmerzsignale aus dem Check-in und Schrittfrequenz als Ampel.
- **Verpflegungsplan** (Rennrechner): Kohlenhydrate pro Stunde für Rad und Lauf, Trinkmenge aus deiner Schweißrate (Garmin-Schätzung oder eigener Wert), Gel-Zeiten, Flaschen, Gewichtsverlust – passend zu den Splits.
- **Morgen-Push**: Tagesform, Empfehlung, Laufampel und Check-in-Erinnerung als Mitteilung aufs iPhone.
- **Offline und schneller Start**: Die App öffnet sofort mit dem letzten Stand, auch ohne Netz; unveränderte Daten werden nicht erneut geladen.
