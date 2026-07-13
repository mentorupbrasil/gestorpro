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

test.describe("authenticated workspace", () => {
  test.skip(!authEnabled, "Set E2E_AUTH_ENABLED=1 and seed a Supabase test user to run.");

  test("signs in, selects a tenant, opens security, and blocks critical action without AAL2", async ({
    page,
  }) => {
    if (!authEmail || !authPassword) {
      throw new Error("E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD are required.");
    }

    await page.goto("/sign-in");
    await page.getByLabel("E-mail").fill(authEmail);
    await page.getByLabel("Senha").fill(authPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/select-tenant$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Selecione a organização" })).toBeVisible();
    await page.getByRole("button", { name: "Acessar" }).click();

    await expect(page).toHaveURL(/\/app$/);
    await expect(
      page.getByRole("heading", { name: "Central operacional da clínica" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Segurança" })).toBeVisible();

    await page.getByRole("link", { name: "Segurança" }).click();
    await expect(page).toHaveURL(/\/app\/security$/);
    await expect(page.getByRole("heading", { name: "Segurança da conta" })).toBeVisible();
    await expect(page.getByText("Autenticação reforçada")).toBeVisible();

    await page.goto("/app/units");
    await page.getByLabel("Código").fill("E2E-MFA-GATE");
    await page.getByLabel("Nome da unidade").fill("Unidade bloqueada por MFA");
    await page.getByRole("button", { name: "Criar unidade" }).click();
    await expect(page.getByText("Confirme o MFA em Segurança")).toBeVisible();

    await page.goto("/app/security");
    await page.getByRole("button", { name: "Gerar QR Code" }).click();
    const secret = await page.getByTestId("totp-secret").innerText();
    await page.getByLabel("Código do autenticador").fill(generateTotp(secret));
    await page.getByRole("button", { name: "Confirmar MFA" }).click();
    await expect(page.getByText("MFA ativado com sucesso.")).toBeVisible();

    await page.goto("/app/units");
    const authorizedUnitCode = `E2E-${Date.now().toString().slice(-8)}`;
    await page.getByLabel("Código").fill(authorizedUnitCode);
    await page.getByLabel("Nome da unidade").fill("Unidade autorizada por MFA");
    await page.getByRole("button", { name: "Criar unidade" }).click();
    await expect(page.getByText("Unidade criada com auditoria.")).toBeVisible();
    await expect(page.getByText(authorizedUnitCode)).toBeVisible();

    await page.goto("/app/occupational");
    await expect(page.getByText("Empresa Exemplo E2E Ltda. — DADO FICTÍCIO")).toBeVisible();
    await expect(page.getByText("Trabalhador Fictício E2E")).toBeVisible();
    await expect(page.getByText("Exame ocupacional fictício E2E")).toBeVisible();

    await page.goto("/app/scheduling");
    await expect(page.getByText("Sala de demonstração E2E")).toBeVisible();
    await expect(page.getByText("Trabalhador Fictício E2E")).toBeVisible();

    await page.goto("/app/check-in");
    await expect(page.getByRole("option", { name: /Sala de demonstração E2E/ })).toBeVisible();

    await page.goto("/app/documents");
    await expect(
      page.getByRole("heading", { name: "Templates, versões e entregas" }),
    ).toBeVisible();

    await page.goto("/app/finance");
    await expect(
      page.getByRole("heading", { name: "Contratos, faturamento e acesso da empresa" }),
    ).toBeVisible();

    await page.goto("/app/integrations");
    await expect(
      page.getByRole("heading", { name: "Webhooks, eSocial, mensagens e conector" }),
    ).toBeVisible();
  });
});
