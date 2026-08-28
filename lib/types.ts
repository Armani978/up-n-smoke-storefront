export type ProductSignal = {
  label: string;
  value: string;
};

export type ProductVariantOption = {
  id: string;
  title: string;
  sku: string;
  price: number;
  stock: number;
};

export type StoreProduct = {
  id: string;
  variantId: string;
  name: string;
  handle: string;
  sku: string;
  category: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  accent: string;
  signals: ProductSignal[];
  brand?: string;
  line?: string;
  flavor?: string;
  nicotine?: string;
  puffs?: string;
  /** Every purchasable variant, in Medusa's own order. Only meaningful (and
   * only rendered as a selector) when a product has more than one; the
   * top-level variantId/price/stock always mirror variants[0] so existing
   * single-variant products are unaffected. */
  variants?: ProductVariantOption[];
};

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
};

export type PickupStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "arrived"
  | "completed"
  | "cancelled";

export type EmployeeRole = "admin" | "manager" | "employee";

export type EmployeeSession = {
  email: string;
  role: EmployeeRole;
  token: string;
  expiresAt: number;
};

export type AdminProduct = StoreProduct & {
  status: string;
  onStorefront: boolean;
  inventoryItemId?: string;
  inventoryLevelId?: string;
  inventoryLocationId?: string;
};

export type AdminOrderLine = {
  id: string;
  title: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type AdminOrder = {
  id: string;
  displayId: string;
  email: string;
  customerName: string;
  phone: string;
  createdAt: string;
  total: number;
  currency: string;
  itemCount: number;
  lineItems: AdminOrderLine[];
  pickupWindow: string;
  pickupNotes: string;
  pickupStatus: PickupStatus;
};

export type PickupItem = {
  id: string;
  title: string;
  variantTitle: string;
  sku: string;
  thumbnail: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PickupVerificationData = {
  verificationId: string;
  status: "active" | "processing" | "completed" | "revoked" | "expired";
  completedAt: string | null;
  completedBy: string | null;
  requiresAgeVerification: boolean;
  ageContext: { today: string; cutoff: string; timeZone: string };
  order: {
    id: string;
    displayId: string;
    status: PickupStatus;
    customerName: string;
    createdAt: string;
    currency: string;
    total: number;
    pickupLocation: string;
    pickupWindow: string;
    items: PickupItem[];
  };
};

export type PickupPassData = PickupVerificationData & {
  token: string;
  expiresAt: string;
};
