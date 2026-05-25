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

const lookupRequestSchema = z
  .object({
    ips: z.array(z.string().ip()).openapi({ example: ['10.20.30.41'] }),
  })
  .openapi('LookupRequest')

const lookupRoute = createRoute({
  method: 'post',
  path: '/lookup',
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
          schema: z.array(bandwidthInfoSchema),
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
    return c.json(data)
  } catch (error) {
    console.error('Bandwidth lookup error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
