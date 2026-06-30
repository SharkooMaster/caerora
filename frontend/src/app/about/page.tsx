import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our story",
  description: "Caerora is modern beauty rooted in elegance, simplicity and confidence.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="container-page grid items-center gap-10 py-16 md:grid-cols-2">
        <div>
          <p className="eyebrow">Our story</p>
          <h1 className="heading-serif mt-3 text-4xl md:text-5xl">Beauty, elevated.</h1>
          <p className="mt-6 text-sm leading-relaxed text-taupe">
            Caerora was born from a simple belief: that luxurious, high-performing makeup should be
            honest and accessible. We obsess over clean formulas, refined shades and sustainable
            packaging - then price them fairly, because beauty should never feel like a luxury tax.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-taupe">
            Every product is dermatologist-tested, cruelty-free and made to be effortlessly wearable.
            Timeless, refined and uniquely you.
          </p>
          <Link href="/shop" className="btn-primary mt-8">Shop the collection</Link>
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
          <Image src="/brand/logo-silk.png" alt="Caerora" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
        </div>
      </section>
      <section className="border-t border-taupe/10 bg-cream">
        <div className="container-page grid gap-8 py-14 sm:grid-cols-3">
          {[
            ["Clean", "Vegan, cruelty-free and dermatologist-tested formulas."],
            ["Fair", "Luxury quality without the luxury markup."],
            ["Considered", "Sustainable packaging and thoughtful shade ranges."],
          ].map(([t, b]) => (
            <div key={t}>
              <h3 className="font-serif text-2xl text-plum">{t}</h3>
              <p className="mt-2 text-sm text-taupe">{b}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
