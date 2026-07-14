"use client";

import { useActionState } from "react";
import {
  closeEncounterAction,
  signConclusionAction,
  type ClosureFormState,
} from "./closure-actions";

const initial: ClosureFormState = {};

export function ConclusionClosureForms({
  conclusionId,
  conclusionVersion = 1,
  encounterId,
  encounterVersion = 1,
}: {
  conclusionId?: string | undefined;
  conclusionVersion?: number | undefined;
  encounterId?: string | undefined;
  encounterVersion?: number | undefined;
}) {
  const [signState, signAction, signPending] = useActionState(signConclusionAction, initial);
  const [closeState, closeAction, closePending] = useActionState(closeEncounterAction, initial);

  return (
    <section className="mt-4 grid gap-3 lg:grid-cols-2">
      <form action={signAction} className="gp-surface grid gap-3 p-4">
        <h2 className="text-base font-semibold">Assinar conclusão (AAL2)</h2>
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

      <form action={closeAction} className="gp-surface grid gap-3 p-4">
        <h2 className="text-base font-semibold">Encerrar atendimento</h2>
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
