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
  return (
    <Link href="/" className={`group inline-flex flex-col items-center ${className}`}>
      <span className={`font-serif text-2xl font-medium tracking-[0.35em] ${color}`}>CAERORA</span>
      {withTagline && (
        <span className="mt-1 text-[9px] uppercase tracking-[0.4em] text-taupe">Beauty. Elevated.</span>
      )}
    </Link>
  );
}
