"use client";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { BagIcon } from "./icons";

export function CartFab() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const open = useCart((s) => s.open);
  const isOpen = useCart((s) => s.isOpen);
  const [mounted, setMounted] = useState(false);
  const [bump, setBump] = useState(false);
  const prev = useRef(count);

  useEffect(() => setMounted(true), []);

  // Pop the badge whenever the item count grows.
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  return (
    <button
      onClick={open}
      aria-label={`Open bag${count ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
      className={`fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-espresso text-ivory shadow-glow ring-1 ring-ivory/10 transition-all duration-300 hover:scale-105 hover:bg-plum active:scale-95 sm:bottom-7 sm:right-7 sm:h-16 sm:w-16 ${
        isOpen ? "pointer-events-none translate-y-24 opacity-0" : "opacity-100"
      }`}
    >
      <span className="h-6 w-6 sm:h-7 sm:w-7">
        <BagIcon />
      </span>
      {mounted && count > 0 && (
        <span
          className={`absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose px-1.5 text-[11px] font-medium text-white ring-2 ring-ivory transition-transform ${
            bump ? "scale-125" : "scale-100"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
