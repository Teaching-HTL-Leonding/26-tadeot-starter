import { globSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const root = import.meta.dirname;

// Jede Seite unter projects/<name>/index.html ist ein eigenes Projekt.
// Im Dev-Server funktionieren neue Ordner sofort, diese Liste braucht nur `vite build`.
const projectPages = globSync("projects/*/index.html", { cwd: root }).map((page) =>
  resolve(root, page),
);

export default defineConfig({
  plugins: [tailwindcss()],
  input: [resolve(root, "index.html"), ...projectPages],
  server: {
    port: 5173,
    strictPort: true,
  },
  // Phaser/Three sind groß – die Warnung ist hier egal und lenkt Agents nur ab.
  build: {
    chunkSizeWarningLimit: 10_000,
  },
  // Engines beim Serverstart vorab bündeln, damit die erste neue Seite
  // nicht mitten in der Session einen "optimized dependencies"-Reload auslöst.
  optimizeDeps: {
    include: [
      "phaser",
      "three",
      "three/addons/controls/OrbitControls.js",
      "three/addons/loaders/GLTFLoader.js",
      "@dimforge/rapier3d-compat",
    ],
  },
});
