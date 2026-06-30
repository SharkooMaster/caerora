"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/lib/cart";

export default function OrderConfirmationPage() {
  const params = useParams<{ number: string }>();
  const number = params.number;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    let tries = 0;
    let active = true;

    async function load() {
      try {
        const o = await api.order(number);
        if (!active) return;
        setOrder(o);
        // Poll a few times while the Stripe webhook confirms payment.
        if (o.payment_status === "pending" && tries < 6) {
          tries += 1;
          setTimeout(load, 2000);
        }
      } catch {
        if (active) setError(true);
      }
    }

    load();
    clear();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [number]);

  if (error) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="heading-serif text-3xl">Order not found</h1>
        <Link href="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="container-page py-20 text-center text-taupe">Loading your order...</div>;
  }

  const paid = order.payment_status === "paid";

  return (
    <div className="container-page max-w-2xl py-16">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose/15 text-2xl text-rose">
          {paid ? "\u2713" : "\u2026"}
        </div>
        <p className="eyebrow">{paid ? "Order confirmed" : "Order received"}</p>
        <h1 className="heading-serif mt-2 text-4xl">Thank you, {order.first_name}</h1>
        <p className="mt-3 text-taupe">
          {paid
            ? "Your payment was successful. A confirmation email is on its way."
            : "We are confirming your payment. This page will update automatically."}
        </p>
        <p className="mt-4 text-sm uppercase tracking-wider text-espresso">Order {order.number}</p>
      </div>

      <div className="card mt-10 p-6">
        <ul className="space-y-3">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between text-sm">
              <span className="text-espresso">
                {it.product_name} <span className="text-taupe">/ {it.variant_name}</span> &times; {it.quantity}
              </span>
              <span>{formatMoney(it.line_total, order.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 space-y-2 border-t border-taupe/15 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-taupe">Subtotal</span><span>{formatMoney(order.subtotal, order.currency)}</span></div>
          <div className="flex justify-between"><span className="text-taupe">Shipping ({order.shipping_method})</span><span>{formatMoney(order.shipping_total, order.currency)}</span></div>
          {parseFloat(order.tax_total) > 0 && (
            <div className="flex justify-between"><span className="text-taupe">Tax</span><span>{formatMoney(order.tax_total, order.currency)}</span></div>
          )}
          <div className="flex justify-between border-t border-taupe/15 pt-2 text-base font-medium text-espresso">
            <span>Total</span><span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="btn-primary">Continue shopping</Link>
      </div>
    </div>
  );
}
