import { test, expect } from "@playwright/test";

test("homepage search → fleet → caravan detail → booking", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Leave room for the unexpected/ })).toBeVisible();
  await page.getByRole("button", { name: /Check availability/i }).first().click();
  await expect(page).toHaveURL(/\/fleet/);
  await page.getByRole("link", { name: /View.*Rowan|View & book/ }).first().click();
  await expect(page).toHaveURL(/\/fleet\//);
  await page.getByRole("button", { name: /Check availability & price/i }).click();
  await expect(page.getByText(/Available for|no longer available/i)).toBeVisible({ timeout: 15000 });
});

test("fleet filters narrow results and clear restores", async ({ page }) => {
  await page.goto("/fleet");
  await page.getByLabel("Category").selectOption("Family Four-Berth");
  await expect(page.getByText(/1 of 3 caravans/)).toBeVisible();
  await page.getByRole("button", { name: /Clear all/i }).click();
  await expect(page.getByText(/3 of 3 caravans/)).toBeVisible();
});
