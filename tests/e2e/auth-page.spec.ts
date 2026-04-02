import { expect, test } from "@playwright/test";

test("login page mode switch toggles between login and register forms", async ({ page }) => {
  await page.goto("/login");

  const modeTabs = page.getByRole("tab");
  const loginToggle = modeTabs.first();
  const registerToggle = modeTabs.nth(1);
  const loginForm = page.locator("form").filter({ has: page.locator('input[name=\"remember\"]') });
  const registerForm = page.locator("form").filter({ has: page.locator('input[name=\"name\"]') });

  await expect(loginToggle).toBeVisible();
  await expect(registerToggle).toBeVisible();
  await registerToggle.click();
  await expect(registerToggle).toHaveAttribute("aria-selected", "true");
  await expect(registerForm).toBeVisible();
  await expect(loginForm).toHaveCount(0);

  await loginToggle.click();
  await expect(loginToggle).toHaveAttribute("aria-selected", "true");
  await expect(loginForm).toBeVisible();
  await expect(registerForm).toHaveCount(0);
  await expect(loginForm.locator('button[type="submit"]')).toBeDisabled();
});
