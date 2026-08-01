# UP N SMOKE VAPORS Storefront

Five-route React/Vite storefront prepared for a Medusa v2 backend. The interface includes a responsive hidden menu, interactive canvas hero, catalog filters, pickup cart feedback, update timeline, logins, carousel, counters, newsletter, scroll reveals, and accessible reduced-motion fallbacks.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and add your Medusa URL and publishable key when the backend is available. Product data currently falls back to the realistic local catalog in `src/data.js`.

## Demo inventory admin

Open `/employee` and sign in with `admin` / `Smoke2026!`. The `/admin` inventory screen can update product names, prices, and stock levels. Changes persist in browser localStorage and immediately affect customer-facing availability. This is a local testing sandbox—not production authentication or Medusa-backed inventory.

## Migrated operations

Important workflows migrated from the original `UNS-Inventory/upnsmoke-app`:

- Quantity-aware customer cart and pickup checkout
- Pay-at-pickup messaging for Clover
- Inventory decrement when pickup orders are placed
- Employee operations dashboard and low-stock watch
- Pickup queue with status progression
- Customer history and completed-sales views
- CSV catalog/inventory import with common Clover/vendor column aliases
- Versioned local persistence for cart, inventory, and orders

Barcode scanning, the custom POS register, cash handling, and Clover write-sync were intentionally excluded because Clover is the in-store point of sale. The current app treats Clover as the payment surface and this storefront as the pickup/order experience. Production should move the local operations state to Medusa and use secure server-side employee authentication.

## Medusa connection

The Medusa 2.16 backend lives in `medusa-backend/` and is connected through the official JS SDK. It owns the live catalog, calculated USD pricing, and inventory quantities. The storefront shows `MEDUSA LIVE` when connected and safely falls back to cached data if the API is unavailable.

- Storefront: `http://localhost:5173`
- Medusa API: `http://localhost:9000`
- Medusa Admin: `http://localhost:9000/app`

Medusa Admin test account:

```text
Email: admin@upnsmoke.local
Password: Smoke2026!
```

Run locally:

```bash
npm run medusa:migrate
npm run medusa:seed
npm run medusa:dev
npm run dev
```

The seed creates the USD store, New Hampshire region, Manchester stock location, pickup sales channel, publishable key, UNS products, prices, and stock levels. Product/pricing/inventory reads are now live in Medusa. The custom pickup checkout and employee status queue still persist locally until the final pay-at-counter pickup fulfillment workflow is mapped into Medusa orders.
