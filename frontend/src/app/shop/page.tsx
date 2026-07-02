import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Shop all",
  description: "Shop the full Caerora collection of clean, cruelty-free makeup and skincare.",
};

async function getData(category?: string) {
  const params: Record<string, string> = {};
  if (category) params["category__slug"] = category;
  const [products, categories] = await Promise.all([
    api.products(params).catch(() => ({ results: [] }) as any),
    api.categories().catch(() => []),
  ]);
  return { products: products.results, categories };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;
  const { products, categories } = await getData(category);

  return (
    <div className="container-page py-12">
      <ProductListTracker list={category || "all"} />
      <div className="mb-8 text-center">
        <p className="eyebrow-rose">The collection</p>
        <h1 className="heading-serif mt-2 text-4xl md:text-5xl">
          {category ? categories.find((c) => c.slug === category)?.name ?? "Shop all" : "Shop all"}
        </h1>
        <p className="mt-3 text-sm text-taupe">
          {products.length} {products.length === 1 ? "product" : "products"} &middot; clean, cruelty-free beauty with free 30-day returns
        </p>
      </div>

      <div className="mb-10 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-wider">
        <Link
          href="/shop"
          className={`rounded-full border px-4 py-2 transition ${
            !category ? "border-espresso bg-espresso text-ivory" : "border-taupe/30 text-espresso hover:border-espresso"
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

      {products.length ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p: any, i: number) => (
            <ProductCard key={p.id} product={p} position={i} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-taupe">No products found in this category.</p>
      )}
    </div>
  );
}
