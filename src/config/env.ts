import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('3000'),
  JWT_SECRET: z.string().default('supersecret'),
  STATIC_AUTH_TOKEN: z.string().default('my-static-token-123'),
  DB_URL: z.string().url().default('mysql://user:pass@localhost:3306/db'),
  VALKEY_URI: z.string().default('redis://localhost:6379'),
  NATS_URI: z.string().default('nats://localhost:4222'),
  API_PREFIX: z.string().default('/api'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format())
  process.exit(1)
}

export const env = parsedEnv.data
