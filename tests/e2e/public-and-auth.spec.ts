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

test("an unauthenticated user cannot open the protected workspace", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in$/);
});
