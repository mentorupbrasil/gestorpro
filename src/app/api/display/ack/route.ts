import { NextResponse } from "next/server";
import { acknowledgeDisplayCall } from "@/features/display/device-public";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    ackKind?: "delivered" | "acknowledged" | "displayed";
    callEventId?: string;
    deviceToken?: string;
    sessionId?: string;
  } | null;

  if (!body?.deviceToken || !body.sessionId || !body.callEventId || !body.ackKind) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    await acknowledgeDisplayCall({
      ackKind: body.ackKind,
      callEventId: body.callEventId,
      deviceToken: body.deviceToken,
      sessionId: body.sessionId,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ack failed" }, { status: 500 });
  }
}
