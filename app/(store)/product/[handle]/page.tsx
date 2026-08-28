import { ArrowLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuyPanel } from "@/components/storefront/product-buy-panel";
import { ProductImage } from "@/components/storefront/product-image";
import { getProduct } from "@/lib/medusa/catalog";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  return product ? { title: product.name, description: product.description } : { title: "Product not found" };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  return (
    <main className="product-page" style={{ "--signal": product.accent } as React.CSSProperties}>
      <Link href="/menu" className="back-link"><ArrowLeft /> Back to the wall</Link>
      <div className="product-stage">
        <div className="product-art">
          <div className="product-ribbon">{product.name}</div>
          <ProductImage src={product.image} alt={product.name} fill priority sizes="(max-width: 900px) 100vw, 55vw" />
          {product.signals.map((signal, index) => <span className={`detail-bubble detail-${index + 1}`} key={signal.label}><small>{signal.label}</small>{signal.value}</span>)}
        </div>
        <div className="product-copy">
          <span className="eyebrow">{product.category} / {product.sku}</span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <ul>
            <li><MapPin /> Pickup at 655 S Willow St</li>
          </ul>
          <ProductBuyPanel product={product} />
          <small className="age-note">Age-restricted products require valid government-issued ID at pickup.</small>
        </div>
      </div>
    </main>
  );
}
