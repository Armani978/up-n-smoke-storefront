# Fall After Dark — seasonal asset contract

Art direction: near-black with a forest-green cast, warm amber/orange lantern light,
autumn foliage. **No text, logos, prices, buttons, nav, product photography or
storefront building is baked into any file.** All live text is the frontend's job.

## Heroes

| File | Dimensions | webp | jpg | avif |
|---|---|---|---|---|
| `hero-halloween-desktop.{webp,jpg,avif}` | 2400 × 1200 | 26,322 B | 48,313 B | 18,275 B |
| `hero-harvest-desktop.{webp,jpg,avif}` | 2400 × 1200 | 27,598 B | 50,310 B | 19,736 B |
| `hero-halloween-mobile.{webp,jpg,avif}` | 1080 × 1350 | 20,598 B | 38,959 B | 16,619 B |
| `hero-harvest-mobile.{webp,jpg,avif}` | 1080 × 1350 | 19,718 B | 38,784 B | 16,619 B |

All well inside budget (desktop ≤ 250 KB, mobile ≤ 150 KB). Serve `avif` → `webp` → `jpg`.

Halloween = carved, glowing pumpkins, mistier and eerier. Harvest = uncarved pumpkins,
warm lanterns, dry grass and more foliage.

## Focal points, object-position, text-safe zones

| Variant | Measured focal centre | Recommended `object-position` | Text-safe zone |
|---|---|---|---|
| Desktop (both) | 75% 75% | `72% 72%` | left **0–45%** (x < 1080px) |
| Mobile (both) | 52% 82% | `50% 78%` | top **0–45%** (y < 608px) |

The desktop focal is the pumpkin cluster, which occupies roughly x 48–100%, y 55–95%.
Mobile focal is lower-middle; the top 45% is deliberately empty sky.

**One correction to the values in use:** desktop vertical `65%` is ~10pp above the real
focal centre. On a hero box much shorter than 2:1 (`object-fit: cover`), `65%` slides the
visible window upward and clips the base of the pumpkins. `72%` keeps the cluster framed;
horizontal `70%` vs measured `75%` is within tolerance either way. Mobile `50% 78%` is fine
as-is. If the hero box stays near the native aspect ratio, none of this is visible.

## Loading background (dominant colour)

| Variant | Recommended | Measured text-zone mean | Measured whole-image mean |
|---|---|---|---|
| Halloween | `#0c0f0a` | `#050707` desktop / `#070808` mobile | `#140f07` / `#1a1108` |
| Harvest | `#0e1109` | `#070907` desktop / `#090a08` mobile | `#171108` / `#1d1409` |

Use the **recommended** column, not the whole-image mean. The image mean is a warm brown
pulled up by the lit focal area; painting that behind a not-yet-loaded hero would flash a
light panel under the headline. The recommended values match the quiet zone where text
actually sits and sit in the `--fall-bg #070a07` family.

## Contrast (measured, worst case)

Against the brightest 48×48 block anywhere in the text-safe zone, using cream `#f3ead2`:

| Variant | Worst-case contrast |
|---|---|
| halloween-desktop | 14.6:1 |
| harvest-desktop | 13.7:1 |
| halloween-mobile | 10.1:1 |
| harvest-mobile | 10.8:1 |

Neon `#f4ff35` measures slightly higher in every case. All pass AA comfortably, so no
scrim is required for the headline — though one is still wise if copy ever extends past
the safe zone into the lit side.

## Decorative leaves

`leaf-1.svg` (1,050 B), `leaf-2.svg` (1,061 B), `leaf-3.svg` (849 B) — `viewBox="0 0 140 160"`,
intrinsic 140×160, transparent, gradient fill plus vein strokes, no raster, no text.
Decorative only; render `aria-hidden`.

| File | Shape | Palette | Author |
|---|---|---|---|
| `leaf-1.svg` | broad-lobed maple | amber `#ffb347` → `#ff9a1f` → `#e8641a` | A1 (lead) |
| `leaf-2.svg` | broad-lobed maple, rotated −14° | orange `#f7822c` → `#e8641a` → `#a8400f` | A1 (lead) |
| `leaf-3.svg` | lobed oak | brown `#a86a32` → `#5a3418` | A1 (lead) |

All three are lead-authored. Verified at 140×160 and again at 56×64, with an
edge-touching-pixel count of 0 on all three, so nothing clips the viewBox.

> **Revision history — these files took three attempts, and the first two were defects.**
>
> 1. **Original (A1).** `leaf-1` and `leaf-2` were 14-point symmetrical star polygons —
>    points alternating in and out around a circle. Geometrically valid, but at the 140×160
>    render size they read as sunbursts, not leaves. This was the original defect. It
>    survived initial authoring because the polygons were never rasterised and looked at.
> 2. **First replacement (A2).** Replaced with the curved maple path used in the hero art.
>    An improvement — five lobes and a petiole rather than fourteen points — but the lobes
>    tapered to sharp tips, so at size they still read as pointed starbursts. A2 reported
>    them as "five broad lobes, unmistakably maple"; the render did not support that
>    description. Correct method, overstated conclusion.
> 3. **Final (A1).** Rebuilt in the rounded-curve style of `leaf-3`, which was the one shape
>    rendering correctly from the start. Broad lobes with rounded shoulders and a thick
>    petiole; reads as maple at both 140×160 and 56×64.
>
> Every revision kept the same filenames, viewBox, intrinsic dimensions and colour families,
> so no wiring or CSS changed at any point — only the leaf-frame crops needed re-shooting.
>
> The transferable lesson: render vector assets at their real display size and look at the
> output before calling them done. Both defects were invisible in the path data and obvious
> in the pixels — and the second one shows that rendering is only half of it; the reported
> conclusion has to match what the render actually shows.

## How this art was produced

Procedurally generated, then rasterised. There was no image-generation model available in
the session that produced these, so nothing here is AI-photographic or photographic at all.

- **Tooling:** Node + `sharp` 0.35.3 (libvips 8.18.3), already a dependency of this repo.
  No new packages were installed. Scenes are authored as layered SVG — gradients, clipped
  ellipse rib curves, recursive branch geometry, hand-written leaf paths — rasterised by
  librsvg, then composited in `sharp` with `screen`/`over` blends, Gaussian blur for mist,
  bloom and depth-of-field, and a fine noise overlay to prevent gradient banding.
- **Lighting:** a dim amber emissive pass drives the bloom, so carved faces and lantern
  flames read as warm light rather than clipping to white.
- **Generated vs reused:** 100% generated. Nothing in `public/promos/`,
  `public/product-images/`, `public/videos/` or `src/assets/up-n-smoke-logo.png` was reused
  or traced. The existing storefront photos and product shots were deliberately excluded —
  baking a real product or the real shopfront into seasonal decoration would imply a claim
  the art has no business making. The logo is untouched and remains the header's job.
- **Deterministic:** each scene uses a seeded PRNG, so a rebuild reproduces the same image.

### Limitation to disclose

These are **vector/procedural illustrations, not photography and not a painted
illustration**. They are clean, atmospheric and cohesive, and they hold up as a hero
backdrop at the sizes above — but at close inspection the pumpkins, trees and leaves are
clearly constructed from geometric primitives. If the brand later wants photographic or
hand-illustrated autumn art, these are a solid placeholder to swap out, and the frontend
contract (paths, dimensions, focal points, safe zones, fallback colours) would not change.
