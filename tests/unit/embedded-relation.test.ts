import { describe, expect, it } from "vitest";
import { z } from "zod";
import { embeddedOneSchema } from "@/lib/supabase/relations";

const relationSchema = embeddedOneSchema(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
);

describe("embeddedOneSchema", () => {
  const relation = {
    id: "a0000000-0000-4000-8000-000000000001",
    name: "Empresa fictícia",
  };

  it("accepts an object embed", () => {
    expect(relationSchema.parse(relation)).toEqual(relation);
  });

  it("normalizes an array embed to its first relation", () => {
    expect(relationSchema.parse([relation])).toEqual(relation);
  });

  it("accepts a null relation", () => {
    expect(relationSchema.parse(null)).toBeNull();
  });
});
