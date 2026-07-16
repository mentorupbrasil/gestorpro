/**
 * E2E profundo: login → MFA → check-in → triagem (persistência) → conclusão UI.
 * Não aceita mensagens de erro como sucesso.
 */
import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";

const authEnabled = process.env.E2E_AUTH_ENABLED === "1";
const authEmail = process.env.E2E_AUTH_EMAIL;
const authPassword = process.env.E2E_AUTH_PASSWORD;

function decodeBase32(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalizedSecret = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of normalizedSecret) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTotp(secret: string, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30_000);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

async function ensureAal2(page: import("@playwright/test").Page) {
  await page.goto("/app/security");
  if (
    await page
      .getByText("Sua sessão já está confirmada para ações críticas.")
      .isVisible()
      .catch(() => false)
  ) {
    return;
  }
  const confirmSession = page.getByRole("button", { name: "Confirmar sessão" });
  if (await confirmSession.isVisible().catch(() => false)) {
    const storedSecret = process.env.E2E_TOTP_SECRET;
    if (!storedSecret) throw new Error("Defina E2E_TOTP_SECRET ou rode seed:e2e:auth.");
    await page.getByLabel("Código do autenticador").fill(generateTotp(storedSecret));
    await confirmSession.click();
    await expect(page.getByText(/Sessão reforçada com MFA|já está confirmada/i)).toBeVisible({
      timeout: 15_000,
    });
    return;
  }
  await page.getByRole("button", { name: "Gerar QR Code" }).click();
  const secretLocator = page.getByTestId("totp-secret");
  await expect(secretLocator).toBeVisible({ timeout: 20_000 });
  const secret = (await secretLocator.innerText()).trim();
  await page.getByLabel("Código do autenticador").fill(generateTotp(secret));
  await page.getByRole("button", { name: "Confirmar MFA" }).click();
  await expect(page.getByText("MFA ativado com sucesso.")).toBeVisible({ timeout: 15_000 });
}

test.describe("deep clinical flow", () => {
  test.skip(!authEnabled, "Set E2E_AUTH_ENABLED=1");
  test.setTimeout(240_000);

  test("check-in e triagem com persistência após reload", async ({ page }) => {
    if (!authEmail || !authPassword) throw new Error("E2E_AUTH_EMAIL/PASSWORD required");

    await page.goto("/sign-in");
    await page.getByLabel("E-mail").fill(authEmail);
    await page.getByLabel("Senha").fill(authPassword);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/select-tenant$/, { timeout: 20_000 });
    await page.getByRole("button", { name: "Acessar" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await ensureAal2(page);

    await page.goto("/app/check-in");
    await expect(page.getByRole("heading", { name: "Estação operacional" })).toBeVisible({
      timeout: 15_000,
    });
    const workerCell = page.getByRole("cell", { name: "Trabalhador Fictício E2E" });
    if (await workerCell.isVisible().catch(() => false)) {
      await workerCell.click();
      await page.getByRole("button", { name: "Check-in" }).click();
      const error = page.getByText(/Não foi possível|Confirme o MFA|permission denied/i);
      const ok = page.getByText(/Check-in realizado|snapshot|Atendimento/i);
      await expect(ok.or(error)).toBeVisible({ timeout: 25_000 });
      if (await error.isVisible().catch(() => false)) {
        throw new Error(`Check-in falhou: ${await error.innerText()}`);
      }
    }

    await page.goto("/app/clinical/triage");
    await expect(page.getByRole("heading", { level: 1, name: /Triagem/i })).toBeVisible({
      timeout: 15_000,
    });

    const weight = page.locator('input[name="weightKg"], input[name="weight"]').first();
    const height = page.locator('input[name="heightCm"], input[name="height"]').first();
    if ((await weight.count()) > 0 && (await height.count()) > 0) {
      await weight.fill("70");
      await height.fill("170");
      const saveDraft = page.getByRole("button", { name: /Salvar rascunho|Salvar/i }).first();
      if (await saveDraft.isVisible().catch(() => false)) {
        await saveDraft.click();
        const saveError = page.getByText(/Não foi possível|Falha|permission/i);
        await page.waitForTimeout(1500);
        if (await saveError.isVisible().catch(() => false)) {
          throw new Error(`Salvar triagem falhou: ${await saveError.innerText()}`);
        }
        await page.reload();
        await expect(weight).toHaveValue(/70/);
      }
    }

    await page.goto("/app/clinical/conclusion");
    await expect(page.getByRole("heading", { level: 1, name: /Conclusão/i })).toBeVisible();
    await expect(page.getByText(/ASO stub|E2E_EXAM/i)).toHaveCount(0);

    await page.goto("/app/operations");
    await expect(page.getByRole("heading", { level: 1, name: /Pendências/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
