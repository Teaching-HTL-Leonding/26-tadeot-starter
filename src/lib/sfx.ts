/**
 * Retro-Soundeffekte, komplett im Browser erzeugt (WebAudio) – keine Audiodateien nötig.
 *
 *   import { sfx } from "../../src/lib/sfx.ts";
 *   sfx.coin();
 *
 * Eigene Sounds: tone({ from: 200, to: 800, duration: 0.2, wave: "square" })
 *
 * Hinweis: Browser erlauben Sound erst nach der ersten Taste/Klick auf der Seite.
 * Das wird hier automatisch erledigt.
 */

type Wave = OscillatorType;

export interface ToneOptions {
  /** Startfrequenz in Hz (tief ≈ 100, hoch ≈ 1500) */
  from: number;
  /** Endfrequenz in Hz – unterschiedlich zu `from` ergibt "Wuuup"-Effekte */
  to?: number;
  /** Dauer in Sekunden */
  duration?: number;
  wave?: Wave;
  volume?: number;
  /** Verzögerung in Sekunden, praktisch für kleine Melodien */
  delay?: number;
}

let ctx: AudioContext | undefined;
let muted = false;

function audio(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// Audio beim ersten Tastendruck/Klick freischalten.
if (typeof window !== "undefined") {
  const unlock = () => audio();
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("pointerdown", unlock, { once: true });
}

export function tone({
  from,
  to = from,
  duration = 0.15,
  wave = "square",
  volume = 0.15,
  delay = 0,
}: ToneOptions): void {
  if (muted) return;
  const ac = audio();
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Rauschen – gut für Explosionen und Treffer. */
export function noise(duration = 0.3, volume = 0.2): void {
  if (muted) return;
  const ac = audio();
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  gain.gain.value = volume;
  src.buffer = buffer;
  src.connect(gain).connect(ac.destination);
  src.start();
}

export const sfx = {
  coin: () => {
    tone({ from: 988, duration: 0.08 });
    tone({ from: 1319, duration: 0.25, delay: 0.08 });
  },
  jump: () => tone({ from: 300, to: 700, duration: 0.18 }),
  laser: () => tone({ from: 1400, to: 200, duration: 0.15, wave: "sawtooth", volume: 0.1 }),
  hit: () => {
    tone({ from: 200, to: 60, duration: 0.25, wave: "sawtooth" });
    noise(0.15, 0.15);
  },
  explosion: () => noise(0.6, 0.3),
  powerup: () => {
    [523, 659, 784, 1047].forEach((f, i) => {
      tone({ from: f, duration: 0.1, delay: i * 0.07, wave: "triangle", volume: 0.2 });
    });
  },
  gameOver: () => {
    [392, 330, 262, 196].forEach((f, i) => {
      tone({ from: f, duration: 0.25, delay: i * 0.18, wave: "triangle", volume: 0.2 });
    });
  },
  click: () => tone({ from: 600, duration: 0.04, wave: "sine", volume: 0.1 }),
  setMuted: (value: boolean) => {
    muted = value;
  },
};
