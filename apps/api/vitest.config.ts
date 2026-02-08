import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    globals: true,
    globalSetup: "./tests/global-setup.ts",
    fileParallelism: false,
  },
});
