import { expect, test } from "@playwright/test";

// Beispiel für einen Browser-Test. Für die Session nicht nötig – aber praktisch,
// wenn ein Agent eine Spiel-Funktion automatisch ausprobieren will.
test("Galerie zeigt die Vorlagen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Vibe Coding/ })).toBeVisible();
  await expect(page.getByText("Sternen-Jäger")).toBeVisible();
  await expect(page.getByText("Murmel-Insel")).toBeVisible();
});
