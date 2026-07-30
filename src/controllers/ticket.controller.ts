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

const monitoringTargetResultSchema = z
  .object({
    ticket_id: z.string().openapi({ example: '12345' }),
    subscriber_id: z.string().openapi({ example: 'S001' }),
    subscriber_name: z.string().openapi({ example: 'John Doe' }),
    ip_address: z.string().nullable().openapi({ example: '192.168.1.1' }),
  })
  .openapi('MonitoringTargetResult')

const monitoringTargetsResponseSchema = z
  .object({
    results: z.array(monitoringTargetResultSchema),
  })
  .openapi('MonitoringTargetsResponse')

const unassignedTicketResultSchema = z
  .object({
    ticket_id: z.string().openapi({ example: '12345' }),
    subscriber_id: z.string().openapi({ example: 'S001' }),
    subscriber_name: z.string().openapi({ example: 'John Doe' }),
    type_id: z.number().openapi({ example: 1 }),
    issue: z.string().nullable().openapi({ example: 'LOS' }),
    region_id: z.string().nullable().openapi({ example: '020' }),
  })
  .openapi('UnassignedTicketResult')

const unassignedTicketsResponseSchema = z
  .object({
    results: z.array(unassignedTicketResultSchema),
  })
  .openapi('UnassignedTicketsResponse')

const vendorTicketResultSchema = z
  .object({
    insert_time: z.string().openapi({ example: '2026-06-01 10:00:00' }),
    insert_timestamp: z.number().openapi({ example: 1717216800 }),
    subscriber_id: z.string().nullable().openapi({ example: 'S001' }),
    subscriber_name: z.string().nullable().openapi({ example: 'John Doe' }),
    request_number: z.string().nullable().openapi({ example: 'REQ-123' }),
    ticket_number: z.string().nullable().openapi({ example: 'T-456' }),
    category: z.string().nullable().openapi({ example: 'Network' }),
    status: z.string().nullable().openapi({ example: 'Open' }),
    ticket_id: z.string().openapi({ example: '12345' }),
    circuit_id: z.string().nullable().openapi({ example: 'V-CID-123' }),
  })
  .openapi('VendorTicketResult')

const vendorTicketsResponseSchema = z
  .object({
    results: z.array(vendorTicketResultSchema),
  })
  .openapi('VendorTicketsResponse')

const employeeCallTicketSummaryResultSchema = z
  .object({
    employee_id: z.string().openapi({ example: '0201234' }),
    name: z.string().openapi({ example: 'Budi Santoso' }),
    total_tickets: z.number().openapi({ example: 5 }),
    tickets: z
      .array(z.number())
      .openapi({ example: [101, 102, 103, 104, 105] }),
  })
  .openapi('EmployeeCallTicketSummaryResult')

const employeeCallTicketSummaryResponseSchema = z
  .object({
    results: z.array(employeeCallTicketSummaryResultSchema),
  })
  .openapi('EmployeeCallTicketSummaryResponse')

const createFromCommandRequestSchema = z
  .object({
    subscriber_id: z
      .union([z.string(), z.number()])
      .openapi({ example: 'S001' }),
    type_id: z.union([z.string(), z.number()]).openapi({ example: 2 }),
    status: z.string().openapi({ example: 'Open' }),
    subject: z.string().openapi({ example: 'Link down di area X' }),
    comment: z.string().openapi({ example: 'Detail masalah...' }),
    inbox_id: z.number().openapi({ example: 12345 }),
    agent_email: z.string().email().openapi({ example: 'agent@example.com' }),
    channel_id: z.string().openapi({ example: 'C1234567890' }),
    customer_phone_number: z
      .string()
      .openapi({ example: '62812345678' }),
  })
  .openapi('CreateFromCommandRequest')

const createFromCommandResponseSchema = z
  .object({
    ticket_id: z.number().openapi({ example: 12345 }),
  })
  .openapi('CreateFromCommandResponse')

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

