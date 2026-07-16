const automatedTestTradeNames = new Set(["E2E", "DEMO", "TEST"]);
const automatedTestLegalNameMarkers = [
  "E2E",
  "FICTÍCIO",
  "FICTICIO",
  "DEMONSTRAÇÃO",
  "DEMONSTRACAO",
];

/** Tenants usados só por validação automatizada — não entram na UI operacional. */
export function isAutomatedTestTenant(
  tenant: { legal_name: string; trade_name: string | null } | null | undefined,
) {
  const tradeName = tenant?.trade_name?.trim().toUpperCase();
  const legalName = tenant?.legal_name?.trim().toUpperCase() ?? "";

  if (tradeName && automatedTestTradeNames.has(tradeName)) return true;

  return automatedTestLegalNameMarkers.some((marker) => legalName.includes(marker));
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
