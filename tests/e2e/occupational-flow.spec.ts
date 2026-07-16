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
  const byteAt = (index: number) => {
    const byte = digest[index];
    if (byte === undefined) throw new Error("Invalid TOTP digest.");
    return byte;
  };
  const offset = byteAt(digest.length - 1) & 0x0f;
  const binary =
    ((byteAt(offset) & 0x7f) << 24) |
    ((byteAt(offset + 1) & 0xff) << 16) |
    ((byteAt(offset + 2) & 0xff) << 8) |
    (byteAt(offset + 3) & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

async function ensureAal2(page: import("@playwright/test").Page) {
  await page.goto("/app/security");
  await expect(page.getByRole("heading", { name: "Segurança da conta" })).toBeVisible();

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
    if (!storedSecret) {
      throw new Error(
        "MFA já cadastrado em aal1. Rode pnpm seed:e2e:auth (limpa fatores) ou defina E2E_TOTP_SECRET.",
      );
    }
    await page.getByLabel("Código do autenticador").fill(generateTotp(storedSecret));
    await confirmSession.click();
    await expect(page.getByText(/Sessão reforçada com MFA|já está confirmada/i)).toBeVisible({
      timeout: 15_000,
    });
    return;
  }

  const enrollButton = page.getByRole("button", { name: "Gerar QR Code" });
  await expect(enrollButton).toBeVisible();
  await enrollButton.click();
  const secretLocator = page.getByTestId("totp-secret");
  await expect(secretLocator).toBeVisible({ timeout: 20_000 });
  const secret = (await secretLocator.innerText()).trim();
  await page.getByLabel("Código do autenticador").fill(generateTotp(secret));
  await page.getByRole("button", { name: "Confirmar MFA" }).click();
  await expect(page.getByText("MFA ativado com sucesso.")).toBeVisible({ timeout: 15_000 });
}

test.describe("authenticated occupational flow", () => {
  test.skip(!authEnabled, "Set E2E_AUTH_ENABLED=1 and seed Supabase test user.");
  test.setTimeout(120_000);

  test("navegação operacional ponta a ponta com check-in elegível", async ({ page }) => {
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

    await ensureAal2(page);

    await page.goto("/app/occupational");
    await expect(
      page.getByRole("cell", { name: /Empresa Exemplo E2E Ltda\. — DADO FICTÍCIO/ }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: /Trabalhador Fictício E2E/ })).toBeVisible();

    await page.goto("/app/scheduling");
    await expect(page.getByRole("heading", { name: "Encaminhamentos e agenda" })).toBeVisible();
    await expect(page.getByRole("option", { name: /Sala de demonstração E2E/ })).toBeAttached();
    await expect(
      page.getByRole("option", { name: /Trabalhador Fictício E2E/ }).first(),
    ).toBeAttached();

    await page.goto("/app/check-in");
    await expect(page.getByRole("heading", { name: "Estação operacional" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("cell", { name: "Trabalhador Fictício E2E" })).toBeVisible();
    await page.getByRole("cell", { name: "Trabalhador Fictício E2E" }).click();
    await page.getByRole("button", { name: "Check-in" }).click();
    const checkInFeedback = page.getByText(/Check-in realizado|snapshot criado|Atendimento/i);
    const checkInError = page.getByText(
      /Não foi possível|Confirme o MFA|permission denied|protocol|vínculo ambíguo/i,
    );
    await expect(checkInFeedback.or(checkInError)).toBeVisible({ timeout: 20_000 });
    if (await checkInError.isVisible().catch(() => false)) {
      throw new Error(`Check-in falhou: ${await checkInError.innerText()}`);
    }
    await expect(checkInFeedback).toBeVisible();

    await page.goto("/app/clinical");
    await expect(page.getByRole("heading", { level: 1, name: "Estações clínicas" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/app/exams/diagnostics");
    await expect(page.getByRole("heading", { level: 1, name: /ECG|EEG|radiologia/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/app/exams/laboratory");
    await expect(page.getByRole("heading", { level: 1, name: /Laboratório/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/app/documents");
    await expect(
      page.getByRole("heading", { level: 1, name: /Templates|Documentos/i }),
    ).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/app/finance");
    await expect(
      page.getByRole("heading", { level: 1, name: /Financeiro|Contratos|faturamento/i }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto("/app/display");
    await expect(page.getByRole("heading", { level: 1, name: /Painel|Chamada/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/painel?token=e2e-public-display-token-ficticio-001");
    await expect(
      page.getByText(/Painel E2E|Painel de chamadas|Dispositivo não autorizado/i).first(),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});
