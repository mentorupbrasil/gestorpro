import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    coverage: { reporter: ["text", "json", "html"] },
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
