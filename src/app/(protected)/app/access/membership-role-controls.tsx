"use client";

import { useActionState } from "react";
import {
  assignMembershipRoleAction,
  revokeMembershipRoleAction,
  type MembershipRoleState,
} from "./actions";

type AssignableRole = {
  code: string;
  id: string;
  name: string;
};

type MembershipRoleControlsProps = {
  assignedRoleIds: string[];
  canManageRoles: boolean;
  isSelf: boolean;
  membershipId: string;
  membershipRoles: Array<{
    id: string;
    name: string;
  }>;
  roles: AssignableRole[];
};

const initialState: MembershipRoleState = {};

export function MembershipRoleControls({
  assignedRoleIds,
  canManageRoles,
  isSelf,
  membershipId,
  membershipRoles,
  roles,
}: MembershipRoleControlsProps) {
  const [assignState, assignAction, assignPending] = useActionState(
    assignMembershipRoleAction,
    initialState,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeMembershipRoleAction,
    initialState,
  );

  const availableRoles = roles.filter((role) => !assignedRoleIds.includes(role.id));
  const feedback =
    assignState.error ?? assignState.success ?? revokeState.error ?? revokeState.success;
  const feedbackIsError = Boolean(assignState.error || revokeState.error);

  if (isSelf || !canManageRoles) {
    return (
      <p className="text-slate-700">
        {membershipRoles.map((role) => role.name).join(", ") || "Sem papel"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {membershipRoles.length === 0 ? (
          <li className="text-slate-600">Sem papel</li>
        ) : (
          membershipRoles.map((role) => (
            <li className="flex items-center justify-between gap-3" key={role.id}>
              <span>{role.name}</span>
              <form
                action={revokeAction}
                onSubmit={(event) => {
                  const confirmed = window.confirm(`Remover o papel "${role.name}" deste vínculo?`);
                  if (!confirmed) event.preventDefault();
                }}
              >
                <input name="membershipRoleId" type="hidden" value={role.id} />
                <button
                  className="text-xs font-semibold text-red-700"
                  disabled={revokePending}
                  type="submit"
                >
                  Remover
                </button>
              </form>
            </li>
          ))
        )}
      </ul>

      {availableRoles.length > 0 ? (
        <form action={assignAction} className="flex flex-wrap items-center gap-2">
          <input name="membershipId" type="hidden" value={membershipId} />
          <label className="sr-only" htmlFor={`role-${membershipId}`}>
            Conceder papel
          </label>
          <select
            className="min-w-40 border border-slate-300 bg-white px-2 py-1 text-sm"
            defaultValue=""
            id={`role-${membershipId}`}
            name="roleId"
            required
          >
            <option disabled value="">
              Selecionar papel
            </option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button
            className="text-sm font-semibold text-emerald-800"
            disabled={assignPending}
            type="submit"
          >
            {assignPending ? "Concedendo…" : "Conceder"}
          </button>
        </form>
      ) : null}

      {feedback ? (
        <span
          className={
            feedbackIsError ? "block text-xs text-red-700" : "block text-xs text-emerald-800"
          }
          role={feedbackIsError ? "alert" : "status"}
        >
          {feedback}
        </span>
      ) : null}
    </div>
  );
}
