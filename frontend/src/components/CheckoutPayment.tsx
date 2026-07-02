"use client";
import { useMemo, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

// Cache one Stripe promise per publishable key so we never re-init on re-render.
const stripeCache: Record<string, Promise<Stripe | null>> = {};
function getStripe(key?: string) {
  if (!key) return null;
  if (!stripeCache[key]) stripeCache[key] = loadStripe(key);
  return stripeCache[key];
}

function PayForm({ orderNumber }: { orderNumber: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${siteUrl}/order/${orderNumber}` },
    });
    if (error) {
      setError(error.message || "Payment failed.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full">
        {loading ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

export function CheckoutPayment({
  clientSecret,
  orderNumber,
  publishableKey,
}: {
  clientSecret: string;
  orderNumber: string;
  publishableKey?: string;
}) {
  // Prefer the key the backend returns with the order; fall back to the
  // build-time public env var when present.
  const key = publishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const promise = useMemo(() => getStripe(key), [key]);
  if (!clientSecret || !promise) {
    return (
      <div className="card p-5 text-sm text-taupe">
        <p>
          Your order <strong className="text-espresso">{orderNumber}</strong> has been created.
          Online payment is not configured in this environment. Add your Stripe keys to enable
          the secure payment step.
        </p>
      </div>
    );
  }
  return (
    <Elements
      stripe={promise}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: { colorPrimary: "#5B3B4A", fontFamily: "Inter, sans-serif", borderRadius: "8px" },
        },
      }}
    >
      <PayForm orderNumber={orderNumber} />
    </Elements>
  );
}
