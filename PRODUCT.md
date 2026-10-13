# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are customers aged 21 or older in and around Manchester, New Hampshire who want to confirm local availability and reserve products before visiting the store.

Secondary users are UP N SMOKE employees, managers, and administrators who manage products and inventory, prepare pickup orders, verify customers, complete fulfillment, review sales, and maintain customer records.

## Product Purpose

UP N SMOKE is a unified local-commerce and store-operations platform. It lets customers browse live inventory, reserve an order for fast in-store pickup, receive a secure pickup pass, and pay at the counter. It gives store staff the operational tools required to move that same order from reservation through age verification and fulfillment.

Success means customers can confidently reserve available products and complete pickup with minimal waiting, while staff work from accurate inventory and a clear pickup queue.

## Positioning

The product connects live Medusa inventory, online reservation, secure pickup passes, server-authoritative age verification, employee fulfillment, and Clover counter payment in one continuous workflow. It is intentionally a local pickup system rather than a shipping storefront or online point-of-sale system.

## Operating Context

- Customers browse, reserve, and manage pickup orders from a responsive web storefront.
- Orders are collected at 655 S Willow St Unit 115A, Manchester, New Hampshire.
- The normal pickup promise is 15–20 minutes.
- Customers present a secure pickup pass and valid identification at the counter.
- Staff physically inspect identification and manually enter date of birth when verification is required.
- Clover remains the counter payment system; payment is not captured online.
- Managers can import inventory through the provided XLSX workflow.

## Capabilities and Constraints

- Medusa 2 owns products, pricing, inventory, customers, carts, orders, and pickup metadata.
- The customer experience includes catalog browsing, product detail, cart, pickup checkout, saved addresses, order history, and secure pickup passes.
- The employee experience includes role-based authentication, inventory management, pickup queues, barcode and QR scanning, age verification, fulfillment, customer lookup, sales reporting, and inventory import.
- Employee access is restricted to administrator, manager, and employee roles configured through allowlists.
- Pickup verification stores privacy-minimal audit records and does not retain raw identification data or entered dates of birth.
- The application does not ship products and does not process online payments.
- Product language, navigation, catalog data, imports, generated content, and customer communication must exclude prohibited cannabinoid terminology.
- Transactional and automated email delivery is not yet configured; provider, event coverage, and retention requirements remain to be decided.

## Brand Commitments

- The product name is UP N SMOKE, with UP N SMOKE VAPORS retained where the supplied logo or legal footer uses it.
- The supplied UP N SMOKE logo is the primary brand asset.
- Black and yellow are binding brand colors.
- The voice is direct, local, energetic, and pickup-focused.
- Fast pickup, live local availability, and clear age requirements must remain prominent and truthful.
- The Skiper UI-inspired navigation interaction is protected design DNA for the storefront.

## Evidence on Hand

- Product and operational scope: `README.md`
- Primary brand asset: `src/assets/up-n-smoke-logo.png`
- Customer storefront routes and copy: `app/(store)`
- Employee operations routes and workflows: `app/employee`
- Secure pickup pass and verification implementation: `components/pickup`, `components/employee/pickup-verification.tsx`, and `medusa-backend/src/modules/pickup-verification`
- Canonical commerce integration: `lib/medusa` and `medusa-backend`
- Inventory workbook: `public/UP-N-SMOKE-Medusa-Inventory-Template.xlsx`
- The repository contains no approved testimonials, press claims, or independent performance benchmarks; future work must not fabricate them.

## Product Principles

1. Show customers truthful local availability before they commit to a visit.
2. Reduce pickup friction without weakening age verification or staff control.
3. Keep customer and employee workflows connected to the same commerce record.
4. Minimize sensitive data collection and retain only what operations require.
5. Preserve the local UP N SMOKE identity across customer and staff experiences.
