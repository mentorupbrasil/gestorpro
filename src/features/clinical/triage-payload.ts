import { z } from "zod";

export const TRIAGE_PAYLOAD_SCHEMA_VERSION = 2;

export const occupationalExamTypeLabels: Record<string, string> = {
  admission: "Admissional",
  change_of_risk: "Mudança de risco",
  dismissal: "Demissional",
  periodic: "Periódico",
  return_to_work: "Retorno ao trabalho",
};

const optionalNumber = (min: number, max: number, label: string) =>
  z
    .union([z.literal(""), z.null(), z.coerce.number()])
    .transform((value) => (value === "" || value === null ? null : value))
    .refine((value) => value === null || (value >= min && value <= max), {
      message: `${label} fora da faixa permitida (${min}–${max}).`,
    });

const optionalText = (max: number) =>
  z
    .union([z.literal(""), z.string().max(max), z.null()])
    .transform((value) => (value === null ? null : value.trim()))
    .transform((value) => (value === null || value.length === 0 ? null : value));

export const triageVitalsInputSchema = z.object({
  capillaryGlucose: optionalNumber(20, 600, "Glicemia capilar"),
  diastolicBp: optionalNumber(20, 200, "Pressão diastólica"),
  heartRate: optionalNumber(20, 300, "Frequência cardíaca"),
  oxygenSaturation: optionalNumber(50, 100, "Saturação de oxigênio"),
  respiratoryRate: optionalNumber(4, 80, "Frequência respiratória"),
  systolicBp: optionalNumber(40, 300, "Pressão sistólica"),
  temperature: optionalNumber(30, 45, "Temperatura"),
});

export const triageAnthropometryInputSchema = z.object({
  abdominalCircumference: optionalNumber(30, 200, "Circunferência abdominal"),
  heightCm: optionalNumber(30, 250, "Altura"),
  weightKg: optionalNumber(1, 500, "Peso"),
});

export const triageClinicalInputSchema = z.object({
  alcoholConsumption: optionalText(120),
  allergies: optionalText(2000),
  currentComplaint: optionalText(4000),
  medications: optionalText(2000),
  observations: optionalText(4000),
  painScale: optionalNumber(0, 10, "Escala de dor"),
  pregnancyStatus: optionalText(240),
  relevantHistory: optionalText(4000),
  smoking: optionalText(120),
});

export const triageOperationalInputSchema = z.object({
  equipmentUsed: optionalText(500),
});

export const triageStructuredInputSchema = z
  .object({
    anthropometry: triageAnthropometryInputSchema,
    clinical: triageClinicalInputSchema,
    operational: triageOperationalInputSchema,
    vitals: triageVitalsInputSchema,
  })
  .superRefine((value, context) => {
    const { systolicBp, diastolicBp } = value.vitals;
    if (systolicBp !== null && diastolicBp !== null && systolicBp < diastolicBp) {
      context.addIssue({
        code: "custom",
        message: "Pressão sistólica não pode ser menor que a diastólica.",
        path: ["vitals", "systolicBp"],
      });
    }
  });

export type TriageStructuredInput = z.infer<typeof triageStructuredInputSchema>;

export type TriageStoredPayload = {
  anthropometry: {
    abdominalCircumference: number | null;
    bmi: number | null;
    bmiClassification: string | null;
    heightCm: number | null;
    weightKg: number | null;
  };
  clinical: {
    alcoholConsumption: string | null;
    allergies: string | null;
    currentComplaint: string | null;
    medications: string | null;
    observations: string | null;
    painScale: number | null;
    pregnancyStatus: string | null;
    relevantHistory: string | null;
    smoking: string | null;
  };
  operational: {
    completedAt: string | null;
    equipmentUsed: string | null;
    responsibleProfessionalId: string | null;
    responsibleProfessionalName: string | null;
    startedAt: string | null;
  };
  schemaVersion: number;
  vitals: {
    capillaryGlucose: number | null;
    diastolicBp: number | null;
    heartRate: number | null;
    oxygenSaturation: number | null;
    respiratoryRate: number | null;
    systolicBp: number | null;
    temperature: number | null;
  };
  _legacy?: Record<string, unknown>;
};

