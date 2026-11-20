import type Phaser from "phaser";

/**
 * Erzeugt aus einem Emoji eine Phaser-Textur, die wie ein normales Bild
 * verwendet werden kann (Sprites, Physik, Partikel ...).
 *
 *   emojiTexture(this, "player", "🚀", 64);
 *   this.physics.add.sprite(100, 100, "player");
 *
 * Emojis sind die schnellste Art, ohne Grafikdateien coole Figuren zu haben.
 */
export function emojiTexture(scene: Phaser.Scene, key: string, emoji: string, size = 64): string {
  if (scene.textures.exists(key)) return key;

  // Etwas Rand lassen, weil manche Emojis über ihre Schriftgröße hinausragen.
  const canvasSize = Math.ceil(size * 1.25);
  const texture = scene.textures.createCanvas(key, canvasSize, canvasSize);
  if (!texture) throw new Error(`Textur "${key}" konnte nicht erstellt werden`);

  const ctx = texture.getContext();
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, canvasSize / 2, canvasSize / 2 + size * 0.05);
  texture.refresh();
  return key;
}

/**
 * Zeichnet ein Emoji auf ein Canvas, z.B. als Textur für Three.js:
 *
 *   const texture = new THREE.CanvasTexture(emojiCanvas("⭐", 128));
 *   const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
 */
export function emojiCanvas(emoji: string, size = 128): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.ceil(size * 1.25);
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, canvas.width / 2, canvas.height / 2 + size * 0.05);
  return canvas;
}
