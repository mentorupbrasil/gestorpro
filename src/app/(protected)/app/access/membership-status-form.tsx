"use client";

import { useActionState } from "react";
import { setMembershipStatusAction, type MembershipStatusState } from "./actions";

type MembershipStatusFormProps = {
  membershipId: string;
  nextStatus: "active" | "blocked";
};

const initialState: MembershipStatusState = {};

export function MembershipStatusForm({ membershipId, nextStatus }: MembershipStatusFormProps) {
  const [state, action, pending] = useActionState(setMembershipStatusAction, initialState);
  const isBlocking = nextStatus === "blocked";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          isBlocking ? "Bloquear este vínculo e impedir novos acessos?" : "Reativar este vínculo?",
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input name="membershipId" type="hidden" value={membershipId} />
      <input name="status" type="hidden" value={nextStatus} />
      <button
        className={
          isBlocking
            ? "text-sm font-semibold text-red-700"
            : "text-sm font-semibold text-emerald-800"
        }
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvando…" : isBlocking ? "Bloquear" : "Reativar"}
      </button>
      {state.error ? (
        <span className="mt-1 block max-w-48 text-xs text-red-700" role="alert">
          {state.error}
        </span>
      ) : null}
      {state.success ? (
        <span className="mt-1 block max-w-48 text-xs text-emerald-800" role="status">
          {state.success}
        </span>
      ) : null}
    </form>
  );
}
