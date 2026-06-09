import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { TicketRepository } from '../repositories/ticket.repository'
import { TicketService } from '../services/ticket.service'

export const ticketController = new OpenAPIHono()

const ticketRepository = new TicketRepository()
const ticketService = new TicketService(ticketRepository)

// Schemas
const iforteTicketResultSchema = z
  .object({
    ticket_id: z.string().openapi({ example: '12345' }),
    insert_time: z.string().openapi({ example: '2026-06-01 10:00:00' }),
    ticket_status: z.string().nullable().openapi({ example: 'Open' }),
    customer_id: z.string().nullable().openapi({ example: 'C001' }),
    subscriber_id: z.string().nullable().openapi({ example: 'S001' }),
    subscription_status: z.string().nullable().openapi({ example: 'AC' }),
    subscriber_name: z.string().nullable().openapi({ example: 'John Doe' }),
    ticket_subject: z
      .string()
      .nullable()
      .openapi({ example: 'Link down di area X' }),
  })
  .openapi('IforteTicketResult')

const iforteTicketsResponseSchema = z
  .object({
    results: z.array(iforteTicketResultSchema),
  })
  .openapi('IforteTicketsResponse')

// Routes
const iforteTicketsRoute = createRoute({
  method: 'get',
  path: '/iforte',
  summary: 'Get Active Iforte Tickets',
  description:
    'Mengambil daftar tiket gangguan aktif dari vendor fiber Iforte.',
  security: [{ JWTAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: iforteTicketsResponseSchema,
        },
      },
      description: 'Daftar tiket aktif Iforte berhasil diambil',
    },
    401: {
      description: 'Unauthorized',
    },
  },
})

// Implementation
ticketController.openapi(iforteTicketsRoute, async (c) => {
  try {
    const data = await ticketService.getActiveIforteTickets()
    return c.json({ results: data })
  } catch (error) {
    console.error('Iforte tickets retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
