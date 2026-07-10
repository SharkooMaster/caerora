"use client";
import { useEffect, useRef, useState } from "react";
import type { ProductDetail, ProductVariant } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { RatingSummary } from "./Rating";
import { useCart } from "@/lib/cart";
import { track } from "@/lib/tracker";
import { demoProductImage, categoryImage } from "@/lib/images";
import { FREE_SHIPPING_THRESHOLD, QTY_TIERS } from "@/lib/config";
import { TruckIcon, ReturnIcon, LockIcon } from "./icons";
import { ProductGallery, type GalleryMedia } from "./ProductGallery";
import { displayName } from "./ProductCard";
import { Markdown } from "./Markdown";

function InfoSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-taupe/15">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-espresso">{title}</span>
        <span
          aria-hidden
          className="text-xl font-light leading-none text-taupe transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-6 text-sm text-taupe">{children}</div>
    </details>
  );
}

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const firstAvailable = product.variants.find((v) => v.stock > 0) || product.variants[0];
  const [variant, setVariant] = useState<ProductVariant | undefined>(firstAvailable);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const enteredAt = useRef<number>(Date.now());

  // Known demo slugs use curated art (their DB images are placeholders); real
  // SKUs use their supplier media; a category shot is the last-resort fallback.
  const demo = demoProductImage(product.slug);
  const apiMedia: GalleryMedia[] = product.images
    .map((m): GalleryMedia | null =>
      m.video
        ? { type: "video", src: m.video, poster: m.image }
        : m.image
          ? { type: "image", src: m.image }
          : null,
    )
    .filter((m): m is GalleryMedia => !!m);
  const fallback = (demo ? [demo, categoryImage(product.category?.slug)] : [categoryImage(product.category?.slug)])
    .filter((s): s is string => !!s)
    .map((src): GalleryMedia => ({ type: "image", src }));
  const seen = new Set<string>();
  const gallery: GalleryMedia[] = (demo || !apiMedia.length ? fallback : apiMedia).filter((m) => {
    if (seen.has(m.src)) return false;
    seen.add(m.src);
    return true;
  });

  // Variant -> gallery index, so selecting a shade shows its photo.
  const [jump, setJump] = useState<{ index: number } | null>(null);
  function galleryIndexFor(v: ProductVariant): number {
    if (!v.image) return -1;
    const row = product.images.find((img) => img.id === v.image);
    const url = row?.video || row?.image;
    return url ? gallery.findIndex((m) => m.src === url) : -1;
  }
  function selectVariant(v: ProductVariant) {
    setVariant(v);
    const i = galleryIndexFor(v);
    if (i >= 0) setJump({ index: i });
  }

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
    addItem(
      {
        variantId: variant.id,
        productSlug: product.slug,
        productName: product.name,
        variantName: variant.name,
        price: parseFloat(variant.price),
        image: gallery.find((m) => m.type === "image")?.src || gallery[0]?.poster || null,
      },
      qty,
    );
    track({
      event_type: "add_to_cart",
      product_slug: product.slug,
      variant_id: variant.id,
      value: parseFloat(variant.price) * qty,
      currency: "eur",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  const compareAt = variant?.compare_at_price ? parseFloat(variant.compare_at_price) : null;
  const price = variant ? parseFloat(variant.price) : 0;

  const benefits = (product.benefits || "")
    .split("\n")
    .map((b) => b.replace(/^[✔✓•\-\s]+/, "").trim())
    .filter(Boolean);

  const activeTier = QTY_TIERS.find((t) => t.qty === qty) || QTY_TIERS[0];
  const bundleTotal = price * qty * (1 - activeTier.percentOff / 100);

  // Desktop sticky ATC (Shrine's sticky_atc block): appears once the in-page
  // buy button scrolls out of view. Mobile keeps the always-on bar.
  const buyBtnRef = useRef<HTMLButtonElement>(null);
  const [buyBoxVisible, setBuyBoxVisible] = useState(true);
  useEffect(() => {
    const el = buyBtnRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setBuyBoxVisible(entry.isIntersecting), {
      rootMargin: "-80px 0px 0px 0px",
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      {/* Gallery: swipe, click to enlarge, zoom */}
      <ProductGallery
        media={gallery}
        alt={product.name}
        jumpTo={jump}
        overlay={
          <span className="pointer-events-none absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#FFB3C7] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-black shadow-card">
            <span className="font-extrabold">Klarna.</span> Pay later available
          </span>
        }
      />

      {/* Info */}
      <div>
        <div className="flex items-center gap-3">
          {product.season ? (
            <span className="text-xs font-medium uppercase tracking-widest text-gold">
              {product.season.numeral}. {product.season.name}
            </span>
          ) : product.brand ? (
            <span className="text-xs font-medium uppercase tracking-widest text-navy">
              {product.brand}
            </span>
          ) : null}
          {product.category && <p className="eyebrow">{product.category.name}</p>}
        </div>
        <h1 className="heading-serif mt-2 text-3xl md:text-4xl">{displayName(product.name, product.brand)}</h1>
        <p className="mt-2 text-taupe">
          {product.tagline}
          {product.volume && (
            <span className="ml-2 whitespace-nowrap rounded-full bg-cream px-2.5 py-0.5 text-xs text-taupe">
              {product.volume}
            </span>
          )}
        </p>
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

        {benefits.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-espresso/90">
                <span className="mt-0.5 text-sage">✔</span>
                {b}
              </li>
            ))}
          </ul>
        )}

        {/* Variant selector */}
        <div className="mt-6">
          <p className="label">
            {product.variants.length > 1 ? "Size" : "Option"}: <span className="text-espresso">{variant?.name}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const out = v.stock <= 0;
              const selected = v.id === variant?.id;
              return (
                <button
                  key={v.id}
                  disabled={out}
                  onClick={() => selectVariant(v)}
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
            Only {variant.stock} left in this size
          </p>
        )}

        {/* Bundle & Save quantity tiers */}
        <div className="mt-6">
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-plum">
            Bundle &amp; Save
          </p>
          <div className="space-y-2">
            {QTY_TIERS.map((t) => {
              const selected = qty === t.qty;
              const tierTotal = price * t.qty * (1 - t.percentOff / 100);
              const fullTotal = price * t.qty;
              const freeShip = tierTotal >= FREE_SHIPPING_THRESHOLD;
              return (
                <button
                  key={t.qty}
                  type="button"
                  onClick={() => setQty(t.qty)}
                  className={`relative flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                    selected ? "border-plum bg-plum/5" : "border-taupe/20 hover:border-taupe/40"
                  }`}
                >
                  {t.badge && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-plum px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ivory">
                      {t.badge}
                    </span>
                  )}
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-plum" : "border-taupe/40"
                      }`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-plum" />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-espresso">
                        Buy {t.qty === 1 ? "1" : `${t.qty}`}
                        {t.percentOff > 0 && ` — save ${t.percentOff}%`}
                      </span>
                      {(t.percentOff > 0 || freeShip) && (
                        <span className="block text-xs text-taupe">
                          {[t.percentOff > 0 ? `${formatMoney(fullTotal - tierTotal)} off` : null, freeShip ? "Free shipping" : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-serif text-lg text-espresso">{formatMoney(tierTotal)}</span>
                    {t.percentOff > 0 && (
                      <span className="block text-xs text-taupe line-through">{formatMoney(fullTotal)}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            ref={buyBtnRef}
            onClick={handleAdd}
            disabled={!variant || variant.stock <= 0}
            className="btn-primary btn-lg flex-1"
          >
            {variant && variant.stock > 0
              ? added
                ? "Added to bag \u2713"
                : `Add to bag \u00b7 ${formatMoney(bundleTotal)}`
              : "Sold out"}
          </button>
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs text-taupe">
          <span className="rounded bg-[#FFB3C7] px-1.5 py-0.5 text-[10px] font-extrabold text-black">Klarna.</span>
          Buy now, pay after delivery — or split into instalments.
        </p>

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

      </div>

      {/* Desktop sticky ATC: slides in when the buy button leaves the viewport. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 hidden border-t border-taupe/15 bg-ivory/95 shadow-soft backdrop-blur transition-transform duration-300 md:block ${
          buyBoxVisible ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="container-page flex items-center justify-between gap-6 py-3">
          <div className="flex min-w-0 items-center gap-4">
            {gallery[0] && (
              <span
                className="h-12 w-10 shrink-0 rounded-lg bg-white bg-contain bg-center bg-no-repeat ring-1 ring-taupe/10"
                style={{ backgroundImage: `url(${gallery.find((m) => m.type === "image")?.src || gallery[0].poster || ""})` }}
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-serif text-base text-espresso">{displayName(product.name, product.brand)}</p>
              <p className="text-sm text-taupe">
                {formatMoney(bundleTotal)}
                {activeTier.percentOff > 0 && (
                  <span className="ml-2 text-xs text-plum">Multi-buy {activeTier.percentOff}% off</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!variant || variant.stock <= 0}
            className="btn-primary shrink-0 px-10"
          >
            {variant && variant.stock > 0 ? (added ? "Added \u2713" : "Add to bag") : "Sold out"}
          </button>
        </div>
      </div>

      {/* Mobile: price + CTA were below the gallery fold, so keep them pinned.
          (The PDP page adds bottom padding so this bar never covers content.) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-taupe/15 bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-soft backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            {product.variants.length > 1 && (
              <p className="truncate text-[10px] uppercase tracking-wider text-taupe">{variant?.name}</p>
            )}
            <p className="font-serif text-xl leading-tight text-espresso">{formatMoney(price)}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={!variant || variant.stock <= 0}
            className="btn-primary flex-1"
          >
            {variant && variant.stock > 0 ? (added ? "Added to bag \u2713" : "Add to bag") : "Sold out"}
          </button>
        </div>
      </div>
    </div>

    {/* Full-width collapsible details under gallery + buy box. Description is
        open by default; the rest stays folded so the page ends near the CTA. */}
    {(product.description || product.brand_copy || product.how_to_use || product.ingredients) && (
      <div className="mt-10 border-t border-taupe/15 md:mt-14">
        {product.description && (
          <InfoSection title="Description" defaultOpen>
            <Markdown>{product.description}</Markdown>
            {product.brand_copy && (
              <div className="mt-4 rounded-xl bg-cream/70 p-4">
                <h4 className="eyebrow mb-1.5">Why you'll trust it</h4>
                <Markdown>{product.brand_copy}</Markdown>
              </div>
            )}
          </InfoSection>
        )}
        {product.how_to_use && (
          <InfoSection title="Fit & sizing">
            <Markdown>{product.how_to_use}</Markdown>
          </InfoSection>
        )}
        {product.ingredients && (
          <InfoSection title="Fabric & care">
            <Markdown>{product.ingredients}</Markdown>
          </InfoSection>
        )}
        <InfoSection title="Shipping & returns">
          <p className="mb-2">
            Orders are processed within 1–2 business days. Delivery takes 5–10 business days within the
            EU, and shipping is free on orders over {formatMoney(FREE_SHIPPING_THRESHOLD)}. You get a
            tracking number as soon as your order ships.
          </p>
          <p>Changed your mind? You have 30 days to return your order — easy and hassle-free.</p>
        </InfoSection>
        <InfoSection title="Payment & Klarna">
          <p>
            Pay securely by card, or choose <strong className="text-espresso">Klarna</strong> at checkout to
            buy now and pay after your delivery arrives — or split the amount into instalments. You never
            pay before you know your order is on its way.
          </p>
        </InfoSection>
      </div>
    )}

    {/* Guarantee block: answers "is this safe to buy?" right before reviews. */}
    <div className="mt-12 rounded-2xl bg-plum/5 px-6 py-10 text-center md:py-12">
      <h2 className="font-serif text-2xl text-espresso md:text-3xl">Love it — or your money back</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-taupe">
        We're confident you'll love your order. If you're not 100% happy, you have 30 days to return it —
        no questions asked. And with Klarna you don't pay until your delivery has arrived, so there's
        nothing to risk.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-taupe">
        <span>✔ 30-day returns</span>
        <span>✔ Pay after delivery with Klarna</span>
        <span>✔ Tracked shipping</span>
      </div>
    </div>
    </>
  );
}
