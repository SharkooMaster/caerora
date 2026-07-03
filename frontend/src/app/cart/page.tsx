"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const { lines, setQuantity, removeItem } = useCart();
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <div className="container-page py-12">
      <h1 className="heading-serif mb-8 text-4xl">Your bag</h1>
      {lines.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl text-taupe">Your bag is empty.</p>
          <Link href="/shop" className="btn-primary mt-6">Discover products</Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul className="divide-y divide-taupe/15">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4 py-5">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-taupe/10">
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
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/product/${l.productSlug}`} className="font-serif text-lg text-espresso hover:text-rose">
                      {l.productName}
                    </Link>
                    <span className="text-xs text-taupe">{l.variantName}</span>
                    <div className="mt-auto flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-taupe/30 px-2 py-1 text-sm">
                        <button onClick={() => setQuantity(l.variantId, l.quantity - 1)} className="px-1 text-taupe">-</button>
                        <span>{l.quantity}</span>
                        <button onClick={() => setQuantity(l.variantId, l.quantity + 1)} className="px-1 text-taupe">+</button>
                      </div>
                      <button onClick={() => removeItem(l.variantId)} className="text-xs text-taupe hover:text-terracotta">
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="text-sm text-espresso">{formatMoney(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="card h-fit p-6">
            <h2 className="font-serif text-xl text-espresso">Summary</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-taupe">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="mt-1 text-[11px] text-taupe">Shipping &amp; taxes calculated at checkout.</p>
            <Link href="/checkout" className="btn-primary mt-6 w-full">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
