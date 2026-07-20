import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { SubscriberRepository } from '../repositories/subscriber.repository'
import { SubscriberService } from '../services/subscriber.service'

export const subscriberController = new OpenAPIHono()

const subscriberRepository = new SubscriberRepository()
const subscriberService = new SubscriberService(subscriberRepository)

// Schemas
const subscriberLookupResultSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: 'S001' }),
    subscriber_name: z.string().openapi({ example: 'John Doe' }),
  })
  .openapi('SubscriberLookupResult')

const subscriberLookupResponseSchema = z
  .object({
    results: z.array(subscriberLookupResultSchema),
  })
  .openapi('SubscriberLookupResponse')

const syncGraphsRequestSchema = z
  .object({
    data: z.array(
      z.object({
        subscriber_id: z.string().openapi({ example: 'S001' }),
        graph_id: z.string().openapi({ example: 'G100' }),
      }),
    ),
    updated_by: z.string().default('system').openapi({ example: 'admin_nis' }),
  })
  .openapi('SyncGraphsRequest')

const fttxCircuitResultSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: 'S001' }),
    subscriber_name: z.string().openapi({ example: 'John Doe' }),
    circuit_id: z.string().openapi({ example: 'V-CID-123' }),
  })
  .openapi('FttxCircuitResult')

const fttxPaginatedResponseSchema = z
  .object({
    results: z.array(fttxCircuitResultSchema),
    total: z.number().openapi({ example: 100 }),
  })
  .openapi('FttxPaginatedResponse')

const fttxHomepassResultSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: 'S001' }),
    subscriber_name: z.string().openapi({ example: 'John Doe' }),
    circuit_id: z.string().nullable().openapi({ example: 'V-CID-123' }),
    homepass_id: z.string().nullable().openapi({ example: 'HP-456' }),
    subscription_status: z.string().openapi({ example: 'AC' }),
  })
  .openapi('FttxHomepassResult')

const fttxHomepassPaginatedResponseSchema = z
  .object({
    results: z.array(fttxHomepassResultSchema),
    total: z.number().openapi({ example: 100 }),
  })
  .openapi('FttxHomepassPaginatedResponse')

const fttxTargetResultSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: '74100' }),
    subscriber_name: z.string().openapi({ example: 'PT Example' }),
    ip_address: z.string().nullable().openapi({ example: '10.169.7.192' }),
    circuit_id: z.string().nullable().openapi({ example: 'V-CID-123' }),
  })
  .openapi('FttxTargetResult')

const fttxTargetResponseSchema = z
  .object({
    results: z.array(fttxTargetResultSchema),
  })
  .openapi('FttxTargetResponse')

const subscriberNetworksRequestSchema = z
  .object({
    subscriber_ids: z
      .array(z.string())
      .openapi({ example: ['74100', '65862'] }),
  })
  .openapi('SubscriberNetworksRequest')

const subscriberNetworkResultSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: '74100' }),
    network: z.string().openapi({ example: '10.169.7.192/29' }),
  })
  .openapi('SubscriberNetworkResult')

const subscriberNetworksResponseSchema = z
  .object({
    results: z.array(subscriberNetworkResultSchema),
  })
  .openapi('SubscriberNetworksResponse')

const ipSchema =
  typeof z.string().ip === 'function'
    ? z.string().ip()
    : z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, {
        message: 'Invalid IP address',
      })

const ipLookupRequestSchema = z
  .object({
    ips: z.array(ipSchema).openapi({ example: ['10.20.30.41'] }),
  })
  .openapi('SubscriberIpLookupRequest')

const subscriberIpLookupResultSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: 'S001' }),
    subscriber_name: z.string().openapi({ example: 'John Doe' }),
    ip: z.string().openapi({ example: '10.20.30.41' }),
  })
  .openapi('SubscriberIpLookupResult')

const subscriberIpLookupResponseSchema = z
  .object({
    results: z.array(subscriberIpLookupResultSchema),
  })
  .openapi('SubscriberIpLookupResponse')

