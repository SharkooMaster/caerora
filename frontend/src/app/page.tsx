import Link from "next/link";
import { api } from "@/lib/api";
import type { ProductListItem } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SmartImage } from "@/components/SmartImage";
import { IMAGES, CATEGORY_IMAGES } from "@/lib/images";
import { TruckIcon, LeafIcon, ReturnIcon, LockIcon, StarIcon } from "@/components/icons";

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

const TRUST = [
  { icon: TruckIcon, title: "Free shipping", body: "On every order over \u20ac45" },
  { icon: LeafIcon, title: "Clean & cruelty-free", body: "Vegan, dermatologist-tested" },
  { icon: ReturnIcon, title: "30-day returns", body: "Not in love? Send it back" },
  { icon: LockIcon, title: "Secure checkout", body: "Encrypted & protected" },
];

const CATEGORIES = [
  { slug: "lips", name: "Lips", copy: "Lipsticks & oils" },
  { slug: "face", name: "Face", copy: "Base & cheeks" },
  { slug: "eyes", name: "Eyes", copy: "Mascara & shadow" },
  { slug: "skin", name: "Skin", copy: "Prep & glow" },
];

const TESTIMONIALS = [
  {
    name: "Sophie R.",
    title: "Better than luxury brands",
    body: "Comparable to products twice the price. The color payoff is unreal and it lasts all day. Caerora has my full trust now.",
  },
  {
    name: "Mia L.",
    title: "My new everyday",
    body: "Lightweight, blends like a dream, and the packaging feels so luxe. I've already repurchased twice.",
  },
  {
    name: "Aria N.",
    title: "Gentle and glowy",
    body: "No irritation on my sensitive skin and the results speak for themselves. Natural, glowy, never cakey.",
  },
];

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fadeUp">
            <p className="eyebrow-rose">New season edit</p>
            <h1 className="heading-serif mt-4 text-5xl leading-[1.05] md:text-7xl">
              Beauty,
              <br />
              elevated.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-taupe">
              Clean, refined makeup that feels luxurious &mdash; and is priced fairly. Formulas you
              can trust, shades you&rsquo;ll reach for every day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary btn-lg">Shop the collection</Link>
              <Link href="/about" className="btn-outline btn-lg">Our story</Link>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex text-rose">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="h-4 w-4"><StarIcon /></span>
                ))}
              </div>
              <p className="text-sm text-taupe">
                <span className="font-medium text-espresso">4.9/5</span> from 10,000+ happy customers
              </p>
            </div>
          </div>

          <div className="relative animate-fadeUp-slow">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-soft">
              <SmartImage
                src={IMAGES.hero}
                alt="Caerora makeup look"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Floating social-proof card */}
            <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-2xl bg-ivory/95 p-4 shadow-card backdrop-blur sm:-left-6 animate-float">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-plum text-ivory">
                <span className="h-5 w-5"><StarIcon /></span>
              </div>
              <div>
                <p className="font-serif text-lg leading-none text-espresso">4.9 rating</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-taupe">2,000+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-taupe/10 bg-cream">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="icon-chip">
                <Icon />
              </span>
              <div>
                <p className="text-sm font-medium text-espresso">{title}</p>
                <p className="text-xs text-taupe">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="container-page section">
        <div className="mb-10 text-center">
          <p className="eyebrow-rose">Find your ritual</p>
          <h2 className="heading-serif mt-2 text-3xl md:text-4xl">Shop by category</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream lift"
            >
              <SmartImage
                src={CATEGORY_IMAGES[c.slug]}
                alt={c.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                <p className="font-serif text-2xl">{c.name}</p>
                <p className="text-xs uppercase tracking-wider text-ivory/80">{c.copy}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container-page pb-4">
        <ProductListTracker />
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow-rose">Bestsellers</p>
            <h2 className="heading-serif mt-2 text-3xl md:text-4xl">Loved by our community</h2>
          </div>
          <Link href="/shop" className="hidden text-xs uppercase tracking-wider text-espresso underline-offset-4 hover:text-rose hover:underline sm:block">
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
        <div className="mt-10 text-center sm:hidden">
          <Link href="/shop" className="btn-outline">View all products</Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="container-page">
          <div className="mb-10 text-center">
            <p className="eyebrow-rose">The reviews are in</p>
            <h2 className="heading-serif mt-2 text-3xl md:text-4xl">Loved by thousands</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="card flex h-full flex-col p-7 shadow-card">
                <div className="flex text-rose">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="h-4 w-4"><StarIcon /></span>
                  ))}
                </div>
                <figcaption className="mt-4 font-serif text-xl text-espresso">{t.title}</figcaption>
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-taupe">
                  &ldquo;{t.body}&rdquo;
                </blockquote>
                <div className="mt-5 flex items-center gap-3 border-t border-taupe/10 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-champagne/50 font-serif text-sm text-plum">
                    {t.name.charAt(0)}
                  </span>
                  <div className="text-xs">
                    <p className="font-medium text-espresso">{t.name}</p>
                    <p className="text-taupe">Verified purchase</p>
                  </div>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <section className="bg-plum">
        <div className="container-page grid items-center gap-10 py-20 md:grid-cols-2">
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[2rem] shadow-glow">
            <SmartImage src={IMAGES.brandDark} alt="Caerora ritual" fill className="object-cover" sizes="(max-width:768px) 100vw, 400px" />
          </div>
          <div className="text-ivory">
            <p className="text-[11px] uppercase tracking-widest text-ivory/70">The Caerora promise</p>
            <h2 className="mt-4 font-serif text-3xl font-light leading-snug md:text-4xl">
              We believe beauty is timeless, refined and uniquely you.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/80">
              Every formula is crafted to be effortless and every price set to be fair. No gimmicks,
              no luxury tax &mdash; just beautiful products you can trust.
            </p>
            <Link href="/shop" className="mt-8 inline-block rounded-full bg-ivory px-8 py-3.5 text-xs uppercase tracking-widest text-espresso transition hover:bg-champagne">
              Explore products
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter band */}
      <section className="border-b border-taupe/10 bg-cream">
        <div className="container-page grid items-center gap-8 py-14 md:grid-cols-2">
          <div>
            <p className="eyebrow-rose">Join the list</p>
            <h2 className="heading-serif mt-2 text-3xl md:text-4xl">Get 10% off your first order</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-taupe">
              Early access to launches, beauty edits and members-only offers. No spam, unsubscribe
              anytime.
            </p>
          </div>
          <div className="md:justify-self-end md:w-full md:max-w-md">
            <NewsletterForm source="home" />
          </div>
        </div>
      </section>
    </>
  );
}
