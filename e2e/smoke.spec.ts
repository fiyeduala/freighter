import { test, expect } from "@playwright/test";

test.describe("Freighter smoke tests", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/");
    // Root redirects to /login
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("register page is accessible from login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(page).toHaveURL("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("forgot password link works", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL("/forgot-password");
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("Page not found")).toBeVisible();
  });

  test("verify email page accessible", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.getByText("Check your email")).toBeVisible();
  });
});
