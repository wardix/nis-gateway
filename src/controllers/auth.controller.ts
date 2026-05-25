import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { bearerAuth } from 'hono/bearer-auth'
import { sign } from 'hono/jwt'
import { env } from '../config/env'

export const authController = new OpenAPIHono()

const tokenRequestSchema = z
  .object({
    exp: z.number().optional().openapi({
      example: 1735689600,
      description: 'Expiration Unix timestamp',
    }),
    role: z.string().default('operator').openapi({ example: 'admin' }),
    user: z.string().default('nis').openapi({ example: 'user123' }),
  })
  .openapi('TokenRequest')

const tokenResponseSchema = z
  .object({
    token: z.string().openapi({ example: 'eyJhbGci...' }),
  })
  .openapi('TokenResponse')

const tokenRoute = createRoute({
  method: 'post',
  path: '/token',
  summary: 'Generate JWT Token',
  description: 'Mendapatkan JWT token untuk akses ke endpoint bisnis.',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: tokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: tokenResponseSchema,
        },
      },
      description: 'JWT Token berhasil digenerate',
    },
    401: {
      description: 'Unauthorized - Static token salah atau tidak ada',
    },
  },
})

// We still need the runtime middleware for static auth
authController.use('/token', bearerAuth({ token: env.STATIC_AUTH_TOKEN }))

authController.openapi(tokenRoute, async (c) => {
  const body = c.req.valid('json')

  const payload: { role: string; user: string; exp?: number } = {
    role: body.role,
    user: body.user,
  }

  if (body.exp) {
    payload.exp = body.exp
  }

  const token = await sign(payload, env.JWT_SECRET)

  return c.json({ token })
})
