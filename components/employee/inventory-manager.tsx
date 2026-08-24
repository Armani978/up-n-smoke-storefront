"use client";

import { Archive, Edit3, Eye, EyeOff, LoaderCircle, PackagePlus, Save, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/storefront/product-image";
import type { AdminProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { DataFreshness } from "@/components/employee/data-freshness";
import { isProductImageFallback } from "@/lib/product-images";

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  price: string;
  status: string;
  image: string;
};
const empty: ProductForm = {
  name: "",
  sku: "",
  description: "",
  price: "",
  status: "published",
  image: "",
};

export function InventoryManager({
  initialProducts,
  canWrite,
  initialUpdatedAt,
  timeZone,
}: {
  initialProducts: AdminProduct[];
  canWrite: boolean;
  initialUpdatedAt: string;
  timeZone: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [storefrontFilter, setStorefrontFilter] = useState<"all" | "shown" | "hidden">("all");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [visibilityBusy, setVisibilityBusy] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);
  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !q || [product.name, product.sku, product.category]
        .some((value) => value.toLowerCase().includes(q));
      const matchesStorefront = storefrontFilter === "all"
        || (storefrontFilter === "shown" && product.onStorefront)
        || (storefrontFilter === "hidden" && !product.onStorefront);
      return matchesQuery && matchesStorefront;
    });
  }, [products, query, storefrontFilter]);
  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: String(product.price),
      status: product.status,
      image: isProductImageFallback(product.image)
        ? ""
        : product.image,
    });
  };
  const openNew = () => {
    setEditing("new");
    setForm({ ...empty, sku: `UNS-${Date.now().toString().slice(-6)}` });
  };

  async function saveProduct() {
    const isNew = editing === "new";
    const response = await fetch(
      isNew
        ? "/api/employee/products"
        : `/api/employee/products/${(editing as AdminProduct).id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) }),
      },
    );
    if (!response.ok) {
      setMessage((await response.json()).error ?? "Unable to save product.");
      return;
    }
    setMessage("Product saved to Medusa.");
    setEditing(null);
    await refresh();
  }
  async function refresh() {
    const response = await fetch("/api/employee/products", {
      cache: "no-store",
    });
    if (!response.ok) {
      setMessage("Medusa could not refresh inventory.");
      return false;
    }
    setProducts((await response.json()).products);
    return true;
  }
  async function saveStock(product: AdminProduct) {
    const quantity = Number(stockDraft[product.id]);
    if (
      !product.inventoryItemId ||
      !product.inventoryLocationId ||
      !Number.isInteger(quantity)
    ) {
      setMessage(
        "This product needs a Medusa inventory item and stock location before stock can change.",
      );
      return;
    }
    const response = await fetch(
      `/api/employee/inventory/${encodeURIComponent(product.inventoryItemId)}/${encodeURIComponent(product.inventoryLocationId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      },
    );
    if (response.ok) {
      setProducts((items) =>
        items.map((item) =>
          item.id === product.id ? { ...item, stock: quantity } : item,
        ),
      );
      setStockDraft((drafts) => {
        const next = { ...drafts };
        delete next[product.id];
        return next;
      });
      setMessage(`${product.name} stock updated.`);
    } else
      setMessage((await response.json()).error ?? "Unable to update stock.");
  }
  async function setStorefront(product: AdminProduct, onStorefront: boolean) {
    setVisibilityBusy(product.id);
    const response = await fetch(`/api/employee/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storefront: onStorefront }),
    });
    if (response.ok) {
      setProducts((items) => items.map((item) => item.id === product.id
        ? { ...item, onStorefront, status: onStorefront ? "published" : "draft" }
        : item));
      setMessage(`${product.name} is now ${onStorefront ? "shown on" : "hidden from"} the storefront.`);
    } else {
      setMessage((await response.json()).error ?? "Unable to change storefront visibility.");
    }
    setVisibilityBusy(null);
  }
  async function archive(product: AdminProduct) {
    if (!window.confirm(`Archive ${product.name} from the storefront?`)) return;
    const response = await fetch(`/api/employee/products/${product.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setProducts((items) => items.filter((item) => item.id !== product.id));
      setMessage(`${product.name} archived.`);
    }
  }

  return (
    <div className="ops-page">
      <header className="ops-heading">
        <div>
          <span>Medusa catalog / live</span>
          <h1>
            INVENTORY
            <br />
            <em>CONTROL.</em>
          </h1>
        </div>
        <div className="ops-heading-actions">
          <DataFreshness
            initialUpdatedAt={initialUpdatedAt}
            timeZone={timeZone}
            onRefresh={refresh}
          />
          {canWrite && (
            <Button onClick={openNew}>
              <PackagePlus /> Add product
            </Button>
          )}
        </div>
      </header>
      <div className="ops-toolbar">
        <label>
          <Search />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(100);
            }}
            placeholder="SEARCH PRODUCT, SKU, CATEGORY"
          />
        </label>
        <div className="storefront-filters" aria-label="Filter inventory by storefront visibility">
          {([['all', 'All'], ['shown', 'On storefront'], ['hidden', 'Hidden']] as const).map(([value, label]) => (
            <button
              key={value}
              className={storefrontFilter === value ? "active" : ""}
              onClick={() => { setStorefrontFilter(value); setLimit(100); }}
            >
              {label}
            </button>
          ))}
        </div>
        <span>{visible.length} / {products.length} products</span>
      </div>
      {message && (
        <p className="ops-message">
          {message}
          <button onClick={() => setMessage("")}>
            <X />
          </button>
        </p>
      )}
      <section className="inventory-table">
        <header>
          <span>Product</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Storefront</span>
          <span>Action</span>
        </header>
        {visible.slice(0, limit).map((product) => (
          <article key={product.id}>
            <div className="inventory-name">
              <div className="inventory-thumb" style={{ "--inventory-accent": product.accent } as React.CSSProperties}>
                <ProductImage src={product.image} alt="" fill sizes="48px" />
              </div>
              <span>
                <b>{product.name}</b>
                <small>
                  {product.sku} · {product.category}
                </small>
              </span>
            </div>
            <b>{formatMoney(product.price)}</b>
            <div className="stock-edit">
              <Input
                inputMode="numeric"
                value={stockDraft[product.id] ?? String(product.stock)}
                onChange={(event) =>
                  setStockDraft((value) => ({
                    ...value,
                    [product.id]: event.target.value,
                  }))
                }
                disabled={!canWrite}
              />
              {canWrite && (
                <button
                  onClick={() => void saveStock(product)}
                  aria-label="Save stock"
                >
                  <Save />
                </button>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={product.onStorefront}
              aria-label={`${product.onStorefront ? "Hide" : "Show"} ${product.name} on storefront`}
              className="storefront-switch"
              disabled={!canWrite || visibilityBusy === product.id}
              onClick={() => void setStorefront(product, !product.onStorefront)}
            >
              <i>{visibilityBusy === product.id ? <LoaderCircle className="spin" /> : product.onStorefront ? <Eye /> : <EyeOff />}</i>
              <span>{product.onStorefront ? "Shown" : "Hidden"}</span>
            </button>
            <div className="row-actions">
              {canWrite && (
                <>
                  <button onClick={() => openEdit(product)}>
                    <Edit3 />
                  </button>
                  <button onClick={() => void archive(product)}>
                    <Archive />
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </section>
      {visible.length > limit && (
        <div className="load-more">
          <Button
            variant="outline"
            onClick={() => setLimit((value) => value + 100)}
          >
            Load more inventory
          </Button>
        </div>
      )}
      {editing && (
        <div className="ops-modal-backdrop">
          <section className="ops-modal">
            <header>
              <div>
                <span>
                  {editing === "new" ? "New Medusa product" : "Edit product"}
                </span>
                <h2>{editing === "new" ? "ADD TO WALL" : "EDIT SIGNAL"}</h2>
              </div>
              <button onClick={() => setEditing(null)}>
                <X />
              </button>
            </header>
            <div className="form-grid">
              <label>
                Product name
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>
              <label>
                SKU
                <Input
                  value={form.sku}
                  disabled={editing !== "new"}
                  onChange={(event) =>
                    setForm({ ...form, sku: event.target.value })
                  }
                />
              </label>
              <label>
                Price
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                />
              </label>
              <label>
                Storefront visibility
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  <option value="published">Shown on storefront</option>
                  <option value="draft">Hidden from storefront</option>
                </select>
              </label>
              <label className="wide">
                Exact product photo
                <Input
                  value={form.image}
                  onChange={(event) =>
                    setForm({ ...form, image: event.target.value })
                  }
                  placeholder="/product-images/UPC.jpg or verified source URL"
                />
              </label>
              <label className="wide">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
            </div>
            <Button onClick={() => void saveProduct()}>
              <Save /> Save product
            </Button>
          </section>
        </div>
      )}
    </div>
  );
}
