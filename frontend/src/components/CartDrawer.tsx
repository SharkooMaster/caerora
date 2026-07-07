"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, qtyDiscountPercent } from "@/lib/config";
import { api } from "@/lib/api";
import type { ProductListItem } from "@/lib/types";
import { track } from "@/lib/tracker";
import { demoProductImage, categoryImage } from "@/lib/images";
import { LockIcon } from "./icons";

const CART_TIMER_MINUTES = 10;

/** Shrine-style "cart reserved" countdown. Starts when the drawer first opens
 *  with items; purely a nudge — nothing expires server-side. */
function CartTimer({ active }: { active: boolean }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let deadline = Number(sessionStorage.getItem("caerora-cart-deadline") || 0);
    if (!deadline || deadline < Date.now()) {
      deadline = Date.now() + CART_TIMER_MINUTES * 60_000;
      sessionStorage.setItem("caerora-cart-deadline", String(deadline));
    }
    const tick = () => setLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active || left === null || left <= 0) return null;
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <p className="flex items-center justify-center gap-1.5 bg-plum py-2 text-center text-xs text-ivory">
      <span aria-hidden>⏳</span>
      Your cart is reserved for{" "}
      <span className="font-semibold tabular-nums">
        {m}:{s.toString().padStart(2, "0")}
      </span>{" "}
      minutes
    </p>
  );
}

/** One-tap upsell row: a featured, single-variant product not already in the
 *  cart, added without leaving the drawer (Shrine's cart upsell block). */
