/**
 * NUR FÜR BETREUER:INNEN – setzt die Station zwischen zwei Gruppen zurück.
 *
 *   npm run station:reset
 *
 * 1. Sichert alle Projekte der Gruppe (außer Vorlagen) nach ~/vibe-archiv/<Zeitstempel>/
 *    (anderer Ordner: Umgebungsvariable VIBE_ARCHIVE_DIR)
 * 2. Setzt alles auf den Git-Tag "starter" zurück (falls nicht vorhanden: auf den letzten Commit)
 * 3. Löscht alle neuen Dateien (node_modules bleibt erhalten)
 *
 * Der Dev-Server kann weiterlaufen; danach im Browser die Galerie neu laden.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8" }).trim();

const projects = readdirSync("projects", { withFileTypes: true }).filter(
  (entry) => entry.isDirectory() && !entry.name.startsWith("_"),
);

if (projects.length > 0) {
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  const archive = join(process.env.VIBE_ARCHIVE_DIR ?? join(homedir(), "vibe-archiv"), stamp);
  for (const project of projects) {
    cpSync(join("projects", project.name), join(archive, project.name), { recursive: true });
  }
  console.log(`📦 ${projects.length} Projekt(e) gesichert in ${archive}`);
}

let ref = "starter";
try {
  git("rev-parse", "--verify", "--quiet", "refs/tags/starter");
} catch {
  ref = "HEAD";
  console.log('ℹ️  Kein Git-Tag "starter" gefunden – setze auf den letzten Commit zurück.');
}

git("reset", "--hard", ref);
git("clean", "-fd");
for (const dir of [".smoke", "test-results", "playwright-report"]) {
  if (existsSync(dir)) rmSync(dir, { recursive: true });
}

console.log(`✅ Station zurückgesetzt auf "${ref}". Jetzt im Browser die Galerie neu laden.`);
