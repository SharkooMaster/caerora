import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Shop all",
  description: "Shop the full Caerora collection of clean, cruelty-free makeup and skincare.",
  alternates: { canonical: "/shop" },
};

async function getData(category?: string, brand?: string) {
  const params: Record<string, string> = {};
  if (category) params["category__slug"] = category;
  if (brand) params["brand"] = brand;
  const [products, categories, brands] = await Promise.all([
    api.products(params).catch(() => ({ results: [] }) as any),
    api.categories().catch(() => []),
    api.brands().catch(() => []),
  ]);
  return {
    products: products.results,
    categories: categories.filter((c) => (c.product_count ?? 1) > 0),
    brands,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; brand?: string };
}) {
  const category = searchParams.category;
  const brand = searchParams.brand;
  const { products, categories, brands } = await getData(category, brand);

  const heading = brand
    ? brand
    : category
      ? categories.find((c) => c.slug === category)?.name ?? "Shop all"
      : "Shop all";

  return (
    <div className="container-page py-12">
      <ProductListTracker list={brand || category || "all"} />
      <div className="mb-8 text-center">
        <p className="eyebrow-rose">The collection</p>
        <h1 className="heading-serif mt-2 text-4xl md:text-5xl">{heading}</h1>
        <p className="mt-3 text-sm text-taupe">
          {products.length} {products.length === 1 ? "product" : "products"} &middot; clean, cruelty-free beauty with free 30-day returns
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-wider">
        <Link
          href="/shop"
          className={`rounded-full border px-4 py-2 transition ${
            !category && !brand ? "border-espresso bg-espresso text-ivory" : "border-taupe/30 text-espresso hover:border-espresso"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className={`rounded-full border px-4 py-2 transition ${
              category === c.slug
                ? "border-espresso bg-espresso text-ivory"
                : "border-taupe/30 text-espresso hover:border-espresso"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {brands.length > 1 && (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="uppercase tracking-widest text-taupe">Brands:</span>
          {brands.map((b) => (
            <Link
              key={b.name}
              href={`/shop?brand=${encodeURIComponent(b.name)}`}
              className={`rounded-full px-3 py-1.5 transition ${
                brand === b.name
                  ? "bg-plum text-ivory"
                  : "bg-cream text-espresso hover:bg-plum/10"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      {products.length ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p: any, i: number) => (
            <ProductCard key={p.id} product={p} position={i} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-taupe">No products found. Try another category or brand.</p>
      )}
    </div>
  );
}
