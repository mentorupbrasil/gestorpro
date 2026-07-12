import { type NextRequest, NextResponse } from "next/server";
import { getSafeAuthRedirect } from "@/core/auth/redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeAuthRedirect(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=callback", request.nextUrl.origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/sign-in?error=callback", request.nextUrl.origin));
  }

  return NextResponse.redirect(new URL(next, request.nextUrl.origin));
}
