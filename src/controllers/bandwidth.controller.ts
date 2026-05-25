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
