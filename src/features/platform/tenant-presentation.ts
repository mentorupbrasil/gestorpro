const demoTradeNames = new Set(["E2E", "DEMO", "TEST"]);
const demoLegalNameMarkers = ["E2E", "FICTÍCIO", "FICTICIO", "DEMONSTRAÇÃO", "DEMONSTRACAO"];

export function isDemoTenant(
  tenant: { legal_name: string; trade_name: string | null } | null | undefined,
) {
  const tradeName = tenant?.trade_name?.trim().toUpperCase();
  const legalName = tenant?.legal_name?.trim().toUpperCase() ?? "";

  if (tradeName && demoTradeNames.has(tradeName)) return true;

  return demoLegalNameMarkers.some((marker) => legalName.includes(marker));
}

export function formatTenantLabel(
  tenant: { legal_name: string; trade_name: string | null } | null | undefined,
) {
  if (!tenant) return "Organização autorizada";

  const tradeName = tenant.trade_name?.trim();
  const legalName = tenant.legal_name.trim();

  if (tradeName && tradeName !== legalName) {
    return `${legalName} (${tradeName})`;
  }

  return legalName || tradeName || "Organização autorizada";
}
