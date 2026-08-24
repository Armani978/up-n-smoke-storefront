import { defineMiddlewares, authenticate } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/inventory-import",
      method: "POST",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/admin/pickup-verifications*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/admin/storefront-promo",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
  ],
})
