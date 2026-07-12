import { randomUUID } from "node:crypto";

export function getRequestId(headers: Headers): string {
  const provided = headers.get("x-request-id")?.trim();
  return provided && provided.length <= 128 ? provided : randomUUID();
}
