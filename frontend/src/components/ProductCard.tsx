"use client";
import Link from "next/link";
import { useState } from "react";
import type { ProductListItem } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { RatingSummary } from "./Rating";
import { track } from "@/lib/tracker";
import { SmartImage } from "./SmartImage";
import { demoProductImage, categoryImage, isUnsplash } from "@/lib/images";
import { useCart } from "@/lib/cart";
import { BagIcon } from "./icons";

/**
 * Strip the brand from the start of a product name so cards can show
 * "NYX PROFESSIONAL MAKEUP / Butter Gloss" instead of repeating the brand.
 * Matches as many leading words of the brand as the name shares.
 */
export function displayName(name: string, brand?: string): string {
  if (!brand) return name;
  const nameLower = name.toLowerCase();
  const words = brand.split(/\s+/);
  for (let n = words.length; n > 0; n--) {
    const prefix = words.slice(0, n).join(" ").toLowerCase();
    if (nameLower.startsWith(prefix + " ")) {
      const stripped = name.slice(prefix.length).trim();
      if (stripped) return stripped;
    }
  }
  return name;
}

export function ProductCard({ product, position }: { product: ProductListItem; position?: number }) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  // Real supplier photo wins; demo slugs get curated art; category shot is the
  // last-resort fallback so a product is never image-less.
  const image =
    demoProductImage(product.slug) ||
    product.primary_image ||
    categoryImage(product.category?.slug);

  const quick = product.quick_variant;
  const compareAt = quick?.compare_at_price ? parseFloat(quick.compare_at_price) : null;
  const price = quick ? parseFloat(quick.price) : null;
  const onSale = compareAt !== null && price !== null && compareAt > price;
  // Only one-tap add when there is a single option; multi-shade products go to
  // the PDP so the shopper picks their shade deliberately.
  const canQuickAdd = Boolean(quick) && (product.variant_count ?? 1) === 1;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!quick) return;
    addItem({
      variantId: quick.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: quick.name,
      price: parseFloat(quick.price),
      image: image || null,
    });
    track({
      event_type: "add_to_cart",
      product_slug: product.slug,
      variant_id: quick.id,
      value: parseFloat(quick.price),
      currency: "eur",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      onClick={() =>
        track({ event_type: "select_item", product_slug: product.slug, meta: { position } })
      }
    >
      <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-card ring-1 ring-taupe/10 transition-shadow duration-300 group-hover:shadow-soft ${isUnsplash(image) ? "bg-cream" : "bg-white"}`}>
        {image ? (
          <SmartImage
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`transition-transform duration-[900ms] ease-out group-hover:scale-105 ${
              isUnsplash(image) ? "object-cover" : "object-contain p-4"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-2xl text-rose">
            Caerora
          </div>
        )}

        {/* Scrim: always visible on touch, hover-reveal on desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/40 via-transparent to-transparent transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />

        {/* CTA: quick-add for single-option products, otherwise choose-shade */}
        {product.in_stock && (
          <div className="absolute inset-x-3 bottom-3 transition-all duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
            {canQuickAdd ? (
              <button
                onClick={quickAdd}
                aria-label={`Add ${product.name} to bag`}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[11px] font-medium uppercase tracking-widest shadow-card backdrop-blur transition-colors duration-300 ${
                  added ? "bg-plum text-ivory" : "bg-ivory/95 text-espresso hover:bg-espresso hover:text-ivory"
                }`}
              >
                <span className="h-3.5 w-3.5">
                  <BagIcon />
                </span>
                {added ? "Added to bag \u2713" : "Add to bag"}
              </button>
            ) : (
              <span className="block rounded-full bg-ivory/95 py-2.5 text-center text-[11px] font-medium uppercase tracking-widest text-espresso shadow-card backdrop-blur">
                {(product.variant_count ?? 0) > 1 ? "Choose shade" : "Shop now"}
              </span>
            )}
          </div>
        )}

        {/* Badges */}
        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/85 px-3 py-1 text-[10px] uppercase tracking-widest text-ivory">
            Sold out
          </span>
        )}
        {product.in_stock && onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-terracotta px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow-card">
            Save {Math.round(((compareAt! - price!) / compareAt!) * 100)}%
          </span>
        )}
        {product.is_featured && product.in_stock && !onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-rose/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white shadow-card">
            Best seller
          </span>
        )}
      </div>

      <div className="mt-3.5 space-y-1">
        {product.brand && (
          <p className="truncate text-[10px] font-medium uppercase tracking-widest text-plum">{product.brand}</p>
        )}
        {/* Mobile: name and price stack so long names don't squeeze against the
            price. Desktop keeps them side by side. */}
        <div className="flex flex-col gap-0.5 md:flex-row md:items-start md:justify-between md:gap-2">
          <h3 className="line-clamp-2 font-serif text-base leading-snug text-espresso transition-colors group-hover:text-plum md:text-lg md:leading-tight">
            {displayName(product.name, product.brand)}
          </h3>
          <span className="flex items-baseline gap-1.5 whitespace-nowrap text-sm md:pt-0.5">
            {onSale && (
              <span className="text-xs text-taupe line-through">{formatMoney(compareAt!)}</span>
            )}
            <span className={onSale ? "font-medium text-terracotta" : "text-espresso"}>
              {product.price_from ? formatMoney(product.price_from) : ""}
            </span>
          </span>
        </div>
        <p className="line-clamp-1 text-xs text-taupe">{product.tagline}</p>
        <div className="flex items-center justify-between pt-0.5">
          <RatingSummary average={product.review_stats.average} count={product.review_stats.count} />
          {(product.variant_count ?? 0) > 1 && (
            <span className="text-[10px] uppercase tracking-wider text-taupe">
              {product.variant_count} shades
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
