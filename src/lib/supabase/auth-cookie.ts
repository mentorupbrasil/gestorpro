type CookieDescriptor = Readonly<{ name: string }>;

export function hasSupabaseAuthCookie(cookies: readonly CookieDescriptor[]) {
  return cookies.some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}
