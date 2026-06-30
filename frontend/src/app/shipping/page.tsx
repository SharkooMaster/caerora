import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: "Shipping options, delivery times and our 30-day return policy.",
};

export default function ShippingPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <p className="eyebrow">Help</p>
      <h1 className="heading-serif mt-2 text-4xl">Shipping &amp; returns</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-taupe">
        <div>
          <h2 className="font-serif text-xl text-espresso">Shipping</h2>
          <p className="mt-2">
            We ship across the EU, UK, US and worldwide. Standard delivery typically takes 2-4
            business days within the EU and UK, and 3-12 business days internationally. Free
            standard shipping applies on EU orders over &euro;45.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-espresso">Returns</h2>
          <p className="mt-2">
            Not in love? Return any item within 30 days of delivery for a full refund. Contact our
            team and we will guide you through the simple process.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-espresso">Order tracking</h2>
          <p className="mt-2">
            Once your order ships you will receive an email with tracking details. You can also view
            your orders any time from your account.
          </p>
        </div>
      </div>
    </div>
  );
}