const monitoringTargetsRoute = createRoute({
  method: 'get',
  path: '/monitoring',
  summary: 'Get Monitoring Targets',
  description: 'Data target IP pelanggan dengan tiket open.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      branch: z.string().optional().openapi({ example: '020,027' }),
      type_id: z.coerce.number().optional().openapi({ example: 6 }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: monitoringTargetsResponseSchema },
      },
      description: 'Monitoring targets retrieved successfully',
    },
    401: { description: 'Unauthorized' },
  },
})

const unassignedTicketsRoute = createRoute({
  method: 'get',
  path: '/unassigned',
  summary: 'Get Unassigned Tickets',
  description: 'Tiket open yang belum ditugaskan ke petugas.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      branch: z.string().optional().openapi({ example: '020' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: unassignedTicketsResponseSchema },
      },
      description: 'Unassigned tickets retrieved successfully',
    },
    401: { description: 'Unauthorized' },
  },
})

const vendorTicketsRoute = createRoute({
  method: 'get',
  path: '/vendor',
  summary: 'Get Vendor Tickets',
  description: 'Vendor/operator ticket dengan detail lengkap.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      vendor_id: z
        .string()
        .min(1, { message: 'Vendor ID is required' })
        .openapi({ example: '22' }),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: vendorTicketsResponseSchema } },
      description: 'Vendor tickets retrieved successfully',
    },
    400: { description: 'Bad Request' },
    401: { description: 'Unauthorized' },
  },
})

const employeeSummaryRoute = createRoute({
  method: 'get',
  path: '/employee-summary',
  summary: 'Get Employee Ticket Summary',
  description:
    'Mendapatkan laporan summary jumlah tiket berstatus Call per karyawan aktif.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      target_date: z.string().optional().openapi({ example: '2026-06-25' }),
      excluded_employee_ids: z
        .string()
        .optional()
        .openapi({ example: '0200911, 0202616' }),
      department_id: z.coerce.number().optional().openapi({ example: 34 }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: employeeCallTicketSummaryResponseSchema },
      },
      description: 'Employee ticket summary retrieved successfully',
    },
    401: { description: 'Unauthorized' },
  },
})

const createTicketRequestSchema = z
  .object({
    priority: z.number().openapi({ example: 1 }),
    reported_by: z.string().openapi({ example: 'Customer' }),
    reported_via: z.string().openapi({ example: 'Phone' }),
    contact_phone: z.string().openapi({ example: '62812345678' }),
    contact_name: z.string().openapi({ example: 'John Doe' }),
    status: z.string().openapi({ example: 'Open' }),
    problem: z.string().openapi({ example: 'Internet tidak bisa connect' }),
    employee_id: z.string().openapi({ example: '0201234' }),
    subscriber_id: z.string().openapi({ example: 'S001' }),
    customer_id: z.string().openapi({ example: 'C001' }),
    type: z.number().openapi({ example: 1 }),
  })
  .openapi('CreateTicketRequest')

const createTicketResponseSchema = z
  .object({
    ticket_id: z.number().openapi({ example: 12345 }),
  })
  .openapi('CreateTicketResponse')

const createTicketRoute = createRoute({
  method: 'post',
  path: '/',
  summary: 'Create Ticket',
  description: 'Membuat tiket gangguan baru beserta data kontak.',
  security: [{ JWTAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTicketRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: createTicketResponseSchema,
        },
      },
      description: 'Tiket berhasil dibuat',
    },
    400: { description: 'Bad Request - Data tidak valid' },
    401: { description: 'Unauthorized' },
  },
})

const ticketTypeResultSchema = z
  .object({
    type_id: z.number().openapi({ example: 1 }),
    type_descr: z.string().openapi({ example: 'Gangguan' }),
  })
  .openapi('TicketTypeResult')

const ticketTypesResponseSchema = z
  .object({
    results: z.array(ticketTypeResultSchema),
  })
  .openapi('TicketTypesResponse')

const ticketTypesRoute = createRoute({
  method: 'get',
  path: '/types',
  summary: 'Get Ticket Types',
  description: 'Mengambil daftar tipe tiket yang aktif.',
  security: [{ JWTAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ticketTypesResponseSchema,
        },
      },
      description: 'Daftar tipe tiket berhasil diambil',
    },
    401: { description: 'Unauthorized' },
  },
})

