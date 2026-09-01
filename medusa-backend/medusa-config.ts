import { defineConfig, loadEnv } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const localStoreOrigins = 'http://localhost:3000,http://127.0.0.1:3000'
const localAdminOrigins = `${localStoreOrigins},http://localhost:9000,http://127.0.0.1:9000`
const withLocalOrigins = (configured: string | undefined, local: string) =>
  Array.from(new Set(`${configured || ''},${local}`.split(',').map((origin) => origin.trim()).filter(Boolean))).join(',')

const corsOrigins = (configured: string | undefined, local: string) =>
  process.env.NODE_ENV === 'production' ? configured || '' : withLocalOrigins(configured, local)

const useS3 = Boolean(process.env.S3_BUCKET && process.env.S3_REGION && process.env.S3_FILE_URL && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Redis is optional for local development. Only enable it when a reachable
    // instance has explicitly been configured; an unavailable Redis server
    // causes authenticated Admin requests to fail while login appears to hang.
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: corsOrigins(process.env.STORE_CORS, localStoreOrigins),
      adminCors: corsOrigins(process.env.ADMIN_CORS, localAdminOrigins),
      authCors: corsOrigins(process.env.AUTH_CORS, localAdminOrigins),
      jwtSecret: process.env.JWT_SECRET || 'change-me',
      cookieSecret: process.env.COOKIE_SECRET || 'change-me',
    },
  },
  modules: [
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [useS3 ? {
          resolve: '@medusajs/medusa/file-s3', id: 's3', options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION,
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
          },
        } : {
          resolve: '@medusajs/medusa/file-local', id: 'local', options: {
            backend_url: `${process.env.MEDUSA_PUBLIC_URL ?? 'http://localhost:9000'}/static`,
          },
        }],
      },
    },
    {
      resolve: "./src/modules/pickup-verification",
    },
    {
      resolve: "./src/modules/storefront-content",
    },
    {
      resolve: "./src/modules/storefront-promo",
    },
  ],
})
