import Link from "next/link";
import { api } from "@/lib/api";
import type { Category, GalleryImageT, ProductListItem, Season, SiteContentData, Testimonial } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductListTracker } from "@/components/ProductListTracker";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SmartImage } from "@/components/SmartImage";
import { Reveal } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { IMAGES, CATEGORY_IMAGES, GALLERY, categoryImage } from "@/lib/images";
import { TruckIcon, ReturnIcon, LockIcon, SparkleIcon, CrossIcon, StarBurstIcon } from "@/components/icons";
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
  seasons: Season[];
}> {
  const [content, testimonials, gallery, categories, seasons] = await Promise.all([
    api.siteContent().catch(() => null),
    api.testimonials().catch(() => [] as Testimonial[]),
    api.gallery().catch(() => [] as GalleryImageT[]),
    api.categories().catch(() => [] as Category[]),
    api.seasons().catch(() => [] as Season[]),
  ]);
  return {
    content,
    testimonials,
    gallery,
    categories: categories.filter((c) => (c.product_count ?? 1) > 0),
    seasons,
  };
}

const TRUST = [
  { icon: TruckIcon, title: "Free shipping", body: "On orders over \u20ac45" },
  { icon: LockIcon, title: "Pay after delivery", body: "With Klarna \u2014 zero risk" },
  { icon: ReturnIcon, title: "30-day returns", body: "Wrong size? Send it back" },
  { icon: SparkleIcon, title: "Crafted to last", body: "Heavyweight, embroidered detail" },
];

// Bento spans for the category grid, applied by position.
const CATEGORY_SPANS = ["md:col-span-2 md:row-span-2", "md:col-span-2", "", ""];
const CATEGORY_FALLBACK_IMAGES = Object.values(CATEGORY_IMAGES);

const STANDARD = [
  {
    title: "One story, told in full",
    body: "Thirteen collections trace the complete Gospel narrative \u2014 from the star over Bethlehem to the new creation. Every piece belongs to a chapter, and every chapter points to Him.",
  },
  {
    title: "Crafted to be kept",
    body: "Heavyweight combed cotton, embroidered artwork instead of cheap prints, woven neck labels and scripture set with care. Garments made to be worn for years, not seasons.",
  },
  {
    title: "Worn with purpose",
    body: "Quiet designs that start conversations \u2014 scripture on the fabric, meaning in the details. Secure checkout, tracked delivery and easy 30-day returns on every order.",
  },
];

