"use client"

import { LoaderCircle, Save } from "lucide-react"
import { useEffect, useState } from "react"

type StorefrontContent = {
  home: { kicker: string; titleTop: string; titleAccent: string; titleBottom: string; ctaLabel: string }
  menu: { eyebrow: string; titleTop: string; titleAccent: string; description: string }
}

export function StorefrontContentEditor() {
  const [content, setContent] = useState<StorefrontContent | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    void fetch("/api/employee/storefront-content", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { content?: StorefrontContent; error?: string }
        if (!response.ok || !payload.content) throw new Error(payload.error || "Storefront content could not load.")
        setContent(payload.content)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Storefront content could not load."))
  }, [])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content) return
    setSaving(true); setError(""); setSuccess(false)
    try {
      const response = await fetch("/api/employee/storefront-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) })
      const payload = await response.json() as { content?: StorefrontContent; error?: string }
      if (!response.ok || !payload.content) throw new Error(payload.error || "Storefront content could not be saved.")
      setContent(payload.content); setSuccess(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Storefront content could not be saved.")
    } finally { setSaving(false) }
  }

  if (!content) return <div className="ops-page promo-editor-state">{error || <><LoaderCircle className="spin" /> Loading storefront content</>}</div>

  return <div className="ops-page promo-studio-page">
    <header className="ops-heading promo-studio-heading"><div><span>Storefront copy / manager access</span><h1>PAGE<br /><em>CONTENT.</em></h1></div><p>Edit the live marketing copy.<br />Products and campaigns remain in their own editors.</p></header>
    <form className="promo-editor-form storefront-content-form" onSubmit={save}>
      <h2>Homepage fallback</h2>
      <p>Shown when no homepage campaign is active.</p>
      <label className="promo-field"><span>Intro line</span><input value={content.home.kicker} maxLength={90} onChange={(event) => setContent({ ...content, home: { ...content.home, kicker: event.target.value } })} required /></label>
      <div className="promo-form-grid">
        <label className="promo-field"><span>Heading line 1</span><input value={content.home.titleTop} maxLength={40} onChange={(event) => setContent({ ...content, home: { ...content.home, titleTop: event.target.value } })} required /></label>
        <label className="promo-field"><span>Accent line</span><input value={content.home.titleAccent} maxLength={40} onChange={(event) => setContent({ ...content, home: { ...content.home, titleAccent: event.target.value } })} required /></label>
        <label className="promo-field"><span>Heading line 3</span><input value={content.home.titleBottom} maxLength={40} onChange={(event) => setContent({ ...content, home: { ...content.home, titleBottom: event.target.value } })} required /></label>
      </div>
      <label className="promo-field"><span>Button label</span><input value={content.home.ctaLabel} maxLength={50} onChange={(event) => setContent({ ...content, home: { ...content.home, ctaLabel: event.target.value } })} required /></label>
      <h2>Menu header</h2>
      <label className="promo-field"><span>Eyebrow</span><input value={content.menu.eyebrow} maxLength={90} onChange={(event) => setContent({ ...content, menu: { ...content.menu, eyebrow: event.target.value } })} required /></label>
      <div className="promo-form-grid"><label className="promo-field"><span>Heading</span><input value={content.menu.titleTop} maxLength={60} onChange={(event) => setContent({ ...content, menu: { ...content.menu, titleTop: event.target.value } })} required /></label><label className="promo-field"><span>Accent</span><input value={content.menu.titleAccent} maxLength={60} onChange={(event) => setContent({ ...content, menu: { ...content.menu, titleAccent: event.target.value } })} required /></label></div>
      <label className="promo-field"><span>Description</span><textarea value={content.menu.description} maxLength={240} onChange={(event) => setContent({ ...content, menu: { ...content.menu, description: event.target.value } })} required /></label>
      {error && <p className="promo-form-error" role="alert">{error}</p>}
      {success && <p className="promo-save-banner" role="status">Storefront page content updated.</p>}
      <div className="promo-form-actions"><button type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />}{saving ? "Saving" : "Save live content"}</button></div>
    </form>
  </div>
}
