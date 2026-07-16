"use client";

import { useActionState } from "react";
import {
  bootstrapTenantOperationsAction,
  type BootstrapOperationsState,
} from "./bootstrap-operations-action";

const initialState: BootstrapOperationsState = {};

type BootstrapOperationsPanelProps = {
  canBootstrap: boolean;
  compact?: boolean;
  reason: string;
};

export function BootstrapOperationsPanel({
  canBootstrap,
  compact = false,
  reason,
}: BootstrapOperationsPanelProps) {
  const [state, action, pending] = useActionState(bootstrapTenantOperationsAction, initialState);

  if (!canBootstrap) {
    return (
      <div className={compact ? "mt-3 text-sm text-amber-900" : "gp-surface mt-4 p-4"}>
        <p className="font-medium text-amber-950">{reason}</p>
        <p className="mt-1 text-sm text-amber-900">
          Peça a um administrador com MFA para inicializar a operação (unidade + formulários +
          papéis).
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "mt-3 rounded border border-amber-300 bg-amber-50 p-3"
          : "gp-surface mt-4 border border-amber-300 bg-amber-50 p-4"
      }
    >
      <p className="font-medium text-amber-950">{reason}</p>
      <p className="mt-1 text-sm text-amber-900">
        Isso cria (se faltar): unidade SEDE, formulário de triagem aprovado, template ASO stub e
        papéis operacionais na sua conta. Exige MFA (AAL2).
      </p>
      <form action={action} className="mt-3">
        <button className="gp-btn gp-btn-primary" disabled={pending} type="submit">
          {pending ? "Inicializando…" : "Inicializar operação deste tenant"}
        </button>
      </form>
      {state.error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-2 text-sm text-emerald-800" role="status">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
