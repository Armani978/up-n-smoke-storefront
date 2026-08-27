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
  it("requires fulfillment creation and order completion for a brand-new order", () => {
    const order = {
      status: "pending",
      fulfillments: [],
      items: [{ id: "ordli_1", detail: { id: "orditem_1", quantity: 1, fulfilled_quantity: 0 } }],
    };
    expect(pickupCompletionPlan(order)).toEqual({
      undeliveredFulfillmentIds: [],
      needsFulfillmentCreation: true,
      needsOrderCompletion: true,
    });
  });

  it("skips re-creating a fulfillment that already covers every item, but still delivers it", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_1", canceled_at: null, delivered_at: null }],
      items: [{ id: "ordli_1", detail: { id: "orditem_1", quantity: 1, fulfilled_quantity: 1 } }],
    };
    expect(pickupCompletionPlan(order)).toEqual({
      undeliveredFulfillmentIds: ["ful_1"],
      needsFulfillmentCreation: false,
      needsOrderCompletion: true,
    });
  });

  it("ignores canceled fulfillments when deciding whether coverage already exists", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_old", canceled_at: "2026-01-01T00:00:00Z", delivered_at: null }],
      items: [{ id: "ordli_1", detail: { id: "orditem_1", quantity: 1, fulfilled_quantity: 0 } }],
    };
    expect(pickupCompletionPlan(order).needsFulfillmentCreation).toBe(true);
  });

  it("only completes the order once every fulfillment is already delivered", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_1", canceled_at: null, delivered_at: "2026-01-01T00:00:00Z" }],
      items: [{ id: "ordli_1", detail: { id: "orditem_1", quantity: 1, fulfilled_quantity: 1 } }],
    };
    expect(pickupCompletionPlan(order)).toEqual({
      undeliveredFulfillmentIds: [],
      needsFulfillmentCreation: false,
      needsOrderCompletion: true,
    });
  });

  it("is a no-op once the order is genuinely completed", () => {
    const order = {
      status: "completed",
      fulfillments: [{ id: "ful_1", canceled_at: null, delivered_at: "2026-01-01T00:00:00Z" }],
      items: [{ id: "ordli_1", detail: { id: "orditem_1", quantity: 1, fulfilled_quantity: 1 } }],
    };
    expect(pickupCompletionPlan(order)).toEqual({
      undeliveredFulfillmentIds: [],
      needsFulfillmentCreation: false,
      needsOrderCompletion: false,
    });
  });

  // Regression coverage for the confirmed defect: a pre-existing fulfillment
  // covering only *some* of the order's items must not be treated as full
  // coverage. `needsFulfillmentCreation` used to be `!activeFulfillments[0]`,
  // so any single active fulfillment — however partial — suppressed a second
  // one for the remainder, and the route went on to complete the order with
  // an item stuck at fulfilled_quantity=0.
  it("still requires a new fulfillment for the remainder when an existing one only partially covers the order", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_partial", canceled_at: null, delivered_at: "2026-01-01T00:00:00Z" }],
      items: [
        { id: "ordli_covered", detail: { id: "orditem_1", quantity: 1, fulfilled_quantity: 1 } },
        { id: "ordli_uncovered", detail: { id: "orditem_2", quantity: 1, fulfilled_quantity: 0 } },
      ],
    };
    const plan = pickupCompletionPlan(order);
    expect(plan.needsFulfillmentCreation).toBe(true);
    expect(plan.undeliveredFulfillmentIds).toEqual([]);
    expect(fulfillmentItemsForOrder(order)).toEqual([{ id: "ordli_uncovered", quantity: 1 }]);
  });

  // Same defect, different sub-path: the pre-existing partial fulfillment is
  // itself still undelivered. Both it and the new remainder fulfillment must
  // be marked delivered.
  it("marks both the pre-existing undelivered partial fulfillment and a newly created remainder fulfillment as delivered", () => {
    const order = {
      status: "pending",
      fulfillments: [{ id: "ful_partial", canceled_at: null, delivered_at: null }],
      items: [
        { id: "ordli_covered", detail: { id: "orditem_1", quantity: 1, fulfilled_quantity: 1 } },
        { id: "ordli_uncovered", detail: { id: "orditem_2", quantity: 1, fulfilled_quantity: 0 } },
      ],
    };
    const plan = pickupCompletionPlan(order);
    expect(plan.needsFulfillmentCreation).toBe(true);
    expect(plan.undeliveredFulfillmentIds).toEqual(["ful_partial"]);
  });
});
