import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('3000'),
  JWT_SECRET: z.string().default('supersecret'),
  STATIC_AUTH_TOKEN: z.string().default('my-static-token-123'),
  DB_URL: z.string().url().default('mysql://user:pass@localhost:3306/db'),
  VALKEY_URI: z.string().default('redis://localhost:6379'),
  NATS_URI: z.string().default('nats://localhost:4222'),
  API_PREFIX: z.string().default('/api'),
  EXCLUDED_NETWORK_SERVICES: z
    .string()
    .default(
      'II,FOP2P,SLPNM,BLINK,SLHOME,VPNCL,VPNSERVER,SL40,SLL500G,SFL500G,SLMB,SLPNMB,NFSF030,NFSF001,BC,SFL1TB,SFL2TB,SLPTPN500,SLPTPN40,SLPTPN1TB,PTP1CORE,SL2TB',
    ),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format())
  process.exit(1)
}

export const env = parsedEnv.data
