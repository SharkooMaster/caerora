import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { ProductDetail, Review } from "@/lib/types";
import { ProductDetailView } from "@/components/ProductDetailView";
import { ProductReviews } from "@/components/ProductReviews";
import { productImage } from "@/lib/images";

export const revalidate = 120;

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await api.product(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };
  const image =
    productImage(product.slug, product.category?.slug) || product.images[0]?.image || undefined;
  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.tagline || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.tagline,
      ...(image ? { images: [{ url: image }] } : {}),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const reviews: Review[] = await api.reviews(params.slug).catch(() => []);
  const priceFrom = product.variants.length
    ? Math.min(...product.variants.map((v) => parseFloat(v.price)))
    : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline || product.description,
    image: product.images.map((i) => i.image).filter(Boolean),
    brand: { "@type": "Brand", name: "Caerora" },
    offers: {
      "@type": "Offer",
      price: priceFrom.toFixed(2),
      priceCurrency: "EUR",
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.review_stats.count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.review_stats.average,
        reviewCount: product.review_stats.count,
      },
    }),
  };

  return (
    <div className="container-page py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} />
      <ProductReviews slug={product.slug} initialReviews={reviews} stats={product.review_stats} />
    </div>
  );
}
