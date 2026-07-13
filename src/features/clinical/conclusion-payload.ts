import { z } from "zod";
import { computeConclusionBlockers, type ConclusionCode } from "./workflow";

export const conclusionCodeSchema = z.enum([
  "fit",
  "fit_with_restrictions",
  "unfit",
  "inconclusive",
]);

export const conclusionInputSchema = z
  .object({
    conclusionCode: conclusionCodeSchema,
    notes: z
      .union([z.literal(""), z.string().max(5000)])
      .transform((value) => value.trim()),
    restrictionsText: z
      .union([z.literal(""), z.string().max(4000)])
      .transform((value) => value.trim()),
  })
  .superRefine((value, context) => {
    if (value.conclusionCode === "fit_with_restrictions" && value.restrictionsText.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Informe ao menos uma restrição para aptidão com restrições.",
        path: ["restrictionsText"],
      });
    }
  });

export type ConclusionStructuredInput = z.infer<typeof conclusionInputSchema>;

export const conclusionCodeLabels: Record<ConclusionCode, string> = {
  fit: "Apto",
  fit_with_restrictions: "Apto com restrições",
  inconclusive: "Inconclusivo",
  unfit: "Inapto",
};

export function parseRestrictionsText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 2);
}

export function formatRestrictionsForTextarea(restrictions: readonly string[]) {
  return restrictions.join("\n");
}

export function buildConclusionBlockers(input: {
  consultationStatus: string | null;
  flowPaused: boolean;
  pendingRequiredExams: number;
  physicianCredential: {
    councilCode: string | null;
    councilRegion: string | null;
    registrationNumber: string | null;
  } | null;
  triageStatus: string | null;
}) {
  return computeConclusionBlockers({
    closedConsultation: input.consultationStatus === "closed",
    closedTriage: input.triageStatus === "closed",
    flowPaused: input.flowPaused,
    pendingRequiredExams: input.pendingRequiredExams,
    physicianRegistrationComplete: Boolean(
      input.physicianCredential?.councilCode &&
        input.physicianCredential?.councilRegion &&
        input.physicianCredential?.registrationNumber,
    ),
  });
}

export function countPendingRequiredExams(
  orders: ReadonlyArray<{ status: string }>,
) {
  return orders.filter((order) => ["collected", "ordered"].includes(order.status)).length;
}
