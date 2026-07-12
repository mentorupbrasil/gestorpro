import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrimaryTotpFactor, getVerifiedTotpFactors } from "@/core/auth/mfa";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Segurança</p>
        <h1 className="mt-1 text-2xl font-semibold">Segurança da conta</h1>
      </header>
      <section className="mt-8 grid gap-3 text-sm text-slate-700" aria-labelledby="mfa-status">
        <h2 id="mfa-status" className="text-lg font-semibold text-slate-950">
          Autenticação reforçada
        </h2>
        <p>
          Sessão atual: <span className="font-semibold">{currentLevel}</span>
        </p>
        <p>
          Próximo nível disponível: <span className="font-semibold">{nextLevel}</span>
        </p>
        {currentLevel === "aal2" ? (
          <p className="rounded bg-emerald-50 p-3 text-emerald-900">
            Sua sessão já está confirmada para ações críticas.
          </p>
        ) : needsChallenge ? (
          <div className="rounded border border-slate-200 p-4">
            <p className="font-medium text-slate-950">Confirme o MFA para ações críticas.</p>
            <TotpChallengeForm factorId={primaryTotpFactor.id} />
          </div>
        ) : (
          <p className="rounded bg-amber-50 p-3 text-amber-900">
            Nenhum fator MFA verificado foi encontrado para esta conta.
          </p>
        )}
      </section>
      {verifiedTotpFactors.length > 0 ? (
        <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="mfa-factors">
          <h2 id="mfa-factors" className="text-lg font-semibold">
            Fatores cadastrados
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="px-2 py-3">Nome</th>
                  <th className="px-2 py-3">Criado em</th>
                  <th className="px-2 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {verifiedTotpFactors.map((factor) => (
                  <tr className="border-b border-slate-200" key={factor.id}>
                    <td className="px-2 py-3">{factor.friendlyName}</td>
                    <td className="px-2 py-3">
                      {new Date(factor.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <TotpUnenrollForm factorId={factor.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <TotpEnrollmentForm />
    </main>
  );
}
