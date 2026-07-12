import { getRequestId } from "@/lib/http/request-id";

export async function GET(request: Request) {
  const requestId = getRequestId(request.headers);
  return Response.json(
    { status: "ok", requestId },
    { headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}
