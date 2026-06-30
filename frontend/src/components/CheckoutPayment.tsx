"use client";
import { useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise && pk) stripePromise = loadStripe(pk);
  return stripePromise;
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
}: {
  clientSecret: string;
  orderNumber: string;
}) {
  const promise = getStripe();
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
