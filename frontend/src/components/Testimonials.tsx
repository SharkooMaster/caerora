import type { Testimonial } from "@/lib/types";
import { Reveal } from "./Reveal";

/** Shrine-style testimonial cards: stars, quote, author. Used on the home
 *  page and under the PDP so social proof appears at the point of decision. */
export function TestimonialCards({ testimonials }: { testimonials: Testimonial[] }) {
  if (!testimonials.length) return null;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {testimonials.slice(0, 6).map((t, i) => (
        <Reveal key={t.id} delay={i * 100} className="rounded-2xl bg-ivory p-7 shadow-card">
          <div className="text-rose" aria-label={`${t.rating} stars`}>
            {"\u2605".repeat(t.rating)}
            {"\u2606".repeat(Math.max(0, 5 - t.rating))}
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
  );
}
