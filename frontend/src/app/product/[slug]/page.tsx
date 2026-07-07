import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { ProductDetail, ProductListItem, Review, Testimonial } from "@/lib/types";
import { ProductDetailView } from "@/components/ProductDetailView";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";
import { TestimonialCards } from "@/components/Testimonials";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Faq } from "@/components/Faq";
import { demoProductImage } from "@/lib/images";

export const revalidate = 120;

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    return await api.product(slug);
  } catch {
    return null;
  }
}

/** Same category first, then same brand, then anything else — up to 4 cards. */
async function getRelated(product: ProductDetail): Promise<ProductListItem[]> {
  try {
    const all = (await api.products()).results.filter((p) => p.slug !== product.slug);
    const catSlug = product.category?.slug;
    const sameCategory = catSlug ? all.filter((p) => p.category?.slug === catSlug) : [];
    const sameBrand = product.brand ? all.filter((p) => p.brand === product.brand) : [];
    const picks: ProductListItem[] = [];
    const seen = new Set<string>();
    for (const list of [sameCategory, sameBrand, all]) {
      for (const p of list) {
        if (seen.has(p.slug)) continue;
        seen.add(p.slug);
        picks.push(p);
        if (picks.length >= 4) return picks;
      }
    }
    return picks;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };
  const image = demoProductImage(product.slug) || product.images[0]?.image || undefined;
  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.tagline || product.description.slice(0, 160),
    alternates: { canonical: `/product/${product.slug}` },
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

  const [reviews, related, testimonials] = await Promise.all([
    api.reviews(params.slug).catch(() => [] as Review[]),
    getRelated(product),
    api.testimonials().catch(() => [] as Testimonial[]),
  ]);
  const priceFrom = product.variants.length
    ? Math.min(...product.variants.map((v) => parseFloat(v.price)))
    : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline || product.description,
    image: product.images.map((i) => i.image).filter(Boolean),
    brand: { "@type": "Brand", name: product.brand || "Caerora" },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://caerora.com"}/product/${product.slug}`,
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
    <div className="container-page pb-28 pt-10 md:pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView product={product} />

      {related.length > 0 && (
        <section className="mt-14 border-t border-taupe/15 pt-10 md:mt-20">
          <ProductListTracker list="related" />
          <div className="mb-6 flex items-end justify-between md:mb-8">
            <div>
              <p className="eyebrow-rose">Complete the look</p>
              <h2 className="display mt-2 text-3xl md:text-4xl">People also shop</h2>
            </div>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-widest text-espresso underline-offset-4 hover:text-rose hover:underline"
            >
              Shop all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} position={i} />
            ))}
          </div>
        </section>
      )}

      {/* Shrine PDP order: related → testimonials → comparison table → FAQ → reviews */}
      {testimonials.length > 0 && (
        <section className="mt-14 md:mt-20">
          <div className="mb-8 text-center">
            <p className="eyebrow-rose">Loved &amp; trusted</p>
            <h2 className="display mt-2 text-3xl md:text-4xl">What people are saying</h2>
          </div>
          <TestimonialCards testimonials={testimonials.slice(0, 3)} />
        </section>
      )}

      <ComparisonTable />

      <Faq />

      <ProductReviews slug={product.slug} initialReviews={reviews} stats={product.review_stats} />
    </div>
  );
}
