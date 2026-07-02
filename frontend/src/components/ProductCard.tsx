"use client";
import Link from "next/link";
import type { ProductListItem } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { RatingSummary } from "./Rating";
import { track } from "@/lib/tracker";
import { SmartImage } from "./SmartImage";
import { demoProductImage, categoryImage } from "@/lib/images";

export function ProductCard({ product, position }: { product: ProductListItem; position?: number }) {
  // Real supplier photo wins; demo slugs get curated art; category shot is the
  // last-resort fallback so a product is never image-less.
  const image =
    demoProductImage(product.slug) ||
    product.primary_image ||
    categoryImage(product.category?.slug);
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      onClick={() =>
        track({ event_type: "select_item", product_slug: product.slug, meta: { position } })
      }
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-cream shadow-card ring-1 ring-taupe/10 transition-shadow duration-300 group-hover:shadow-soft">
        {image ? (
          <SmartImage
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-2xl text-rose">
            Caerora
          </div>
        )}

        {/* Hover scrim + shop prompt */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {product.in_stock && (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="block rounded-full bg-ivory/95 py-2.5 text-center text-[11px] font-medium uppercase tracking-widest text-espresso shadow-card backdrop-blur">
              Shop now
            </span>
          </div>
        )}

        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/85 px-3 py-1 text-[10px] uppercase tracking-widest text-ivory">
            Sold out
          </span>
        )}
        {product.is_featured && product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-rose/95 px-3 py-1 text-[10px] uppercase tracking-widest text-white shadow-card">
            Bestseller
          </span>
        )}
      </div>
      <div className="mt-3.5 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg leading-tight text-espresso transition-colors group-hover:text-plum">
            {product.name}
          </h3>
          <span className="whitespace-nowrap pt-0.5 text-sm text-espresso">
            {product.price_from ? formatMoney(product.price_from) : ""}
          </span>
        </div>
        <p className="line-clamp-1 text-xs text-taupe">{product.tagline}</p>
        <div className="pt-0.5">
          <RatingSummary average={product.review_stats.average} count={product.review_stats.count} />
        </div>
      </div>
    </Link>
  );
}
