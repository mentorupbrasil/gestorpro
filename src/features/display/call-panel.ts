import { AppError } from "@/core/errors/app-error";

export type CallAction =
  "call" | "recall" | "arrived" | "start" | "return" | "no_show" | "redirect";

export type QueueTicketCallContext = Readonly<{
  queueName: string;
  roomName?: string;
  ticketCode: string;
}>;

export function buildPublicCallPayload(context: QueueTicketCallContext) {
  return {
    queueName: context.queueName,
    roomName: context.roomName ?? null,
    ticketCode: context.ticketCode,
    voice: {
      lang: "pt-BR",
      text: `${context.ticketCode}, dirija-se ${context.roomName ? `a ${context.roomName}` : "ao atendimento"}.`,
    },
  } as const;
}

export function assertPublicPayload(payload: Readonly<Record<string, unknown>>) {
  const forbiddenKeys = ["cpf", "company", "diagnosis", "exam", "result", "workerName"];
  const serialized = JSON.stringify(payload).toLowerCase();
  const leaked = forbiddenKeys.find((key) => serialized.includes(key));

  if (leaked) {
    throw new AppError("VALIDATION_FAILED", "Payload de painel contém dado proibido.", {
      details: { leaked },
      status: 422,
    });
  }

  return payload;
}

export function recoverPanelStatus(lastHeartbeatAt: string, now = new Date()) {
  const lastHeartbeat = new Date(lastHeartbeatAt).getTime();
  const elapsedMs = now.getTime() - lastHeartbeat;
  return elapsedMs > 30_000 ? "offline" : "online";
}
