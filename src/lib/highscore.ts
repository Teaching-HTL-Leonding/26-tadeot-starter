/**
 * Highscore pro Projekt im Browser speichern (localStorage).
 * Bleibt erhalten, wenn die Seite neu geladen wird.
 *
 *   const best = getHighscore("weltraum");
 *   if (saveHighscore("weltraum", score)) { ... neuer Rekord! ... }
 */

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

const keyFor = (game: string) => `highscore:${game}`;

export function getHighscore(game: string, storage: Storage = localStorage): number {
  const value = Number(storage.getItem(keyFor(game)));
  return Number.isFinite(value) ? value : 0;
}

/** Speichert den Punktestand, falls er ein neuer Rekord ist. Gibt `true` bei neuem Rekord zurück. */
export function saveHighscore(
  game: string,
  score: number,
  storage: Storage = localStorage,
): boolean {
  if (score <= getHighscore(game, storage)) return false;
  storage.setItem(keyFor(game), String(score));
  return true;
}
