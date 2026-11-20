import "./styles.css";

/**
 * Die Galerie findet alle Projekte automatisch: jede Datei projects/<name>/index.html.
 * Titel, Beschreibung und Emoji kommen aus dem <head> der jeweiligen Seite:
 *
 *   <title>Weltraum-Ballerei</title>
 *   <meta name="description" content="Schieß die Aliens ab!" />
 *   <meta name="emoji" content="🚀" />
 *
 * Ordner, die mit "_" beginnen, sind Vorlagen.
 */
const pages = import.meta.glob<string>("/projects/*/index.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

interface Project {
  slug: string;
  url: string;
  title: string;
  description: string;
  emoji: string;
  isTemplate: boolean;
}

function parse(path: string, html: string): Project {
  const slug = path.split("/")[2];
  const head = new DOMParser().parseFromString(html, "text/html");
  const meta = (name: string) =>
    head.querySelector(`meta[name="${name}"]`)?.getAttribute("content")?.trim() ?? "";
  return {
    slug,
    url: `/projects/${slug}/`,
    title: head.title.trim() || slug,
    description: meta("description"),
    emoji: meta("emoji") || "✨",
    isTemplate: slug.startsWith("_"),
  };
}

function card(project: Project): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = project.url;
  a.className =
    "group block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-fuchsia-400/60 hover:bg-white/10";

  const emoji = document.createElement("div");
  emoji.className = "text-5xl transition group-hover:scale-110";
  emoji.textContent = project.emoji;

  const title = document.createElement("h3");
  title.className = "mt-3 text-lg font-bold";
  title.textContent = project.title;

  const description = document.createElement("p");
  description.className = "mt-1 text-sm text-slate-400";
  description.textContent = project.description;

  const url = document.createElement("p");
  url.className = "mt-3 font-mono text-xs text-slate-500";
  url.textContent = project.url;

  a.append(emoji, title, description, url);
  return a;
}

const projects = Object.entries(pages)
  .map(([path, html]) => parse(path, html))
  .sort((a, b) => a.title.localeCompare(b.title, "de"));

const own = projects.filter((p) => !p.isTemplate);
const templates = projects.filter((p) => p.isTemplate);

const ownContainer = document.querySelector("#projects")!;
if (own.length === 0) {
  ownContainer.innerHTML = `
    <div class="col-span-full rounded-2xl border border-dashed border-white/20 p-8 text-center text-slate-400">
      Noch nichts da – sag der KI links, was du bauen willst! 👈
    </div>`;
} else {
  ownContainer.append(...own.map(card));
}
document.querySelector("#templates")!.append(...templates.map(card));
