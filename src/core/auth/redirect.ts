const allowedAuthRedirects = new Set(["/select-tenant", "/update-password"]);

export function getSafeAuthRedirect(value: string | null, fallback = "/select-tenant") {
  return value && allowedAuthRedirects.has(value) ? value : fallback;
}
