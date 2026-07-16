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
  canBill = false,
  canClose = false,
  canManageDocuments = false,
  canSignConclusion = false,
  canSignDocuments = false,
  closeBlockers = [],
  companyId,
  conclusionId,
  conclusionVersion = 1,
  contractId,
  encounterId,
  encounterVersion = 1,
  priceTableId,
  templateVersionId,
}: {
  canBill?: boolean;
  canClose?: boolean;
  canManageDocuments?: boolean;
  canSignConclusion?: boolean;
  canSignDocuments?: boolean;
  closeBlockers?: Array<{ code: string; message: string }>;
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

  const canEmitAso = canManageDocuments && canSignDocuments;
  const closeBlocked = closeBlockers.length > 0;

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-2">
      {closeBlockers.length > 0 ? (
        <div className="gp-surface col-span-full border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-amber-950">
            Cockpit de pendências do fechamento
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
            {closeBlockers.map((blocker) => (
              <li key={blocker.code}>{blocker.message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {canSignConclusion ? (
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
          {signState.success ? (
            <p className="text-sm text-emerald-800">{signState.success}</p>
          ) : null}
        </form>
      ) : (
        <div className="gp-surface p-4 text-sm text-gp-text-muted">
          Assinatura médica oculta: exige permissão <code>conclusions.manage</code>.
        </div>
      )}

      {canEmitAso ? (
        <form action={asoAction} className="gp-surface grid gap-3 p-4">
          <h2 className="text-base font-semibold">2. Gerar e assinar ASO (AAL2)</h2>
          <p className="text-sm text-gp-text-muted">
            PDF operacional gerado do snapshot imutável. Estação documental.
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
      ) : (
        <div className="gp-surface p-4 text-sm text-gp-text-muted">
          ASO oculto: exige <code>documents.manage</code> e <code>documents.sign</code>.
        </div>
      )}

      {canBill ? (
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
          {billState.success ? (
            <p className="text-sm text-emerald-800">{billState.success}</p>
          ) : null}
        </form>
      ) : (
        <div className="gp-surface p-4 text-sm text-gp-text-muted">
          Faturamento oculto: exige <code>finance.manage</code>.
        </div>
      )}

      {canClose ? (
        <form action={closeAction} className="gp-surface grid gap-3 p-4">
          <h2 className="text-base font-semibold">4. Encerrar atendimento</h2>
          <p className="text-sm text-gp-text-muted">
            Estação administrativa. Exige etapas fechadas, ASO assinado e fatura consolidada.
          </p>
          <input name="encounterId" type="hidden" value={encounterId ?? ""} />
          <input name="expectedVersion" type="hidden" value={encounterVersion ?? 1} />
          <button
            className="gp-btn gp-btn-primary w-fit"
            disabled={closePending || !encounterId || closeBlocked}
            title={closeBlocked ? closeBlockers.map((b) => b.message).join(" ") : undefined}
            type="submit"
          >
            {closePending ? "Encerrando…" : "Encerrar atendimento"}
          </button>
          {closeBlocked ? (
            <p className="text-sm text-amber-900">Encerramento bloqueado até limpar pendências.</p>
          ) : null}
          {closeState.error ? <p className="text-sm text-red-700">{closeState.error}</p> : null}
          {closeState.success ? (
            <p className="text-sm text-emerald-800">{closeState.success}</p>
          ) : null}
        </form>
      ) : (
        <div className="gp-surface p-4 text-sm text-gp-text-muted">
          Encerramento oculto: exige <code>encounters.manage</code>.
        </div>
      )}
    </section>
  );
}
