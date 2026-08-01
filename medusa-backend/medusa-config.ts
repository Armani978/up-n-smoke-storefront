import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Redis is optional for local development. Only enable it when a reachable
    // instance has explicitly been configured; an unavailable Redis server
    // causes authenticated Admin requests to fail while login appears to hang.
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: process.env.STORE_CORS || 'http://localhost:5173,http://127.0.0.1:5173',
      adminCors: process.env.ADMIN_CORS || 'http://localhost:9000,http://127.0.0.1:9000,http://localhost:5173,http://127.0.0.1:5173',
      authCors: process.env.AUTH_CORS || 'http://localhost:9000,http://127.0.0.1:9000,http://localhost:5173,http://127.0.0.1:5173',
      jwtSecret: process.env.JWT_SECRET || 'change-me',
      cookieSecret: process.env.COOKIE_SECRET || 'change-me',
    },
  },
})
