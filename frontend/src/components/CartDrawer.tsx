"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/config";
import { LockIcon } from "./icons";

export function CartDrawer() {
  const { isOpen, close, lines, setQuantity, removeItem } = useCart();
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

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
                  You&apos;re <span className="font-medium text-plum">{formatMoney(remaining)}</span> away
                  from <span className="font-medium">free shipping</span>
                </>
              ) : (
                <span className="font-medium text-plum">
                  You&apos;ve unlocked free shipping &#10024;
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
              {lines.map((l) => (
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
                      <span className="text-sm font-medium text-espresso">{formatMoney(l.price * l.quantity)}</span>
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
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-taupe/15 bg-white/60 px-6 py-5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-taupe">Subtotal</span>
              <span className="font-serif text-xl text-espresso">{formatMoney(subtotal)}</span>
            </div>
            <p className="mb-4 text-[11px] text-taupe">Shipping &amp; taxes calculated at checkout.</p>
            <Link href="/checkout" onClick={close} className="btn-primary btn-lg w-full">
              Checkout &middot; {formatMoney(subtotal)}
            </Link>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-taupe">
              <span className="h-3.5 w-3.5">
                <LockIcon />
              </span>
              Secure checkout &middot; 30-day returns
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
