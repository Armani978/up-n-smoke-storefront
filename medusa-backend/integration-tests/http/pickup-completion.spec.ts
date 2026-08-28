import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  completeOrderWorkflow,
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createLocationFulfillmentSetWorkflow,
  createOrderFulfillmentWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
  updateOrderWorkflow,
} from "@medusajs/medusa/core-flows"

jest.setTimeout(180000)

const ADMIN_EMAIL = "integration.employee@upnsmoke.local"
const ADMIN_PASSWORD = "Integration01Test!"

medusaIntegrationTestRunner({
  // The runner truncates the database between tests by default; this suite
  // seeds its commerce fixture once in beforeAll and each test creates its
  // own order against it, so per-test isolation would just delete the
  // fixture out from under every test after the first.
  disableAutoTeardown: true,
  testSuite: ({ api, getContainer }) => {
    describe("Pickup completion — persisted lifecycle", () => {
      let publishableKey: string
      let regionId: string
      let shippingOptionId: string
      let stockLocationId: string
      let adminToken: string
      let widgetVariantId: string
      let widgetInventoryItemId: string
      let gadgetVariantId: string
      let gadgetInventoryItemId: string

      beforeAll(async () => {
        const container = getContainer()
        const link = container.resolve(ContainerRegistrationKeys.LINK)
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        const { result: [channel] } = await createSalesChannelsWorkflow(container).run({
          input: { salesChannelsData: [{ name: "Test Pickup Channel" }] },
        })
        const { result: [key] } = await createApiKeysWorkflow(container).run({
          input: { api_keys: [{ title: "Test Key", type: "publishable", created_by: "" }] },
        })
        await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } })
        publishableKey = key.token

        await createStoresWorkflow(container).run({
          input: {
            stores: [{
              name: "Test Store",
              supported_currencies: [{ currency_code: "usd", is_default: true }],
              default_sales_channel_id: channel.id,
            }],
          },
        })

        const { result: [region] } = await createRegionsWorkflow(container).run({
          input: { regions: [{ name: "Test Region", currency_code: "usd", countries: ["us"], payment_providers: ["pp_system_default"] }] },
        })
        regionId = region.id

        const { result: [shippingProfile] } = await createShippingProfilesWorkflow(container).run({
          input: { data: [{ name: "Test Profile", type: "default" }] },
        })
        const { result: [location] } = await createStockLocationsWorkflow(container).run({
          input: {
            locations: [{
              name: "Test Location",
              address: { address_1: "1 Test St", city: "Manchester", province: "NH", postal_code: "03103", country_code: "US" },
            }],
          },
        })
        stockLocationId = location.id
        await link.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
          [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
        })
        await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channel.id] } })
        await createLocationFulfillmentSetWorkflow(container).run({
          input: { location_id: location.id, fulfillment_set_data: { name: "Test Fulfillment Set", type: "pickup" } },
        })
        const { data: [fulfillmentSet] } = await query.graph({
          entity: "fulfillment_set", fields: ["id"], filters: { name: "Test Fulfillment Set" },
        })
        const { result: [serviceZone] } = await createServiceZonesWorkflow(container).run({
          input: { data: [{ name: "Test Zone", fulfillment_set_id: fulfillmentSet.id, geo_zones: [{ type: "country", country_code: "us" }] }] },
        })
        const { result: [shippingOption] } = await createShippingOptionsWorkflow(container).run({
          input: [{
            name: "Test Pickup",
            service_zone_id: serviceZone.id,
            shipping_profile_id: shippingProfile.id,
            provider_id: "manual_manual",
            price_type: "flat",
            type: { label: "Pickup", description: "Pickup", code: "store-pickup" },
            prices: [{ currency_code: "usd", amount: 0 }],
          }],
        })
        shippingOptionId = shippingOption.id

        const { result: products } = await createProductsWorkflow(container).run({
          input: {
            products: [
              {
                title: "Test Widget",
                status: ProductStatus.PUBLISHED,
                shipping_profile_id: shippingProfile.id,
                options: [{ title: "Size", values: ["Standard"] }],
                variants: [{ title: "Standard", sku: "TEST-WIDGET-1", manage_inventory: true, options: { Size: "Standard" }, prices: [{ currency_code: "usd", amount: 10 }] }],
                sales_channels: [{ id: channel.id }],
              },
              {
                title: "Test Gadget",
                status: ProductStatus.PUBLISHED,
                shipping_profile_id: shippingProfile.id,
                options: [{ title: "Size", values: ["Standard"] }],
                variants: [{ title: "Standard", sku: "TEST-GADGET-1", manage_inventory: true, options: { Size: "Standard" }, prices: [{ currency_code: "usd", amount: 25 }] }],
                sales_channels: [{ id: channel.id }],
              },
            ],
          },
        })
        widgetVariantId = products[0].variants![0].id
        gadgetVariantId = products[1].variants![0].id

        const { data: inventoryItems } = await query.graph({
          entity: "inventory_item", fields: ["id", "sku"], filters: { sku: ["TEST-WIDGET-1", "TEST-GADGET-1"] },
        })
        widgetInventoryItemId = inventoryItems.find((item: any) => item.sku === "TEST-WIDGET-1")!.id
        gadgetInventoryItemId = inventoryItems.find((item: any) => item.sku === "TEST-GADGET-1")!.id
        await createInventoryLevelsWorkflow(container).run({
          input: {
            inventory_levels: [
              { location_id: location.id, inventory_item_id: widgetInventoryItemId, stocked_quantity: 10 },
              { location_id: location.id, inventory_item_id: gadgetInventoryItemId, stocked_quantity: 10 },
            ],
          },
        })

        const authModuleService: any = container.resolve(Modules.AUTH)
        const userModuleService: any = container.resolve(Modules.USER)
        const { authIdentity } = await authModuleService.register("emailpass", {
          body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        })
        const user = await userModuleService.createUsers({ email: ADMIN_EMAIL, first_name: "Test", last_name: "Employee" })
        await authModuleService.updateAuthIdentities({ id: authIdentity.id, app_metadata: { user_id: user.id } })
        const tokenResponse = await api.post("/auth/user/emailpass", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        adminToken = tokenResponse.data.token
      })

      const storeHeaders = () => ({ "x-publishable-api-key": publishableKey })
      const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` })

      async function createFreshOrder(items: Array<{ variantId: string; quantity: number }>, email: string) {
        const headers = storeHeaders()
        const { data: cartData } = await api.post("/store/carts", { region_id: regionId }, { headers })
        const cartId = cartData.cart.id
        for (const item of items) {
          await api.post(`/store/carts/${cartId}/line-items`, { variant_id: item.variantId, quantity: item.quantity }, { headers })
        }
        await api.post(`/store/carts/${cartId}`, {
          email,
          shipping_address: { first_name: "I", last_name: "T", address_1: "1 Test St", city: "Manchester", province: "NH", postal_code: "03103", country_code: "us" },
          billing_address: { first_name: "I", last_name: "T", address_1: "1 Test St", city: "Manchester", province: "NH", postal_code: "03103", country_code: "us" },
        }, { headers })
        await api.post(`/store/carts/${cartId}/shipping-methods`, { option_id: shippingOptionId }, { headers })
        const { data: pcData } = await api.post("/store/payment-collections", { cart_id: cartId }, { headers })
        await api.post(`/store/payment-collections/${pcData.payment_collection.id}/payment-sessions`, { provider_id: "pp_system_default" }, { headers })
        const { data: completeData } = await api.post(`/store/carts/${cartId}/complete`, {}, { headers })
        return completeData.order
      }

      async function resolveAndVerify(orderNumber: string) {
        const { data: resolved } = await api.post("/admin/pickup-verifications/resolve", { order_number: orderNumber }, { headers: adminHeaders() })
        await api.post(`/admin/pickup-verifications/${resolved.verificationId}/verify-age`, { date_of_birth: "1990-01-01" }, { headers: adminHeaders() })
        return resolved.verificationId as string
      }

      const fullChecklist = { customer_match: true, physical_id_presented: true, id_valid_not_expired: true, age_confirmed: true }

      async function currentOrderState(dbConnection: any, orderId: string) {
        const [order] = await dbConnection("order").where({ id: orderId }).select("id", "status", "version", "metadata")
        const items = await dbConnection("order_item").where({ order_id: orderId, version: order.version }).select("item_id", "quantity", "fulfilled_quantity", "delivered_quantity")
        const fulfillments = await dbConnection("order_fulfillment").where({ order_id: orderId }).select("fulfillment_id")
        const reservations = await dbConnection("reservation_item")
          .whereIn("line_item_id", items.map((item: any) => item.item_id))
          .whereNull("deleted_at")
        return { order, items, fulfillmentCount: fulfillments.length, activeReservations: reservations }
      }

      it("completes a fresh single-item order: fulfillment delivered, order completed, reservation released, verification completed", async () => {
        const order = await createFreshOrder([{ variantId: widgetVariantId, quantity: 1 }], "customer.a@upnsmoke.local")
        const verificationId = await resolveAndVerify(String(order.display_id))

        const before = await currentOrderState(getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(before.order.status).toBe("pending")
        expect(before.items[0].fulfilled_quantity).toBe("0")

        const response = await api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }, { headers: adminHeaders() })
        expect(response.status).toBe(200)
        expect(response.data.status).toBe("completed")

        const after = await currentOrderState(getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(after.order.status).toBe("completed")
        expect(after.order.metadata.pickup_status).toBe("completed")
        expect(after.items.every((item: any) => item.fulfilled_quantity === item.quantity && item.delivered_quantity === item.quantity)).toBe(true)
        expect(after.fulfillmentCount).toBe(1)
        expect(after.activeReservations.length).toBe(0)

        const [verification] = await getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)("pickup_verification").where({ id: verificationId }).select("status", "completed_by")
        expect(verification.status).toBe("completed")
        expect(verification.completed_by).not.toBe("employee")

        // Sequential duplicate is idempotent — zero new fulfillment/audit rows.
        const duplicate = await api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }, { headers: adminHeaders() })
        expect(duplicate.data.alreadyCompleted).toBe(true)
        const afterDuplicate = await currentOrderState(getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(afterDuplicate.fulfillmentCount).toBe(1)
      })

      // Genuine concurrency, not sequential: two completion requests fired via
      // Promise.all, not two awaited one after another. The per-verification
      // lock in the route must serialize them so the loser observes the
      // already-completed state and returns the idempotent branch, rather
      // than a race producing a double fulfillment/decrement.
      it("serializes two truly concurrent completion requests to exactly one fulfillment/decrement", async () => {
        const order = await createFreshOrder([{ variantId: gadgetVariantId, quantity: 1 }], "customer.e@upnsmoke.local")
        const verificationId = await resolveAndVerify(String(order.display_id))

        const [first, second] = await Promise.all([
          api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }, { headers: adminHeaders() }),
          api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }, { headers: adminHeaders() }),
        ])
        const results = [first.data, second.data]
        expect(results.filter((r: any) => r.alreadyCompleted).length).toBe(1)
        expect(results.filter((r: any) => !r.alreadyCompleted).length).toBe(1)

        const after = await currentOrderState(getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(after.order.status).toBe("completed")
        expect(after.fulfillmentCount).toBe(1)
        expect(after.activeReservations.length).toBe(0)

        const [verification] = await getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)("pickup_verification").where({ id: verificationId }).select("status")
        expect(verification.status).toBe("completed")

        const auditEvents = await getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)("pickup_audit_event").where({ verification_id: verificationId, event_type: "pickup_completed" })
        expect(auditEvents.length).toBe(1)
      })

      // Regression coverage for the confirmed defect: a pre-existing fulfillment
      // covering only one of two items must not let the order complete with the
      // second item unfulfilled and its inventory reservation stranded.
      it("fulfills the remainder when the order already carries a partial fulfillment, and releases every reservation", async () => {
        const order = await createFreshOrder(
          [{ variantId: widgetVariantId, quantity: 1 }, { variantId: gadgetVariantId, quantity: 1 }],
          "customer.b@upnsmoke.local",
        )
        const container = getContainer()
        const { data: orderDetail } = await api.get(`/admin/orders/${order.id}?fields=items.id,items.variant_id`, { headers: adminHeaders() })
        const widgetItem = orderDetail.order.items.find((item: any) => item.variant_id === widgetVariantId)

        await createOrderFulfillmentWorkflow(container).run({
          input: { order_id: order.id, items: [{ id: widgetItem.id, quantity: 1 }], no_notification: false },
        })

        const verificationId = await resolveAndVerify(String(order.display_id))
        const response = await api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }, { headers: adminHeaders() })
        expect(response.status).toBe(200)

        const after = await currentOrderState(container.resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(after.order.status).toBe("completed")
        expect(after.items.every((item: any) => item.fulfilled_quantity === item.quantity && item.delivered_quantity === item.quantity)).toBe(true)
        expect(after.activeReservations.length).toBe(0)
      })

      // Same defect, the already-delivered sub-path: the pre-existing partial
      // fulfillment is already delivered, so the route must still create and
      // deliver a fulfillment for the remainder rather than completing early.
      it("fulfills the remainder when the pre-existing partial fulfillment is already delivered", async () => {
        const order = await createFreshOrder(
          [{ variantId: widgetVariantId, quantity: 1 }, { variantId: gadgetVariantId, quantity: 1 }],
          "customer.c@upnsmoke.local",
        )
        const container = getContainer()
        const { data: orderDetail } = await api.get(`/admin/orders/${order.id}?fields=items.id,items.variant_id`, { headers: adminHeaders() })
        const widgetItem = orderDetail.order.items.find((item: any) => item.variant_id === widgetVariantId)

        const { result: fulfillment } = await createOrderFulfillmentWorkflow(container).run({
          input: { order_id: order.id, items: [{ id: widgetItem.id, quantity: 1 }], no_notification: false },
        })
        await markOrderFulfillmentAsDeliveredWorkflow(container).run({
          input: { orderId: order.id, fulfillmentId: fulfillment.id, no_notification: false },
        })

        const verificationId = await resolveAndVerify(String(order.display_id))
        const response = await api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }, { headers: adminHeaders() })
        expect(response.status).toBe(200)

        const after = await currentOrderState(container.resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(after.order.status).toBe("completed")
        expect(after.items.every((item: any) => item.fulfilled_quantity === item.quantity && item.delivered_quantity === item.quantity)).toBe(true)
        expect(after.activeReservations.length).toBe(0)
      })

      // Regression coverage for the Sprint 04 lifecycle-recovery finding
      // (Opus's read-only workstream, sprint-04/lifecycle-recovery-evidence):
      // a crash between the order-metadata write (step 4) and verification
      // finalization (step 5) left the pickup_verification row permanently
      // stuck "active" with no completed_at/completed_by/audit event, and no
      // supported route could ever repair it. This plants that exact
      // post-step-4 state directly (bypassing the route, the only way to
      // reach the crash window without actually crashing mid-request) and
      // asserts a retry through the real route repairs it.
      it("recovers a verification stranded active after the order was already completed (post-step-4 crash)", async () => {
        const order = await createFreshOrder([{ variantId: widgetVariantId, quantity: 1 }], "customer.f@upnsmoke.local")
        const container = getContainer()
        const verificationId = await resolveAndVerify(String(order.display_id))
        const { data: orderDetail } = await api.get(`/admin/orders/${order.id}?fields=items.id`, { headers: adminHeaders() })
        const item = orderDetail.order.items[0]

        // Replay steps 1-4 out of band, exactly what the route itself does,
        // then stop -- leaving verification.status at "active" as if the
        // process died right after this point.
        const { result: fulfillment } = await createOrderFulfillmentWorkflow(container).run({
          input: { order_id: order.id, items: [{ id: item.id, quantity: 1 }], no_notification: false },
        })
        await markOrderFulfillmentAsDeliveredWorkflow(container).run({
          input: { orderId: order.id, fulfillmentId: fulfillment.id, no_notification: false },
        })
        await completeOrderWorkflow(container).run({ input: { orderIds: [order.id] } })
        const plantedCompletedAt = "2020-01-01T00:00:00.000Z"
        await updateOrderWorkflow(container).run({
          input: {
            id: order.id,
            user_id: "harness",
            metadata: { pickup_status: "completed", pickup_completed_at: plantedCompletedAt, pickup_completed_by: "harness" },
          },
        })

        const stranded = await currentOrderState(container.resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(stranded.order.status).toBe("completed")
        expect(stranded.order.metadata.pickup_status).toBe("completed")
        const [strandedVerification] = await container.resolve(ContainerRegistrationKeys.PG_CONNECTION)("pickup_verification").where({ id: verificationId }).select("status", "completed_at")
        expect(strandedVerification.status).toBe("active")
        expect(strandedVerification.completed_at).toBeNull()

        // The employee's normal re-scan path must also let them back in —
        // not just direct API access to the verification id.
        const rescan = await api.post("/admin/pickup-verifications/resolve", { order_number: String(order.display_id) }, { headers: adminHeaders() })
        expect(rescan.status).toBe(200)
        expect(rescan.data.verificationId).toBe(verificationId)

        const response = await api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }, { headers: adminHeaders() })
        expect(response.status).toBe(200)
        expect(response.data.status).toBe("completed")

        const after = await currentOrderState(container.resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(after.fulfillmentCount).toBe(1)
        expect(after.items.every((i: any) => i.fulfilled_quantity === i.quantity && i.delivered_quantity === i.quantity)).toBe(true)
        expect(after.activeReservations.length).toBe(0)
        // The retry must not overwrite the original completion timestamp/actor
        // with its own -- that would falsify the compliance record's history.
        expect(after.order.metadata.pickup_completed_at).toBe(plantedCompletedAt)
        expect(after.order.metadata.pickup_completed_by).toBe("harness")

        const [verification] = await container.resolve(ContainerRegistrationKeys.PG_CONNECTION)("pickup_verification").where({ id: verificationId }).select("status", "completed_by", "completed_at")
        expect(verification.status).toBe("completed")
        expect(verification.completed_at).not.toBeNull()
        expect(verification.completed_by).not.toBeNull()

        const auditEvents = await container.resolve(ContainerRegistrationKeys.PG_CONNECTION)("pickup_audit_event").where({ verification_id: verificationId, event_type: "pickup_completed" })
        expect(auditEvents.length).toBe(1)
      })

      it("rejects completion with zero database delta when the checklist is incomplete", async () => {
        const order = await createFreshOrder([{ variantId: widgetVariantId, quantity: 1 }], "customer.d@upnsmoke.local")
        const verificationId = await resolveAndVerify(String(order.display_id))
        const container = getContainer()
        const before = await currentOrderState(container.resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)

        await expect(
          api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: { customer_match: false } }, { headers: adminHeaders() }),
        ).rejects.toMatchObject({ response: { status: 400 } })

        const after = await currentOrderState(container.resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(after.order.status).toBe(before.order.status)
        expect(after.fulfillmentCount).toBe(before.fulfillmentCount)
      })

      it("returns 404 with zero database delta for an unknown verification id", async () => {
        await expect(
          api.post("/admin/pickup-verifications/pverf_does_not_exist/complete", { checklist: fullChecklist }, { headers: adminHeaders() }),
        ).rejects.toMatchObject({ response: { status: 404 } })
      })

      it("rejects an unauthenticated request directly against the Medusa admin route", async () => {
        const order = await createFreshOrder([{ variantId: widgetVariantId, quantity: 1 }], "customer.e@upnsmoke.local")
        const verificationId = await resolveAndVerify(String(order.display_id))

        await expect(
          api.post(`/admin/pickup-verifications/${verificationId}/complete`, { checklist: fullChecklist }),
        ).rejects.toMatchObject({ response: { status: 401 } })

        const container = getContainer()
        const after = await currentOrderState(container.resolve(ContainerRegistrationKeys.PG_CONNECTION), order.id)
        expect(after.order.status).toBe("pending")
      })
    })
  },
})
