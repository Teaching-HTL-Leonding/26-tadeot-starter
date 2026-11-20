/**
 * Kopiert die offiziellen Phaser-4-Skills aus node_modules/phaser/skills nach .claude/skills/phaser-*,
 * damit Claude Code sie automatisch findet. Nach einem Phaser-Update erneut ausführen:
 *
 *   npm run skills:sync
 */
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const source = "node_modules/phaser/skills";
const target = ".claude/skills";

if (!existsSync(source)) {
  console.error(`❌ ${source} nicht gefunden – zuerst npm install ausführen.`);
  process.exit(1);
}

const skills = readdirSync(source, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Alte Phaser-Skills entfernen (z.B. falls ein Skill umbenannt wurde)
if (existsSync(target)) {
  for (const entry of readdirSync(target)) {
    if (entry.startsWith("phaser-")) rmSync(join(target, entry), { recursive: true });
  }
}

for (const skill of skills) {
  const dest = join(target, `phaser-${skill}`);
  cpSync(join(source, skill), dest, { recursive: true });

  const file = join(dest, "SKILL.md");
  const text = readFileSync(file, "utf8")
    // eindeutiger Name, damit es keine Verwechslung mit anderen Skills gibt
    .replace(/^name: (.+)$/m, "name: phaser-$1")
    // Querverweise auf die umbenannten Ordner anpassen
    .replace(/\.\.\/([a-z0-9-]+)\/SKILL\.md/g, "../phaser-$1/SKILL.md")
    // Quellcode-Pfade zeigen auf das installierte Paket
    .replace(/`src\//g, "`node_modules/phaser/src/");
  writeFileSync(file, text);
}

console.log(`✅ ${skills.length} Phaser-Skills nach ${target}/phaser-* kopiert.`);
