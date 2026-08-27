import type { MedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PICKUP_VERIFICATION_MODULE } from "../modules/pickup-verification"
import { getTwentyOneCutoffDate, localDateAt, STORE_TIMEZONE, toIsoDate } from "../modules/pickup-verification/age"

export type PickupService = {
  listPickupVerifications: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any[]>
  createPickupVerifications: (data: Record<string, unknown>) => Promise<any>
  updatePickupVerifications: (data: Record<string, unknown>) => Promise<any>
  createPickupAuditEvents: (data: Record<string, unknown>) => Promise<any>
}

export function pickupService(req: MedusaRequest) {
  return req.scope.resolve(PICKUP_VERIFICATION_MODULE) as PickupService
}

export function graph(req: MedusaRequest) {
  return req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as {
    graph: (input: Record<string, unknown>) => Promise<{ data: any[] }>
  }
}

export async function orderById(req: MedusaRequest, id: string) {
  const { data } = await graph(req).graph({
    entity: "order",
    fields: [
      "id", "display_id", "email", "status", "created_at", "currency_code", "total", "metadata",
      "customer.id", "customer.first_name", "customer.last_name", "shipping_address.first_name",
      "shipping_address.last_name", "items.id", "items.title", "items.product_title", "items.variant_title",
      "items.variant_sku", "items.quantity", "items.unit_price", "items.total", "items.thumbnail",
      "items.product.metadata", "items.detail.id", "items.detail.quantity", "items.detail.fulfilled_quantity",
      "fulfillments.id", "fulfillments.canceled_at", "fulfillments.delivered_at",
    ],
    filters: { id },
  })
  return data[0] || null
}

export function fulfillmentItemsForOrder(order: any) {
  return (order.items || []).flatMap((item: any) => {
    const id = item.id
    const remaining = Number(item.detail?.quantity ?? item.quantity ?? 0) - Number(item.detail?.fulfilled_quantity ?? 0)
    return id && remaining > 0 ? [{ id, quantity: remaining }] : []
  })
}

export function pickupCompletionPlan(order: any) {
  const activeFulfillments = (order.fulfillments || []).filter((fulfillment: any) => !fulfillment.canceled_at)
  const undeliveredFulfillmentIds = activeFulfillments
    .filter((fulfillment: any) => !fulfillment.delivered_at)
    .map((fulfillment: any) => fulfillment.id as string)
  return {
    undeliveredFulfillmentIds,
    needsFulfillmentCreation: fulfillmentItemsForOrder(order).length > 0,
    needsOrderCompletion: order.status !== "completed",
  }
}

export function canAttemptPickupCompletion(status: unknown) {
  // The route is protected by a per-verification lock. If it observes
  // `processing` after acquiring that lock, the previous request ended before
  // it could finish or restore the verification. Retrying is safe because the
  // completion route also detects an already-created fulfillment.
  return status === "active" || status === "processing"
}

export async function orderByDisplayId(req: MedusaRequest, displayId: string) {
  const numeric = Number(displayId.replace(/^#/, ""))
  if (!Number.isInteger(numeric) || numeric < 1) return null
  const { data } = await graph(req).graph({
    entity: "order",
    fields: ["id"],
    filters: { display_id: numeric },
  })
  return data[0] ? orderById(req, data[0].id) : null
}

export function requiresAgeVerification(order: any) {
  if ((process.env.REQUIRE_ID_FOR_ALL_PICKUPS || "true").toLowerCase() === "true") return true
  return (order.items || []).some((item: any) => {
    const metadata = item.product?.metadata || {}
    return metadata.age_restricted === true || metadata.age_restricted === "true" || Number(metadata.minimum_age) >= 21
  })
}

export function pickupStatus(order: any) {
  return String(order.metadata?.pickup_status || "pending")
}

export function customerDisplayName(order: any) {
  const first = String(order.customer?.first_name || order.shipping_address?.first_name || "Customer")
  const last = String(order.customer?.last_name || order.shipping_address?.last_name || "")
  return `${first}${last ? ` ${last[0].toUpperCase()}.` : ""}`
}

export function publicOrder(order: any, verification: any) {
  const today = localDateAt()
  return {
    verificationId: verification.id,
    status: verification.status,
    completedAt: verification.completed_at,
    completedBy: verification.completed_by,
    requiresAgeVerification: verification.requires_age_verification,
    ageContext: {
      today: toIsoDate(today),
      cutoff: toIsoDate(getTwentyOneCutoffDate(today)),
      timeZone: STORE_TIMEZONE,
    },
    order: {
      id: order.id,
      displayId: String(order.display_id),
      status: pickupStatus(order),
      customerName: customerDisplayName(order),
      createdAt: order.created_at,
      currency: order.currency_code,
      total: Number(order.total || 0),
      pickupLocation: process.env.PICKUP_LOCATION_NAME || "Manchester Counter",
      pickupWindow: String(order.metadata?.pickup_window || "In-store pickup"),
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        title: item.product_title || item.title,
        variantTitle: item.variant_title || "",
        sku: item.variant_sku || "",
        thumbnail: item.thumbnail || null,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unit_price || 0),
        total: Number(item.total || 0),
      })),
    },
  }
}

export async function audit(service: PickupService, verification: any, event: string, employeeId?: string, extra?: Record<string, unknown>) {
  return service.createPickupAuditEvents({
    verification_id: verification.id,
    order_id: verification.order_id,
    employee_id: employeeId || null,
    event_type: event,
    verification_method: extra?.verification_method || null,
    result: extra?.result || null,
    metadata: extra?.metadata || null,
  })
}
