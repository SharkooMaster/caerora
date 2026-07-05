export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= full ? "#B88F93" : "none"}
          stroke="#B88F93"
          strokeWidth="1.5"
        >
          <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7z" />
        </svg>
      ))}
    </span>
  );
}

export function RatingSummary({ average, count }: { average: number; count: number }) {
  // No rating chip at all beats a wall of "No reviews yet" on a young catalog.
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-taupe">
      <Stars value={average} />
      <span>
        {average.toFixed(1)} ({count})
      </span>
    </span>
  );
}
