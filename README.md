# Up N Smoke unified platform

One yellow-and-black Next.js application for the customer pickup storefront and the employee operations portal, backed by one Medusa 2 server.

## Included

- Customer catalog, product detail, cart, pay-at-counter pickup checkout, account addresses, and order history
- Employee dashboard, inventory CRUD and stock adjustment, pickup queue, barcode scanning, sales reporting, customer lookup, and XLSX inventory import
- Signed HttpOnly customer and employee sessions with admin/manager/employee permissions
- Medusa-owned products, pricing, inventory, customers, carts, orders, and pickup metadata
- Secure pickup QR passes, employee camera scanning, server-authoritative 21+ ID checks, fulfillment completion, and privacy-minimal audit records
- Clover remains the counter payment system; this application intentionally does not include a POS register

## Local setup

Requirements: Node.js 20.9+, npm, PostgreSQL, and Redis for Medusa.

```bash
copy .env.example .env.local
npm install
npm run medusa:migrate
npm run medusa:seed
npm run medusa:dev
```

In another terminal:

```bash
npm run dev
```

- Storefront: `http://localhost:3000`
- Employee portal: `http://localhost:3000/employee`
- Health check: `http://localhost:3000/api/health`
- Medusa Admin: `http://localhost:9000/app`

The seed account defaults to `admin@upnsmoke.local`. Create or reset its password with:

```bash
npm run medusa:user -- -e admin@upnsmoke.local -p "your-secure-password"
```

Do not keep seed credentials in a deployed environment.

## Environment contract

Copy `.env.example` to `.env.local` for the Next.js app. The browser receives only `NEXT_PUBLIC_*` values. `AUTH_SECRET` must be at least 32 characters in production. Employee login requires both valid Medusa Admin credentials and membership in `EMPLOYEE_ADMIN_EMAILS`, `EMPLOYEE_MANAGER_EMAILS`, or `EMPLOYEE_STAFF_EMAILS`. Removing an email from those allowlists or disabling the Medusa user revokes portal access. In production there is no default allowed employee.

The Medusa server keeps its own variables in `medusa-backend/.env`. Configure its database URL, Redis URL, CORS origins, JWT/cookie secrets, and inventory import/Clover values there. Add every production storefront origin to Medusa's `STORE_CORS` and `AUTH_CORS`.

Pickup verification uses `STORE_TIMEZONE` for both the staff cutoff display and backend age decisions. It defaults to `America/New_York`; configure the same IANA timezone in both applications if the store changes location. `REQUIRE_ID_FOR_ALL_PICKUPS` defaults to `true`. When disabled, products can opt in with `metadata.age_restricted=true` or `metadata.minimum_age=21`. QR tokens expire after `PICKUP_QR_TTL_DAYS` (30 by default), rotate when a customer reopens a pass, and are invalidated at completion. The database stores only token hashes and verification results—never the entered DOB or raw ID data.

The employee flow intentionally uses manual DOB entry plus physical visual ID inspection. Government ID barcode parsing is not enabled because the installed scanner does not provide a sufficiently reliable, jurisdiction-aware parsing layer; this avoids implying unsupported ID-format coverage or retaining raw barcode data.

## Inventory import

Managers and admins can upload XLSX workbooks from `/employee/settings`. The request is authenticated by the employee session and forwarded server-to-server to the existing Medusa inventory importer. Use the template in `public/UNS_Product_Import_Template.xlsx`; validate a backup before a large production import.

## Production

Verify both applications before release:

```bash
npm run typecheck
npm run lint
npm run build
npm run medusa:build
```

The storefront can run on Vercel or any Node host with `npm start`; `next.config.ts` also produces a standalone server. Deploy `medusa-backend` separately on a persistent Node host with PostgreSQL and Redis. Run database migrations before starting the new backend release. Point both public and server-only Medusa URLs at that deployment, use HTTPS, rotate all secrets, and restrict employee emails by role.

## Source layout

- `app/(store)` — customer routes
- `app/employee` — protected operations portal
- `app/api` — authentication and same-origin operational endpoints
- `components/storefront` and `components/employee` — client interaction layers
- `lib/medusa` — store/admin data boundaries
- `medusa-backend` — canonical Medusa service and inventory import route
- `src` — retained legacy Vite source for migration reference; it is not part of the Next.js build
