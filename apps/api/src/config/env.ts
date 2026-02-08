import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(8081),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  BUGS: z.string().default("off"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}
