"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=lips", label: "Lips" },
  { href: "/shop?category=face", label: "Face" },
  { href: "/shop?category=eyes", label: "Eyes" },
  { href: "/shop?category=skin", label: "Skin" },
];

export function Header() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const open = useCart((s) => s.open);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="bg-espresso py-2 text-center text-[11px] uppercase tracking-widest text-ivory/90">
        Free shipping over &euro;45 &middot; New season beauty in now &middot; 30-day easy returns
      </div>
      <header className="sticky top-0 z-40 border-b border-taupe/10 bg-ivory/85 backdrop-blur">
        <div className="container-page flex items-center justify-between py-4">
          <nav className="hidden flex-1 items-center gap-6 text-xs uppercase tracking-wider text-espresso md:flex">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-rose">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 text-center">
            <Logo />
          </div>
          <div className="flex flex-1 items-center justify-end gap-5">
            <Link href="/account" className="hidden text-xs uppercase tracking-wider text-espresso hover:text-rose sm:block">
              Account
            </Link>
            <button
              onClick={open}
              className="relative text-xs uppercase tracking-wider text-espresso hover:text-rose"
              aria-label="Open cart"
            >
              Cart
              {mounted && count > 0 && (
                <span className="absolute -right-4 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        <nav className="container-page flex items-center gap-5 overflow-x-auto pb-3 text-xs uppercase tracking-wider text-espresso md:hidden">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="whitespace-nowrap hover:text-rose">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