function CartUpsell() {
  const { lines, addItem } = useCart();
  const [candidates, setCandidates] = useState<ProductListItem[]>([]);

  useEffect(() => {
    api
      .products()
      .then((res) =>
        setCandidates(
          res.results.filter(
            (p) => p.in_stock && p.quick_variant && (p.variant_count ?? 1) === 1,
          ),
        ),
      )
      .catch(() => {});
  }, []);

  const inCart = new Set(lines.map((l) => l.productSlug));
  // Impulse-add range only: an expensive upsell next to a €15 cart kills
  // trust. Prefer featured products, cheapest first.
  const affordable = candidates
    .filter((p) => !inCart.has(p.slug) && parseFloat(p.quick_variant!.price) <= 30)
    .sort((a, b) => parseFloat(a.quick_variant!.price) - parseFloat(b.quick_variant!.price));
  const pick = affordable.find((p) => p.is_featured) || affordable[0];
  if (!pick || !pick.quick_variant) return null;

  const image = demoProductImage(pick.slug) || pick.primary_image || categoryImage(pick.category?.slug);
  const price = parseFloat(pick.quick_variant.price);

  function add() {
    const quick = pick!.quick_variant!;
    addItem({
      variantId: quick.id,
      productSlug: pick!.slug,
      productName: pick!.name,
      variantName: quick.name,
      price,
      image: image || null,
    });
    track({
      event_type: "add_to_cart",
      product_slug: pick!.slug,
      variant_id: quick.id,
      value: price,
      currency: "eur",
      meta: { source: "cart_upsell" },
    });
  }

  return (
    <div className="mx-6 mb-2 flex items-center gap-3 rounded-xl bg-cream/70 p-3 ring-1 ring-taupe/10">
      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
        {image && (
          <Image src={image} alt={pick.name} fill className="object-contain p-1" sizes="48px" unoptimized />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-plum">You may also like</p>
        <p className="truncate text-sm text-espresso">{pick.name}</p>
        <p className="text-xs text-taupe">{formatMoney(price)}</p>
      </div>
      <button
        onClick={add}
        className="shrink-0 rounded-full bg-espresso px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ivory transition hover:bg-plum"
      >
        + Add
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { isOpen, close, lines, setQuantity, removeItem } = useCart();
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  // Mirror the server's automatic multi-buy discount so the drawer total
  // matches checkout (server recomputes; this is display-only).
  const multiBuy = lines.reduce(
    (sum, l) => sum + l.price * l.quantity * (qtyDiscountPercent(l.quantity) / 100),
    0,
  );
  const total = subtotal - multiBuy;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className={`fixed inset-0 z-50 transition ${isOpen ? "visible" : "invisible"}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-espresso/40 backdrop-blur-[2px] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <CartTimer active={isOpen && lines.length > 0} />
        <div className="flex items-center justify-between border-b border-taupe/15 px-6 py-5">
          <h2 className="font-serif text-xl text-espresso">
            Your bag
            {lines.length > 0 && (
              <span className="ml-2 text-sm text-taupe">
                ({lines.reduce((n, l) => n + l.quantity, 0)})
              </span>
            )}
          </h2>
          <button onClick={close} className="text-xs uppercase tracking-wider text-taupe hover:text-espresso">
            Close
          </button>
        </div>

        {/* Free-shipping progress: nudges shoppers toward the €45 threshold */}
        {lines.length > 0 && (
          <div className="border-b border-taupe/15 bg-cream/60 px-6 py-4">
            <p className="text-xs text-espresso">
              {remaining > 0 ? (
                <>
                  Spend <span className="font-medium text-plum">{formatMoney(remaining)}</span> more
                  to get <span className="font-medium">FREE shipping</span>
                </>
              ) : (
                <span className="font-medium text-plum">
                  Congrats! You&apos;ve unlocked FREE shipping &#127881;
                </span>
              )}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-taupe/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose to-plum transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-serif text-2xl text-taupe">Your bag is empty</p>
              <p className="mt-2 text-xs text-taupe">Free shipping on orders over {formatMoney(FREE_SHIPPING_THRESHOLD)}.</p>
              <Link href="/shop" onClick={close} className="btn-outline mt-6">
                Discover products
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {lines.map((l) => {
                const pct = qtyDiscountPercent(l.quantity);
                const lineFull = l.price * l.quantity;
                const lineTotal = lineFull * (1 - pct / 100);
                return (
                <li key={l.variantId} className="flex gap-4">
                  <Link
                    href={`/product/${l.productSlug}`}
                    onClick={close}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-taupe/10"
                  >
                    {l.image && (
                      <Image
                        src={l.image}
                        alt={l.productName}
                        fill
                        className={l.image.includes("unsplash") ? "object-cover" : "object-contain p-1.5"}
                        sizes="80px"
                        unoptimized
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col py-0.5">
                    <Link href={`/product/${l.productSlug}`} onClick={close} className="font-serif text-base leading-tight text-espresso hover:text-plum">
                      {l.productName}
                    </Link>
                    <span className="mt-0.5 text-xs text-taupe">{l.variantName}</span>
                    {pct > 0 && (
                      <span className="mt-1 w-fit rounded-full bg-plum/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-plum">
                        Multi-buy: {pct}% off
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-taupe/25">
                        <button
                          onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                          className="px-3 py-1 text-sm text-taupe transition hover:text-espresso"
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span className="min-w-5 text-center text-sm">{l.quantity}</span>
                        <button
                          onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                          className="px-3 py-1 text-sm text-taupe transition hover:text-espresso"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="flex items-baseline gap-1.5 text-sm font-medium text-espresso">
                        {pct > 0 && (
                          <span className="text-xs font-normal text-taupe line-through">{formatMoney(lineFull)}</span>
                        )}
                        {formatMoney(lineTotal)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(l.variantId)}
                    className="self-start p-1 text-taupe transition hover:text-terracotta"
                    aria-label={`Remove ${l.productName}`}
                  >
                    &times;
                  </button>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <>
            <CartUpsell />
            <div className="border-t border-taupe/15 bg-white/60 px-6 py-5">
              {multiBuy > 0 && (
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-taupe">Multi-buy savings</span>
                  <span className="font-medium text-plum">&minus;{formatMoney(multiBuy)}</span>
                </div>
              )}
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-taupe">Subtotal</span>
                <span className="font-serif text-xl text-espresso">{formatMoney(total)}</span>
              </div>
              <p className="mb-4 text-[11px] text-taupe">Shipping &amp; taxes calculated at checkout.</p>
              <Link href="/checkout" onClick={close} className="btn-primary btn-lg w-full">
                Checkout &middot; {formatMoney(total)}
              </Link>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-taupe">
                <span className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5">
                    <LockIcon />
                  </span>
                  Secure checkout
                </span>
                <span>30-day returns</span>
                <span className="rounded bg-[#FFB3C7] px-1.5 py-0.5 text-[9px] font-extrabold text-black">Klarna.</span>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
