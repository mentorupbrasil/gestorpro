import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrimaryTotpFactor, getVerifiedTotpFactors } from "@/core/auth/mfa";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { TotpChallengeForm } from "./totp-challenge-form";
import { TotpEnrollmentForm } from "./totp-enrollment-form";
import { TotpUnenrollForm } from "./totp-unenroll-form";

export default async function AccountSecurityPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "tenant.read");

  const supabase = await createServerSupabaseClient();
  const [{ data: aalData, error: aalError }, { data: factorsData, error: factorsError }] =
    await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);

  if (aalError || factorsError) {
    throw new Error("Não foi possível carregar a segurança da conta.");
  }

  const verifiedTotpFactors = getVerifiedTotpFactors(factorsData.all);
  const primaryTotpFactor = getPrimaryTotpFactor(verifiedTotpFactors);
  const currentLevel = aalData.currentLevel ?? context.aal;
  const nextLevel = aalData.nextLevel ?? currentLevel;
  const needsChallenge = currentLevel !== "aal2" && nextLevel === "aal2" && primaryTotpFactor;

  return (
    <div>
      <PageHeader eyebrow="Segurança" title="Segurança da conta" />
      <Surface className="space-y-3 p-4 text-sm text-gp-text-muted" aria-labelledby="mfa-status">
        <h2 id="mfa-status" className="text-base font-semibold text-gp-text">
          Autenticação reforçada
        </h2>
        <p>
          Sessão atual: <span className="font-semibold text-gp-text">{currentLevel}</span>
        </p>
        <p>
          Próximo nível disponível: <span className="font-semibold text-gp-text">{nextLevel}</span>
        </p>
        {currentLevel === "aal2" ? (
          <p className="rounded border border-gp-border bg-gp-accent-soft p-3 text-gp-text">
            Sua sessão já está confirmada para ações críticas.
          </p>
        ) : needsChallenge ? (
          <div className="rounded border border-gp-border p-4">
            <p className="font-medium text-gp-text">Confirme o MFA para ações críticas.</p>
            <TotpChallengeForm factorId={primaryTotpFactor.id} />
          </div>
        ) : (
          <p className="rounded border border-gp-border bg-amber-50 p-3 text-amber-900">
            Nenhum fator MFA verificado foi encontrado para esta conta.
          </p>
        )}
      </Surface>
      {verifiedTotpFactors.length > 0 ? (
        <section className="mt-4" aria-labelledby="mfa-factors">
          <h2 id="mfa-factors" className="mb-2 text-base font-semibold text-gp-text">
            Fatores cadastrados
          </h2>
          <Surface className="overflow-x-auto">
            <table className="gp-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Criado em</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {verifiedTotpFactors.map((factor) => (
                  <tr key={factor.id}>
                    <td className="font-medium text-gp-text">{factor.friendlyName}</td>
                    <td>{new Date(factor.createdAt).toLocaleString("pt-BR")}</td>
                    <td className="text-right">
                      <TotpUnenrollForm factorId={factor.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        </section>
      ) : null}
      <TotpEnrollmentForm />
    </div>
  );
}
