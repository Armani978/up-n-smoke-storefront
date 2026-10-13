export const PRODUCT_IMAGE_FALLBACK = "/up-n-smoke-logo.png";

const verifiedProductImages: Readonly<Record<string, string>> = {
  "784762990235": "/product-images/784762990235.jpg",
  "850046584060": "/product-images/850046584060.jpg",
  "10036882107176": "/product-images/10036882107176.jpg",
  "894236021225": "/product-images/894236021225.jpg",
  "784762991300": "/product-images/784762991300.jpg",
};

const knownPlaceholderFragments = [
  "product-placeholder",
  "up-n-smoke-logo",
  "placehold.co",
  "1609592806596",
];

export function isProductImageFallback(source?: string | null) {
  if (!source?.trim()) return true;
  return knownPlaceholderFragments.some((fragment) => source.includes(fragment));
}

export function resolveProductImage(source: string | null | undefined, sku: string) {
  const verifiedImage = verifiedProductImages[sku.trim()];
  if (verifiedImage) return verifiedImage;
  return isProductImageFallback(source) ? PRODUCT_IMAGE_FALLBACK : source!.trim();
}
