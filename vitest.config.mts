import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    // medusa-backend has its own Jest suite (unit + integration); Vitest
    // must not also try to run those spec files under a different runner.
    exclude: ["**/node_modules/**", "medusa-backend/**"],
  },
});