export function computeBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg === null || heightCm === null || weightKg <= 0 || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function resolveBmiClassification(): string | null {
  return null;
}

export function hasTriageClinicalData(input: TriageStructuredInput) {
  const values = [
    ...Object.values(input.vitals),
    ...Object.values(input.anthropometry),
    ...Object.values(input.clinical),
    ...Object.values(input.operational),
  ];

  return values.some((value) => value !== null && value !== "");
}

export function buildTriageStoredPayload(
  input: TriageStructuredInput,
  options: {
    completedAt?: string | null;
    professionalId?: string | null;
    professionalName?: string | null;
    startedAt?: string | null;
  } = {},
): TriageStoredPayload {
  const bmi = computeBmi(input.anthropometry.weightKg, input.anthropometry.heightCm);

  return {
    anthropometry: {
      abdominalCircumference: input.anthropometry.abdominalCircumference,
      bmi,
      bmiClassification: resolveBmiClassification(),
      heightCm: input.anthropometry.heightCm,
      weightKg: input.anthropometry.weightKg,
    },
    clinical: { ...input.clinical },
    operational: {
      completedAt: options.completedAt ?? null,
      equipmentUsed: input.operational.equipmentUsed,
      responsibleProfessionalId: options.professionalId ?? null,
      responsibleProfessionalName: options.professionalName ?? null,
      startedAt: options.startedAt ?? null,
    },
    schemaVersion: TRIAGE_PAYLOAD_SCHEMA_VERSION,
    vitals: { ...input.vitals },
  };
}

function readLegacyNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readLegacyText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeLegacyTriagePayload(
  payload: Record<string, unknown>,
): TriageStoredPayload {
  if (payload.schemaVersion === TRIAGE_PAYLOAD_SCHEMA_VERSION) {
    return parseTriageStoredPayload(payload);
  }

  const structured = triageStructuredInputSchema.parse({
    anthropometry: {
      abdominalCircumference: readLegacyNumber(
        payload.circunferenciaAbdominal ?? payload.abdominalCircumference,
      ),
      heightCm: readLegacyNumber(payload.altura ?? payload.heightCm ?? payload.height),
      weightKg: readLegacyNumber(payload.peso ?? payload.weightKg ?? payload.weight),
    },
    clinical: {
      alcoholConsumption: readLegacyText(payload.etilismo ?? payload.alcoholConsumption),
      allergies: readLegacyText(payload.alergias ?? payload.allergies),
      currentComplaint: readLegacyText(payload.queixa ?? payload.currentComplaint),
      medications: readLegacyText(payload.medicamentos ?? payload.medications),
      observations: readLegacyText(
        payload.observações ?? payload.observacoes ?? payload.observations,
      ),
      painScale: readLegacyNumber(payload.dor ?? payload.painScale),
      pregnancyStatus: readLegacyText(payload.gestacao ?? payload.pregnancyStatus),
      relevantHistory: readLegacyText(payload.antecedentes ?? payload.relevantHistory),
      smoking: readLegacyText(payload.tabagismo ?? payload.smoking),
    },
    operational: {
      equipmentUsed: readLegacyText(payload.equipamentos ?? payload.equipmentUsed),
    },
    vitals: {
      capillaryGlucose: readLegacyNumber(payload.glicemia ?? payload.capillaryGlucose),
      diastolicBp: readLegacyNumber(payload.pressaoDiastolica ?? payload.diastolicBp),
      heartRate: readLegacyNumber(payload.frequenciaCardiaca ?? payload.heartRate),
      oxygenSaturation: readLegacyNumber(payload.saturacao ?? payload.oxygenSaturation),
      respiratoryRate: readLegacyNumber(payload.frequenciaRespiratoria ?? payload.respiratoryRate),
      systolicBp: readLegacyNumber(
        payload.pressaoSistolica ?? payload.pressao ?? payload.systolicBp,
      ),
      temperature: readLegacyNumber(payload.temperatura ?? payload.temperature),
    },
  });

  const stored = buildTriageStoredPayload(structured);
  const knownKeys = new Set([
    "schemaVersion",
    "vitals",
    "anthropometry",
    "clinical",
    "operational",
    "_legacy",
    "pressão",
    "peso",
    "observações",
    "observacoes",
    "altura",
    "peso",
  ]);

  const legacyEntries = Object.entries(payload).filter(([key]) => !knownKeys.has(key));
  if (legacyEntries.length > 0) {
    stored._legacy = Object.fromEntries(legacyEntries);
  }

  return stored;
}

