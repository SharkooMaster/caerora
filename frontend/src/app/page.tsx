import Link from "next/link";
import { api } from "@/lib/api";
import type { ProductListItem } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SmartImage } from "@/components/SmartImage";
import { IMAGES, CATEGORY_IMAGES } from "@/lib/images";
import { TruckIcon, LeafIcon, ReturnIcon, LockIcon, SparkleIcon } from "@/components/icons";

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
  { icon: LeafIcon, title: "Hand-picked edit", body: "Curated clean beauty" },
  { icon: ReturnIcon, title: "30-day returns", body: "Not in love? Send it back" },
  { icon: LockIcon, title: "Secure checkout", body: "Encrypted & protected" },
];

const CATEGORIES = [
  { slug: "lips", name: "Lips", copy: "Lipsticks & oils" },
  { slug: "face", name: "Face", copy: "Base & cheeks" },
  { slug: "eyes", name: "Eyes", copy: "Mascara & shadow" },
  { slug: "skin", name: "Skin", copy: "Prep & glow" },
];

const STANDARD = [
  {
    icon: SparkleIcon,
    title: "A curated edit",
    body: "We hand-pick a tight collection of clean, modern beauty \u2014 quality over clutter, so you never have to sift through thousands of products.",
  },
  {
    icon: TruckIcon,
    title: "Delivered with care",
    body: "Every order is prepared and shipped by our fulfilment partners, with tracking sent to your inbox the moment it's on the way.",
  },
  {
    icon: ReturnIcon,
    title: "Shop with confidence",
    body: "Secure checkout and a no-fuss 30-day return policy on every order. Not in love? Send it back, simple as that.",
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
            <p className="eyebrow-rose">The clean-beauty edit</p>
            <h1 className="heading-serif mt-4 text-5xl leading-[1.05] md:text-7xl">
              Beauty,
              <br />
              elevated.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-taupe">
              A curated edit of clean, modern beauty &mdash; hand-picked pieces we love, chosen for
              quality and delivered with care. Discover your new everyday favourites.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary btn-lg">Shop the edit</Link>
              <Link href="/about" className="btn-outline btn-lg">Our story</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-taupe">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 text-plum"><SparkleIcon /></span> Curated clean-beauty edit
              </span>
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 text-plum"><ReturnIcon /></span> Free 30-day returns
              </span>
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
            {/* Floating reassurance card */}
            <div className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-2xl bg-ivory/95 p-4 shadow-card backdrop-blur sm:-left-6 animate-float">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-plum text-ivory">
                <span className="h-5 w-5"><ReturnIcon /></span>
              </div>
              <div>
                <p className="font-serif text-lg leading-none text-espresso">Easy returns</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-taupe">30 days, no fuss</p>
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
            <p className="eyebrow-rose">Featured</p>
            <h2 className="heading-serif mt-2 text-3xl md:text-4xl">This season&rsquo;s edit</h2>
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

      {/* The Caerora standard */}
      <section className="section">
        <div className="container-page">
          <div className="mb-10 text-center">
            <p className="eyebrow-rose">The Caerora standard</p>
            <h2 className="heading-serif mt-2 text-3xl md:text-4xl">Why shop the edit</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STANDARD.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card flex h-full flex-col p-7 shadow-card">
                <span className="icon-chip mb-4">
                  <Icon />
                </span>
                <h3 className="font-serif text-xl text-espresso">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-taupe">{body}</p>
              </div>
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
              So we hand-pick every piece in the edit for quality and everyday wearability &mdash;
              then deliver it with care. No noise, no clutter, just beauty worth reaching for.
            </p>
            <Link href="/shop" className="mt-8 inline-block rounded-full bg-ivory px-8 py-3.5 text-xs uppercase tracking-widest text-espresso transition hover:bg-champagne">
              Explore the edit
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