// Routes
const phoneLookupRoute = createRoute({
  method: 'get',
  path: '/search',
  summary: 'Lookup Subscriber by Phone',
  description: 'Mencari subscriber berdasarkan nomor telepon.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      phone: z
        .string()
        .regex(/^\+?[0-9]+$/, { message: 'Invalid phone number format' })

        .openapi({ example: '62812345678' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: subscriberLookupResponseSchema,
        },
      },
      description: 'Subscriber ditemukan',
    },
    400: {
      description: 'Bad Request - Parameter format salah',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

const syncGraphsRoute = createRoute({
  method: 'post',
  path: '/sync-graphs',
  summary: 'Sync Subscriber Graph Data',
  description: 'Sinkronisasi batch data grafik Zabbix ke database legacy.',
  security: [{ JWTAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: syncGraphsRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            count: z.number().nullable().openapi({ example: 5 }),
          }),
        },
      },
      description: 'Sinkronisasi berhasil',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

const fttxCircuitsRoute = createRoute({
  method: 'get',
  path: '/fttx-circuits',
  summary: 'Get FTTX Circuits Data',
  description: 'Mengambil data sirkuit FTTX dengan paginasi.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().optional().default(1).openapi({ example: 1 }),
      page_size: z.coerce
        .number()
        .optional()
        .default(10)
        .openapi({ example: 10 }),
      operator_id: z
        .string()
        .min(1, { message: 'Operator ID is required' })
        .openapi({ example: 'V001' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: fttxPaginatedResponseSchema,
        },
      },
      description: 'Data sirkuit berhasil diambil',
    },
    400: {
      description: 'Bad Request - Parameter format salah',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

const fttxHomepassesRoute = createRoute({
  method: 'get',
  path: '/fttx-homepasses',
  summary: 'Get FTTX Homepasses Data',
  description:
    'Mengambil data homepass FTTX (subscriber, circuit ID, homepass ID) berdasarkan operator, dengan paginasi.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().optional().default(1).openapi({ example: 1 }),
      page_size: z.coerce
        .number()
        .optional()
        .default(10)
        .openapi({ example: 10 }),
      operator_id: z
        .string()
        .min(1, { message: 'Operator ID is required' })
        .openapi({ example: '22' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: fttxHomepassPaginatedResponseSchema,
        },
      },
      description: 'Data homepass berhasil diambil',
    },
    400: {
      description: 'Bad Request - Parameter format salah',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

const fttxTargetsRoute = createRoute({
  method: 'get',
  path: '/fttx-targets',
  summary: 'Get FTTX Targets Data',
  description:
    'Mengambil data target FTTx (subscriber, IP address, circuit_id) berdasarkan operator.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      operator_id: z
        .string()
        .min(1, { message: 'Operator ID is required' })
        .openapi({ example: '22' }),
      branch: z.string().optional().openapi({ example: '020,027,028,029' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: fttxTargetResponseSchema,
        },
      },
      description: 'Data FTTx targets berhasil diambil',
    },
    400: {
      description: 'Bad Request - Parameter format salah',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

const subscriberNetworksRoute = createRoute({
  method: 'post',
  path: '/networks/search',
  summary: 'Lookup Subscriber Networks',
  description:
    'Mencari data network (IP/subnet) untuk daftar subscriber ID secara batch.',
  security: [{ JWTAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: subscriberNetworksRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: subscriberNetworksResponseSchema,
        },
      },
      description: 'Data network subscriber berhasil ditemukan',
    },
    400: {
      description: 'Bad Request - Parameter format salah',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

const ipLookupRoute = createRoute({
  method: 'post',
  path: '/ip-search',
  summary: 'Lookup Subscriber by IPs',
  description: 'Mencari subscriber berdasarkan daftar IP address.',
  security: [{ JWTAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ipLookupRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: subscriberIpLookupResponseSchema,
        },
      },
      description: 'Data subscriber ditemukan',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

// Implementation
subscriberController.openapi(phoneLookupRoute, async (c) => {
  const { phone } = c.req.valid('query')
  try {
    const data = await subscriberService.searchByPhone(phone)
    return c.json({ results: data })
  } catch (error) {
    console.error('Subscriber phone lookup error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subscriberController.openapi(syncGraphsRoute, async (c) => {
  try {
    const { data, updated_by } = c.req.valid('json')
    const count = await subscriberService.syncGraphs(data, updated_by)
    return c.json({ success: true, count })
  } catch (error) {
    console.error('Subscriber graph sync error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subscriberController.openapi(fttxCircuitsRoute, async (c) => {
  const { page, page_size, operator_id } = c.req.valid('query')
  try {
    const data = await subscriberService.getFttxCircuits(
      page,
      page_size,
      operator_id,
    )
    return c.json(data)
  } catch (error) {
    console.error('FTTX circuits retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subscriberController.openapi(fttxHomepassesRoute, async (c) => {
  const { page, page_size, operator_id } = c.req.valid('query')
  try {
    const data = await subscriberService.getFttxHomepasses(
      page,
      page_size,
      operator_id,
    )
    return c.json(data)
  } catch (error) {
    console.error('FTTX homepasses retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subscriberController.openapi(subscriberNetworksRoute, async (c) => {
  try {
    const { subscriber_ids } = c.req.valid('json')
    const data = await subscriberService.getSubscriberNetworks(subscriber_ids)
    return c.json({ results: data })
  } catch (error) {
    console.error('Subscriber networks retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subscriberController.openapi(fttxTargetsRoute, async (c) => {
  const { operator_id, branch } = c.req.valid('query')
  const defaultBranches = ['020', '027', '028', '029']
  const branches = branch
    ? branch.split(',').map((b) => b.trim())
    : defaultBranches

  try {
    const data = await subscriberService.getFttxTargets(operator_id, branches)
    return c.json({ results: data })
  } catch (error) {
    console.error('FTTX targets retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

subscriberController.openapi(ipLookupRoute, async (c) => {
  try {
    const { ips } = c.req.valid('json')
    const data = await subscriberService.searchByIps(ips)
    return c.json({ results: data })
  } catch (error) {
    console.error('Subscriber IP lookup error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
