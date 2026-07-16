"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createDocumentVersionAction,
  signDocumentVersionAction,
  type DocumentsFormState,
} from "./actions";

type TemplateVersionOption = {
  id: string;
  label: string;
};

type VersionOption = {
  contentHash: string;
  id: string;
  label: string;
};

export function DocumentsWorkspaceForms({
  templateVersions,
  versions,
}: {
  templateVersions: TemplateVersionOption[];
  versions: VersionOption[];
}) {
  const [selectedVersionId, setSelectedVersionId] = useState(versions[0]?.id ?? "");
  const selectedHash = useMemo(
    () => versions.find((item) => item.id === selectedVersionId)?.contentHash ?? "",
    [selectedVersionId, versions],
  );
  const [idempotencyKey] = useState(() => `doc-${crypto.randomUUID()}`);
  const [createState, createAction, createPending] = useActionState(
    createDocumentVersionAction,
    {} as DocumentsFormState,
  );
  const [signState, signAction, signPending] = useActionState(
    signDocumentVersionAction,
    {} as DocumentsFormState,
  );

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <form action={createAction} className="space-y-3 gp-surface p-4">
        <h3 className="font-semibold">Gerar versão</h3>
        <select className="gp-input" name="templateVersionId" required>
          <option value="">Template version…</option>
          {templateVersions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className="gp-input font-mono"
          name="encounterId"
          placeholder="encounter_id"
          required
        />
        <select className="gp-input" defaultValue="generic" name="documentType">
          <option value="generic">generic</option>
          <option value="triage_form">triage_form</option>
          <option value="exam_report">exam_report</option>
          <option value="aso">aso</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input name="hasMedicalConclusion" type="checkbox" /> Conclusão médica existente (ASO)
        </label>
        <p className="text-xs text-slate-600">
          Path e PDF são gerados no servidor (bucket privado). Sem path do cliente.
        </p>
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <button
          className="gp-btn gp-btn-primary"
          disabled={createPending || templateVersions.length === 0}
          type="submit"
        >
          Gerar documento
        </button>
        {createState.error ? <p className="text-sm text-red-700">{createState.error}</p> : null}
        {createState.success ? (
          <p className="text-sm text-emerald-700">{createState.success}</p>
        ) : null}
      </form>

      <form action={signAction} className="space-y-3 gp-surface p-4">
        <h3 className="font-semibold">Assinar versão</h3>
        <select
          className="gp-input"
          name="documentVersionId"
          onChange={(event) => setSelectedVersionId(event.target.value)}
          required
          value={selectedVersionId}
        >
          <option value="">Versão…</option>
          {versions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <input name="contentHash" type="hidden" value={selectedHash} />
        <p className="truncate font-mono text-xs text-slate-500">{selectedHash || "hash…"}</p>
        <button
          className="gp-btn gp-btn-secondary"
          disabled={signPending || versions.length === 0 || !selectedHash}
          type="submit"
        >
          Assinar (AAL2)
        </button>
        {signState.error ? <p className="text-sm text-red-700">{signState.error}</p> : null}
        {signState.success ? <p className="text-sm text-emerald-700">{signState.success}</p> : null}
      </form>
    </div>
  );
}
