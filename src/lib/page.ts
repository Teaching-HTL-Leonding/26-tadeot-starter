/**
 * Fügt oben links einen kleinen "← Galerie"-Button ein,
 * damit man von jedem Projekt zurück zur Übersicht kommt.
 */
export function addBackLink(): void {
  const link = document.createElement("a");
  link.href = "/";
  link.textContent = "← Galerie";
  link.className =
    "fixed top-3 left-3 z-50 rounded-full bg-black/50 px-3 py-1 text-sm text-white/80 backdrop-blur hover:bg-black/70 hover:text-white";
  document.body.append(link);
}
