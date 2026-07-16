import { createHash, randomUUID } from "node:crypto";
import { AppError } from "@/core/errors/app-error";

export type DocumentType = "aso" | "triage_form" | "exam_report" | "generic";

export const CLINICAL_PRIVATE_BUCKET = "clinical-private";

export type AsoSnapshot = {
  company?: {
    cnpjMasked?: string;
    fantasyName?: string;
    legalName?: string;
    establishment?: string;
  };
  conclusion?: {
    code?: string;
    restrictions?: string[];
    signedAt?: string;
  };
  encounter?: {
    clinicUnitId?: string;
    examType?: string;
    id?: string;
    pcmsoVersion?: string | number;
    protocolVersion?: string | number;
  };
  exams?: Array<{ code?: string; date?: string; name?: string }>;
  issuedAt?: string;
  physician?: {
    councilNumber?: string;
    councilRegion?: string;
    name?: string;
  };
  risks?: string[];
  tenantId?: string;
  verificationCode?: string;
  worker?: {
    birthDate?: string;
    cpfMasked?: string;
    functionName?: string;
    ghe?: string;
    name?: string;
    registration?: string;
    sector?: string;
  };
};

/** @deprecated Test-only stub. Never use in operational document emission. */
export function buildNonPhiDocumentStubPdf(meta: {
  documentType: DocumentType;
  versionId: string;
}) {
  const title = `GestorPro stub ${meta.documentType} ${meta.versionId.slice(0, 8)}`;
  return buildSimplePdf([title, "TEST ONLY — not an operational document"]);
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const contentLines = lines
    .slice(0, 48)
    .map((line, index) => {
      const y = 750 - index * 14;
      return `BT /F1 10 Tf 48 ${y} Td (${escapePdfText(line.slice(0, 110))}) Tj ET`;
    })
    .join("\n");

  const stream = `${contentLines}\n`;
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}endstream\nendobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${object}\n`;
  }

  const xrefStart = Buffer.byteLength(body, "utf8");
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, "utf8");
}

/**
 * Renders an operational ASO PDF from an immutable server-side snapshot.
 * Content is textual and deterministic; signature still binds to the byte hash.
 */
export function buildAsoPdfFromSnapshot(input: { snapshot: AsoSnapshot; versionId: string }) {
  const snap = input.snapshot;
  const company = snap.company ?? {};
  const worker = snap.worker ?? {};
  const physician = snap.physician ?? {};
  const conclusion = snap.conclusion ?? {};
  const encounter = snap.encounter ?? {};
  const exams = snap.exams ?? [];
  const risks = snap.risks ?? [];

  if (!company.legalName && !company.fantasyName) {
    throw new AppError("VALIDATION_FAILED", "Snapshot ASO sem dados da empresa.", { status: 422 });
  }
  if (!worker.name) {
    throw new AppError("VALIDATION_FAILED", "Snapshot ASO sem dados do trabalhador.", {
      status: 422,
    });
  }
  if (!conclusion.code) {
    throw new AppError("VALIDATION_FAILED", "Snapshot ASO sem conclusão médica.", { status: 422 });
  }
  if (!physician.name || !physician.councilNumber) {
    throw new AppError("VALIDATION_FAILED", "Snapshot ASO sem credencial médica.", {
      status: 422,
    });
  }

  const lines = [
    "GESTORPRO — ATESTADO DE SAUDE OCUPACIONAL (ASO)",
    `Documento versao: ${input.versionId}`,
    `Emitido em: ${snap.issuedAt ?? new Date().toISOString()}`,
    `Codigo verificavel: ${snap.verificationCode ?? input.versionId.slice(0, 8)}`,
    "",
    "EMPRESA",
    `Razao social: ${company.legalName ?? "-"}`,
    `Nome fantasia: ${company.fantasyName ?? "-"}`,
    `CNPJ: ${company.cnpjMasked ?? "-"}`,
    `Estabelecimento: ${company.establishment ?? "-"}`,
    "",
    "TRABALHADOR",
    `Nome: ${worker.name}`,
    `CPF: ${worker.cpfMasked ?? "-"}`,
    `Nascimento: ${worker.birthDate ?? "-"}`,
    `Matricula: ${worker.registration ?? "-"}`,
    `Setor: ${worker.sector ?? "-"}`,
    `Funcao: ${worker.functionName ?? "-"}`,
    `GHE: ${worker.ghe ?? "-"}`,
    "",
    "EXAME OCUPACIONAL",
    `Tipo: ${encounter.examType ?? "-"}`,
    `Atendimento: ${encounter.id ?? "-"}`,
    `PCMSO versao: ${encounter.pcmsoVersion ?? "-"}`,
    `Protocolo versao: ${encounter.protocolVersion ?? "-"}`,
    `Riscos: ${risks.length > 0 ? risks.join(", ") : "nao informados"}`,
    `Exames: ${
      exams.length > 0
        ? exams
            .map((exam) => `${exam.name ?? exam.code ?? "exame"} (${exam.date ?? "-"})`)
            .join("; ")
        : "nenhum listado"
    }`,
    "",
    "CONCLUSAO MEDICA (HUMANA)",
    `Resultado: ${conclusion.code}`,
    `Restricoes: ${(conclusion.restrictions ?? []).join("; ") || "nenhuma"}`,
    `Assinatura clinica em: ${conclusion.signedAt ?? "-"}`,
    "",
    "PROFISSIONAL",
    `Nome: ${physician.name}`,
    `CRM: ${physician.councilNumber}/${physician.councilRegion ?? "-"}`,
    "",
    "RASTREABILIDADE",
    `Tenant: ${snap.tenantId ?? "-"}`,
    `Unidade: ${encounter.clinicUnitId ?? "-"}`,
    "Documento gerado server-side a partir de snapshot imutavel.",
  ];

  return buildSimplePdf(lines);
}

export function buildGenericDocumentPdf(input: { documentType: DocumentType; versionId: string }) {
  return buildSimplePdf([
    `GestorPro documento ${input.documentType}`,
    `Versao: ${input.versionId}`,
    `Emitido: ${new Date().toISOString()}`,
    "Conteudo gerado server-side a partir do snapshot informado.",
  ]);
}

export function buildDocumentHash(snapshot: unknown) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export function buildOpaqueDocumentStoragePath(input: {
  documentId: string;
  encounterId: string;
  tenantId: string;
  version: number;
}) {
  const path = [
    input.tenantId,
    input.encounterId,
    input.documentId,
    `v${input.version}`,
    `${randomUUID()}.pdf`,
  ].join("/");

  return assertPrivateDocumentPath({ bucket: CLINICAL_PRIVATE_BUCKET, path }).path;
}

export function assertPrivateDocumentPath(input: { bucket: string; path: string }) {
  if (input.bucket !== CLINICAL_PRIVATE_BUCKET || !input.path.trim()) {
    throw new AppError("VALIDATION_FAILED", "Documento clínico deve ficar em storage privado.", {
      status: 400,
    });
  }

  if (/diagn[oó]stico|inapto|doen[cç]a/i.test(input.path)) {
    throw new AppError("VALIDATION_FAILED", "Nome físico não pode revelar conteúdo clínico.", {
      status: 400,
    });
  }

  if (
    !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/v\d+\/[0-9a-f-]{36}\.pdf$/i.test(input.path)
  ) {
    if (input.path.includes("..") || input.path.startsWith("/")) {
      throw new AppError("VALIDATION_FAILED", "Caminho de storage inválido.", { status: 400 });
    }
  }

  return input;
}

export function assertAsoReadiness(input: {
  documentType: DocumentType;
  hasMedicalConclusion: boolean;
  pendingRequiredExams: number;
}) {
  if (input.documentType !== "aso") return;

  if (!input.hasMedicalConclusion || input.pendingRequiredExams > 0) {
    throw new AppError("VALIDATION_FAILED", "ASO não pode ser gerado incompleto.", {
      status: 409,
    });
  }
}

export function buildPrintConfig(copies: number) {
  return {
    copies: Math.max(1, Math.min(copies, 5)),
    paper: "A4" as const,
  };
}
