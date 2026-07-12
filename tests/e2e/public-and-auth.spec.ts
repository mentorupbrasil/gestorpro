import { expect, test } from "@playwright/test";

test("public landing leads to the real sign-in form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Fundação segura da plataforma" })).toBeVisible();
  await page.getByRole("link", { name: "Acessar a plataforma" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Acesso seguro" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});

test("sign-in exposes the password recovery flow", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Recuperar acesso" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
});

test("auth callback without a code fails closed", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/sign-in\?error=callback$/);
  await expect(page.getByRole("heading", { name: "Acesso seguro" })).toBeVisible();
});

test("an unauthenticated user cannot open the protected workspace", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in$/);
});
