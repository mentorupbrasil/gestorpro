"use client";

import { useActionState } from "react";
import {
  createBillingFromSnapshotAction,
  createPriceSnapshotAction,
  issueInvoiceAction,
  recordPaymentAction,
  type FinanceFormState,
} from "./actions";

type Option = { id: string; label: string };

export function FinanceWorkspaceForms({
  billingOptions,
  contractOptions,
  invoiceOptions,
  priceItemOptions,
  priceTableOptions,
  snapshotOptions,
}: {
  billingOptions: Option[];
  contractOptions: Option[];
  invoiceOptions: Option[];
  priceItemOptions: Option[];
  priceTableOptions: Option[];
  snapshotOptions: Option[];
}) {
  const [snapshotState, snapshotAction, snapshotPending] = useActionState(
    createPriceSnapshotAction,
    {} as FinanceFormState,
  );
  const [billingState, billingAction, billingPending] = useActionState(
    createBillingFromSnapshotAction,
    {} as FinanceFormState,
  );
  const [invoiceState, invoiceAction, invoicePending] = useActionState(
    issueInvoiceAction,
    {} as FinanceFormState,
  );
  const [paymentState, paymentAction, paymentPending] = useActionState(
    recordPaymentAction,
    {} as FinanceFormState,
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const dueOn = tomorrow.toISOString().slice(0, 10);

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-2">
      <form action={snapshotAction} className="space-y-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">1. Snapshot de preço</h2>
        <p className="text-xs text-slate-600">
          Valor vem da tabela aprovada no servidor. O cliente só escolhe o código faturável.
        </p>
        <input
          className="gp-input font-mono"
          name="encounterId"
          placeholder="encounter_id"
          required
        />
        <select className="gp-input" name="contractId" required>
          <option value="">Contrato…</option>
          {contractOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="gp-input" name="priceTableId" required>
          <option value="">Tabela…</option>
          {priceTableOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="gp-input" name="billableCode" required>
          <option value="">Código faturável…</option>
          {priceItemOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input name="technicalRepeat" type="checkbox" /> Repetição técnica (não faturável)
        </label>
        <button
          className="gp-btn gp-btn-primary"
          disabled={
            snapshotPending || contractOptions.length === 0 || priceItemOptions.length === 0
          }
          type="submit"
        >
          Criar snapshot
        </button>
        {snapshotState.error ? <p className="text-sm text-red-700">{snapshotState.error}</p> : null}
        {snapshotState.success ? (
          <p className="text-sm text-emerald-700">{snapshotState.success}</p>
        ) : null}
      </form>

      <form action={billingAction} className="space-y-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">2. Gerar faturamento</h2>
        <select className="gp-input" name="snapshotId" required>
          <option value="">Snapshot…</option>
          {snapshotOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          className="gp-btn gp-btn-primary"
          disabled={billingPending || snapshotOptions.length === 0}
          type="submit"
        >
          Criar billing items
        </button>
        {billingState.error ? <p className="text-sm text-red-700">{billingState.error}</p> : null}
        {billingState.success ? (
          <p className="text-sm text-emerald-700">{billingState.success}</p>
        ) : null}
      </form>

      <form action={invoiceAction} className="space-y-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">3. Emitir fatura</h2>
        <select className="gp-input" name="billingPayload" required>
          <option value="">Item pending/ready…</option>
          {billingOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input className="gp-input" defaultValue={dueOn} name="dueOn" required type="date" />
        <button
          className="gp-btn gp-btn-primary"
          disabled={invoicePending || billingOptions.length === 0}
          type="submit"
        >
          Emitir fatura
        </button>
        {invoiceState.error ? <p className="text-sm text-red-700">{invoiceState.error}</p> : null}
        {invoiceState.success ? (
          <p className="text-sm text-emerald-700">{invoiceState.success}</p>
        ) : null}
      </form>

      <form action={paymentAction} className="space-y-3 gp-surface p-4">
        <h2 className="text-lg font-semibold">4. Registrar pagamento</h2>
        <select className="gp-input" name="invoiceId" required>
          <option value="">Fatura…</option>
          {invoiceOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="gp-input"
          min={1}
          name="amountCents"
          placeholder="valor em centavos"
          required
          type="number"
        />
        <input className="gp-input" defaultValue="pix" name="method" required />
        <input className="gp-input" name="reference" placeholder="referência (opcional)" />
        <button
          className="gp-btn gp-btn-secondary"
          disabled={paymentPending || invoiceOptions.length === 0}
          type="submit"
        >
          Registrar pagamento
        </button>
        {paymentState.error ? <p className="text-sm text-red-700">{paymentState.error}</p> : null}
        {paymentState.success ? (
          <p className="text-sm text-emerald-700">{paymentState.success}</p>
        ) : null}
      </form>
    </section>
  );
}
