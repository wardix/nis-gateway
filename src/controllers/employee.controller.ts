import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { EmployeeRepository } from '../repositories/employee.repository'
import { EmployeeService } from '../services/employee.service'

export const employeeController = new OpenAPIHono()

const employeeRepository = new EmployeeRepository()
const employeeService = new EmployeeService(employeeRepository)

// Schemas
const employeeResultSchema = z
  .object({
    employee_id: z.string().openapi({ example: '0201234' }),
    name: z.string().openapi({ example: 'John Doe' }),
    email: z.string().nullable().openapi({ example: 'johndoe@example.com' }),
  })
  .openapi('EmployeeResult')

const getEmployeeByEmailRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'Get Employee by Email',
  description: 'Mendapatkan data karyawan berdasarkan alamat email.',
  security: [{ JWTAuth: [] }],
  request: {
    query: z.object({
      email: z
        .string()
        .email({ message: 'Format email tidak valid' })
        .openapi({ example: 'johndoe@example.com' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: employeeResultSchema,
        },
      },
      description: 'Data karyawan berhasil ditemukan',
    },
    400: { description: 'Bad Request - Email tidak valid' },
    401: { description: 'Unauthorized' },
    404: { description: 'Not Found - Karyawan tidak ditemukan' },
  },
})

// Implementation
employeeController.openapi(getEmployeeByEmailRoute, async (c) => {
  const { email } = c.req.valid('query')

  try {
    const result = await employeeService.getEmployeeByEmail(email)
    return c.json(result, 200)
  } catch (error: any) {
    if (error.status === 404) {
      throw error
    }
    console.error('Employee retrieval error:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})
