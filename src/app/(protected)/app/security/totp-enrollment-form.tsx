"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  startTotpEnrollment,
  verifyTotpEnrollment,
  type TotpEnrollmentState,
  type TotpVerificationState,
} from "./actions";

const enrollmentInitialState: TotpEnrollmentState = {};
const verificationInitialState: TotpVerificationState = {};

export function TotpEnrollmentForm() {
  const [enrollmentState, startAction, starting] = useActionState(
    startTotpEnrollment,
    enrollmentInitialState,
  );
  const [verificationState, verifyAction, verifying] = useActionState(
    verifyTotpEnrollment,
    verificationInitialState,
  );

  return (
    <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="mfa-enroll-title">
      <h2 id="mfa-enroll-title" className="text-lg font-semibold">
        Ativar aplicativo autenticador
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Use um aplicativo compatível com TOTP para reforçar ações administrativas críticas.
      </p>
      <form action={startAction} className="mt-4">
        <button
          className="rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
          disabled={starting || Boolean(enrollmentState.enrollment)}
          type="submit"
        >
          {starting ? "Gerando…" : "Gerar QR Code"}
        </button>
      </form>
      {enrollmentState.error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {enrollmentState.error}
        </p>
      ) : null}
      {enrollmentState.enrollment ? (
        <div className="mt-5 grid gap-5 md:grid-cols-[12rem_1fr] md:items-start">
          <Image
            alt="QR Code para configurar MFA"
            className="h-48 w-48 border border-slate-200 bg-white p-2"
            height={192}
            src={enrollmentState.enrollment.qrCode}
            unoptimized
            width={192}
          />
          <div>
            <p className="text-sm text-slate-700">
              Escaneie o QR Code ou cadastre o segredo manualmente:
            </p>
            <p className="mt-2 break-all rounded bg-slate-100 p-3 font-mono text-sm">
              <span data-testid="totp-secret" className="contents">
                {enrollmentState.enrollment.secret}
              </span>
            </p>
            <form action={verifyAction} className="mt-4 grid max-w-sm gap-3">
              <input name="factorId" type="hidden" value={enrollmentState.enrollment.factorId} />
              <label className="grid gap-1 text-sm font-medium">
                Código do autenticador
                <input
                  className="rounded border border-slate-300 px-3 py-2"
                  inputMode="numeric"
                  maxLength={6}
                  name="code"
                  pattern="[0-9]{6}"
                  required
                />
              </label>
              <button
                className="rounded bg-emerald-800 px-4 py-2 font-semibold text-white disabled:opacity-60"
                disabled={verifying}
                type="submit"
              >
                {verifying ? "Verificando…" : "Confirmar MFA"}
              </button>
            </form>
            {verificationState.error ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {verificationState.error}
              </p>
            ) : null}
            {verificationState.success ? (
              <p role="status" className="mt-3 text-sm text-emerald-800">
                {verificationState.success}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
