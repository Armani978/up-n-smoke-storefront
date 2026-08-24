"use client";

import { CheckCircle2, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { StorefrontPromo } from "@/lib/promo";
import type { AdminProduct } from "@/lib/types";

const WARNING = "WARNING: This product contains nicotine. Nicotine is an addictive chemical.";

function clonePromo(promo: StorefrontPromo): StorefrontPromo {
  return { ...promo, products: promo.products.map((product) => ({ ...product })) };
}

export function PromoEditor() {
  const [saved, setSaved] = useState<StorefrontPromo | null>(null);
  const [draft, setDraft] = useState<StorefrontPromo | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/employee/promo", { cache: "no-store" }),
      fetch("/api/employee/products", { cache: "no-store" }),
    ]).then(async ([promoResponse, productsResponse]) => {
      if (!promoResponse.ok || !productsResponse.ok) throw new Error("Promo Studio could not load live storefront data.");
      const promoPayload = await promoResponse.json() as { promo: StorefrontPromo };
      const productsPayload = await productsResponse.json() as { products: AdminProduct[] };
      if (!active) return;
      setSaved(clonePromo(promoPayload.promo));
      setDraft(clonePromo(promoPayload.promo));
      setProducts(productsPayload.products.filter((product) => product.status === "published"));
    }).catch((reason) => {
      if (active) setError(reason instanceof Error ? reason.message : "Promo Studio could not load.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const productOptions = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);

  function update<K extends keyof StorefrontPromo>(key: K, value: StorefrontPromo[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setSuccess(false);
  }

  function chooseProduct(index: number, handle: string) {
    const selected = productOptions.find((product) => product.handle === handle);
    setDraft((current) => {
      if (!current) return current;
      const next = current.products.map((product) => ({ ...product }));
      if (selected) next[index] = { handle: selected.handle, label: selected.name, imageUrl: selected.image };
      else next[index] = { ...next[index], handle: "" };
      return { ...current, products: next };
    });
    setSuccess(false);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch("/api/employee/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await response.json() as { promo?: StorefrontPromo; error?: string };
      if (!response.ok || !payload.promo) throw new Error(payload.error || "The promo could not be saved.");
      setSaved(clonePromo(payload.promo));
      setDraft(clonePromo(payload.promo));
      setSuccess(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The promo could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="ops-page promo-editor-state"><LoaderCircle className="spin" /> Loading Promo Studio</div>;
  if (!draft || !saved) return <div className="ops-page promo-editor-state is-error">{error || "Promo Studio is unavailable."}</div>;

  return (
    <div className="ops-page promo-studio-page">
      <header className="ops-heading promo-studio-heading">
        <div><span>Storefront campaign / manager access</span><h1>PROMO<br /><em>STUDIO.</em></h1></div>
        <p>Edit the live homepage campaign.<br />Changes publish after save.</p>
      </header>

      {success && <div className="promo-save-banner" role="status"><CheckCircle2 /> Promo updated on the storefront.</div>}

      <div className="promo-studio-grid">
        <form className="promo-editor-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <div className="promo-switch-row">
            <div><strong>Campaign status</strong><small>{draft.active ? "Visible on the storefront" : "Standard homepage is visible"}</small></div>
            <button className="promo-switch" type="button" role="switch" aria-checked={draft.active} aria-label="Campaign active" onClick={() => update("active", !draft.active)} />
          </div>

          <label className="promo-field"><span>Campaign name</span><input value={draft.campaignName} maxLength={80} onChange={(event) => update("campaignName", event.target.value)} required /></label>
          <label className="promo-field"><span>Headline</span><input value={draft.headline} maxLength={90} onChange={(event) => update("headline", event.target.value)} required /></label>
          <label className="promo-field"><span>Supporting copy</span><textarea value={draft.supportingCopy} maxLength={220} onChange={(event) => update("supportingCopy", event.target.value)} required /></label>
          <label className="promo-field"><span>Primary button label</span><input value={draft.ctaLabel} maxLength={32} onChange={(event) => update("ctaLabel", event.target.value)} required /></label>
          <label className="promo-field"><span>Primary button link</span><input value={draft.ctaHref} maxLength={300} onChange={(event) => update("ctaHref", event.target.value)} required /><small>Use a storefront path such as /menu or a full HTTPS URL.</small></label>
          <label className="promo-field"><span>Hero image URL</span><input value={draft.heroImageUrl} maxLength={500} onChange={(event) => update("heroImageUrl", event.target.value)} required /><small>Use official campaign photography. Local /promos paths and HTTPS images are supported.</small></label>

          <div className="promo-field">
            <span>Featured products</span>
            <div className="promo-product-selects">
              {draft.products.map((selection, index) => (
                <select key={index} value={selection.handle} onChange={(event) => chooseProduct(index, event.target.value)} aria-label={`Featured product ${index + 1}`}>
                  <option value="">{selection.handle ? "Keep campaign image" : selection.label}</option>
                  {productOptions.map((product) => <option key={product.id} value={product.handle}>{product.name}</option>)}
                </select>
              ))}
            </div>
            <small>Select up to two live products. Promo defaults stay in place until matching inventory is selected.</small>
          </div>

          <div className="promo-field">
            <span>Nicotine warning</span>
            <div className="promo-warning-lock" aria-label="Locked nicotine warning">{WARNING}</div>
            <small>The standard warning is locked and always visible above the storefront header.</small>
          </div>

          {error && <p className="promo-form-error" role="alert">{error}</p>}
          <div className="promo-form-actions">
            <button type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? "Saving" : "Save changes"}</button>
            <button type="button" disabled={saving} onClick={() => { setDraft(clonePromo(saved)); setError(""); setSuccess(false); }}><RotateCcw /> Reset draft</button>
          </div>
        </form>

        <aside className="promo-live-preview" aria-label="Live storefront preview">
          <header>LIVE PREVIEW / STOREFRONT HERO</header>
          <div className="promo-preview-browser">
            <div className="nicotine-warning is-compact"><strong>{WARNING}</strong></div>
            <div className="promo-preview-head"><b>UP N SMOKE</b><nav><span>Shop</span><span>Account</span><span>Menu</span></nav></div>
            <div className="promo-preview-hero">
              {/* The preview accepts manager-provided HTTPS sources that are not known at build time. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.heroImageUrl} alt="Promo preview" />
              <h2>{draft.headline}</h2>
              <p>{draft.supportingCopy}</p>
              <b>{draft.ctaLabel}</b>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
