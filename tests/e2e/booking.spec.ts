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

test("fleet category filter narrows results and clear restores", async ({ page }) => {
  await page.goto("/fleet");
  // Custom dropdown: open the Category listbox and choose Family Four-Berth.
  await page.getByRole("button", { name: /Any category/ }).click();
  await page.getByRole("option", { name: /Family four-berth/ }).click();
  await expect(page.getByText(/1 of 3 caravans/)).toBeVisible();
  await page.getByRole("button", { name: /Clear all/i }).click();
  await expect(page.getByText(/3 of 3 caravans/)).toBeVisible();
});

test("booking flow shows itemised breakdown with seasonal and extras", async ({ page }) => {
  await page.goto("/booking");
  await page.getByRole("button", { name: /Check availability & price/i }).click();
  await expect(page.getByText(/is available for/i)).toBeVisible({ timeout: 15000 });
  // Itemised lines render from the server quote.
  await expect(page.getByText(/Nightly base/)).toBeVisible();
  await expect(page.getByText(/VAT 20%/)).toBeVisible();
  await page.getByRole("button", { name: /Continue to extras/ }).click();
  await page.getByRole("button", { name: /Apply to price/i }).click();
  await expect(page.getByText(/Live price/)).toBeVisible();
});
