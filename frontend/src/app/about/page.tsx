import type { Metadata } from "next";
import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { IMAGES } from "@/lib/images";
import { LeafIcon, HeartIcon, SparkleIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Our story",
  description: "Caerora is modern beauty rooted in elegance, simplicity and confidence.",
};

const PILLARS = [
  { icon: LeafIcon, title: "Clean", body: "High-performance formulas made with clean, cruelty-free and vegan ingredients \u2014 kind to your skin and to the planet." },
  { icon: SparkleIcon, title: "Considered", body: "Thoughtful design and shades made to flatter real skin, for a beauty routine that feels effortless." },
  { icon: HeartIcon, title: "Trusted", body: "Shop with confidence: secure checkout, fast tracked delivery and a no-fuss 30-day return policy on every order." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-hero-glow">
        <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fadeUp">
            <p className="eyebrow-rose">Our story</p>
            <h1 className="heading-serif mt-3 text-4xl md:text-6xl">Beauty, elevated.</h1>
            <p className="mt-6 text-sm leading-relaxed text-taupe">
              Caerora began with a simple belief: that beauty should feel elevated, effortless and
              truly yours. We create clean, high-performance makeup and skincare that earns its place
              in your everyday routine.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-taupe">
              From weightless colour to skin-loving essentials, every Caerora product is designed for
              real life &mdash; beautiful to use, made to last and backed by easy 30-day returns.
            </p>
            <Link href="/shop" className="btn-primary btn-lg mt-8">Shop the collection</Link>
          </div>
          <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-soft animate-fadeUp-slow">
            <SmartImage
              src={IMAGES.about}
              alt="The Caerora ritual"
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
      <section className="border-t border-taupe/10 bg-cream">
        <div className="container-page grid gap-8 py-16 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="icon-chip mb-4">
                <Icon />
              </span>
              <h3 className="font-serif text-2xl text-plum">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-taupe">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
