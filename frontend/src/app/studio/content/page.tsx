"use client";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminGalleryImage, AdminSiteContent, Paginated } from "@/lib/adminTypes";
import { Card, PageHeader, Spinner } from "@/components/studio/ui";

export default function SiteContentPage() {
  const [c, setC] = useState<AdminSiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    adminApi.get<AdminSiteContent>("/site-content/").then(setC);
  }
  useEffect(load, []);

  function set<K extends keyof AdminSiteContent>(k: K, v: AdminSiteContent[K]) {
    setC((p) => (p ? { ...p, [k]: v } : p));
  }

  async function save() {
    if (!c) return;
    setBusy(true);
    setMsg("");
    try {
      await adminApi.patch("/site-content/", {
        promo_bar_text: c.promo_bar_text,
        hero_eyebrow: c.hero_eyebrow, hero_title: c.hero_title, hero_title_accent: c.hero_title_accent,
        hero_subtitle: c.hero_subtitle, hero_cta_label: c.hero_cta_label, hero_cta_href: c.hero_cta_href,
        brand_band_title: c.brand_band_title, brand_band_body: c.brand_band_body,
        newsletter_title: c.newsletter_title, newsletter_body: c.newsletter_body,
      });
      setMsg("Saved.");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function uploadField(field: string, file: File) {
    const form = new FormData();
    form.append(field, file);
    await adminApi.patchForm("/site-content/", form);
    load();
  }

  if (!c) return <Spinner />;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Site content"
        subtitle="Copy and imagery shown on the storefront. Blank fields fall back to built-in defaults."
        action={<button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save"}</button>}
      />
      {msg && <p className="mb-4 text-sm text-taupe">{msg}</p>}

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 font-serif text-lg">Announcement bar</h3>
          <input className="input" value={c.promo_bar_text} onChange={(e) => set("promo_bar_text", e.target.value)} placeholder="Free shipping over €45 · New season beauty in now" />
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Hero</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Eyebrow</label><input className="input" value={c.hero_eyebrow} onChange={(e) => set("hero_eyebrow", e.target.value)} /></div>
            <div><label className="label">CTA label</label><input className="input" value={c.hero_cta_label} onChange={(e) => set("hero_cta_label", e.target.value)} /></div>
            <div><label className="label">Title</label><input className="input" value={c.hero_title} onChange={(e) => set("hero_title", e.target.value)} /></div>
            <div><label className="label">Title accent</label><input className="input" value={c.hero_title_accent} onChange={(e) => set("hero_title_accent", e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">Subtitle</label><textarea className="input min-h-[70px]" value={c.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} /></div>
            <div><label className="label">CTA link</label><input className="input" value={c.hero_cta_href} onChange={(e) => set("hero_cta_href", e.target.value)} placeholder="/shop" /></div>
          </div>
          <ImageField label="Hero image" url={c.hero_image_url} onUpload={(f) => uploadField("hero_image", f)} />
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Brand band</h3>
          <label className="label">Title</label>
          <input className="input" value={c.brand_band_title} onChange={(e) => set("brand_band_title", e.target.value)} />
          <label className="label mt-3">Body</label>
          <textarea className="input min-h-[70px]" value={c.brand_band_body} onChange={(e) => set("brand_band_body", e.target.value)} />
          <ImageField label="Brand band image" url={c.brand_band_image_url} onUpload={(f) => uploadField("brand_band_image", f)} />
        </Card>

        <Card>
          <h3 className="mb-4 font-serif text-lg">Newsletter band</h3>
          <label className="label">Title</label>
          <input className="input" value={c.newsletter_title} onChange={(e) => set("newsletter_title", e.target.value)} />
          <label className="label mt-3">Body</label>
          <textarea className="input min-h-[70px]" value={c.newsletter_body} onChange={(e) => set("newsletter_body", e.target.value)} />
        </Card>

        <Card>
          <h3 className="mb-1 font-serif text-lg">Social image (OG)</h3>
          <p className="mb-3 text-xs text-taupe">Shown when the site is shared on social media.</p>
          <ImageField label="OG image" url={c.og_image_url} onUpload={(f) => uploadField("og_image", f)} wide />
        </Card>

        <GallerySection />
      </div>
    </div>
  );
}

function ImageField({ label, url, onUpload, wide }: { label: string; url: string | null; onUpload: (f: File) => void; wide?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-4">
      <label className="label">{label}</label>
      <button onClick={() => ref.current?.click()} className={`overflow-hidden rounded-lg bg-cream ring-1 ring-taupe/10 ${wide ? "h-32 w-56" : "h-40 w-32"}`}>
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-taupe">Click to upload</span>}
      </button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
    </div>
  );
}

function GallerySection() {
  const [items, setItems] = useState<AdminGalleryImage[]>([]);
  const ref = useRef<HTMLInputElement>(null);

  function load() {
    adminApi.get<Paginated<AdminGalleryImage> | AdminGalleryImage[]>("/gallery/?page_size=100").then((d) =>
      setItems(Array.isArray(d) ? d : d.results),
    );
  }
  useEffect(load, []);

  async function add(file: File) {
    const form = new FormData();
    form.append("image", file);
    form.append("position", String(items.length));
    await adminApi.postForm("/gallery/", form);
    load();
  }
  async function del(id: number) {
    await adminApi.del(`/gallery/${id}/`);
    load();
  }

  return (
    <Card>
      <h3 className="mb-1 font-serif text-lg">Gallery (@caerora strip)</h3>
      <p className="mb-3 text-xs text-taupe">Square images shown in the homepage social strip.</p>
      <div className="flex flex-wrap gap-3">
        {items.map((g) => (
          <div key={g.id} className="relative h-24 w-24 overflow-hidden rounded-lg bg-cream ring-1 ring-taupe/10">
            {g.image_url && <img src={g.image_url} alt={g.alt_text} className="h-full w-full object-cover" />}
            <button onClick={() => del(g.id)} className="absolute right-1 top-1 rounded-full bg-espresso/80 px-1.5 text-xs text-ivory">&times;</button>
          </div>
        ))}
        <button onClick={() => ref.current?.click()} className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-taupe/40 text-2xl text-taupe hover:bg-cream">+</button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) add(f); e.target.value = ""; }} />
      </div>
    </Card>
  );
}
