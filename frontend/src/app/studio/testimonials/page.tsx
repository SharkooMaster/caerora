"use client";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminTestimonial, Paginated } from "@/lib/adminTypes";
import { Card, Empty, PageHeader, Spinner } from "@/components/studio/ui";

export default function TestimonialsPage() {
  const [items, setItems] = useState<AdminTestimonial[] | null>(null);

  function load() {
    adminApi.get<Paginated<AdminTestimonial> | AdminTestimonial[]>("/testimonials/?page_size=100").then((d) =>
      setItems(Array.isArray(d) ? d : d.results),
    );
  }
  useEffect(load, []);

  async function addNew() {
    await adminApi.post("/testimonials/", { author_name: "New name", quote: "Their words here.", rating: 5, is_active: false });
    load();
  }

  if (!items) return <Spinner />;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Testimonials" subtitle="Curated quotes shown in the site design (separate from product reviews)." action={<button className="btn-primary" onClick={addNew}>New testimonial</button>} />
      {items.length === 0 ? <Empty>No testimonials yet.</Empty> : (
        <div className="space-y-4">{items.map((t) => <TestimonialRow key={t.id} item={t} onChange={load} />)}</div>
      )}
    </div>
  );
}

function TestimonialRow({ item, onChange }: { item: AdminTestimonial; onChange: () => void }) {
  const [t, setT] = useState(item);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setT(item), [item]);

  async function save() {
    setBusy(true);
    try {
      await adminApi.patch(`/testimonials/${t.id}/`, {
        author_name: t.author_name, handle: t.handle, quote: t.quote,
        rating: t.rating, position: t.position, is_active: t.is_active,
      });
      onChange();
    } finally { setBusy(false); }
  }
  async function del() {
    if (!confirm("Delete testimonial?")) return;
    await adminApi.del(`/testimonials/${t.id}/`);
    onChange();
  }
  async function upload(file: File) {
    const form = new FormData();
    form.append("photo", file);
    await adminApi.patchForm(`/testimonials/${t.id}/`, form);
    onChange();
  }

  return (
    <Card>
      <div className="flex gap-4">
        <button onClick={() => fileRef.current?.click()} className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-cream ring-1 ring-taupe/10">
          {t.photo_url ? <img src={t.photo_url} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-taupe">+ Photo</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <div className="flex-1 space-y-2">
          <div className="grid gap-2 sm:grid-cols-4">
            <input className="input sm:col-span-2" value={t.author_name} onChange={(e) => setT({ ...t, author_name: e.target.value })} placeholder="Name" />
            <input className="input" value={t.handle} onChange={(e) => setT({ ...t, handle: e.target.value })} placeholder="@handle / location" />
            <select className="input" value={t.rating} onChange={(e) => setT({ ...t, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </select>
          </div>
          <textarea className="input min-h-[70px]" value={t.quote} onChange={(e) => setT({ ...t, quote: e.target.value })} placeholder="Quote" />
          <div className="flex items-center gap-3">
            <input type="number" className="input w-24" value={t.position} onChange={(e) => setT({ ...t, position: Number(e.target.value) })} placeholder="Pos" />
            <label className="flex items-center gap-2 text-sm text-taupe"><input type="checkbox" checked={t.is_active} onChange={(e) => setT({ ...t, is_active: e.target.checked })} /> Active</label>
            <button className="btn-primary px-4 py-1.5 text-xs" disabled={busy} onClick={save}>Save</button>
            <button className="text-xs text-terracotta" onClick={del}>Delete</button>
          </div>
        </div>
      </div>
    </Card>
  );
}
