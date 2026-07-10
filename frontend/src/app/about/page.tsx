import type { Metadata } from "next";
import Link from "next/link";
import { SmartImage } from "@/components/SmartImage";
import { IMAGES } from "@/lib/images";
import { CrossIcon, SparkleIcon, HeartIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Caerora is a Christian clothing brand telling the complete story of the Gospel in thirteen collections — life in the Spirit, from the first light to the eternal day.",
};

const PILLARS = [
  {
    icon: CrossIcon,
    title: "Rooted in scripture",
    body: "Every collection begins with a passage, not a trend. Thirteen seasons trace the Gospel from the birth of Christ to the new creation \u2014 and every garment carries its verse.",
  },
  {
    icon: SparkleIcon,
    title: "Crafted to be kept",
    body: "Heavyweight combed cotton, embroidered artwork instead of prints that crack, woven neck labels and considered details. Made to be worn for years, not seasons.",
  },
  {
    icon: HeartIcon,
    title: "Worn with purpose",
    body: "Quiet designs that invite conversation rather than shout. Secure checkout, fast tracked delivery and a no-fuss 30-day return policy on every order.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-hero-glow">
        <div className="container-page grid grid-cols-1 items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-fadeUp">
            <p className="eyebrow-rose">Our story</p>
            <h1 className="heading-serif mt-3 text-4xl md:text-6xl">Life in the Spirit.</h1>
            <p className="mt-6 text-sm leading-relaxed text-stone">
              Caerora began with a simple conviction: the greatest story ever told deserves better
              than an afterthought on a t-shirt. So we set out to tell it properly &mdash; in
              thirteen collections that follow the Gospel from the star over Bethlehem to the new
              creation, each with its own palette, its own scripture and its own place in the
              narrative.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-stone">
              The name Caerora carries the idea of dawn &mdash; first light breaking into darkness.
              That is the story we wear: from the first light to the eternal day. Every piece is
              cut from heavyweight cotton, finished with embroidered detail and made to be kept.
            </p>
            <p className="mt-4 font-serif text-base italic leading-relaxed text-gold">
              &ldquo;And if the Spirit of him who raised Jesus from the dead is living in you, he who
              raised Christ from the dead will also give life to your mortal bodies.&rdquo;
              <span className="mt-1 block text-xs uppercase not-italic tracking-widest text-stone">Romans 8:11</span>
            </p>
            <Link href="/shop" className="btn-primary btn-lg mt-8">Shop the collections</Link>
          </div>
          <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-soft animate-fadeUp-slow">
            <SmartImage
              src={IMAGES.about}
              alt="Caerora garments"
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
      <section className="border-t border-stone/10 bg-cream">
        <div className="container-page grid grid-cols-1 gap-8 py-16 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="icon-chip mb-4">
                <Icon />
              </span>
              <h3 className="font-serif text-2xl text-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
