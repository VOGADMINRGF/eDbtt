import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      setupFiles: ["./tests/support/create-save-route-security.setup.ts"],
    },
  }),
);
