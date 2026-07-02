"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminReview, Paginated } from "@/lib/adminTypes";
import { Card, Empty, PageHeader, ReviewBadge, Spinner, Stars } from "@/components/studio/ui";

const FILTERS = ["", "pending", "approved", "rejected"];

export default function ReviewsPage() {
  const [data, setData] = useState<Paginated<AdminReview> | null>(null);
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    const qs = new URLSearchParams({ page_size: "100" });
    if (status) qs.set("status", status);
    adminApi.get<Paginated<AdminReview>>(`/reviews/?${qs.toString()}`).then(setData);
  }
  useEffect(load, [status]);

  async function moderate(id: number, action: "approve" | "reject") {
    setBusy(id);
    try {
      await adminApi.post(`/reviews/${id}/${action}/`);
      load();
    } finally { setBusy(null); }
  }
  async function remove(id: number) {
    if (!confirm("Delete this review?")) return;
    await adminApi.del(`/reviews/${id}/`);
    load();
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Product reviews" subtitle="Moderate customer reviews shown on product pages." />
      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={`rounded-full px-3 py-1.5 text-sm ${status === f ? "bg-espresso text-ivory" : "bg-ivory text-taupe ring-1 ring-taupe/20"}`}>
            {f ? f[0].toUpperCase() + f.slice(1) : "All"}
          </button>
        ))}
      </div>
      {!data ? <Spinner /> : data.results.length === 0 ? <Empty>No reviews.</Empty> : (
        <div className="space-y-3">
          {data.results.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars n={r.rating} />
                    <span className="font-medium">{r.author_name}</span>
                    <ReviewBadge status={r.status} />
                  </div>
                  {r.title && <p className="mt-1 font-serif">{r.title}</p>}
                  <p className="mt-1 text-sm text-taupe">{r.body}</p>
                  <p className="mt-2 text-xs text-taupe">On {r.product_name} &middot; {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {r.status !== "approved" && <button className="btn-primary px-3 py-1.5 text-xs" disabled={busy === r.id} onClick={() => moderate(r.id, "approve")}>Approve</button>}
                  {r.status !== "rejected" && <button className="btn-outline px-3 py-1.5 text-xs" disabled={busy === r.id} onClick={() => moderate(r.id, "reject")}>Reject</button>}
                  <button className="text-xs text-terracotta" onClick={() => remove(r.id)}>Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
