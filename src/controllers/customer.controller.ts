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

const lookupRoute = createRoute({
  method: 'get',
  path: '/lookup-id',
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
