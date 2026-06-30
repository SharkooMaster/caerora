"use client";
import { useState } from "react";
import type { Review, ReviewStats } from "@/lib/types";
import { api } from "@/lib/api";
import { Stars } from "./Rating";

export function ProductReviews({
  slug,
  initialReviews,
  stats,
}: {
  slug: string;
  initialReviews: Review[];
  stats: ReviewStats;
}) {
  const [reviews] = useState<Review[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await api.createReview({ product: slug, author_name: name, author_email: email, rating, title, body });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mt-20 border-t border-taupe/15 pt-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="heading-serif mt-2 text-3xl">
            {stats.count ? `${stats.average.toFixed(1)} from ${stats.count} reviews` : "Be the first to review"}
          </h2>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-outline">
          Write a review
        </button>
      </div>

      {showForm && (
        <div className="card mb-10 p-6">
          {status === "done" ? (
            <p className="text-plum">
              Thank you. Your review has been submitted and will appear once approved.
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <span className="label">Your rating</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                      <Stars value={n <= rating ? 5 : 0} size={22} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Email (not published)</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Title</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Your review</label>
                <textarea className="input min-h-[110px]" value={body} onChange={(e) => setBody(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="btn-primary" disabled={status === "loading"}>
                  {status === "loading" ? "Submitting..." : "Submit review"}
                </button>
                {status === "error" && <span className="ml-3 text-sm text-terracotta">Something went wrong.</span>}
              </div>
            </form>
          )}
        </div>
      )}

      {reviews.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                {r.is_verified_purchase && (
                  <span className="text-[10px] uppercase tracking-wider text-sage">Verified purchase</span>
                )}
              </div>
              {r.title && <h4 className="mt-3 font-serif text-lg text-espresso">{r.title}</h4>}
              <p className="mt-1 text-sm leading-relaxed text-taupe">{r.body}</p>
              <p className="mt-3 text-xs text-espresso/60">
                {r.author_name} &middot; {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-taupe">No reviews yet. Share your experience.</p>
      )}
    </section>
  );
}
