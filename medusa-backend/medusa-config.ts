import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const localStoreOrigins = 'http://localhost:3000,http://127.0.0.1:3000'
const localAdminOrigins = `${localStoreOrigins},http://localhost:9000,http://127.0.0.1:9000`
const withLocalOrigins = (configured: string | undefined, local: string) =>
  Array.from(new Set(`${configured || ''},${local}`.split(',').map((origin) => origin.trim()).filter(Boolean))).join(',')

const corsOrigins = (configured: string | undefined, local: string) =>
  process.env.NODE_ENV === 'production' ? configured || '' : withLocalOrigins(configured, local)

// Signing secrets fall back to a placeholder for local development only.
// In production a missing/empty/placeholder/short value must fail the boot
// loudly, not silently sign every admin/customer auth token with a
// publicly-known literal string.
const KNOWN_PLACEHOLDER_SECRETS = new Set(['change-me', 'replace-with-a-long-random-secret'])
function requireProductionSecret(name: string, value: string | undefined) {
  if (process.env.NODE_ENV !== 'production') return value || 'change-me'
  if (!value || KNOWN_PLACEHOLDER_SECRETS.has(value) || value.length < 32) {
    // eslint-disable-next-line @medusajs/use-medusa-error-not-generic-error -- this runs at config-load time, before the server (and any HTTP status mapping) exists; a MedusaError has no meaning here.
    throw new Error(`${name} must be set to a random secret of at least 32 characters in production.`)
  }
  return value
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // The production database is the non-TLS Postgres service on Compose's
    // private network. Medusa 2.16 otherwise classifies the `postgres` host as
    // remote, forces SSL for module migrations, and can hang indefinitely at
    // "Running migrations..." instead of surfacing the SSL mismatch.
    databaseDriverOptions: {
      connection: {
        ssl: false,
      },
    },
    // Redis is optional for local development. Only enable it when a reachable
    // instance has explicitly been configured; an unavailable Redis server
    // causes authenticated Admin requests to fail while login appears to hang.
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: corsOrigins(process.env.STORE_CORS, localStoreOrigins),
      adminCors: corsOrigins(process.env.ADMIN_CORS, localAdminOrigins),
      authCors: corsOrigins(process.env.AUTH_CORS, localAdminOrigins),
      jwtSecret: requireProductionSecret('JWT_SECRET', process.env.JWT_SECRET),
      cookieSecret: requireProductionSecret('COOKIE_SECRET', process.env.COOKIE_SECRET),
    },
  },
  modules: [
    {
      resolve: "./src/modules/pickup-verification",
    },
    {
      resolve: "./src/modules/storefront-promo",
    },
  ],
})
