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
      'II,FOP2P,SLPNM,BLINK,SLHOME,VPNCL,VPNSERVER,SL40,SLL500G,SFL500G,SLMB,SLPNMB,BC,SFL1TB,SFL2TB,SLPTPN500,SLPTPN40,SLPTPN1TB,PTP1CORE,SL2TB',
    ),
  EXCLUDED_SUBSCRIBER_IDS: z.string().default(''),
  DEFAULT_SUBNET: z
    .string()
    .regex(
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/(?:[12]?[0-9]|3[0-2])$/,
      'Format DEFAULT_SUBNET harus berupa notasi CIDR yang valid',
    )
    .default('10.233.0.0/22'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format())
  process.exit(1)
}

export const env = parsedEnv.data
