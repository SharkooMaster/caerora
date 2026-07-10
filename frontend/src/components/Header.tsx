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

export interface SeasonNavItem {
  name: string;
  numeral: string;
  slug: string;
  subtitle?: string;
}

const MENU_EXTRA = [
  { href: "/about", label: "Our story" },
  { href: "/shipping", label: "Shipping & returns" },
  { href: "/account", label: "Account" },
];

export function Header({
  promoText,
  nav,
  seasons,
}: {
  promoText?: string;
  nav?: NavItem[];
  seasons?: SeasonNavItem[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const NAV: NavItem[] = [{ href: "/shop", label: "Shop" }, ...(nav ?? [])];
  const SEASONS = seasons ?? [];

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
      <span className="h-4 w-4 shrink-0 text-stone">
        <SearchIcon />
      </span>
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        placeholder={"Search tees, hoodies, collections\u2026"}
        aria-label="Search"
        className="w-full bg-transparent text-sm text-midnight placeholder:text-stone/70 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 text-[11px] uppercase tracking-widest text-midnight transition hover:text-gold"
      >
        Search
      </button>
    </form>
  );

  return (
    <>
      {/* Announcement bar: one bold offer, high-contrast midnight band. */}
      <div className="flex items-center justify-center gap-2 bg-midnight px-3 py-2.5 text-center text-xs font-medium tracking-wide text-parchment sm:text-sm">
        <span aria-hidden className="text-goldlight">&#10022;</span>
        <span>{promoText || "10% OFF your first order with code WELCOME10 \u2014 Free shipping over \u20ac45"}</span>
        <span aria-hidden className="text-goldlight">&#10022;</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-stone/10 bg-parchment/85 backdrop-blur">
        <div className="container-page grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-4">
          {/* Left: hamburger (mobile) / nav (desktop) */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-6 w-6 items-center justify-center text-midnight md:hidden"
            >
              <MenuIcon />
            </button>
            <nav className="hidden items-center gap-6 text-xs uppercase tracking-wider text-midnight md:flex">
              {NAV.map((item) => (
                <Link key={item.label} href={item.href} className="transition hover:text-gold">
                  {item.label}
                </Link>
              ))}
              {SEASONS.length > 0 && (
                <div className="group relative">
                  <button
                    className="flex items-center gap-1 uppercase tracking-wider transition hover:text-gold"
                    aria-haspopup="true"
                  >
                    Seasons
                    <span className="h-3.5 w-3.5 transition-transform group-hover:rotate-180">
                      <ChevronDownIcon />
                    </span>
                  </button>
                  {/* Hover dropdown */}
                  <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="overflow-hidden rounded-xl border border-stone/10 bg-parchment shadow-soft">
                      <ul className="max-h-[26rem] overflow-y-auto py-2">
                        {SEASONS.map((s) => (
                          <li key={s.slug}>
                            <Link
                              href={`/shop?season=${s.slug}`}
                              className="flex items-baseline gap-3 px-5 py-2.5 text-xs normal-case tracking-normal text-midnight transition hover:bg-cream hover:text-navy"
                            >
                              <span className="w-7 shrink-0 font-serif text-sm text-gold">{s.numeral}.</span>
                              <span className="flex-1">{s.name}</span>
                              {s.subtitle && <span className="text-[10px] text-stone">{s.subtitle}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href="/shop"
                        className="block border-t border-stone/10 px-5 py-3 text-[11px] uppercase tracking-widest text-navy transition hover:bg-cream"
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
              className="flex h-6 w-6 items-center justify-center text-midnight transition hover:text-gold"
            >
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>
            <Link
              href="/account"
              aria-label="Account"
              className="flex items-center gap-2 text-midnight transition hover:text-gold"
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
          className={`overflow-hidden border-stone/10 transition-all duration-300 ${
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
          className={`absolute inset-0 bg-midnight/40 transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-parchment shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-stone/15 px-6 py-5">
            <span className="font-serif text-xl tracking-[0.2em] text-midnight">CAERORA</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="h-6 w-6 text-stone hover:text-midnight"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="border-b border-stone/10 px-6 py-4">{searchForm}</div>
          <nav className="flex flex-col overflow-y-auto px-6 py-4">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-stone/10 py-4 font-serif text-xl text-midnight transition hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            {SEASONS.length > 0 && (
              <div className="border-b border-stone/10 py-4">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-stone">Shop by season</p>
                <div className="flex flex-col gap-2.5">
                  {SEASONS.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/shop?season=${s.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-baseline gap-2 text-sm text-midnight transition hover:text-gold"
                    >
                      <span className="w-7 shrink-0 font-serif text-gold">{s.numeral}.</span>
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2 flex flex-col gap-3 pt-4 text-xs uppercase tracking-wider text-stone">
              {MENU_EXTRA.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="transition hover:text-midnight"
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
              Shop the collections
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
