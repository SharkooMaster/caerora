/** Shrine-style FAQ accordion: kills the last objections right before the
 *  reviews. Static, store-wide questions. */

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Orders are processed within 1–2 business days and delivered within 5–10 business days across the EU. You receive a tracking link by email the moment your order ships.",
  },
  {
    q: "What are the garments made of?",
    a: "Heavyweight combed cotton with embroidered artwork and woven neck labels — built to hold their shape and color wash after wash. Each product page lists the exact fabric and care instructions.",
  },
  {
    q: "What are the thirteen seasons?",
    a: "Caerora tells the complete story of the Gospel in thirteen collections — from The Dawn (the birth of Christ) to The New Creation. Each season has its own palette, scripture and designs. Explore them all from the Seasons menu.",
  },
  {
    q: "How does sizing run?",
    a: "Our fits are true to size with a relaxed, contemporary cut. Every product page includes a size guide — and if it's not right, you have 30 days to exchange or return it free of hassle.",
  },
  {
    q: "Can I pay after I receive my order?",
    a: "Yes. Choose Klarna at checkout to pay after your delivery arrives, or split the amount into instalments. You never pay before you know your order is on the way.",
  },
  {
    q: "Is shipping really free?",
    a: "Shipping is free on all orders over \u20ac45. Below that, you see the exact shipping cost at checkout before you pay — no surprises.",
  },
];

export function Faq() {
  return (
    <section className="mt-14 md:mt-20">
      <div className="mb-8 text-center">
        <p className="eyebrow-rose">Good to know</p>
        <h2 className="display mt-2 text-3xl md:text-4xl">Frequently asked questions</h2>
      </div>
      <div className="mx-auto max-w-2xl">
        {FAQS.map((f) => (
          <details key={f.q} className="group border-b border-taupe/15">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-medium text-espresso">{f.q}</span>
              <span
                aria-hidden
                className="text-xl font-light leading-none text-taupe transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-5 text-sm leading-relaxed text-taupe">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
