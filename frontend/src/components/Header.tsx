"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { MenuIcon, CloseIcon, UserIcon } from "./icons";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=lips", label: "Lips" },
  { href: "/shop?category=face", label: "Face" },
  { href: "/shop?category=eyes", label: "Eyes" },
  { href: "/shop?category=skin", label: "Skin" },
];

const MENU_EXTRA = [
  { href: "/about", label: "Our story" },
  { href: "/shipping", label: "Shipping & returns" },
  { href: "/account", label: "Account" },
];

export function Header({ promoText }: { promoText?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <div className="bg-espresso py-2 text-center text-[10px] uppercase tracking-widest text-ivory/90 sm:text-[11px]">
        {promoText || "Free shipping over \u20ac45 \u00b7 New season beauty in now \u00b7 30-day easy returns"}
      </div>

      <header className="sticky top-0 z-40 border-b border-taupe/10 bg-ivory/85 backdrop-blur">
        <div className="container-page grid grid-cols-3 items-center py-4">
          {/* Left: hamburger (mobile) / nav (desktop) */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-6 w-6 items-center justify-center text-espresso md:hidden"
            >
              <MenuIcon />
            </button>
            <nav className="hidden items-center gap-6 text-xs uppercase tracking-wider text-espresso md:flex">
              {NAV.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-rose">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: logo */}
          <div className="flex justify-center">
            <Logo />
          </div>

          {/* Right: account */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/account"
              aria-label="Account"
              className="flex items-center gap-2 text-espresso transition hover:text-rose"
            >
              <span className="h-6 w-6">
                <UserIcon />
              </span>
              <span className="hidden text-xs uppercase tracking-wider lg:inline">Account</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile slide-in menu */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${menuOpen ? "visible" : "invisible"}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-espresso/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-ivory shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-taupe/15 px-6 py-5">
            <span className="font-serif text-xl tracking-[0.2em] text-espresso">CAERORA</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="h-6 w-6 text-taupe hover:text-espresso"
            >
              <CloseIcon />
            </button>
          </div>
          <nav className="flex flex-col px-6 py-4">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-taupe/10 py-4 font-serif text-xl text-espresso transition hover:text-rose"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 pt-4 text-xs uppercase tracking-wider text-taupe">
              {MENU_EXTRA.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="transition hover:text-espresso"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="mt-auto px-6 py-6">
            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
              className="btn-primary w-full"
            >
              Shop the collection
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
