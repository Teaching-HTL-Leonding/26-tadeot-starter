# Vibe Coding Starter – Tag der offenen Tür HTL Leonding

Startercode für eine Vibe-Coding-Station: Besucher:innen (13–15 Jahre) beschreiben links im Chat mit
**Claude Code** ihre Idee, rechts im Browser entsteht live ein Spiel oder eine App.

Die Regeln für den Agent stehen in [`AGENTS.md`](AGENTS.md) (Claude Code liest sie über [`CLAUDE.md`](CLAUDE.md)).

## Technik

| Bereich            | Werkzeug                                                       |
| ------------------ | -------------------------------------------------------------- |
| Build / Dev-Server | Vite 8 + TypeScript 7 (ohne Framework, eine Seite pro Projekt) |
| Styling            | Tailwind CSS 4                                                 |
| 2D-Spiele          | Phaser 4 (+ 28 offizielle Phaser-Skills in `.claude/skills/`)  |
| 3D-Spiele          | Three.js + Rapier-Physik                                       |
| Lint / Format      | Biome                                                          |
| Tests (optional)   | Vitest, Playwright                                             |

```
index.html, src/gallery.ts   Galerie-Startseite – zeigt alle Projekte automatisch an
src/lib/                     Helfer: Emoji-Grafiken, Retro-Sounds, Highscore, Zurück-Button
projects/_vorlage-2d/        Vorlage 2D-Spiel (Phaser)
projects/_vorlage-3d/        Vorlage 3D-Spiel (Three.js + Rapier)
projects/_vorlage-app/       Vorlage App/Quiz (kein Spiel)
projects/<name>/             ← hier entstehen die Projekte der Besucher:innen
scripts/smoke.ts             Browser-Check für den Agent (Fehler + Screenshot)
scripts/reset-station.ts     Station zurücksetzen (nur Betreuer:innen)
```

## Station vorbereiten (einmalig)

```bash
npm ci
npx playwright install chromium      # Headless-Browser für den Smoke-Test des Agents
git tag starter                      # Ausgangszustand markieren (für den Reset)
```

## Vor jeder Session

1. **Dev-Server starten** (eigenes Terminal, läuft den ganzen Tag): `npm run dev`
2. **Browser** (rechte Bildschirmhälfte) auf http://localhost:5173 öffnen.
3. **Claude Code** (linke Bildschirmhälfte) im Projektordner starten: `claude`

> ⚠️ Der Dev-Server muss gestartet werden, **nachdem** das Projekt vollständig installiert ist.
> Ein Server, der schon vorher lief, kennt `vite.config.ts` (und damit Tailwind) nicht – Seiten sehen dann ungestylt aus.

## Zwischen zwei Gruppen

```bash
npm run station:reset
```

- sichert die Projekte der Gruppe nach `~/vibe-archiv/<Zeitstempel>/` (anderer Ort: `VIBE_ARCHIVE_DIR`)
- setzt alles auf den Git-Tag `starter` zurück und löscht neue Dateien (`node_modules` bleibt)

Danach in Claude Code **`/clear`** eingeben (oder Claude Code neu starten), damit der Agent die vorige Gruppe „vergisst",
und im Browser die Galerie neu laden. Der Dev-Server kann weiterlaufen.

## Was der Agent darf (`.claude/settings.json`)

- Dateien bearbeiten ohne Rückfrage (`acceptEdits`), Checks/Tests/Smoke-Test ausführen, Vorlagen kopieren.
- **Gesperrt:** Dev-Server starten/stoppen, Prozesse beenden, `git reset/clean/checkout/push`, `rm -rf`
  und den Reset ausführen.
- Die Vorlagen sind bewusst **nicht** per Berechtigung gesperrt: Claude Code prüft bei `cp` auch den Quellpfad
  gegen `Edit`-Regeln, eine Sperre würde also das Kopieren der Vorlagen verhindern. Geschützt sind sie über
  `AGENTS.md`, und `npm run station:reset` stellt sie ohnehin wieder her.

## Nützliche Befehle

| Befehl                                                                   | Zweck                                                                      |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `npm run dev`                                                            | Dev-Server (Port 5173)                                                     |
| `npm run check`                                                          | Biome (mit Auto-Fix) + TypeScript                                          |
| `npm run smoke -- <projekt> [--keys=ArrowRight:800,Space] [--wait=3000]` | Seite headless öffnen, Fehler melden, Screenshot nach `.smoke/`            |
| `npm test` / `npm run test:e2e`                                          | Vitest / Playwright                                                        |
| `npm run skills:sync`                                                    | Phaser-Skills nach einem Phaser-Update neu nach `.claude/skills/` kopieren |
| `npm run station:reset`                                                  | Station zurücksetzen (siehe oben)                                          |

## Hinweis zu Phaser-Doku

`phaser.io/llms.txt` leitet Agents zum kostenpflichtigen Dienst „Phaser AE" weiter und ist deshalb bewusst **nicht**
in `AGENTS.md` verlinkt. Die Phaser-Skills aus dem npm-Paket decken die Framework-Doku offline ab.
