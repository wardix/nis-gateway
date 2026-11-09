import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { BandwidthRepository } from '../repositories/bandwidth.repository'
import { BandwidthService } from '../services/bandwidth.service'

export const bandwidthController = new OpenAPIHono()

const bandwidthRepository = new BandwidthRepository()
const bandwidthService = new BandwidthService(bandwidthRepository)

const bandwidthInfoSchema = z
  .object({
    ip: z.string().openapi({ example: '10.20.30.41' }),
    download_rate: z.number().openapi({ example: 10000000 }),
    upload_rate: z.number().openapi({ example: 5000000 }),
    unit: z.string().openapi({ example: 'bps' }),
    subscription_package: z.string().openapi({ example: 'Gold-Fiber-10M' }),
  })
  .openapi('BandwidthInfo')

const ipSchema =
  typeof z.string().ip === 'function'
    ? z.string().ip()
    : z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, {
        message: 'Invalid IP address',
      })

const lookupRequestSchema = z
  .object({
    ips: z.array(ipSchema).openapi({ example: ['10.20.30.41'] }),
  })
  .openapi('LookupRequest')

const bandwidthLookupResponseSchema = z
  .object({
    results: z.array(bandwidthInfoSchema),
  })
  .openapi('BandwidthLookupResponse')

const lookupRoute = createRoute({
  method: 'post',
  path: '/search',
  summary: 'Lookup Bandwidth by IPs',
  description: 'Mencari informasi bandwidth untuk daftar IP address.',
  security: [{ JWTAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: lookupRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: bandwidthLookupResponseSchema,
        },
      },
      description: 'Data bandwidth ditemukan',
    },
    401: {
      description: 'Unauthorized - JWT tidak valid',
    },
  },
})

bandwidthController.openapi(lookupRoute, async (c) => {
  try {
    const { ips } = c.req.valid('json')
    const data = await bandwidthService.lookupBandwidth(ips)
    return c.json({ results: data })
  } catch (error) {
    console.error('Bandwidth lookup error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

const heavyUserSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: '64255' }),
    subscriber_name: z.string().openapi({ example: 'hartaty132' }),
    service_id: z.string().openapi({ example: 'HOMESTD100' }),
    status: z.string().openapi({ example: 'AC' }),
    branch: z.string().openapi({ example: '020' }),
    service_charge: z.number().openapi({ example: 350000 }),
    total_gb: z.number().openapi({ example: 3856.32 }),
    price_each_gb: z.number().openapi({ example: 90.76 }),
  })
  .openapi('HeavyUser')

const heavyUsersResponseSchema = z
  .object({
    period: z.object({
      start_date: z.string().openapi({ example: '2026-11-01' }),
      end_date: z.string().openapi({ example: '2026-11-07' }),
    }),
    results: z.array(heavyUserSchema),
  })
  .openapi('HeavyUsersResponse')

const heavyUsersRoute = createRoute({
  method: 'get',
  path: '/heavy-users',
  summary: 'Get Heavy Users / Abusive Bandwidth Consumers',
  description:
    'Mendapatkan daftar pelanggan internet dengan pemakaian kuota trafik paling masif relatif terhadap harga paket (biaya per GB terendah).',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
        .optional()
        .openapi({
          example: '2026-11-01',
          description:
            'Tanggal awal rentang trafik (YYYY-MM-DD, default: awal bulan berjalan)',
        }),
      end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
        .optional()
        .openapi({
          example: '2026-11-09',
          description:
            'Tanggal akhir rentang trafik (YYYY-MM-DD, default: tanggal saat ini)',
        }),
      max_price_per_gb: z.coerce
        .number()
        .positive()
        .optional()
        .default(200)
        .openapi({ example: 200 }),
      branches: z
        .string()
        .optional()
        .openapi({ example: '020,062,025,027,029' }),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .openapi({ example: 10 }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: heavyUsersResponseSchema,
        },
      },
      description: 'Daftar heavy users berhasil diambil',
    },
    400: {
      description: 'Bad Request - Parameter query tidak valid',
    },
    401: {
      description: 'Unauthorized - JWT tidak valid',
    },
  },
})

bandwidthController.openapi(heavyUsersRoute, async (c) => {
  try {
    const { start_date, end_date, max_price_per_gb, branches, limit } =
      c.req.valid('query')
    const data = await bandwidthService.getHeavyUsers({
      startDate: start_date,
      endDate: end_date,
      maxPricePerGb: max_price_per_gb,
      branches,
      limit,
    })
    return c.json(data)
  } catch (error) {
    console.error('Heavy users retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
