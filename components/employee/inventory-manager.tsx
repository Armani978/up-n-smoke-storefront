"use client";

import { Archive, Edit3, PackagePlus, Save, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type ProductForm = { name: string; sku: string; description: string; price: string; status: string; image: string };
const empty: ProductForm = { name: "", sku: "", description: "", price: "", status: "published", image: "" };

export function InventoryManager({ initialProducts, canWrite }: { initialProducts: AdminProduct[]; canWrite: boolean }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [limit, setLimit] = useState(100);
  const visible = useMemo(() => { const q = query.toLowerCase(); return products.filter((product) => !q || [product.name, product.sku, product.category].some((value) => value.toLowerCase().includes(q))); }, [products, query]);
  const openEdit = (product: AdminProduct) => { setEditing(product); setForm({ name: product.name, sku: product.sku, description: product.description, price: String(product.price), status: product.status, image: product.image.startsWith("/product-placeholder") ? "" : product.image }); };
  const openNew = () => { setEditing("new"); setForm({ ...empty, sku: `UNS-${Date.now().toString().slice(-6)}` }); };

  async function saveProduct() {
    const isNew = editing === "new";
    const response = await fetch(isNew ? "/api/employee/products" : `/api/employee/products/${(editing as AdminProduct).id}`, { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: Number(form.price) }) });
    if (!response.ok) { setMessage((await response.json()).error ?? "Unable to save product."); return; }
    setMessage("Product saved to Medusa."); setEditing(null); await refresh();
  }
  async function refresh() { const response = await fetch("/api/employee/products", { cache: "no-store" }); if (response.ok) setProducts((await response.json()).products); }
  async function saveStock(product: AdminProduct) { const quantity = Number(stockDraft[product.id]); if (!product.inventoryLevelId || !Number.isInteger(quantity)) { setMessage("This product needs a Medusa inventory level before stock can change."); return; } const response = await fetch(`/api/employee/inventory/${product.inventoryLevelId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity }) }); if (response.ok) { setProducts((items) => items.map((item) => item.id === product.id ? { ...item, stock: quantity } : item)); setMessage(`${product.name} stock updated.`); } else setMessage((await response.json()).error ?? "Unable to update stock."); }
  async function archive(product: AdminProduct) { if (!window.confirm(`Archive ${product.name} from the storefront?`)) return; const response = await fetch(`/api/employee/products/${product.id}`, { method: "DELETE" }); if (response.ok) { setProducts((items) => items.filter((item) => item.id !== product.id)); setMessage(`${product.name} archived.`); } }

  return <div className="ops-page"><header className="ops-heading"><div><span>Medusa catalog / live</span><h1>INVENTORY<br /><em>CONTROL.</em></h1></div>{canWrite && <Button onClick={openNew}><PackagePlus /> Add product</Button>}</header><div className="ops-toolbar"><label><Search /><input value={query} onChange={(event) => { setQuery(event.target.value); setLimit(100); }} placeholder="SEARCH PRODUCT, SKU, CATEGORY" /></label><span>{visible.length} / {products.length} products</span></div>{message && <p className="ops-message">{message}<button onClick={() => setMessage("")}><X /></button></p>}<section className="inventory-table"><header><span>Product</span><span>Price</span><span>Stock</span><span>Status</span><span>Action</span></header>{visible.slice(0, limit).map((product) => <article key={product.id}><div className="inventory-name"><i style={{ background: product.accent }} /><span><b>{product.name}</b><small>{product.sku} · {product.category}</small></span></div><b>{formatMoney(product.price)}</b><div className="stock-edit"><Input inputMode="numeric" value={stockDraft[product.id] ?? String(product.stock)} onChange={(event) => setStockDraft((value) => ({ ...value, [product.id]: event.target.value }))} disabled={!canWrite} />{canWrite && <button onClick={() => void saveStock(product)} aria-label="Save stock"><Save /></button>}</div><em data-status={product.status}>{product.status}</em><div className="row-actions">{canWrite && <><button onClick={() => openEdit(product)}><Edit3 /></button><button onClick={() => void archive(product)}><Archive /></button></>}</div></article>)}</section>{visible.length > limit && <div className="load-more"><Button variant="outline" onClick={() => setLimit((value) => value + 100)}>Load more inventory</Button></div>}{editing && <div className="ops-modal-backdrop"><section className="ops-modal"><header><div><span>{editing === "new" ? "New Medusa product" : "Edit product"}</span><h2>{editing === "new" ? "ADD TO WALL" : "EDIT SIGNAL"}</h2></div><button onClick={() => setEditing(null)}><X /></button></header><div className="form-grid"><label>Product name<Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>SKU<Input value={form.sku} disabled={editing !== "new"} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label><label>Price<Input type="number" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="published">Published</option><option value="draft">Draft</option></select></label><label className="wide">Exact product photo<Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="/product-images/UPC.jpg or verified source URL" /></label><label className="wide">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div><Button onClick={() => void saveProduct()}><Save /> Save product</Button></section></div>}</div>;
}
