import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { jwt } from 'hono/jwt'
import { logger } from 'hono/logger'
import { env } from './config/env'
import { authController } from './controllers/auth.controller'
import { bandwidthController } from './controllers/bandwidth.controller'
import { customerController } from './controllers/customer.controller'
import { subscriberController } from './controllers/subscriber.controller'

const app = new OpenAPIHono()

// Middleware
app.use('*', logger())

// Security Components
app.openAPIRegistry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  description: 'Static Bearer Token for Auth endpoint',
})

app.openAPIRegistry.registerComponent('securitySchemes', 'JWTAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Token for business endpoints',
})

// JWT Middleware for business routes
app.use('/bandwidth/*', jwt({ secret: env.JWT_SECRET, alg: 'HS256' }))
app.use('/customer/*', jwt({ secret: env.JWT_SECRET, alg: 'HS256' }))
app.use('/subscriber/*', jwt({ secret: env.JWT_SECRET, alg: 'HS256' }))

// Error handling
app.onError((err, c) => {
  console.error(`[Error] ${err.message}`)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Routes
app.route('/auth', authController)
app.route('/bandwidth', bandwidthController)
app.route('/customer', customerController)
app.route('/subscriber', subscriberController)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// OpenAPI & Swagger UI
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'NIS Gateway API',
    description: 'API modern sebagai jembatan sistem legacy PHP.',
  },
})

app.get('/ui', swaggerUI({ url: '/doc' }))

console.log(`🚀 NIS Gateway is running on port ${env.PORT}`)
console.log(`📖 Documentation available at http://localhost:${env.PORT}/ui`)

export default {
  port: parseInt(env.PORT, 10),
  fetch: app.fetch,
}
