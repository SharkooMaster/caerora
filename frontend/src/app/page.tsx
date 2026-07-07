import Link from "next/link";
import { api } from "@/lib/api";
import type { Category, GalleryImageT, ProductListItem, SiteContentData, Testimonial } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SmartImage } from "@/components/SmartImage";
import { Reveal } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { IMAGES, CATEGORY_IMAGES, GALLERY } from "@/lib/images";
import { TruckIcon, LeafIcon, ReturnIcon, LockIcon, SparkleIcon } from "@/components/icons";
import { Stars } from "@/components/Rating";
import { Faq } from "@/components/Faq";
import type { Metadata } from "next";

export const revalidate = 120;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

async function getHomeProducts(): Promise<{
  bestsellers: ProductListItem[];
  newIn: ProductListItem[];
  proof: { average: number; count: number } | null;
}> {
  try {
    const all = await api.products();
    const products = all.results;
    // Always fill a row of 4: lead with featured, then top up with the rest so
    // the grid never renders a lopsided/empty column.
    const featured = products.filter((p) => p.is_featured);
    const featuredSlugs = new Set(featured.map((p) => p.slug));
    const filler = products.filter((p) => !featuredSlugs.has(p.slug));
    const bestsellers = [...featured, ...filler].slice(0, 4);
    const bestslugs = new Set(bestsellers.map((p) => p.slug));
    const rest = products.filter((p) => !bestslugs.has(p.slug));
    const newIn = (rest.length ? rest : products).slice(0, 4);
    // Honest, catalog-wide social proof from real approved reviews.
    const count = products.reduce((n, p) => n + p.review_stats.count, 0);
    const weighted = products.reduce((s, p) => s + p.review_stats.average * p.review_stats.count, 0);
    const proof = count > 0 ? { average: weighted / count, count } : null;
    return { bestsellers, newIn, proof };
  } catch {
    return { bestsellers: [], newIn: [], proof: null };
  }
}

async function getSiteData(): Promise<{
  content: SiteContentData | null;
  testimonials: Testimonial[];
  gallery: GalleryImageT[];
  categories: Category[];
}> {
  const [content, testimonials, gallery, categories] = await Promise.all([
    api.siteContent().catch(() => null),
    api.testimonials().catch(() => [] as Testimonial[]),
    api.gallery().catch(() => [] as GalleryImageT[]),
    api.categories().catch(() => [] as Category[]),
  ]);
  return {
    content,
    testimonials,
    gallery,
    categories: categories.filter((c) => (c.product_count ?? 1) > 0),
  };
}

const TRUST = [
  { icon: TruckIcon, title: "Free shipping", body: "On orders over \u20ac45" },
  { icon: LockIcon, title: "Pay after delivery", body: "With Klarna \u2014 zero risk" },
  { icon: ReturnIcon, title: "30-day returns", body: "Not in love? Send it back" },
  { icon: LeafIcon, title: "100% authentic", body: "Verified brand products" },
];

// Bento spans for the category grid, applied by position.
const CATEGORY_SPANS = ["md:col-span-2 md:row-span-2", "md:col-span-2", "", ""];
const CATEGORY_FALLBACK_IMAGES = Object.values(CATEGORY_IMAGES);

const STANDARD = [
  {
    title: "Clean, proven formulas",
    body: "High-performance makeup and skincare made with clean, cruelty-free ingredients \u2014 designed to look good and feel good on every skin.",
  },
  {
    title: "Fast, tracked delivery",
    body: "Orders ship quickly with tracking sent straight to your inbox, so you always know exactly when your order is on the way.",
  },
  {
    title: "Shop with confidence",
    body: "Secure checkout and a no-fuss 30-day return policy on every order. Not in love? Send it back, simple as that.",
  },
];

