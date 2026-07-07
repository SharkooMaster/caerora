/** Shrine-style FAQ accordion: kills the last objections right before the
 *  reviews. Static, store-wide questions. */

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Orders are processed within 1–2 business days and delivered within 5–10 business days across the EU. You receive a tracking link by email the moment your order ships.",
  },
  {
    q: "Are your products authentic?",
    a: "Yes — every product we sell is a 100% authentic brand product, sourced from verified distributors. No dupes, no imitations.",
  },
  {
    q: "Can I pay after I receive my order?",
    a: "Yes. Choose Klarna at checkout to pay after your delivery arrives, or split the amount into instalments. You never pay before you know your order is on the way.",
  },
  {
    q: "What if it doesn't work for me?",
    a: "You have 30 days to return your order — no questions asked. Contact us and we'll sort out the return and your refund quickly.",
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
