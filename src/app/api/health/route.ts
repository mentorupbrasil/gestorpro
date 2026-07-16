import { getRequestId } from "@/lib/http/request-id";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const requestId = getRequestId(request.headers);
  const deep = new URL(request.url).searchParams.get("deep") === "1";
  const headers = { "cache-control": "no-store", "x-request-id": requestId };

  if (!deep) {
    return Response.json({ requestId, status: "ok" }, { headers });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("tenants").select("id", { count: "exact", head: true });
    if (error) {
      return Response.json(
        { database: "down", requestId, status: "degraded" },
        { headers, status: 503 },
      );
    }
    return Response.json({ database: "up", requestId, status: "ok" }, { headers });
  } catch {
    return Response.json(
      { database: "down", requestId, status: "degraded" },
      { headers, status: 503 },
    );
  }
}
