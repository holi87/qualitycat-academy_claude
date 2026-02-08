import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Booking flow", () => {
  test("should book a session and see it in my bookings", async ({ page }) => {
    // Use mentor — has no existing bookings from seed
    await login(page, "mentor@qualitycat.dev", "Mentor123!");

    // Click the first course card
    const firstCourse = page.locator("a[href^='/courses/']").first();
    const courseTitle = await firstCourse.locator("h3").textContent();
    await firstCourse.click();
    await page.waitForURL(/\/courses\/.+/);

    // Click "Book" on the first available session
    await page.getByRole("button", { name: "Book" }).first().click();

    // Wait for success message
    await expect(page.getByText("Booked!").first()).toBeVisible();

    // Navigate to My Bookings
    await page.click('a[href="/bookings"]');
    await page.waitForURL("/bookings");

    // The booked course should appear in the bookings list
    await expect(page.getByText(courseTitle!)).toBeVisible();
    await expect(page.getByText("CONFIRMED")).toBeVisible();
  });
});
