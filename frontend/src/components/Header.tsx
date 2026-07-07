"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { MenuIcon, CloseIcon, UserIcon, SearchIcon, ChevronDownIcon } from "./icons";

export interface NavItem {
  href: string;
  label: string;
}

export interface BrandItem {
  name: string;
  count: number;
}

const MENU_EXTRA = [
  { href: "/about", label: "Our story" },
  { href: "/shipping", label: "Shipping & returns" },
  { href: "/account", label: "Account" },
];

export function Header({
  promoText,
  nav,
  brands,
}: {
  promoText?: string;
  nav?: NavItem[];
  brands?: BrandItem[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const NAV: NavItem[] = [{ href: "/shop", label: "Shop" }, ...(nav ?? [])];
  const BRANDS = brands ?? [];

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    setMenuOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const searchForm = (
    <form onSubmit={submitSearch} className="flex w-full items-center gap-3">
      <span className="h-4 w-4 shrink-0 text-taupe">
        <SearchIcon />
      </span>
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        placeholder={"Search products, brands, shades\u2026"}
        aria-label="Search"
        className="w-full bg-transparent text-sm text-espresso placeholder:text-taupe/70 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 text-[11px] uppercase tracking-widest text-espresso transition hover:text-rose"
      >
        Search
      </button>
    </form>
  );

  return (
    <>
      {/* Shrine-style announcement bar: one bold offer with an icon, readable
          size, high-contrast background. */}
      <div className="flex items-center justify-center gap-2 bg-plum px-3 py-2.5 text-center text-xs font-medium tracking-wide text-ivory sm:text-sm">
        <span aria-hidden className="text-champagne">&#10022;</span>
        <span>{promoText || "10% OFF your first order with code WELCOME10 \u2014 Free shipping over \u20ac45"}</span>
        <span aria-hidden className="text-champagne">&#10022;</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-taupe/10 bg-ivory/85 backdrop-blur">
        <div className="container-page grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-4">
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
              {BRANDS.length > 0 && (
                <div className="group relative">
                  <button
                    className="flex items-center gap-1 uppercase tracking-wider transition hover:text-rose"
                    aria-haspopup="true"
                  >
                    Brands
                    <span className="h-3.5 w-3.5 transition-transform group-hover:rotate-180">
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {/* Hover dropdown */}
                  <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="overflow-hidden rounded-xl border border-taupe/10 bg-ivory shadow-soft">
                      <ul className="py-2">
                        {BRANDS.map((b) => (
                          <li key={b.name}>
                            <Link
                              href={`/shop?brand=${encodeURIComponent(b.name)}`}
                              className="flex items-center justify-between px-5 py-2.5 text-xs normal-case tracking-normal text-espresso transition hover:bg-cream hover:text-plum"
                            >
                              <span>{b.name}</span>
                              <span className="text-[10px] text-taupe">{b.count}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/shop"
                        className="block border-t border-taupe/10 px-5 py-3 text-[11px] uppercase tracking-widest text-plum transition hover:bg-cream"
                      >
                        {"Shop everything \u2192"}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Center: logo */}
          <div className="flex justify-center">
            <Logo />
          </div>

          {/* Right: search + account */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              aria-expanded={searchOpen}
              className="flex h-6 w-6 items-center justify-center text-espresso transition hover:text-rose"
            >
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>
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

        {/* Expanding search row */}
        <div
          className={`overflow-hidden border-taupe/10 transition-all duration-300 ${
            searchOpen ? "max-h-16 border-t" : "max-h-0"
          }`}
        >
          <div className="container-page py-3.5">{searchForm}</div>
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
          <div className="border-b border-taupe/10 px-6 py-4">{searchForm}</div>
          <nav className="flex flex-col overflow-y-auto px-6 py-4">
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
            {BRANDS.length > 0 && (
              <div className="border-b border-taupe/10 py-4">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-taupe">Shop by brand</p>
                <div className="flex flex-col gap-2.5">
                  {BRANDS.map((b) => (
                    <Link
                      key={b.name}
                      href={`/shop?brand=${encodeURIComponent(b.name)}`}
                      onClick={() => setMenuOpen(false)}
                      className="text-sm text-espresso transition hover:text-rose"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
