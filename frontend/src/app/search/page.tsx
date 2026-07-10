import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { SearchTracker } from "@/components/SearchTracker";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Caerora collection.",
  // Internal search results are thin/duplicate content; keep them out of the index.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  const products = q
    ? await api
        .products({ search: q })
        .then((r) => r.results)
        .catch(() => [])
    : [];

  return (
    <div className="container-page py-12">
      <SearchTracker query={q} results={products.length} />
      <div className="mb-10 text-center">
        <p className="eyebrow-rose">Search</p>
        <h1 className="heading-serif mt-2 text-4xl md:text-5xl">
          {q ? `Results for \u201c${q}\u201d` : "Search the collection"}
        </h1>
        {q && (
          <p className="mt-3 text-sm text-taupe">
            {products.length} {products.length === 1 ? "product" : "products"} found
          </p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} position={i} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-taupe">
            {q
              ? "Nothing matched your search. Try a brand name (e.l.f., NYX) or a product type (mascara, lip oil)."
              : "Type a product, season or style in the search bar above."}
          </p>
          <Link href="/shop" className="btn-primary mt-8 inline-flex">
            Browse everything
          </Link>
        </div>
      )}
    </div>
  );
}
