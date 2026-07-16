import { NextResponse } from "next/server";
import { heartbeatDisplaySession } from "@/features/display/device-public";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    deviceToken?: string;
    sessionId?: string;
  } | null;

  if (!body?.deviceToken || !body.sessionId) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    await heartbeatDisplaySession(body.deviceToken, body.sessionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "heartbeat failed" }, { status: 401 });
  }
}
