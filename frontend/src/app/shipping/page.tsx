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
            Orders are prepared and dispatched by our fulfilment partners. Once dispatched, standard
            delivery typically takes 3&ndash;7 business days within the EU and UK, and 7&ndash;14
            business days for international destinations. Please allow 1&ndash;3 business days for
            processing before dispatch. Delivery windows are estimates and can vary during busy
            periods. Free standard shipping applies on EU orders over &euro;45.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-espresso">Returns</h2>
          <p className="mt-2">
            Not in love? Return any item within 30 days of delivery for a full refund of the item
            price. Just contact our team and we&rsquo;ll guide you through the simple process.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-espresso">Order tracking</h2>
          <p className="mt-2">
            As soon as your order is dispatched you&rsquo;ll receive an email with tracking details.
            You can also view your orders any time from your account. Larger orders may arrive in
            more than one parcel.
          </p>
        </div>
      </div>
    </div>
  );
}
