/** Shrine-style "us vs. others" comparison table — answers "why buy here?"
 *  right before the reviews. Static content, honest rows only. */

const ROWS = [
  "100% authentic brand products",
  "Free EU shipping over \u20ac45",
  "Pay after delivery with Klarna",
  "30-day easy returns",
  "Tracked delivery on every order",
  "Bundle discounts \u2014 save up to 15%",
];

function Check() {
  return (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-rose/20 text-sm font-bold text-plum">
      ✓
    </span>
  );
}

function Cross() {
  return (
    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-taupe/10 text-sm text-taupe">
      ✕
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section className="mt-14 md:mt-20">
      <div className="mb-8 text-center">
        <p className="eyebrow-rose">The Caerora difference</p>
        <h2 className="display mt-2 text-3xl md:text-4xl">Why shop with us</h2>
      </div>
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl shadow-card ring-1 ring-taupe/10">
        <div className="grid grid-cols-[1fr_5rem_5rem] items-center bg-cream/70 px-5 py-4 md:grid-cols-[1fr_7rem_7rem]">
          <span />
          <span className="text-center font-serif text-sm font-medium tracking-wide text-plum md:text-base">
            Caerora
          </span>
          <span className="text-center text-xs uppercase tracking-wider text-taupe">Others</span>
        </div>
        {ROWS.map((row, i) => (
          <div
            key={row}
            className={`grid grid-cols-[1fr_5rem_5rem] items-center px-5 py-3.5 md:grid-cols-[1fr_7rem_7rem] ${
              i % 2 === 0 ? "bg-ivory" : "bg-cream/40"
            }`}
          >
            <span className="text-sm text-espresso">{row}</span>
            <Check />
            <Cross />
          </div>
        ))}
      </div>
    </section>
  );
}
