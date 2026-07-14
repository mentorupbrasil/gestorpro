export type NavLeaf = {
  href: string;
  label: string;
  anyOf?: string[];
};

export type NavGroup = {
  label: string;
  items: Array<NavLeaf | NavExamGroup>;
};

export type NavExamGroup = {
  label: "Exames";
  kind: "exams";
  anyOf?: string[];
  children: NavLeaf[];
};

export function isExamGroup(item: NavLeaf | NavExamGroup): item is NavExamGroup {
  return "kind" in item && item.kind === "exams";
}

export const workspaceNavigation: NavGroup[] = [
  {
    label: "Plataforma",
    items: [
      { href: "/app", label: "Visão geral" },
      { href: "/app/units", label: "Unidades", anyOf: ["units.read", "units.manage"] },
      {
        href: "/app/access",
        label: "Acessos",
        anyOf: ["memberships.read", "roles.read", "roles.manage"],
      },
      { href: "/app/security", label: "Segurança" },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        href: "/app/occupational",
        label: "Empresas e PCMSO",
        anyOf: ["occupational.read", "occupational.manage", "protocols.read", "protocols.manage"],
      },
      {
        href: "/app/scheduling",
        label: "Encaminhamentos",
        anyOf: ["referrals.read", "referrals.manage", "schedule.read", "schedule.manage"],
      },
      {
        href: "/app/check-in",
        label: "Check-in e filas",
        anyOf: ["encounters.read", "encounters.manage", "queues.read", "queues.manage"],
      },
      {
        href: "/app/display",
        label: "Painel de chamadas",
        anyOf: ["display.read", "display.manage"],
      },
    ],
  },
  {
    label: "Atendimento",
    items: [
      {
        href: "/app/clinical",
        label: "Clínica",
        anyOf: ["clinical.read", "triage.manage", "consultations.manage", "conclusions.manage"],
      },
      {
        kind: "exams",
        label: "Exames",
        anyOf: ["exams.read", "exams.manage"],
        children: [
          { href: "/app/exams/visual-acuity", label: "Acuidade" },
          { href: "/app/exams/audiometry", label: "Audiometria" },
          { href: "/app/exams/spirometry", label: "Espirometria" },
          { href: "/app/exams/diagnostics", label: "ECG / EEG / RX" },
          { href: "/app/exams/laboratory", label: "Laboratório" },
        ],
      },
    ],
  },
  {
    label: "Fechamento",
    items: [
      {
        href: "/app/documents",
        label: "Documentos",
        anyOf: ["documents.read", "documents.manage", "documents.sign", "documents.deliver"],
      },
      {
        href: "/app/finance",
        label: "Financeiro",
        anyOf: ["finance.read", "finance.manage"],
      },
      {
        href: "/app/portal",
        label: "Portal empresa",
        anyOf: ["company_portal.read", "company_portal.manage"],
      },
      {
        href: "/app/integrations",
        label: "Integrações",
        anyOf: ["integrations.read", "integrations.manage", "esocial.read", "esocial.manage"],
      },
    ],
  },
];

export function filterWorkspaceNavigation(
  navigation: NavGroup[],
  permissionSet: ReadonlySet<string>,
): NavGroup[] {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => {
          if (isExamGroup(item)) {
            if (item.anyOf && !item.anyOf.some((code) => permissionSet.has(code))) {
              return null;
            }
            return item;
          }
          if (item.anyOf && !item.anyOf.some((code) => permissionSet.has(code))) {
            return null;
          }
          return item;
        })
        .filter((item): item is NavLeaf | NavExamGroup => item !== null),
    }))
    .filter((group) => group.items.length > 0);
}
