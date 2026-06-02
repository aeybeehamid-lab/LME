import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node"
  },
  // Allow Vitest/Vite to resolve deps hoisted to the workspace root.
  server: {
    fs: {
      allow: [path.resolve(__dirname, "../..")]
    }
  }
});

