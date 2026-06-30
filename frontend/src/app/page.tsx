import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import type { ProductListItem } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";

export const revalidate = 120;

async function getFeatured(): Promise<ProductListItem[]> {
  try {
    const data = await api.products({ is_featured: "true" });
    if (data.results.length) return data.results.slice(0, 4);
    const all = await api.products();
    return all.results.slice(0, 4);
  } catch {
    return [];
  }
}

const VALUES = [
  { title: "Honestly priced", body: "Luxury formulas without the luxury markup. Fair pricing, always." },
  { title: "Clean & cruelty-free", body: "Dermatologist-tested, vegan and never tested on animals." },
  { title: "Loved by thousands", body: "Real reviews from a community that keeps coming back." },
  { title: "30-day returns", body: "Not in love? Return within 30 days, no questions asked." },
];

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fadeUp">
            <p className="eyebrow">New season edit</p>
            <h1 className="heading-serif mt-4 text-5xl leading-tight md:text-6xl">
              Beauty,
              <br />
              elevated.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-taupe">
              Caerora is modern beauty rooted in elegance and confidence. Clean, refined makeup
              that feels luxurious and is priced fairly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">Shop the collection</Link>
              <Link href="/about" className="btn-outline">Our story</Link>
            </div>
          </div>
          <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl">
            <Image
              src="/brand/hero.png"
              alt="Caerora products"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-y border-taupe/10 bg-cream">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title}>
              <h3 className="font-serif text-xl text-plum">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-taupe">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-page py-20">
        <ProductListTracker />
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow">Bestsellers</p>
            <h2 className="heading-serif mt-2 text-3xl md:text-4xl">Loved by our community</h2>
          </div>
          <Link href="/shop" className="hidden text-xs uppercase tracking-wider text-espresso hover:text-rose sm:block">
            View all
          </Link>
        </div>
        {featured.length ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} position={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-taupe">Products are on their way. Check back soon.</p>
        )}
      </section>

      {/* Brand statement */}
      <section className="bg-plum">
        <div className="container-page grid items-center gap-10 py-20 md:grid-cols-2">
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl">
            <Image src="/brand/logo-silk.png" alt="Caerora" fill className="object-cover" sizes="400px" />
          </div>
          <div className="text-ivory">
            <p className="text-[11px] uppercase tracking-widest text-ivory/70">The Caerora promise</p>
            <h2 className="mt-4 font-serif text-3xl font-light leading-snug md:text-4xl">
              We believe beauty is timeless, refined and uniquely you.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/80">
              Every formula is crafted to be effortless and every price set to be fair. No gimmicks,
              just beautiful products you can trust.
            </p>
            <Link href="/shop" className="mt-8 inline-block rounded-full bg-ivory px-7 py-3 text-xs uppercase tracking-widest text-espresso transition hover:bg-champagne">
              Explore products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
