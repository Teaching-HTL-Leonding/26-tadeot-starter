import { describe, expect, it } from "vitest";
import { getHighscore, saveHighscore } from "./highscore.ts";

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe("highscore", () => {
  it("startet bei 0", () => {
    expect(getHighscore("test", fakeStorage())).toBe(0);
  });

  it("speichert nur neue Rekorde", () => {
    const storage = fakeStorage();
    expect(saveHighscore("test", 10, storage)).toBe(true);
    expect(saveHighscore("test", 5, storage)).toBe(false);
    expect(getHighscore("test", storage)).toBe(10);
  });
});
