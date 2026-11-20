/**
 * Smoke-Test für Agents: öffnet eine Seite im echten Browser (headless Chromium),
 * sammelt Fehler aus der Konsole und macht einen Screenshot.
 *
 *   npm run smoke -- <projekt>                       z.B. npm run smoke -- weltraum-ballerei
 *   npm run smoke -- <projekt> --keys=ArrowRight:800,Space --wait=3000
 *   npm run smoke                                    (testet die Galerie-Startseite)
 *
 * --keys:  Tasten nacheinander drücken, optional mit Haltedauer in ms (Name:Dauer).
 *          Namen wie bei Playwright: ArrowLeft, ArrowUp, Space, KeyA, Enter ...
 * --wait:  Wartezeit nach dem Laden in ms (Standard 2000)
 *
 * Der Screenshot landet in .smoke/<projekt>.png – ansehen, um zu prüfen, ob alles gut aussieht!
 * Nutzt den laufenden Dev-Server (Port 5173, änderbar mit SMOKE_BASE_URL).
 * Läuft keiner, wird kurz ein eigener gestartet.
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

const args = process.argv.slice(2);
const option = (name: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const target = args
  .find((a) => !a.startsWith("--"))
  ?.replace(/^projects\//, "")
  .replace(/\/$/, "");
const waitMs = Number(option("wait") ?? 2000);
const keys = (option("keys") ?? "")
  .split(",")
  .filter(Boolean)
  .map((entry) => {
    const [key, hold] = entry.split(":");
    return { key, hold: Number(hold ?? 100) };
  });

if (target && !existsSync(`projects/${target}/index.html`)) {
  console.error(`❌ projects/${target}/index.html gibt es nicht.`);
  process.exit(1);
}

let baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:5173";
let tempServer: ViteDevServer | undefined;
try {
  await fetch(baseUrl, { signal: AbortSignal.timeout(2000) });
} catch {
  console.log(`ℹ️  Kein Dev-Server auf ${baseUrl} – starte einen temporären Server für den Test.`);
  tempServer = await createServer({ server: { port: 5199, strictPort: false }, logLevel: "error" });
  await tempServer.listen();
  baseUrl = tempServer.resolvedUrls!.local[0].replace(/\/$/, "");
}

const path = target ? `/projects/${target}/` : "/";
const problems: string[] = [];
const warnings: string[] = [];

const browser = await chromium.launch({
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });

page.on("console", (msg) => {
  if (msg.type() === "error") problems.push(`console.error: ${msg.text()}`);
  if (msg.type() === "warning") warnings.push(msg.text());
});
page.on("pageerror", (err) => problems.push(`Laufzeitfehler: ${err.message}`));
page.on("response", (res) => {
  if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
});

await page.goto(baseUrl + path, { waitUntil: "load" });
await page.waitForTimeout(waitMs);

for (const { key, hold } of keys) {
  await page.keyboard.down(key);
  await page.waitForTimeout(hold);
  await page.keyboard.up(key);
  await page.waitForTimeout(100);
}
if (keys.length > 0) await page.waitForTimeout(500);

await mkdir(".smoke", { recursive: true });
const screenshot = `.smoke/${target || "galerie"}.png`;
await page.screenshot({ path: screenshot });

await browser.close();
await tempServer?.close();

console.log(`\n🔎 Smoke-Test: ${path}`);
if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} Warnung(en):`);
  for (const w of [...new Set(warnings)].slice(0, 10)) console.log(`   - ${w}`);
}
if (problems.length > 0) {
  console.log(`❌ ${problems.length} Fehler:`);
  for (const p of [...new Set(problems)]) console.log(`   - ${p}`);
} else {
  console.log("✅ Keine Fehler.");
}
console.log(`📸 Screenshot: ${screenshot}`);
process.exit(problems.length > 0 ? 1 : 0);
