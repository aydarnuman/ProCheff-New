import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.string().default("8080"),
  ANTHROPIC_API_KEY: z.string().min(5),
  OPENAI_API_KEY: z.string().min(5).optional(),
  NEXTAUTH_SECRET: z.string().min(10).optional(),
  DB_URL_SECRET: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`ENV_INVALID: ${issues}`);
  }
  return parsed.data;
}
