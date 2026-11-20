/**
 * VORLAGE APP – Persönlichkeits-Quiz (kein Spiel)
 *
 * Zeigt die Bausteine einer interaktiven Web-App:
 *  - Daten (Fragen, Antworten, Ergebnisse) getrennt vom Aussehen
 *  - Zustand (welche Frage, welche Punkte) und neu zeichnen bei jeder Änderung
 *  - Styling mit Tailwind-Klassen direkt im HTML
 *
 * Für eine neue App: diesen Ordner kopieren und dann umbauen.
 */
import "../../src/styles.css";
import { addBackLink } from "../../src/lib/page.ts";
import { sfx } from "../../src/lib/sfx.ts";

// ---------- Daten ----------

type Creature = "dragon" | "unicorn" | "fox" | "octopus";

const results: Record<Creature, { emoji: string; name: string; text: string }> = {
  dragon: {
    emoji: "🐉",
    name: "Drache",
    text: "Mutig, voller Energie und immer bereit für ein Abenteuer. Du gehst voran!",
  },
  unicorn: {
    emoji: "🦄",
    name: "Einhorn",
    text: "Kreativ und ein bisschen magisch. Du siehst Dinge, die andere übersehen.",
  },
  fox: {
    emoji: "🦊",
    name: "Fuchs",
    text: "Schlau und neugierig. Für jedes Problem findest du einen cleveren Trick.",
  },
  octopus: {
    emoji: "🐙",
    name: "Krake",
    text: "Multitasking-Profi! Du hast acht Arme und für alles eine Idee.",
  },
};

const questions: { question: string; answers: { text: string; creature: Creature }[] }[] = [
  {
    question: "Es ist Samstag. Was machst du?",
    answers: [
      { text: "Raus, irgendwas Neues ausprobieren 🧗", creature: "dragon" },
      { text: "Zeichnen, Musik machen oder basteln 🎨", creature: "unicorn" },
      { text: "Ein Rätsel oder Strategiespiel 🧩", creature: "fox" },
      { text: "Alles gleichzeitig 🤹", creature: "octopus" },
    ],
  },
  {
    question: "In der Gruppenarbeit bist du ...",
    answers: [
      { text: "die Person, die entscheidet 👑", creature: "dragon" },
      { text: "die mit den verrückten Ideen 💡", creature: "unicorn" },
      { text: "die, die den Plan macht 📋", creature: "fox" },
      { text: "die, die überall hilft 🤝", creature: "octopus" },
    ],
  },
  {
    question: "Deine Superkraft wäre ...",
    answers: [
      { text: "Fliegen 🔥", creature: "dragon" },
      { text: "Gedanken sichtbar machen ✨", creature: "unicorn" },
      { text: "Unsichtbar sein 🕵️", creature: "fox" },
      { text: "Mich klonen 👯", creature: "octopus" },
    ],
  },
];

// ---------- Zustand ----------

let current = 0;
let points: Record<Creature, number> = { dragon: 0, unicorn: 0, fox: 0, octopus: 0 };

// ---------- Anzeige ----------

const app = document.querySelector<HTMLElement>("#app")!;

function render() {
  if (current < questions.length) renderQuestion();
  else renderResult();
}

function renderQuestion() {
  const q = questions[current];
  app.innerHTML = `
    <div class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <p class="text-sm font-semibold text-fuchsia-300">Frage ${current + 1} von ${questions.length}</p>
      <div class="mt-2 h-2 rounded-full bg-white/10">
        <div class="h-2 rounded-full bg-fuchsia-400 transition-all" style="width: ${(current / questions.length) * 100}%"></div>
      </div>
      <h1 class="mt-6 text-3xl font-black">${q.question}</h1>
      <div class="mt-6 grid gap-3" id="answers"></div>
    </div>`;

  const list = app.querySelector("#answers")!;
  for (const answer of q.answers) {
    const button = document.createElement("button");
    button.textContent = answer.text;
    button.className =
      "rounded-xl bg-white/10 px-5 py-4 text-left text-lg font-semibold transition hover:scale-[1.02] hover:bg-fuchsia-500/40 active:scale-95";
    button.addEventListener("click", () => {
      sfx.click();
      points[answer.creature] += 1;
      current += 1;
      render();
    });
    list.append(button);
  }
}

function renderResult() {
  const winner = (Object.keys(points) as Creature[]).sort((a, b) => points[b] - points[a])[0];
  const result = results[winner];
  sfx.powerup();
  app.innerHTML = `
    <div class="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
      <p class="text-sm font-semibold text-fuchsia-300">Du bist ein ...</p>
      <div class="mt-4 animate-bounce text-8xl">${result.emoji}</div>
      <h1 class="mt-2 text-4xl font-black">${result.name}!</h1>
      <p class="mt-4 text-lg text-slate-300">${result.text}</p>
      <button id="restart" class="mt-8 rounded-full bg-fuchsia-500 px-6 py-3 font-bold transition hover:bg-fuchsia-400">
        Nochmal 🔄
      </button>
    </div>`;
  app.querySelector("#restart")!.addEventListener("click", () => {
    current = 0;
    points = { dragon: 0, unicorn: 0, fox: 0, octopus: 0 };
    render();
  });
}

render();
addBackLink();
