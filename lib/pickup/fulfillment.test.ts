import { describe, expect, it } from "vitest";
import { canAttemptPickupCompletion, fulfillmentItemsForOrder } from "../../medusa-backend/src/api/pickup-verification-helpers";

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
