import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

export async function setup() {
  const cwd = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  dotenv.config({ path: resolve(cwd, ".env.test") });

  console.log("Pushing test database schema...");
  execSync("npx prisma db push --force-reset --skip-generate", {
    env: process.env,
    cwd,
    stdio: "inherit",
  });

  console.log("Seeding test database...");
  execSync("npx tsx prisma/seed.ts", {
    env: process.env,
    cwd,
    stdio: "inherit",
  });

  console.log("Test database ready.");
}

export async function teardown() {
  // Test DB persists for debugging; cleaned on next run via --force-reset
}
