import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const localStoreOrigins = 'http://localhost:3000,http://127.0.0.1:3000'
const localAdminOrigins = `${localStoreOrigins},http://localhost:9000,http://127.0.0.1:9000`
const withLocalOrigins = (configured: string | undefined, local: string) =>
  Array.from(new Set(`${configured || ''},${local}`.split(',').map((origin) => origin.trim()).filter(Boolean))).join(',')

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Redis is optional for local development. Only enable it when a reachable
    // instance has explicitly been configured; an unavailable Redis server
    // causes authenticated Admin requests to fail while login appears to hang.
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: withLocalOrigins(process.env.STORE_CORS, localStoreOrigins),
      adminCors: withLocalOrigins(process.env.ADMIN_CORS, localAdminOrigins),
      authCors: withLocalOrigins(process.env.AUTH_CORS, localAdminOrigins),
      jwtSecret: process.env.JWT_SECRET || 'change-me',
      cookieSecret: process.env.COOKIE_SECRET || 'change-me',
    },
  },
})
