"use client";

import { useActionState } from "react";
import {
  closeEncounterAction,
  deliverAsoAction,
  generateAsoAction,
  prepareBillingAction,
  signAsoAction,
  signConclusionAction,
  type ClosureFormState,
} from "./closure-actions";

const initial: ClosureFormState = {};

export function ConclusionClosureForms({
  canBill = false,
  canClose = false,
  canDeliverDocuments = false,
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
  readiness = null,
  templateVersionId,
}: {
  canBill?: boolean;
  canClose?: boolean;
  canDeliverDocuments?: boolean;
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
  readiness?: {
    asoStatus: string;
    billingStatus: string;
    deliveryStatus: string;
    invoiceStatus: string;
    ready: boolean;
    storageStatus: string;
  } | null;
  templateVersionId?: string | null | undefined;
}) {
  const [signState, signAction, signPending] = useActionState(signConclusionAction, initial);
  const [generateState, generateAction, generatePending] = useActionState(
    generateAsoAction,
    initial,
  );
  const [asoSignState, asoSignAction, asoSignPending] = useActionState(signAsoAction, initial);
  const [deliverState, deliverAction, deliverPending] = useActionState(deliverAsoAction, initial);
  const [billState, billAction, billPending] = useActionState(prepareBillingAction, initial);
  const [closeState, closeAction, closePending] = useActionState(closeEncounterAction, initial);

  const closeBlocked = closeBlockers.length > 0 || readiness?.ready === false;

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-2">
      {closeBlockers.length > 0 ? (
        <div className="gp-surface col-span-full border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-base font-semibold text-amber-950">
            Cockpit de pendências do fechamento
          </h2>
          {readiness ? (
            <p className="mt-1 text-xs text-amber-900">
              ASO={readiness.asoStatus} · storage={readiness.storageStatus} · entrega=
              {readiness.deliveryStatus} · fatura={readiness.invoiceStatus}
            </p>
          ) : null}
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

      {canManageDocuments ? (
        <form action={generateAction} className="gp-surface grid gap-3 p-4">
          <h2 className="text-base font-semibold">2a. Gerar ASO (operador documental)</h2>
          <p className="text-sm text-gp-text-muted">
            Exige <code>documents.manage</code>. Não assina. PDF + storage verificado no servidor.
          </p>
          <input name="encounterId" type="hidden" value={encounterId ?? ""} />
          <input name="templateVersionId" type="hidden" value={templateVersionId ?? ""} />
          <button
            className="gp-btn gp-btn-primary w-fit"
            disabled={generatePending || !encounterId || !templateVersionId}
            type="submit"
          >
            {generatePending ? "Gerando…" : "Gerar versão ASO"}
          </button>
          {generateState.error ? (
            <p className="text-sm text-red-700">{generateState.error}</p>
          ) : null}
          {generateState.success ? (
            <p className="text-sm text-emerald-800">{generateState.success}</p>
          ) : null}
        </form>
      ) : (
        <div className="gp-surface p-4 text-sm text-gp-text-muted">
          Geração ASO oculta: exige <code>documents.manage</code>.
        </div>
      )}

      {canSignDocuments ? (
        <form action={asoSignAction} className="gp-surface grid gap-3 p-4">
          <h2 className="text-base font-semibold">2b. Assinar ASO (signatário)</h2>
          <p className="text-sm text-gp-text-muted">
            Exige <code>documents.sign</code> + AAL2. Recusa versão sem storage verificado.
          </p>
          <input name="encounterId" type="hidden" value={encounterId ?? ""} />
          <button
            className="gp-btn gp-btn-primary w-fit"
            disabled={asoSignPending || !encounterId}
            type="submit"
          >
            {asoSignPending ? "Assinando…" : "Assinar ASO vigente"}
          </button>
          {asoSignState.error ? <p className="text-sm text-red-700">{asoSignState.error}</p> : null}
          {asoSignState.success ? (
            <p className="text-sm text-emerald-800">{asoSignState.success}</p>
          ) : null}
        </form>
      ) : (
        <div className="gp-surface p-4 text-sm text-gp-text-muted">
          Assinatura ASO oculta: exige <code>documents.sign</code>.
        </div>
      )}

      {canDeliverDocuments ? (
        <form action={deliverAction} className="gp-surface grid gap-3 p-4">
          <h2 className="text-base font-semibold">2c. Registrar entrega</h2>
          <p className="text-sm text-gp-text-muted">
            Exige <code>documents.deliver</code>. Conclui a etapa de entrega.
          </p>
          <input name="encounterId" type="hidden" value={encounterId ?? ""} />
          <label className="grid gap-1 text-sm">
            Destinatário
            <select className="gp-input" defaultValue="company" name="recipientType">
              <option value="company">Empresa</option>
              <option value="worker">Trabalhador</option>
              <option value="internal">Interno</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Canal
            <select className="gp-input" defaultValue="portal" name="channel">
              <option value="portal">Portal</option>
              <option value="print">Impressão</option>
              <option value="handoff">Entrega presencial</option>
            </select>
          </label>
          <button
            className="gp-btn gp-btn-primary w-fit"
            disabled={deliverPending || !encounterId}
            type="submit"
          >
            {deliverPending ? "Registrando…" : "Registrar entrega"}
          </button>
          {deliverState.error ? <p className="text-sm text-red-700">{deliverState.error}</p> : null}
          {deliverState.success ? (
            <p className="text-sm text-emerald-800">{deliverState.success}</p>
          ) : null}
        </form>
      ) : (
        <div className="gp-surface p-4 text-sm text-gp-text-muted">
          Entrega oculta: exige <code>documents.deliver</code>.
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
            A RPC revalida todos os gates. A UI nunca encerra só com estado local.
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
