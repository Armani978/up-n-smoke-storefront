"use client";

import Image, { type ImageProps, type StaticImageData } from "next/image";
import { useState } from "react";
import logo from "@/src/assets/up-n-smoke-logo.png";
import { isProductImageFallback } from "@/lib/product-images";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
};

function initialSource(source?: string | null): string | StaticImageData {
  return isProductImageFallback(source) ? logo : source!.trim();
}

export function ProductImage({ src, alt, className, onError, ...props }: ProductImageProps) {
  const requestedSource = initialSource(src);
  const normalizedSource = typeof requestedSource === "string" ? requestedSource : "";
  const [failedSource, setFailedSource] = useState("");
  const showingLogo = requestedSource === logo || failedSource === normalizedSource;
  const resolvedSource = showingLogo ? logo : requestedSource;

  return (
    <Image
      {...props}
      src={resolvedSource}
      alt={alt}
      unoptimized
      className={[className, showingLogo ? "product-image-fallback" : ""].filter(Boolean).join(" ")}
      onError={(event) => {
        onError?.(event);
        if (!showingLogo) setFailedSource(normalizedSource);
      }}
    />
  );
}
