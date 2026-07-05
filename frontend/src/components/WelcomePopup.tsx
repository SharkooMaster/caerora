"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NewsletterForm } from "./NewsletterForm";
import { CloseIcon, SparkleIcon } from "./icons";

const SEEN_KEY = "caerora-welcome-seen";
const DELAY_MS = 6000;

/**
 * One-time "10% off your first order" capture, shown a few seconds after
 * landing. Never on checkout/order pages (don't interrupt buying) or Studio.
 */
export function WelcomePopup() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const suppressed =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/studio");

  useEffect(() => {
    if (suppressed) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {}
      setOpen(true);
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [suppressed]);

  if (!open || suppressed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Get 10% off your first order"
    >
      <div
        className="relative w-full max-w-md animate-fadeUp rounded-3xl bg-ivory p-7 shadow-soft sm:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-taupe transition hover:bg-cream hover:text-espresso"
        >
          <span className="h-4 w-4"><CloseIcon /></span>
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-plum text-ivory">
          <span className="h-5 w-5"><SparkleIcon /></span>
        </div>
        <h2 className="mt-4 font-serif text-3xl font-light leading-tight text-espresso">
          Get 10% off your first order
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-taupe">
          Join the list and we&rsquo;ll send your code right away &mdash; plus early access
          to new drops. No spam, unsubscribe anytime.
        </p>
        <div className="mt-5">
          <NewsletterForm source="popup" />
        </div>
        <button
          onClick={() => setOpen(false)}
          className="mt-4 text-xs uppercase tracking-wider text-taupe underline-offset-4 transition hover:text-espresso hover:underline"
        >
          No thanks, full price is fine
        </button>
      </div>
    </div>
  );
}
