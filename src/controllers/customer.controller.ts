import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { CustomerRepository } from '../repositories/customer.repository'
import { CustomerService } from '../services/customer.service'

export const customerController = new OpenAPIHono()

const customerRepository = new CustomerRepository()
const customerService = new CustomerService(customerRepository)

const customerLookupResponseSchema = z
  .object({
    customer_ids: z
      .array(z.string())
      .openapi({ example: ['CUST-001', 'CUST-002'] }),
  })
  .openapi('CustomerLookupResponse')

const callerIdSubscriberSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: '14414' }),
    service: z
      .string()
      .nullable()
      .openapi({ example: 'Dedicated Wireless Business Priority 4 Mbps' }),
    account: z.string().openapi({ example: 'wardix1' }),
    address: z
      .string()
      .openapi({ example: 'Jl. Sei Batanghari gg. Singer no. 96e' }),
  })
  .openapi('CallerIdSubscriber')

const callerIdCustomerSchema = z
  .object({
    customer_id: z.string().openapi({ example: '0200040634' }),
    company: z.string().openapi({ example: 'PT MEDIA ANTAR NUSA' }),
    branch: z.string().openapi({ example: '020' }),
    subscribers: z.array(callerIdSubscriberSchema),
  })
  .openapi('CallerIdCustomer')

const callerIdResponseSchema = z
  .object({
    contact: z.object({
      name: z.string().openapi({ example: 'Wardi' }),
      salutation: z.string().nullable().openapi({ example: 'Mas' }),
      phone: z.string().openapi({ example: '628196066607' }),
    }),
    customers: z.array(callerIdCustomerSchema),
  })
  .openapi('CallerIdResponse')

const lookupRoute = createRoute({
  method: 'get',
  path: '/search',
  summary: 'Lookup Customer IDs by Email',
  description: 'Mencari daftar Customer ID berdasarkan alamat email.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      email: z.string().email().openapi({ example: 'user@example.com' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: customerLookupResponseSchema,
        },
      },
      description: 'Customer ID ditemukan',
    },
    400: {
      description: 'Email parameter is required or invalid',
    },
    404: {
      description: 'Customer not found',
    },
    401: {
      description: 'Unauthorized - JWT tidak valid',
    },
  },
})

customerController.openapi(lookupRoute, async (c) => {
  const { email } = c.req.valid('query')

  try {
    const customerIds = await customerService.getCustomerIdsByEmail(email)

    if (customerIds.length === 0) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    return c.json({ customer_ids: customerIds })
  } catch (error) {
    console.error('Customer lookup error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

const callerIdRoute = createRoute({
  method: 'get',
  path: '/caller-id',
  summary: 'Caller ID Lookup by Phone',
  description:
    'Mendapatkan identitas kontak pemanggil, profil perusahaan pelanggan, dan daftar langganan aktif berdasarkan nomor telepon.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      phone: z
        .string()
        .min(1, 'Phone parameter is required')
        .openapi({ example: '628196066607' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: callerIdResponseSchema,
        },
      },
      description: 'Data Caller ID ditemukan',
    },
    400: {
      description: 'Bad Request - Parameter nomor telepon tidak valid',
    },
    401: {
      description: 'Unauthorized - JWT tidak valid',
    },
    404: {
      description: 'Caller ID tidak ditemukan',
    },
  },
})

customerController.openapi(callerIdRoute, async (c) => {
  const { phone } = c.req.valid('query')

  try {
    const data = await customerService.getCallerId(phone)

    if (!data) {
      return c.json({ error: 'Caller ID not found' }, 404)
    }

    return c.json(data)
  } catch (error) {
    console.error('Caller ID lookup error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