const escalationTicketResultSchema = z
  .object({
    subscriber_id: z.string().openapi({ example: '18292' }),
    ticket_id: z.string().openapi({ example: '0000475218' }),
    ticket_status: z.string().openapi({ example: 'Pending' }),
    problem: z.string().openapi({ example: 'Radio Backup Link Down' }),
  })
  .openapi('EscalationTicketResult')

const escalationTicketsResponseSchema = z
  .object({
    results: z.array(escalationTicketResultSchema),
  })
  .openapi('EscalationTicketsResponse')

const escalationTicketsRoute = createRoute({
  method: 'get',
  path: '/escalations',
  summary: 'Get Active Escalation Tickets',
  description:
    'Mengambil daftar tiket eskalasi yang belum diselesaikan (exclude Closed, Cancel, Call).',
  security: [{ JWTAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: escalationTicketsResponseSchema,
        },
      },
      description: 'Daftar tiket eskalasi aktif berhasil diambil',
    },
    401: { description: 'Unauthorized' },
  },
})

const createFromCommandRoute = createRoute({
  method: 'post',
  path: '/from-command',
  summary: 'Create Ticket from Slash Command',
  description:
    'Membuat tiket baru dari data slash command (Slack/Discord).',
  security: [{ JWTAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createFromCommandRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: createFromCommandResponseSchema,
        },
      },
      description: 'Tiket berhasil dibuat dari command',
    },
    400: { description: 'Bad Request - Data tidak valid' },
    401: { description: 'Unauthorized' },
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

ticketController.openapi(monitoringTargetsRoute, async (c) => {
  const { branch, type_id } = c.req.valid('query')
  const defaultBranches = ['020', '027']
  const branches = branch
    ? branch.split(',').map((b) => b.trim())
    : defaultBranches
  const finalTypeId = type_id ?? 6

  try {
    const data = await ticketService.getMonitoringTargets(branches, finalTypeId)
    return c.json({ results: data })
  } catch (error) {
    console.error('Monitoring targets retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

ticketController.openapi(unassignedTicketsRoute, async (c) => {
  const { branch } = c.req.valid('query')
  const finalBranch = branch ?? '020'

  try {
    const data = await ticketService.getUnassignedTickets(finalBranch)
    return c.json({ results: data })
  } catch (error) {
    console.error('Unassigned tickets retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

ticketController.openapi(vendorTicketsRoute, async (c) => {
  const { vendor_id } = c.req.valid('query')

  try {
    const data = await ticketService.getVendorTickets(vendor_id)
    return c.json({ results: data })
  } catch (error) {
    console.error('Vendor tickets retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

ticketController.openapi(employeeSummaryRoute, async (c) => {
  const { target_date, excluded_employee_ids, department_id } =
    c.req.valid('query')
  const excludedArr = excluded_employee_ids
    ? excluded_employee_ids.split(',').map((id) => id.trim())
    : undefined

  try {
    const data = await ticketService.getEmployeeSolvedTicketSummary(
      target_date,
      excludedArr,
      department_id,
    )
    return c.json({ results: data })
  } catch (error) {
    console.error('Employee ticket summary retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

ticketController.openapi(createTicketRoute, async (c) => {
  try {
    const input = c.req.valid('json')
    const result = await ticketService.createTicket(input)
    return c.json(result, 201)
  } catch (error) {
    console.error('Create ticket error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

ticketController.openapi(ticketTypesRoute, async (c) => {
  try {
    const data = await ticketService.getTicketTypes()
    return c.json({ results: data })
  } catch (error) {
    console.error('Ticket types retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

ticketController.openapi(escalationTicketsRoute, async (c) => {
  try {
    const data = await ticketService.getActiveEscalationTickets()
    return c.json({ results: data })
  } catch (error) {
    console.error('Escalation tickets retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

ticketController.openapi(createFromCommandRoute, async (c) => {
  try {
    const input = c.req.valid('json')
    const result = await ticketService.createFromCommand(input)
    return c.json(result, 201)
  } catch (error) {
    console.error('Create from command error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
