import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(12, "A senha deve possuir pelo menos 12 caracteres.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial.");
