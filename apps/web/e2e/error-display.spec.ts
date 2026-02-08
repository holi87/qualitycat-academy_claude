import { test, expect } from "@playwright/test";

test.describe("Error message display", () => {
  test("should show meaningful error on invalid credentials", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("#email", "student@qualitycat.dev");
    await page.fill("#password", "WrongPassword!");
    await page.click('button[type="submit"]');

    // Error message should appear
    const errorBox = page.locator(".bg-red-50");
    await expect(errorBox).toBeVisible();

    // Should show credential error, NOT a misleading connection/server message
    // Fails when VITE_BUG_ERROR_MESSAGE=1 (and backend returns 500 via BUG_AUTH_WRONG_STATUS)
    await expect(errorBox).toContainText("Nieprawidłowy email lub hasło");
    await expect(errorBox).not.toContainText("Problem z połączeniem");
  });
});
