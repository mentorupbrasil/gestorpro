"use client";

import { useActionState } from "react";
import {
  closeEncounterAction,
  prepareBillingAction,
  prepareAndSignAsoAction,
  signConclusionAction,
  type ClosureFormState,
} from "./closure-actions";

const initial: ClosureFormState = {};

export function ConclusionClosureForms({
  companyId,
  conclusionId,
  conclusionVersion = 1,
  contractId,
  encounterId,
  encounterVersion = 1,
  priceTableId,
  templateVersionId,
}: {
  companyId?: string | null | undefined;
  conclusionId?: string | undefined;
  conclusionVersion?: number | undefined;
  contractId?: string | null | undefined;
  encounterId?: string | undefined;
  encounterVersion?: number | undefined;
  priceTableId?: string | null | undefined;
  templateVersionId?: string | null | undefined;
}) {
  const [signState, signAction, signPending] = useActionState(signConclusionAction, initial);
  const [asoState, asoAction, asoPending] = useActionState(prepareAndSignAsoAction, initial);
  const [billState, billAction, billPending] = useActionState(prepareBillingAction, initial);
  const [closeState, closeAction, closePending] = useActionState(closeEncounterAction, initial);

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-2">
      <form action={signAction} className="gp-surface grid gap-3 p-4">
        <h2 className="text-base font-semibold">1. Assinar conclusão (AAL2)</h2>
        <input name="conclusionId" type="hidden" value={conclusionId ?? ""} />
        <input name="expectedVersion" type="hidden" value={conclusionVersion ?? 1} />
        <button
          className="gp-btn gp-btn-primary w-fit"
          disabled={signPending || !conclusionId}
          type="submit"
        >
          {signPending ? "Assinando…" : "Assinar conclusão médica"}
        </button>
        {signState.error ? <p className="text-sm text-red-700">{signState.error}</p> : null}
        {signState.success ? <p className="text-sm text-emerald-800">{signState.success}</p> : null}
      </form>

      <form action={asoAction} className="gp-surface grid gap-3 p-4">
        <h2 className="text-base font-semibold">2. Gerar e assinar ASO (AAL2)</h2>
        <p className="text-sm text-gp-text-muted">
          PDF stub não-PHI com hash e auditoria. Template aprovado do tenant.
        </p>
        <input name="encounterId" type="hidden" value={encounterId ?? ""} />
        <input name="templateVersionId" type="hidden" value={templateVersionId ?? ""} />
        <button
          className="gp-btn gp-btn-primary w-fit"
          disabled={asoPending || !encounterId || !templateVersionId}
          type="submit"
        >
          {asoPending ? "Emitindo…" : "Emitir e assinar ASO"}
        </button>
        {asoState.error ? <p className="text-sm text-red-700">{asoState.error}</p> : null}
        {asoState.success ? <p className="text-sm text-emerald-800">{asoState.success}</p> : null}
      </form>

      <form action={billAction} className="gp-surface grid gap-3 p-4">
        <h2 className="text-base font-semibold">3. Snapshot e fatura</h2>
        <input name="encounterId" type="hidden" value={encounterId ?? ""} />
        <input name="companyId" type="hidden" value={companyId ?? ""} />
        <input name="contractId" type="hidden" value={contractId ?? ""} />
        <input name="priceTableId" type="hidden" value={priceTableId ?? ""} />
        <button
          className="gp-btn gp-btn-primary w-fit"
          disabled={billPending || !encounterId || !companyId || !contractId || !priceTableId}
          type="submit"
        >
          {billPending ? "Faturando…" : "Preparar faturamento"}
        </button>
        {billState.error ? <p className="text-sm text-red-700">{billState.error}</p> : null}
        {billState.success ? <p className="text-sm text-emerald-800">{billState.success}</p> : null}
      </form>

      <form action={closeAction} className="gp-surface grid gap-3 p-4">
        <h2 className="text-base font-semibold">4. Encerrar atendimento</h2>
        <p className="text-sm text-gp-text-muted">
          Exige etapas fechadas, conclusão assinada, ASO assinado e fatura consolidada.
        </p>
        <input name="encounterId" type="hidden" value={encounterId ?? ""} />
        <input name="expectedVersion" type="hidden" value={encounterVersion ?? 1} />
        <button
          className="gp-btn gp-btn-primary w-fit"
          disabled={closePending || !encounterId}
          type="submit"
        >
          {closePending ? "Encerrando…" : "Encerrar atendimento"}
        </button>
        {closeState.error ? <p className="text-sm text-red-700">{closeState.error}</p> : null}
        {closeState.success ? (
          <p className="text-sm text-emerald-800">{closeState.success}</p>
        ) : null}
      </form>
    </section>
  );
}