export default async function HomePage() {
  const { bestsellers, newIn, proof } = await getHomeProducts();
  const { content, testimonials, gallery, categories, seasons } = await getSiteData();

  const categoryTiles = categories.slice(0, 4).map((c, i) => ({
    slug: c.slug,
    name: c.name,
    copy: c.description || "",
    span: CATEGORY_SPANS[i] ?? "",
    image: c.image || categoryImage(c.slug) || CATEGORY_FALLBACK_IMAGES[i % CATEGORY_FALLBACK_IMAGES.length],
  }));

  const heroEyebrow = content?.hero_eyebrow || "Life in the Spirit";
  const heroTitle = content?.hero_title || "From the first light";
  const heroAccent = content?.hero_title_accent || "to the eternal day.";
  const heroSubtitle =
    content?.hero_subtitle ||
    "Caerora tells the complete story of the Gospel in thirteen collections \u2014 heavyweight garments, embroidered detail and scripture you can wear.";
  const heroCtaLabel = content?.hero_cta_label || "Shop the collections";
  const heroCtaHref = content?.hero_cta_href || "/shop";
  const heroImage = content?.hero_image || IMAGES.hero;

  const storyEyebrow = content?.story_eyebrow || "Thirteen collections \u2014 one narrative";
  const storyTitle = content?.story_title || "The Complete Story";
  const storyBody =
    content?.story_body ||
    "Four acts. Thirteen seasons. From the birth of Christ to the new creation, each collection carries its own palette, its own scripture and its own place in the story.";

  const brandEyebrow = content?.brand_band_eyebrow || "Life in the Spirit \u00b7 Romans 8:11";
  const brandTitle = content?.brand_band_title;
  const brandBody = content?.brand_band_body;
  const brandImage = content?.brand_band_image || IMAGES.editorialDark;

  const newsletterTitle = content?.newsletter_title || "Join the fellowship \u2014 10% off your first order";
  const newsletterBody =
    content?.newsletter_body ||
    "Be first to know when a new season drops. Early access, behind-the-design stories and members-only offers. No spam, unsubscribe anytime.";

  const galleryImages = gallery.length
    ? gallery.map((g) => g.image).filter((s): s is string => Boolean(s))
    : GALLERY;

  // Group the seasons by act for the story strip.
  const acts: { act: string; seasons: Season[] }[] = [];
  for (const s of seasons) {
    const key = s.act || "";
    const last = acts[acts.length - 1];
    if (last && last.act === key) last.seasons.push(s);
    else acts.push({ act: key, seasons: [s] });
  }

  return (
    <>
      {/* ── Hero: cinematic dark band ─────────────────────── */}
      <section className="relative isolate overflow-hidden bg-midnight text-parchment">
        <SmartImage
          src={heroImage}
          alt="The first light over Bethlehem"
          fill
          priority
          className="animate-kenburns object-cover object-center opacity-90"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/95 via-midnight/60 to-midnight/20" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-midnight/80 to-transparent" />
        <div className="container-page relative py-24 md:py-40">
          <div className="max-w-xl animate-fadeUp">
            <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.35em] text-goldlight">
              <span className="h-3.5 w-3.5 animate-twinkle"><StarBurstIcon /></span>
              {heroEyebrow}
            </p>
            <h1 className="mt-5 font-serif text-4xl font-light leading-[1.05] sm:text-6xl md:text-7xl">
              {heroTitle}{" "}
              <span className="font-serif italic text-goldlight">{heroAccent}</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-parchment/80 md:mt-7 md:text-base">
              {heroSubtitle}
            </p>
            <div className="mt-7 flex flex-wrap gap-3 md:mt-10">
              <Link href={heroCtaHref} className="btn-gold btn-lg">{heroCtaLabel}</Link>
              <Link
                href="#story"
                className="btn btn-lg border border-parchment/40 text-parchment hover:border-parchment hover:bg-parchment hover:text-midnight"
              >
                Explore the story
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-parchment/70 md:mt-10">
              {proof ? (
                <span className="flex items-center gap-2">
                  <Stars value={proof.average} />
                  <span>
                    <span className="font-medium text-parchment">{proof.average.toFixed(1)}</span> from{" "}
                    {proof.count} verified reviews
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 text-goldlight"><CrossIcon /></span> Scripture in every stitch
                </span>
              )}
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 text-goldlight"><ReturnIcon /></span> Free 30-day returns
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Complete Story: thirteen seasons ──────────── */}
      {seasons.length > 0 && (
        <section id="story" className="border-b border-stone/10 bg-parchment">
          <div className="container-page section">
            <Reveal className="mb-10 text-center md:mb-14">
              <p className="eyebrow-rose">{storyEyebrow}</p>
              <h2 className="display mt-2 text-4xl md:text-6xl">{storyTitle}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone">{storyBody}</p>
              <div className="mx-auto mt-6 flex items-center justify-center gap-3 text-gold">
                <span className="h-px w-10 bg-gold/40" />
                <span className="h-3.5 w-3.5"><CrossIcon /></span>
                <span className="h-px w-10 bg-gold/40" />
              </div>
            </Reveal>

            <div className="space-y-10">
              {acts.map(({ act, seasons: group }) => (
                <Reveal key={act || group[0]?.slug}>
                  {act && (
                    <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-stone">
                      {act}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/shop?season=${s.slug}`}
                        className="group relative overflow-hidden rounded-2xl border border-stone/15 bg-white/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-card"
                      >
                        {s.image && (
                          <>
                            <SmartImage
                              src={s.image}
                              alt={s.name}
                              fill
                              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-midnight/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                          </>
                        )}
                        <div className="relative flex items-baseline justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex items-baseline gap-2.5">
                              <span className="font-serif text-2xl leading-none text-gold transition-colors group-hover:text-goldlight">
                                {s.numeral}.
                              </span>
                              <span className="truncate font-serif text-xl text-midnight transition-colors group-hover:text-parchment">
                                {s.name}
                              </span>
                            </p>
                            {s.subtitle && (
                              <p className="mt-1.5 text-[11px] uppercase tracking-widest text-stone transition-colors group-hover:text-parchment/70">
                                {s.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs uppercase tracking-widest text-stone/0 transition-all duration-300 group-hover:text-goldlight">
                            Shop &rarr;
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-10 text-center">
              <p className="font-serif text-lg italic text-stone">
                From the first light to the eternal day.
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Best sellers ──────────────────────────────────── */}
      {bestsellers.length > 0 && (
        <section className="container-page pb-10 pt-10 md:pb-14 md:pt-16">
          <ProductListTracker list="bestsellers" />
          <Reveal className="mb-6 flex items-end justify-between md:mb-10">
            <div>
              <p className="eyebrow-rose">Worn &amp; loved</p>
              <h2 className="display mt-2 text-3xl md:text-5xl">Best sellers</h2>
            </div>
            <Link href="/shop" className="text-xs uppercase tracking-widest text-midnight underline-offset-4 hover:text-gold hover:underline">
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
      <section className="border-b border-stone/10 bg-cream">
        <div className="container-page grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="icon-chip">
                <Icon />
              </span>
              <div>
                <p className="text-sm font-medium text-midnight">{title}</p>
                <p className="text-xs text-stone">{body}</p>
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
            <p className="eyebrow-rose">Everyday essentials</p>
            <h2 className="display mt-2 text-4xl md:text-5xl">Shop by category</h2>
          </div>
          <Link href="/shop" className="hidden text-xs uppercase tracking-widest text-midnight underline-offset-4 hover:text-gold hover:underline sm:block">
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
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-parchment">
                <div>
                  <p className="font-serif text-2xl md:text-3xl">{c.name}</p>
                  <p className="text-[11px] uppercase tracking-widest text-parchment/80">{c.copy}</p>
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
            <Link href="/shop" className="hidden text-xs uppercase tracking-widest text-midnight underline-offset-4 hover:text-gold hover:underline sm:block">
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
          alt="Caerora craftsmanship"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight/95 via-midnight/75 to-midnight/35" />
        <div className="container-page relative py-24 md:py-36">
          <Reveal className="max-w-xl text-parchment">
            <p className="text-[11px] uppercase tracking-[0.3em] text-goldlight">{brandEyebrow}</p>
            {brandTitle ? (
              <h2 className="mt-5 font-serif text-4xl font-light leading-[1.1] md:text-6xl">{brandTitle}</h2>
            ) : (
              <h2 className="mt-5 font-serif text-4xl font-light leading-[1.1] md:text-6xl">
                The same Spirit who raised Christ <span className="italic text-goldlight">now lives in you.</span>
              </h2>
            )}
            <p className="mt-6 max-w-md text-sm leading-relaxed text-parchment/85">
              {brandBody ||
                "Every Caerora piece is built around a verse \u2014 embroidered artwork, woven labels and heavyweight fabric that carries the words with the weight they deserve. Not merch. A testimony you can wear."}
            </p>
            <Link
              href="/shop"
              className="mt-9 inline-block rounded-full bg-parchment px-9 py-3.5 text-xs uppercase tracking-widest text-midnight transition hover:bg-goldlight"
            >
              Shop the collections
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
            <Reveal key={s.title} delay={i * 120} className="border-t border-stone/25 pt-6">
              <span className="font-serif text-5xl font-light text-sand">0{i + 1}</span>
              <h3 className="mt-4 font-serif text-2xl text-midnight">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-stone">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="border-t border-stone/10 bg-cream">
          <div className="container-page section">
            <Reveal className="mb-12 text-center">
              <p className="eyebrow-rose">Loved &amp; trusted</p>
              <h2 className="display mt-2 text-4xl md:text-5xl">What people are saying</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.slice(0, 6).map((t, i) => (
                <Reveal key={t.id} delay={i * 100} className="rounded-2xl bg-parchment p-7 shadow-card">
                  <div className="text-gold" aria-label={`${t.rating} stars`}>
                    {"\u2605".repeat(t.rating)}{"\u2606".repeat(Math.max(0, 5 - t.rating))}
                  </div>
                  <p className="mt-4 font-serif text-lg leading-relaxed text-midnight">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    {t.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-midnight">{t.author_name}</p>
                      {t.handle && <p className="text-xs text-stone">{t.handle}</p>}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── @caerora gallery ─────────────────────────────── */}
      <section className="border-t border-stone/10 bg-cream">
        <div className="container-page section">
          <Reveal className="mb-10 text-center">
            <p className="eyebrow-rose">@caerora</p>
            <h2 className="display mt-2 text-4xl md:text-5xl">Worn in the wild</h2>
            <p className="mt-3 text-sm text-stone">Tag <span className="text-midnight">@caerora</span> for a chance to be featured.</p>
          </Reveal>
          <Reveal className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {galleryImages.map((src, i) => (
              <Link
                key={i}
                href="/shop"
                className="group relative aspect-square overflow-hidden rounded-xl bg-parchment"
              >
                <SmartImage
                  src={src}
                  alt="Caerora community"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-midnight/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="text-xs uppercase tracking-widest text-parchment">Shop</span>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Guarantee band ───────────────────────────────── */}
      <section className="container-page section">
        <Reveal className="mx-auto max-w-2xl rounded-2xl bg-navy/5 px-6 py-12 text-center md:py-14">
          <h2 className="font-serif text-3xl text-midnight md:text-4xl">Love it — or your money back</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone">
            We&apos;re confident you&apos;ll love what arrives. If the fit isn&apos;t right or you&apos;re
            not 100% happy, you have 30 days to return it — no questions asked. And with Klarna you
            don&apos;t pay until your delivery has arrived, so there&apos;s nothing to risk.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-stone">
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
      <section className="border-t border-stone/10 bg-midnight">
        <div className="container-page grid grid-cols-1 items-center gap-8 py-16 md:grid-cols-2 md:py-20">
          <Reveal className="text-parchment">
            <p className="text-[11px] uppercase tracking-[0.3em] text-goldlight">Join the list</p>
            <h2 className="mt-3 font-serif text-4xl font-light leading-tight md:text-5xl">
              {newsletterTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-parchment/80">
              {newsletterBody}
            </p>
          </Reveal>
          <Reveal delay={120} className="md:justify-self-end md:w-full md:max-w-md">
            <div className="rounded-2xl bg-parchment/95 p-6 shadow-glow">
              <NewsletterForm source="home" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
