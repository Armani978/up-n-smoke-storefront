import { describe, expect, it } from "vitest";
import { canAttemptPickupCompletion, fulfillmentItemsForOrder, pickupCompletionPlan } from "../../medusa-backend/src/api/pickup-verification-helpers";

describe("pickup fulfillment items", () => {
  it("uses the Medusa order line-item ID required by the fulfillment workflow", () => {
    expect(fulfillmentItemsForOrder({
      items: [{ id: "ordli_1", quantity: 2, detail: { id: "orditem_1", quantity: 2, fulfilled_quantity: 0 } }],
    })).toEqual([{ id: "ordli_1", quantity: 2 }]);
  });

  it("only fulfills the remaining quantity", () => {
    expect(fulfillmentItemsForOrder({
      items: [{ id: "ordli_1", detail: { id: "orditem_1", quantity: 3, fulfilled_quantity: 2 } }],
    })).toEqual([{ id: "ordli_1", quantity: 1 }]);
  });

  it("lets an interrupted processing attempt retry under the completion lock", () => {
    expect(canAttemptPickupCompletion("active")).toBe(true);
    expect(canAttemptPickupCompletion("processing")).toBe(true);
    expect(canAttemptPickupCompletion("completed")).toBe(false);
    expect(canAttemptPickupCompletion("revoked")).toBe(false);
  });
});

describe("pickup completion plan", () => {
  // Regression coverage for the bug where the completion route created a
  // fulfillment and flipped a custom `pickup_status` metadata flag, but
  // never called markOrderFulfillmentAsDeliveredWorkflow or
  // completeOrderWorkflow — leaving Medusa's real order.status stuck on
  // "pending" forever even though the API reported success.
  it("requires fulfillment creation, delivery, and order completion for a brand-new order", () => {
    const order = { status: "pending", fulfillments: [] };
    expect(pickupCompletionPlan(order)).toEqual({
      fulfillmentId: undefined,
      needsFulfillmentCreation: true,
      needsDeliveryMark: true,
      needsOrderCompletion: true,
    });
  });

  it("skips re-creating a fulfillment that already exists but still marks it delivered", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_1", canceled_at: null, delivered_at: null }],
    };
    const plan = pickupCompletionPlan(order);
    expect(plan.needsFulfillmentCreation).toBe(false);
    expect(plan.fulfillmentId).toBe("ful_1");
    expect(plan.needsDeliveryMark).toBe(true);
    expect(plan.needsOrderCompletion).toBe(true);
  });

  it("ignores canceled fulfillments when deciding whether one already exists", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_old", canceled_at: "2026-01-01T00:00:00Z", delivered_at: null }],
    };
    expect(pickupCompletionPlan(order).needsFulfillmentCreation).toBe(true);
  });

  it("only completes the order once the fulfillment is already delivered", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_1", canceled_at: null, delivered_at: "2026-01-01T00:00:00Z" }],
    };
    expect(pickupCompletionPlan(order)).toEqual({
      fulfillmentId: "ful_1",
      needsFulfillmentCreation: false,
      needsDeliveryMark: false,
      needsOrderCompletion: true,
    });
  });

  it("is a no-op once the order is genuinely completed", () => {
    const order = {
      status: "completed",
      fulfillments: [{ id: "ful_1", canceled_at: null, delivered_at: "2026-01-01T00:00:00Z" }],
    };
    expect(pickupCompletionPlan(order)).toEqual({
      fulfillmentId: "ful_1",
      needsFulfillmentCreation: false,
      needsDeliveryMark: false,
      needsOrderCompletion: false,
    });
  });
});
