const DEFAULT_ITEMS = [
  "Thirteen collections \u2014 one narrative",
  "Heavyweight cotton, embroidered detail",
  "Free shipping over \u20ac45",
  "30-day easy returns",
  "From the first light to the eternal day",
];

export function Marquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...items, ...items];
  return (
    <div className="marquee-mask bg-midnight py-4 text-parchment">
      <div className="marquee-track animate-marquee">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="px-6 font-serif text-lg tracking-wide text-parchment/95 md:text-xl">
              {item}
            </span>
            <span aria-hidden className="text-goldlight">
              &#10022;
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
