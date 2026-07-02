"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStaffToken, clearStaffTokens } from "@/lib/adminApi";

const NAV = [
  { href: "/studio", label: "Dashboard", exact: true },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/products", label: "Products" },
  { href: "/studio/categories", label: "Categories" },
  { href: "/studio/reviews", label: "Reviews" },
  { href: "/studio/content", label: "Site content" },
  { href: "/studio/testimonials", label: "Testimonials" },
  { href: "/studio/newsletter", label: "Newsletter" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLogin = pathname === "/studio/login";

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getStaffToken()) {
      router.replace("/studio/login");
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (isLogin) return <div className="min-h-screen bg-cream">{children}</div>;
  if (!ready) return <div className="min-h-screen bg-cream" />;

  function logout() {
    clearStaffTokens();
    router.replace("/studio/login");
  }

  return (
    <div className="min-h-screen bg-cream text-espresso">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-espresso text-ivory transition-transform md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center px-6 text-lg font-serif tracking-[0.25em]">CAERORA</div>
        <p className="px-6 pb-4 text-[10px] uppercase tracking-widest text-ivory/50">Studio</p>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                isActive(pathname, item.href, item.exact)
                  ? "bg-ivory/15 text-ivory"
                  : "text-ivory/70 hover:bg-ivory/10 hover:text-ivory"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <button
            onClick={logout}
            className="w-full rounded-lg border border-ivory/20 px-3 py-2 text-sm text-ivory/80 transition hover:bg-ivory/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-espresso/40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Main */}
      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-taupe/15 bg-ivory/90 px-4 backdrop-blur md:px-8">
          <button
            className="rounded-lg border border-taupe/20 p-2 md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-5 bg-espresso" />
            <span className="mt-1 block h-0.5 w-5 bg-espresso" />
            <span className="mt-1 block h-0.5 w-5 bg-espresso" />
          </button>
          <div className="text-sm text-taupe">
            {NAV.find((n) => isActive(pathname, n.href, n.exact))?.label || "Studio"}
          </div>
          <Link href="/" target="_blank" className="text-xs uppercase tracking-wider text-taupe hover:text-espresso">
            View store &rarr;
          </Link>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
