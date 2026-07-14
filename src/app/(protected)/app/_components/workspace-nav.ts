export type NavLeaf = {
  href: string;
  label: string;
};

export type NavGroup = {
  label: string;
  items: Array<NavLeaf | NavExamGroup>;
};

export type NavExamGroup = {
  label: "Exames";
  kind: "exams";
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
      { href: "/app/units", label: "Unidades" },
      { href: "/app/access", label: "Acessos" },
      { href: "/app/security", label: "Segurança" },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/app/occupational", label: "Empresas e PCMSO" },
      { href: "/app/scheduling", label: "Encaminhamentos" },
      { href: "/app/check-in", label: "Check-in e filas" },
      { href: "/app/display", label: "Painel de chamadas" },
    ],
  },
  {
    label: "Atendimento",
    items: [
      { href: "/app/clinical", label: "Clínica" },
      {
        kind: "exams",
        label: "Exames",
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
      { href: "/app/documents", label: "Documentos" },
      { href: "/app/finance", label: "Financeiro" },
      { href: "/app/portal", label: "Portal empresa" },
      { href: "/app/integrations", label: "Integrações" },
    ],
  },
];