export function parseTriageStoredPayload(payload: Record<string, unknown>): TriageStoredPayload {
  if (payload.schemaVersion !== TRIAGE_PAYLOAD_SCHEMA_VERSION) {
    return normalizeLegacyTriagePayload(payload);
  }

  const vitals = (payload.vitals ?? {}) as Record<string, unknown>;
  const anthropometry = (payload.anthropometry ?? {}) as Record<string, unknown>;
  const clinical = (payload.clinical ?? {}) as Record<string, unknown>;
  const operational = (payload.operational ?? {}) as Record<string, unknown>;

  const structured = triageStructuredInputSchema.parse({
    anthropometry: {
      abdominalCircumference: readLegacyNumber(anthropometry.abdominalCircumference),
      heightCm: readLegacyNumber(anthropometry.heightCm),
      weightKg: readLegacyNumber(anthropometry.weightKg),
    },
    clinical: {
      alcoholConsumption: readLegacyText(clinical.alcoholConsumption),
      allergies: readLegacyText(clinical.allergies),
      currentComplaint: readLegacyText(clinical.currentComplaint),
      medications: readLegacyText(clinical.medications),
      observations: readLegacyText(clinical.observations),
      painScale: readLegacyNumber(clinical.painScale),
      pregnancyStatus: readLegacyText(clinical.pregnancyStatus),
      relevantHistory: readLegacyText(clinical.relevantHistory),
      smoking: readLegacyText(clinical.smoking),
    },
    operational: {
      equipmentUsed: readLegacyText(operational.equipmentUsed),
    },
    vitals: {
      capillaryGlucose: readLegacyNumber(vitals.capillaryGlucose),
      diastolicBp: readLegacyNumber(vitals.diastolicBp),
      heartRate: readLegacyNumber(vitals.heartRate),
      oxygenSaturation: readLegacyNumber(vitals.oxygenSaturation),
      respiratoryRate: readLegacyNumber(vitals.respiratoryRate),
      systolicBp: readLegacyNumber(vitals.systolicBp),
      temperature: readLegacyNumber(vitals.temperature),
    },
  });

  const stored = buildTriageStoredPayload(structured, {
    completedAt: readLegacyText(operational.completedAt),
    professionalId: readLegacyText(operational.responsibleProfessionalId),
    professionalName: readLegacyText(operational.responsibleProfessionalName),
    startedAt: readLegacyText(operational.startedAt),
  });

  stored.anthropometry.bmi =
    readLegacyNumber(anthropometry.bmi) ??
    computeBmi(stored.anthropometry.weightKg, stored.anthropometry.heightCm);
  stored.anthropometry.bmiClassification = readLegacyText(anthropometry.bmiClassification);

  if (payload._legacy && typeof payload._legacy === "object" && !Array.isArray(payload._legacy)) {
    stored._legacy = payload._legacy as Record<string, unknown>;
  }

  return stored;
}

export function triageInputFromStored(payload: TriageStoredPayload): TriageStructuredInput {
  return {
    anthropometry: {
      abdominalCircumference: payload.anthropometry.abdominalCircumference,
      heightCm: payload.anthropometry.heightCm,
      weightKg: payload.anthropometry.weightKg,
    },
    clinical: { ...payload.clinical },
    operational: {
      equipmentUsed: payload.operational.equipmentUsed,
    },
    vitals: { ...payload.vitals },
  };
}

export function formatWaitDuration(checkedInAt: string, now = Date.now()) {
  const started = new Date(checkedInAt).getTime();
  if (Number.isNaN(started)) return "—";

  const minutes = Math.max(0, Math.floor((now - started) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}min`;
}
