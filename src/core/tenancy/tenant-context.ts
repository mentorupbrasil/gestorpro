import { z } from "zod";

const trustedTenantContextSchema = z.object({
  tenantId: z.uuid(),
  userId: z.uuid(),
});

export type TrustedTenantContext = z.infer<typeof trustedTenantContextSchema>;

/**
 * Aceita somente valores recuperados de sessão/membership no servidor.
 * Este parser não deve receber tenantId enviado por formulário ou query string.
 */
export function parseTrustedTenantContext(value: unknown): TrustedTenantContext {
  return trustedTenantContextSchema.parse(value);
}
