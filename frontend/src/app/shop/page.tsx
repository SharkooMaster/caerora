import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { Season } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";
import { CrossIcon } from "@/components/icons";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Shop the full Caerora range — heavyweight tees, hoodies and sweatshirts across thirteen collections telling the complete story of the Gospel.",
  alternates: { canonical: "/shop" },
};

async function getData(category?: string, season?: string) {
  const params: Record<string, string> = {};
  if (category) params["category__slug"] = category;
  if (season) params["season__slug"] = season;
  const [products, categories, seasons] = await Promise.all([
    api.products(params).catch(() => ({ results: [] }) as any),
    api.categories().catch(() => []),
    api.seasons().catch(() => [] as Season[]),
  ]);
  return {
    products: products.results,
    categories: categories.filter((c) => (c.product_count ?? 1) > 0),
    seasons,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; season?: string };
}) {
  const category = searchParams.category;
  const seasonSlug = searchParams.season;
  const { products, categories, seasons } = await getData(category, seasonSlug);

  const activeSeason = seasonSlug ? seasons.find((s) => s.slug === seasonSlug) : undefined;

  const heading = activeSeason
    ? activeSeason.name
    : category
      ? categories.find((c) => c.slug === category)?.name ?? "Shop all"
      : "Shop all";

  return (
    <div className="container-page py-12">
      <ProductListTracker list={seasonSlug || category || "all"} />
      <div className="mb-8 text-center">
        <p className="eyebrow-rose">
          {activeSeason ? activeSeason.act || "The collection" : "The collections"}
        </p>
        <h1 className="heading-serif mt-2 text-4xl md:text-5xl">
          {activeSeason ? (
            <>
              <span className="text-gold">{activeSeason.numeral}.</span> {heading}
            </>
          ) : (
            heading
          )}
        </h1>
        {activeSeason?.scripture_text ? (
          <div className="mx-auto mt-4 max-w-xl">
            <p className="font-serif text-lg italic leading-relaxed text-stone">
              &ldquo;{activeSeason.scripture_text}&rdquo;
            </p>
            {activeSeason.scripture_ref && (
              <p className="mt-2 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-gold">
                <span className="h-3 w-3"><CrossIcon /></span>
                {activeSeason.scripture_ref}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone">
            {products.length} {products.length === 1 ? "product" : "products"} &middot; crafted to be kept, with free 30-day returns
          </p>
        )}
        {activeSeason?.description && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone">{activeSeason.description}</p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-wider">
        <Link
          href="/shop"
          className={`rounded-full border px-4 py-2 transition ${
            !category && !seasonSlug ? "border-midnight bg-midnight text-parchment" : "border-stone/30 text-midnight hover:border-midnight"
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
                ? "border-midnight bg-midnight text-parchment"
                : "border-stone/30 text-midnight hover:border-midnight"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {seasons.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="uppercase tracking-widest text-stone">Seasons:</span>
          {seasons.map((s) => (
            <Link
              key={s.slug}
              href={`/shop?season=${s.slug}`}
              title={s.subtitle}
              className={`rounded-full px-3 py-1.5 transition ${
                seasonSlug === s.slug
                  ? "bg-navy text-parchment"
                  : "bg-cream text-midnight hover:bg-navy/10"
              }`}
            >
              <span className={`font-serif ${seasonSlug === s.slug ? "text-goldlight" : "text-gold"}`}>{s.numeral}.</span> {s.name}
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
        <p className="py-20 text-center text-stone">
          Nothing here yet — this season&apos;s drop is still being prepared. Explore another season or category.
        </p>
      )}
    </div>
  );
}