export default async function HomePage() {
  const { bestsellers, newIn, proof } = await getHomeProducts();
  const { content, testimonials, gallery, categories } = await getSiteData();

  const categoryTiles = categories.slice(0, 4).map((c, i) => ({
    slug: c.slug,
    name: c.name,
    copy: c.description || "",
    span: CATEGORY_SPANS[i] ?? "",
    image: c.image || CATEGORY_IMAGES[c.slug] || CATEGORY_FALLBACK_IMAGES[i % CATEGORY_FALLBACK_IMAGES.length],
  }));

  const heroEyebrow = content?.hero_eyebrow || "New season beauty";
  const heroTitle = content?.hero_title || "Beauty,";
  const heroAccent = content?.hero_title_accent || "elevated.";
  const heroSubtitle =
    content?.hero_subtitle ||
    "Clean, high-performance makeup and skincare, designed to feel like you and made to last. Discover the collection your everyday routine has been missing.";
  const heroCtaLabel = content?.hero_cta_label || "Shop the collection";
  const heroCtaHref = content?.hero_cta_href || "/shop";
  const heroImage = content?.hero_image || IMAGES.hero;

  const brandTitle = content?.brand_band_title;
  const brandBody = content?.brand_band_body;
  const brandImage = content?.brand_band_image || IMAGES.editorialDark;

  const newsletterTitle = content?.newsletter_title || "Get 10% off your first order";
  const newsletterBody =
    content?.newsletter_body ||
    "Early access to launches, beauty edits and members-only offers. No spam, unsubscribe anytime.";

  const galleryImages = gallery.length
    ? gallery.map((g) => g.image).filter((s): s is string => Boolean(s))
    : GALLERY;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-glow">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 top-8 h-72 w-72 rounded-full bg-rose/20 blur-3xl animate-float" />
          <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-champagne/25 blur-3xl" />
        </div>
        <div className="container-page relative grid grid-cols-1 items-center gap-10 py-8 md:grid-cols-[1.05fr_1fr] md:gap-16 md:py-20 lg:py-24">
          <div className="animate-fadeUp">
            <p className="eyebrow-rose">{heroEyebrow}</p>
            <h1 className="display mt-3 text-4xl sm:text-6xl md:mt-5 md:text-7xl lg:text-[5.5rem]">
              {heroTitle} <span className="display-accent text-plum">{heroAccent}</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-taupe md:mt-6 md:text-base">
              {heroSubtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-8">
              <Link href={heroCtaHref} className="btn-primary btn-lg">{heroCtaLabel}</Link>
              <Link href="/about" className="btn-outline btn-lg hidden sm:inline-flex">Our story</Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-taupe md:mt-8">
              {proof ? (
                <span className="flex items-center gap-2">
                  <Stars value={proof.average} />
                  <span>
                    <span className="font-medium text-espresso">{proof.average.toFixed(1)}</span> from{" "}
                    {proof.count} verified reviews
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 text-plum"><SparkleIcon /></span> Clean, cruelty-free formulas
                </span>
              )}
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 text-plum"><ReturnIcon /></span> Free 30-day returns
              </span>
            </div>
          </div>

          {/* On mobile the hero image pushed products two screens down; show it
              from md up only so shoppers land straight on the product grid. */}
          <div className="relative hidden animate-fadeUp-slow md:block">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-soft ring-1 ring-taupe/10">
              <SmartImage
                src={heroImage}
                alt="Caerora beauty look"
                fill
                priority
                className="animate-kenburns object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/25 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl bg-ivory/95 p-4 shadow-card backdrop-blur sm:-left-6 animate-float">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-plum text-ivory">
                <span className="h-5 w-5"><SparkleIcon /></span>
              </div>
              <div>
                <p className="font-serif text-lg leading-none text-espresso">New in</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-taupe">Fresh drops this season</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Best sellers (first content so mobile visitors see products
             without scrolling past editorial sections) ─────── */}
      {bestsellers.length > 0 && (
        <section className="container-page pb-10 pt-8 md:pb-14 md:pt-16">
          <ProductListTracker list="bestsellers" />
          <Reveal className="mb-6 flex items-end justify-between md:mb-10">
            <div>
              <p className="eyebrow-rose">Loved by many</p>
              <h2 className="display mt-2 text-3xl md:text-5xl">Best sellers</h2>
            </div>
            <Link href="/shop" className="text-xs uppercase tracking-widest text-espresso underline-offset-4 hover:text-rose hover:underline">
              Shop all
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {bestsellers.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <ProductCard product={p} position={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Marquee ribbon ───────────────────────────────── */}
      <Marquee />

      {/* ── Trust bar ────────────────────────────────────── */}
      <section className="border-b border-taupe/10 bg-cream">
        <div className="container-page grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
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

      {/* ── Shop by category (bento) ─────────────────────── */}
      {categoryTiles.length > 0 && (
      <section className="container-page section">
        <Reveal className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow-rose">Find your ritual</p>
            <h2 className="display mt-2 text-4xl md:text-5xl">Shop by category</h2>
          </div>
          <Link href="/shop" className="hidden text-xs uppercase tracking-widest text-espresso underline-offset-4 hover:text-rose hover:underline sm:block">
            View all
          </Link>
        </Reveal>
        <Reveal className="grid grid-cols-2 gap-4 md:h-[560px] md:grid-cols-4 md:grid-rows-2">
          {categoryTiles.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className={`group relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream md:aspect-auto ${c.span}`}
            >
              <SmartImage
                src={c.image}
                alt={c.name}
                fill
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-ivory">
                <div>
                  <p className="font-serif text-2xl md:text-3xl">{c.name}</p>
                  <p className="text-[11px] uppercase tracking-widest text-ivory/80">{c.copy}</p>
                </div>
                <span className="mb-1 text-sm uppercase tracking-widest transition-all duration-300 md:translate-x-2 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
                  Shop &rarr;
                </span>
              </div>
            </Link>
          ))}
        </Reveal>
      </section>
      )}

      {/* ── New in ───────────────────────────────────────── */}
      {newIn.length > 0 && (
        <section className="container-page pb-4">
          <Reveal className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow-rose">Just landed</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">New in</h2>
            </div>
            <Link href="/shop" className="hidden text-xs uppercase tracking-widest text-espresso underline-offset-4 hover:text-rose hover:underline sm:block">
              Shop all
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {newIn.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <ProductCard product={p} position={i} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <Link href="/shop" className="btn-outline">View all products</Link>
          </div>
        </section>
      )}

      {/* ── Cinematic brand band ─────────────────────────── */}
      <section className="relative isolate my-16 overflow-hidden md:my-24">
        <SmartImage
          src={brandImage}
          alt="Caerora editorial"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/70 to-espresso/30" />
        <div className="container-page relative py-24 md:py-36">
          <Reveal className="max-w-xl text-ivory">
            <p className="text-[11px] uppercase tracking-widest text-champagne">The Caerora promise</p>
            {brandTitle ? (
              <h2 className="mt-5 font-serif text-4xl font-light leading-[1.1] md:text-6xl">{brandTitle}</h2>
            ) : (
              <h2 className="mt-5 font-serif text-4xl font-light leading-[1.1] md:text-6xl">
                Beauty that feels <span className="italic">timeless</span>, refined and uniquely you.
              </h2>
            )}
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/85">
              {brandBody ||
                "Every Caerora product is made for real life \u2014 clean, high-performance formulas, considered design and shades that work on you. Beauty worth reaching for."}
            </p>
            <Link
              href="/shop"
              className="mt-9 inline-block rounded-full bg-ivory px-9 py-3.5 text-xs uppercase tracking-widest text-espresso transition hover:bg-champagne"
            >
              Shop the collection
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── The Caerora standard (editorial) ─────────────── */}
      <section className="container-page section">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow-rose">The Caerora standard</p>
          <h2 className="display mt-2 text-4xl md:text-5xl">Why Caerora</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {STANDARD.map((s, i) => (
            <Reveal key={s.title} delay={i * 120} className="border-t border-taupe/25 pt-6">
              <span className="font-serif text-5xl font-light text-champagne">0{i + 1}</span>
              <h3 className="mt-4 font-serif text-2xl text-espresso">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-taupe">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="border-t border-taupe/10 bg-cream">
          <div className="container-page section">
            <Reveal className="mb-12 text-center">
              <p className="eyebrow-rose">Loved &amp; trusted</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">What people are saying</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.slice(0, 6).map((t, i) => (
                <Reveal key={t.id} delay={i * 100} className="rounded-2xl bg-ivory p-7 shadow-card">
                  <div className="text-rose" aria-label={`${t.rating} stars`}>
                    {"\u2605".repeat(t.rating)}{"\u2606".repeat(Math.max(0, 5 - t.rating))}
                  </div>
                  <p className="mt-4 font-serif text-lg leading-relaxed text-espresso">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    {t.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-espresso">{t.author_name}</p>
                      {t.handle && <p className="text-xs text-taupe">{t.handle}</p>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── @caerora gallery ─────────────────────────────── */}
      <section className="border-t border-taupe/10 bg-cream">
        <div className="container-page section">
          <Reveal className="mb-10 text-center">
            <p className="eyebrow-rose">@caerora</p>
            <h2 className="display mt-2 text-4xl md:text-5xl">Share your look</h2>
            <p className="mt-3 text-sm text-taupe">Tag <span className="text-espresso">@caerora</span> for a chance to be featured.</p>
          </Reveal>
          <Reveal className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {galleryImages.map((src, i) => (
              <Link
                key={i}
                href="/shop"
                className="group relative aspect-square overflow-hidden rounded-xl bg-ivory"
              >
                <SmartImage
                  src={src}
                  alt="Caerora community look"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-espresso/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-xs uppercase tracking-widest text-ivory">Shop</span>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Guarantee band (Shrine's risk-reversal rich text) ── */}
      <section className="container-page section">
        <Reveal className="mx-auto max-w-2xl rounded-2xl bg-plum/5 px-6 py-12 text-center md:py-14">
          <h2 className="font-serif text-3xl text-espresso md:text-4xl">Love it — or your money back</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-taupe">
            We&apos;re confident you&apos;ll love your order. If you&apos;re not 100% happy, you have 30
            days to return it — no questions asked. And with Klarna you don&apos;t pay until your delivery
            has arrived, so there&apos;s nothing to risk.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-taupe">
            <span>✔ 30-day returns</span>
            <span>✔ Pay after delivery with Klarna</span>
            <span>✔ Tracked shipping</span>
          </div>
          <Link href="/shop" className="btn-primary btn-lg mt-8 inline-flex">
            Shop risk-free
          </Link>
        </Reveal>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="container-page pb-16">
        <Faq />
      </section>

      {/* ── Newsletter band ──────────────────────────────── */}
      <section className="border-t border-taupe/10 bg-plum">
        <div className="container-page grid grid-cols-1 items-center gap-8 py-16 md:grid-cols-2 md:py-20">
          <Reveal className="text-ivory">
            <p className="text-[11px] uppercase tracking-widest text-champagne">Join the list</p>
            <h2 className="mt-3 font-serif text-4xl font-light leading-tight md:text-5xl">
              {newsletterTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory/80">
              {newsletterBody}
            </p>
          </Reveal>
          <Reveal delay={120} className="md:justify-self-end md:w-full md:max-w-md">
            <div className="rounded-2xl bg-ivory/95 p-6 shadow-glow">
              <NewsletterForm source="home" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
