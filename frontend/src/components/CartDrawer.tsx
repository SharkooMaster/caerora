"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";

export function CartDrawer() {
  const { isOpen, close, lines, setQuantity, removeItem } = useCart();
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  return (
    <div
      className={`fixed inset-0 z-50 transition ${isOpen ? "visible" : "invisible"}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-espresso/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-taupe/15 px-6 py-5">
          <h2 className="font-serif text-xl text-espresso">Your bag</h2>
          <button onClick={close} className="text-xs uppercase tracking-wider text-taupe hover:text-espresso">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-serif text-2xl text-taupe">Your bag is empty</p>
              <Link href="/shop" onClick={close} className="btn-outline mt-6">
                Discover products
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-cream">
                    {l.image && (
                      <Image src={l.image} alt={l.productName} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-serif text-base text-espresso">{l.productName}</span>
                    <span className="text-xs text-taupe">{l.variantName}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <button onClick={() => setQuantity(l.variantId, l.quantity - 1)} className="px-2 text-taupe hover:text-espresso">-</button>
                        <span>{l.quantity}</span>
                        <button onClick={() => setQuantity(l.variantId, l.quantity + 1)} className="px-2 text-taupe hover:text-espresso">+</button>
                      </div>
                      <span className="text-sm text-espresso">{formatMoney(l.price * l.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(l.variantId)}
                    className="self-start text-xs text-taupe hover:text-terracotta"
                    aria-label="Remove"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-taupe/15 px-6 py-5">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-taupe">Subtotal</span>
              <span className="font-medium text-espresso">{formatMoney(subtotal)}</span>
            </div>
            <p className="mb-4 text-[11px] text-taupe">Shipping &amp; taxes calculated at checkout.</p>
            <Link href="/checkout" onClick={close} className="btn-primary w-full">
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
