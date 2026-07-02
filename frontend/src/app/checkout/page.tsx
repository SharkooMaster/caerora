"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { COUNTRIES } from "@/lib/countries";
import type { ShippingRate } from "@/lib/types";
import { CheckoutPayment } from "@/components/CheckoutPayment";
import { getAnonId, getStoredUtm, track } from "@/lib/tracker";

interface Form {
  email: string;
  marketing_opt_in: boolean;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  region: string;
  country: string;
  phone: string;
}

const EMPTY: Form = {
  email: "",
  marketing_opt_in: true,
  first_name: "",
  last_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  postal_code: "",
  region: "",
  country: "DE",
  phone: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const [form, setForm] = useState<Form>(EMPTY);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [currency, setCurrency] = useState("eur");
  const [rateId, setRateId] = useState<number | null>(null);
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderTotals, setOrderTotals] = useState<{ shipping: number; tax: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const selectedRate = rates.find((r) => r.id === rateId);
  const shippingCost = selectedRate ? parseFloat(selectedRate.effective_price ?? selectedRate.price) : 0;

  useEffect(() => {
    track({ event_type: "begin_checkout", value: subtotal, currency: "eur" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch live shipping options whenever country or subtotal changes.
  useEffect(() => {
    if (!form.country || lines.length === 0) return;
    api
      .shippingOptions(form.country, subtotal)
      .then((opt) => {
        setRates(opt.rates);
        setCurrency(opt.currency);
        setRateId(opt.rates[0]?.id ?? null);
      })
      .catch(() => setRates([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country, subtotal]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const utm = getStoredUtm();
      const res = await api.checkout({
        ...form,
        shipping_rate_id: rateId,
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
        anonymous_id: getAnonId(),
        ...utm,
      });
      setClientSecret(res.client_secret);
      setPublishableKey(res.publishable_key || "");
      setOrderNumber(res.order.number);
      setOrderTotals({
        shipping: parseFloat(res.order.shipping_total),
        tax: parseFloat(res.order.tax_total),
        total: parseFloat(res.order.total),
      });
      setCurrency(res.order.currency);
      track({ event_type: "add_shipping_info", value: subtotal, currency: res.order.currency });
      setStep("payment");
      // If payment isn't configured, the cart can be cleared and the order shown.
      if (!res.client_secret) clear();
    } catch (err: any) {
      setError(err.message || "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  if (lines.length === 0 && step === "details") {
    return (
      <div className="container-page py-20 text-center">
        <p className="font-serif text-2xl text-taupe">Your bag is empty.</p>
        <Link href="/shop" className="btn-primary mt-6">Discover products</Link>
      </div>
    );
  }

  const taxEstimate = orderTotals?.tax ?? 0;
  const total = orderTotals?.total ?? subtotal + shippingCost;

  return (
    <div className="container-page py-12">
      <h1 className="heading-serif mb-8 text-4xl">Checkout</h1>
      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {step === "details" ? (
            <form onSubmit={submitDetails} className="space-y-8">
              <section>
                <h2 className="eyebrow mb-4">Contact</h2>
                <input
                  className="input"
                  type="email"
                  placeholder="Email (for delivery updates)"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
                <label className="mt-3 flex items-center gap-2 text-xs text-taupe">
                  <input
                    type="checkbox"
                    checked={form.marketing_opt_in}
                    onChange={(e) => update("marketing_opt_in", e.target.checked)}
                  />
                  Email me beauty edits and offers (you can unsubscribe anytime).
                </label>
              </section>

              <section>
                <h2 className="eyebrow mb-4">Shipping address</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="input" placeholder="First name" required value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
                  <input className="input" placeholder="Last name" required value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
                  <input className="input sm:col-span-2" placeholder="Address" required value={form.address_line1} onChange={(e) => update("address_line1", e.target.value)} />
                  <input className="input sm:col-span-2" placeholder="Apartment, suite (optional)" value={form.address_line2} onChange={(e) => update("address_line2", e.target.value)} />
                  <input className="input" placeholder="City" required value={form.city} onChange={(e) => update("city", e.target.value)} />
                  <input className="input" placeholder="Postal code" required value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} />
                  <input className="input" placeholder="Region / State (optional)" value={form.region} onChange={(e) => update("region", e.target.value)} />
                  <select className="input" value={form.country} onChange={(e) => update("country", e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <input className="input sm:col-span-2" placeholder="Phone (optional)" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
              </section>

              <section>
                <h2 className="eyebrow mb-4">Shipping method</h2>
                {rates.length ? (
                  <div className="space-y-2">
                    {rates.map((r) => {
                      const cost = parseFloat(r.effective_price ?? r.price);
                      return (
                        <label
                          key={r.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 text-sm ${
                            rateId === r.id ? "border-rose bg-rose/5" : "border-taupe/20"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <input type="radio" name="rate" checked={rateId === r.id} onChange={() => setRateId(r.id)} />
                            <span>
                              <span className="text-espresso">{r.name}</span>
                              {r.delivery_estimate && <span className="ml-2 text-taupe">{r.delivery_estimate}</span>}
                            </span>
                          </span>
                          <span className="text-espresso">{cost === 0 ? "Free" : formatMoney(cost, currency)}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-taupe">Select a country to see shipping options.</p>
                )}
              </section>

              {error && <p className="text-sm text-terracotta">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading || !rateId}>
                {loading ? "Preparing payment..." : "Continue to payment"}
              </button>
            </form>
          ) : (
            <section>
              <button onClick={() => setStep("details")} className="mb-4 text-xs uppercase tracking-wider text-taupe hover:text-espresso">
                &larr; Back to details
              </button>
              <h2 className="eyebrow mb-4">Payment</h2>
              <CheckoutPayment clientSecret={clientSecret} orderNumber={orderNumber} publishableKey={publishableKey} />
              {!clientSecret && (
                <Link href={`/order/${orderNumber}`} className="btn-outline mt-4 w-full">
                  View order
                </Link>
              )}
            </section>
          )}
        </div>

        {/* Summary */}
        <aside className="card h-fit p-6 lg:col-span-2">
          <h2 className="font-serif text-xl text-espresso">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between text-sm">
                <span className="text-espresso">
                  {l.productName} <span className="text-taupe">/ {l.variantName}</span> &times; {l.quantity}
                </span>
                <span>{formatMoney(l.price * l.quantity, currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-2 border-t border-taupe/15 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-taupe">Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>
            <div className="flex justify-between"><span className="text-taupe">Shipping</span><span>{shippingCost === 0 ? "Free" : formatMoney(shippingCost, currency)}</span></div>
            {taxEstimate > 0 && (
              <div className="flex justify-between"><span className="text-taupe">Tax</span><span>{formatMoney(taxEstimate, currency)}</span></div>
            )}
            <div className="flex justify-between border-t border-taupe/15 pt-2 text-base font-medium text-espresso">
              <span>Total</span><span>{formatMoney(total, currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
