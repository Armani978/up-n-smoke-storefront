import { describe, expect, it } from "vitest";
import { mapMedusaProduct } from "./catalog";

describe("Medusa catalog mapping", () => {
  it("maps calculated price, stock, category, and the pickup variant", () => {
    const product = mapMedusaProduct({
      id: "prod_1",
      title: "Signal Device",
      handle: "signal-device",
      categories: [{ name: "Devices" }],
      variants: [{
        id: "variant_1",
        sku: "SIG-1",
        inventory_quantity: 7,
        calculated_price: { calculated_amount: 1999, currency_code: "usd" },
      }],
    }, 0);

    expect(product).toMatchObject({ variantId: "variant_1", price: 1999, stock: 7, category: "Devices" });
  });

  it("clamps negative inventory and replaces the known broken seed image", () => {
    const product = mapMedusaProduct({
      id: "prod_2",
      title: "Charge Case",
      handle: "charge-case",
      thumbnail: "https://images.unsplash.com/photo-1609592806596-b43bada2f39c",
      variants: [{ id: "variant_2", inventory_quantity: -4 }],
    }, 1);

    expect(product.stock).toBe(0);
    expect(product.image).toBe("/up-n-smoke-logo.png");
  });

  it("uses an exact local product photo when the SKU has a verified match", () => {
    const product = mapMedusaProduct({
      id: "prod_3",
      title: "Verified accessory",
      handle: "verified-accessory",
      variants: [{ id: "variant_3", sku: "784762991300" }],
    }, 2);

    expect(product.image).toBe("/product-images/784762991300.jpg");
  });
});
