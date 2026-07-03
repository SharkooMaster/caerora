"use client";
import { useEffect, useRef, useState } from "react";
import type { ProductDetail, ProductVariant } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { RatingSummary } from "./Rating";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/tracker";
import { demoProductImage, categoryImage } from "@/lib/images";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/config";
import { TruckIcon, ReturnIcon, LockIcon } from "./icons";
import { ProductGallery } from "./ProductGallery";
import { displayName } from "./ProductCard";

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const firstAvailable = product.variants.find((v) => v.stock > 0) || product.variants[0];
  const [variant, setVariant] = useState<ProductVariant | undefined>(firstAvailable);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const enteredAt = useRef<number>(Date.now());

  // Known demo slugs use curated art (their DB images are placeholders); real
  // SKUs use their supplier images; a category shot is the last-resort fallback.
  const demo = demoProductImage(product.slug);
  const apiImages = product.images.map((i) => i.image).filter((s): s is string => !!s);
  const chosen = demo
    ? [demo, categoryImage(product.category?.slug)]
    : apiImages.length
      ? apiImages
      : [categoryImage(product.category?.slug)];
  const gallery: string[] = Array.from(new Set(chosen.filter((s): s is string => !!s)));

  // view_item on mount + product_dwell on unmount (time-on-product).
  useEffect(() => {
    enteredAt.current = Date.now();
    track({
      event_type: "view_item",
      product_slug: product.slug,
      value: firstAvailable ? parseFloat(firstAvailable.price) : undefined,
      currency: "eur",
    });
    return () => {
      const dwell = Date.now() - enteredAt.current;
      track({ event_type: "product_dwell", product_slug: product.slug, dwell_ms: dwell });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  function handleAdd() {
    if (!variant) return;
    addItem({
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: variant.name,
      price: parseFloat(variant.price),
      image: gallery[0] || null,
    });
    track({
      event_type: "add_to_cart",
      product_slug: product.slug,
      variant_id: variant.id,
      value: parseFloat(variant.price),
      currency: "eur",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const compareAt = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
  const price = variant ? parseFloat(variant.price) : 0;

  return (
    <div className="grid gap-10 md:grid-cols-2">
      {/* Gallery: swipe, click to enlarge, zoom */}
      <ProductGallery images={gallery} alt={product.name} />

      {/* Info */}
      <div>
        <div className="flex items-center gap-3">
          {product.brand && (
            <span className="text-xs font-medium uppercase tracking-widest text-plum">
              {product.brand}
            </span>
          )}
          {product.category && <p className="eyebrow">{product.category.name}</p>}
        </div>
        <h1 className="heading-serif mt-2 text-4xl">{displayName(product.name, product.brand)}</h1>
        <p className="mt-2 text-taupe">{product.tagline}</p>
        <div className="mt-3">
          <RatingSummary average={product.review_stats.average} count={product.review_stats.count} />
        </div>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-serif text-3xl text-espresso">{formatMoney(price)}</span>
          {compareAt && compareAt > price && (
            <>
              <span className="text-base text-taupe line-through">{formatMoney(compareAt)}</span>
              <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 text-xs font-medium text-terracotta">
                Save {formatMoney(compareAt - price)}
              </span>
            </>
          )}
        </div>

        {/* Variant selector */}
        <div className="mt-6">
          <p className="label">
            {product.variants.length > 1 ? "Shade / size" : "Option"}: <span className="text-espresso">{variant?.name}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.stock <= 0;
              const selected = v.id === variant?.id;
              return (
                <button
                  key={v.id}
                  disabled={out}
                  onClick={() => setVariant(v)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${
                    selected ? "border-espresso bg-espresso text-ivory" : "border-taupe/30 text-espresso hover:border-espresso"
                  } ${out ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {v.swatch_hex && (
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-white/40"
                      style={{ backgroundColor: v.swatch_hex }}
                    />
                  )}
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Honest urgency: only when stock is genuinely low */}
        {variant && variant.stock > 0 && variant.stock <= 5 && (
          <p className="mt-4 flex items-center gap-2 text-xs font-medium text-terracotta">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-terracotta" />
            </span>
            Only {variant.stock} left in this shade
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAdd}
            disabled={!variant || variant.stock <= 0}
            className="btn-primary btn-lg flex-1"
          >
            {variant && variant.stock > 0
              ? added
                ? "Added to bag \u2713"
                : `Add to bag \u00b7 ${formatMoney(price)}`
              : "Sold out"}
          </button>
        </div>

        {/* Trust signals at the point of decision */}
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-cream/70 p-3 text-center">
          <div className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider text-taupe">
            <span className="h-[18px] w-[18px] text-plum">
              <TruckIcon />
            </span>
            Free over {formatMoney(FREE_SHIPPING_THRESHOLD)}
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-taupe/15 text-[10px] uppercase tracking-wider text-taupe">
            <span className="h-[18px] w-[18px] text-plum">
              <ReturnIcon />
            </span>
            30-day returns
          </div>
          <div className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider text-taupe">
            <span className="h-[18px] w-[18px] text-plum">
              <LockIcon />
            </span>
            Secure checkout
          </div>
        </div>

        <div className="mt-8 space-y-5 border-t border-taupe/15 pt-6 text-sm leading-relaxed text-espresso/90">
          {product.description && <p>{product.description}</p>}
          {product.brand_copy && (
            <div>
              <h3 className="eyebrow mb-1">Why you'll trust it</h3>
              <p className="text-taupe">{product.brand_copy}</p>
            </div>
          )}
          {product.how_to_use && (
            <div>
              <h3 className="eyebrow mb-1">How to use</h3>
              <p className="text-taupe">{product.how_to_use}</p>
            </div>
          )}
          {product.ingredients && (
            <div>
              <h3 className="eyebrow mb-1">Ingredients</h3>
              <p className="text-taupe">{product.ingredients}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
