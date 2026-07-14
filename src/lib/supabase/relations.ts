import { z } from "zod";

export function readEmbeddedRelation<T>(value: T | T[] | null | undefined): T | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/**
 * PostgREST may return many-to-one embeds as object or single-element array
 * depending on FK discovery / composite keys. Normalize before Zod validation.
 */
export function embeddedOneSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (value == null) return null;
    if (Array.isArray(value)) return value[0] ?? null;
    return value;
  }, schema.nullable()) as z.ZodType<z.output<T> | null>;
}
