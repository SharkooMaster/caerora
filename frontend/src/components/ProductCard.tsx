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
      className="group block lift"
      onClick={() =>
        track({ event_type: "select_item", product_slug: product.slug, meta: { position } })
      }
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-cream shadow-card">
        {image ? (
          <SmartImage
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-2xl text-rose">
            Caerora
          </div>
        )}
        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/80 px-3 py-1 text-[10px] uppercase tracking-wider text-ivory">
            Sold out
          </span>
        )}
        {product.is_featured && product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-rose/90 px-3 py-1 text-[10px] uppercase tracking-wider text-white">
            Bestseller
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-serif text-lg text-espresso">{product.name}</h3>
        <p className="line-clamp-1 text-xs text-taupe">{product.tagline}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-espresso">
            {product.price_from ? `From ${formatMoney(product.price_from)}` : ""}
          </span>
          <RatingSummary average={product.review_stats.average} count={product.review_stats.count} />
        </div>
      </div>
    </Link>
  );
}
