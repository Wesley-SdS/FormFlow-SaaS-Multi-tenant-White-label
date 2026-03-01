import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL é obrigatória'),
  REDIS_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const messages = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${messages}`);
  }

  return parsed.data;
}

let cached: Env | null = null;

/** Variáveis de ambiente validadas (lazy: valida na primeira leitura em runtime). */
export function getEnv(): Env {
  if (!cached) cached = validateEnv();
  return cached;
}
