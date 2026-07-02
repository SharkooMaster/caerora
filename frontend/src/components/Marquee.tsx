const DEFAULT_ITEMS = [
  "New arrivals in now",
  "Clean, cruelty-free beauty",
  "Free shipping over \u20ac45",
  "30-day easy returns",
  "Fast, tracked delivery",
];

export function Marquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...items, ...items];
  return (
    <div className="marquee-mask bg-espresso py-4 text-ivory">
      <div className="marquee-track animate-marquee">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="px-6 font-serif text-lg tracking-wide text-ivory/95 md:text-xl">
              {item}
            </span>
            <span aria-hidden className="text-champagne">
              &#10022;
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
