import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createLocationFulfillmentSetWorkflow,
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
} from "@medusajs/medusa/core-flows"
import { hashPickupToken } from "../../src/modules/pickup-verification/token"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  disableAutoTeardown: true,
  testSuite: ({ api, getContainer }) => {
    describe("Pickup pass issuance — regenerate guard", () => {
      let publishableKey: string
      let regionId: string
      let shippingOptionId: string

      beforeAll(async () => {
        const container = getContainer()
        const link = container.resolve(ContainerRegistrationKeys.LINK)
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        const { result: [channel] } = await createSalesChannelsWorkflow(container).run({
          input: { salesChannelsData: [{ name: "Test Issue Channel" }] },
        })
        const { result: [key] } = await createApiKeysWorkflow(container).run({
          input: { api_keys: [{ title: "Test Issue Key", type: "publishable", created_by: "" }] },
        })
        await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } })
        publishableKey = key.token

        await createStoresWorkflow(container).run({
          input: {
            stores: [{
              name: "Test Issue Store",
              supported_currencies: [{ currency_code: "usd", is_default: true }],
              default_sales_channel_id: channel.id,
            }],
          },
        })

        const { result: [region] } = await createRegionsWorkflow(container).run({
          input: { regions: [{ name: "Test Issue Region", currency_code: "usd", countries: ["us"], payment_providers: ["pp_system_default"] }] },
        })
        regionId = region.id

        const { result: [shippingProfile] } = await createShippingProfilesWorkflow(container).run({
          input: { data: [{ name: "Test Issue Profile", type: "default" }] },
        })
        const { result: [location] } = await createStockLocationsWorkflow(container).run({
          input: {
            locations: [{
              name: "Test Issue Location",
              address: { address_1: "1 Test St", city: "Manchester", province: "NH", postal_code: "03103", country_code: "US" },
            }],
          },
        })
        await link.create({
          [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
          [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
        })
        await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channel.id] } })
        await createLocationFulfillmentSetWorkflow(container).run({
          input: { location_id: location.id, fulfillment_set_data: { name: "Test Issue Fulfillment Set", type: "pickup" } },
        })
        const { data: [fulfillmentSet] } = await query.graph({
          entity: "fulfillment_set", fields: ["id"], filters: { name: "Test Issue Fulfillment Set" },
        })
        const { result: [serviceZone] } = await createServiceZonesWorkflow(container).run({
          input: { data: [{ name: "Test Issue Zone", fulfillment_set_id: fulfillmentSet.id, geo_zones: [{ type: "country", country_code: "us" }] }] },
        })
        const { result: [shippingOption] } = await createShippingOptionsWorkflow(container).run({
          input: [{
            name: "Test Issue Pickup",
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
            products: [{
              title: "Test Issue Widget",
              status: ProductStatus.PUBLISHED,
              shipping_profile_id: shippingProfile.id,
              options: [{ title: "Size", values: ["Standard"] }],
              variants: [{ title: "Standard", sku: "TEST-ISSUE-WIDGET-1", manage_inventory: true, options: { Size: "Standard" }, prices: [{ currency_code: "usd", amount: 10 }] }],
              sales_channels: [{ id: channel.id }],
            }],
          },
        })
        const variantId = products[0].variants![0].id

        const { data: inventoryItems } = await query.graph({
          entity: "inventory_item", fields: ["id", "sku"], filters: { sku: ["TEST-ISSUE-WIDGET-1"] },
        })
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: [{ location_id: location.id, inventory_item_id: inventoryItems[0].id, stocked_quantity: 10 }] },
        })
        ;(global as any).__issueTestVariantId = variantId
      })

      const storeHeaders = () => ({ "x-publishable-api-key": publishableKey })

      async function createFreshOrder(email: string) {
        const headers = storeHeaders()
        const variantId = (global as any).__issueTestVariantId as string
        const { data: cartData } = await api.post("/store/carts", { region_id: regionId }, { headers })
        const cartId = cartData.cart.id
        await api.post(`/store/carts/${cartId}/line-items`, { variant_id: variantId, quantity: 1 }, { headers })
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

      async function verificationRow(orderId: string) {
        const rows = await getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)("pickup_verification")
          .where({ order_id: orderId }).whereNull("deleted_at").select("id", "token_hash", "status")
        return rows
      }

      it("regenerate=false on first issuance still creates a token (nothing to protect yet)", async () => {
        const order = await createFreshOrder("issue.first@upnsmoke.local")
        const response = await api.post("/store/pickup-verifications/issue", { order_id: order.id, email: order.email, regenerate: false }, { headers: storeHeaders() })
        expect(response.status).toBe(200)
        expect(response.data.token).toBeDefined()
        expect(response.data.alreadyIssued).toBeUndefined()

        const rows = await verificationRow(order.id)
        expect(rows.length).toBe(1)
        expect(rows[0].token_hash).toBe(hashPickupToken(response.data.token))
      })

      it("regenerate=false does not rotate an active, unexpired credential", async () => {
        const order = await createFreshOrder("issue.noregen@upnsmoke.local")
        const first = await api.post("/store/pickup-verifications/issue", { order_id: order.id, email: order.email }, { headers: storeHeaders() })
        const firstToken = first.data.token as string
        const firstHash = hashPickupToken(firstToken)

        const second = await api.post("/store/pickup-verifications/issue", { order_id: order.id, email: order.email, regenerate: false }, { headers: storeHeaders() })
        expect(second.status).toBe(200)
        expect(second.data.token).toBeUndefined()
        expect(second.data.alreadyIssued).toBe(true)
        expect(second.data.order.displayId).toBe(String(order.display_id))

        const rows = await verificationRow(order.id)
        expect(rows.length).toBe(1)
        expect(rows[0].token_hash).toBe(firstHash)
      })

      it("regenerate=true explicitly rotates and invalidates the previous credential", async () => {
        const order = await createFreshOrder("issue.regen@upnsmoke.local")
        const first = await api.post("/store/pickup-verifications/issue", { order_id: order.id, email: order.email }, { headers: storeHeaders() })
        const firstToken = first.data.token as string

        const second = await api.post("/store/pickup-verifications/issue", { order_id: order.id, email: order.email, regenerate: true }, { headers: storeHeaders() })
        const secondToken = second.data.token as string
        expect(secondToken).toBeDefined()
        expect(secondToken).not.toBe(firstToken)

        const rows = await verificationRow(order.id)
        expect(rows.length).toBe(1)
        expect(rows[0].token_hash).toBe(hashPickupToken(secondToken))
        expect(rows[0].token_hash).not.toBe(hashPickupToken(firstToken))
      })

      it("wrong email is rejected with zero verification rows created, regardless of regenerate", async () => {
        const order = await createFreshOrder("issue.wrongemail@upnsmoke.local")
        await expect(
          api.post("/store/pickup-verifications/issue", { order_id: order.id, email: "someone.else@upnsmoke.local", regenerate: false }, { headers: storeHeaders() }),
        ).rejects.toMatchObject({ response: { status: 404 } })

        const rows = await verificationRow(order.id)
        expect(rows.length).toBe(0)
      })
    })
  },
})
