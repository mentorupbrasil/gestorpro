import { expect, test } from "@playwright/test";

const authEnabled = process.env.E2E_AUTH_ENABLED === "1";
const authEmail = process.env.E2E_AUTH_EMAIL;
const authPassword = process.env.E2E_AUTH_PASSWORD;

test.describe("clinical close flow", () => {
  test.skip(!authEnabled, "Set E2E_AUTH_ENABLED=1 and seed Supabase test user.");
  test.setTimeout(180_000);

  test("estações clínicas e fechamento guiado estão acessíveis após MFA", async ({ page }) => {
    if (!authEmail || !authPassword) {
      throw new Error("E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD are required.");
    }

    await page.goto("/sign-in");
    await page.getByLabel("E-mail").fill(authEmail);
    await page.getByLabel("Senha").fill(authPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/select-tenant$/, { timeout: 20_000 });
    await page.getByRole("button", { name: "Acessar" }).click();
    await expect(page).toHaveURL(/\/app$/);

    await page.goto("/app/security");
    if (
      await page
        .getByText("Sua sessão já está confirmada para ações críticas.")
        .isVisible()
        .catch(() => false)
    ) {
      // already aal2
    } else if (await page.getByRole("button", { name: "Gerar QR Code" }).isVisible()) {
      await page.getByRole("button", { name: "Gerar QR Code" }).click();
      await expect(page.getByTestId("totp-secret")).toBeVisible({ timeout: 20_000 });
    }

    await page.goto("/app/clinical/triage");
    await expect(page.getByRole("heading", { level: 1, name: /Triagem/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/app/clinical/consultation");
    await expect(page.getByRole("heading", { level: 1, name: /Consulta/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/app/clinical/conclusion");
    await expect(page.getByRole("heading", { level: 1, name: /Conclusão/i })).toBeVisible({
      timeout: 15_000,
    });
    // Estações filtradas por permissão: admin E2E tipicamente vê todas; ausência de stub/E2E_EXAM.
    await expect(page.getByText(/ASO stub|E2E_EXAM/i)).toHaveCount(0);
    const signHeading = page.getByRole("heading", { name: /Assinar conclusão/i });
    if (await signHeading.isVisible().catch(() => false)) {
      await expect(signHeading).toBeVisible();
    } else {
      await expect(page.getByText(/conclusions\.manage/i)).toBeVisible();
    }
  });
});
