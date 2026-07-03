import Link from "next/link";

export function Logo({
  variant = "dark",
  withTagline = false,
  className = "",
}: {
  variant?: "dark" | "light" | "rose";
  withTagline?: boolean;
  className?: string;
}) {
  const color = variant === "light" ? "text-ivory" : variant === "rose" ? "text-rose" : "text-plum";
  const rule = variant === "light" ? "bg-ivory/40" : "bg-taupe/40";
  return (
    <Link href="/" className={`group inline-flex flex-col items-center ${className}`} aria-label="Caerora home">
      <span className="mb-1 flex items-center gap-2">
        <span className={`hidden h-px w-4 sm:block ${rule} transition-all duration-300 group-hover:w-6`} />
        <span
          className={`whitespace-nowrap font-serif text-xl font-medium tracking-[0.28em] sm:text-2xl sm:tracking-[0.4em] ${color}`}
        >
          CAERORA
        </span>
        <span className={`hidden h-px w-4 sm:block ${rule} transition-all duration-300 group-hover:w-6`} />
      </span>
      {withTagline && (
        <span className={`text-[9px] uppercase tracking-[0.45em] ${variant === "light" ? "text-ivory/70" : "text-taupe"}`}>
          Beauty. Elevated.
        </span>
      )}
    </Link>
  );
}
