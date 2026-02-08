import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("should log in and redirect to courses", async ({ page }) => {
    await page.goto("/login");

    await page.fill("#email", "student@qualitycat.dev");
    await page.fill("#password", "Student123!");
    await page.click('button[type="submit"]');

    // Should redirect to /courses
    await page.waitForURL("/courses");

    // Navbar should show user name and role
    const nav = page.locator("nav");
    await expect(nav.getByText("Student")).toBeVisible();
    await expect(nav.getByText("STUDENT")).toBeVisible();
  });
});
