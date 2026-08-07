export type ProductSignal = {
  label: string;
  value: string;
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
  inventoryItemId?: string;
  inventoryLevelId?: string;
};

export type AdminOrder = {
  id: string;
  displayId: string;
  email: string;
  customerName: string;
  createdAt: string;
  total: number;
  currency: string;
  itemCount: number;
  pickupWindow: string;
  pickupStatus: PickupStatus;
};
