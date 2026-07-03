"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminProduct, AdminProductImage, AdminVariant } from "@/lib/adminTypes";
import { Card, PageHeader, Spinner } from "@/components/studio/ui";
import { CategorySelect } from "@/components/studio/CategorySelect";

const BLANK_VARIANT: Partial<AdminVariant> = {
  name: "", sku: "", price: "0.00", compare_at_price: null, stock: 0, swatch_hex: "", is_active: true,
};

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    adminApi.get<AdminProduct>(`/products/${id}/`).then(setProduct);
  }
  useEffect(load, [id]);

  /** Re-fetch only images/variants so unsaved edits in other fields survive. */
  function refreshRelated() {
    adminApi.get<AdminProduct>(`/products/${id}/`).then((fresh) => {
      setProduct((p) => (p ? { ...p, images: fresh.images, variants: fresh.variants } : fresh));
    });
  }

  function set<K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) {
    setProduct((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save() {
    if (!product) return;
    setBusy(true);
    setMsg("");
    try {
      const payload = {
        category: product.category,
        name: product.name, brand: product.brand, tagline: product.tagline,
        volume: product.volume || "", description: product.description,
        brand_copy: product.brand_copy, ingredients: product.ingredients, how_to_use: product.how_to_use,
        is_active: product.is_active, is_featured: product.is_featured, position: product.position,
        supplier_url: product.supplier_url, supplier_notes: product.supplier_notes,
        supplier_cost: product.supplier_cost || null,
        meta_title: product.meta_title, meta_description: product.meta_description,
      };
      const updated = await adminApi.patch<AdminProduct>(`/products/${id}/`, payload);
      setProduct(updated);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct() {
    if (!confirm("Delete this product permanently?")) return;
    await adminApi.del(`/products/${id}/`);
    router.replace("/studio/products");
  }

  async function uploadImage(file: File) {
    setMsg("");
    try {
      const form = new FormData();
      form.append("product", id);
      form.append("image", file);
      await adminApi.postForm<AdminProductImage>("/product-images/", form);
      refreshRelated();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Image upload failed");
    }
  }

  async function deleteImage(imgId: number) {
    await adminApi.del(`/product-images/${imgId}/`);
    refreshRelated();
  }

  if (!product) return <Spinner />;

  return (
    <div className="max-w-4xl">
      <Link href="/studio/products" className="text-sm text-taupe hover:text-espresso">&larr; All products</Link>
      <PageHeader
        title={product.name || "Untitled product"}
        subtitle={product.slug ? `/product/${product.slug}` : undefined}
        action={
          <div className="flex gap-2">
            <button className="btn-outline" onClick={removeProduct}>Delete</button>
            <button className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save"}</button>
          </div>
        }
      />
      {msg && <p className="mb-4 text-sm text-taupe">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-4 font-serif text-lg">Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label">Name</label><input className="input" value={product.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label">Brand</label><input className="input" value={product.brand || ""} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. NYX Professional Makeup" /></div>
              <div className="sm:col-span-2"><label className="label">Tagline</label><input className="input" value={product.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
              <div>
                <label className="label">Category</label>
                <CategorySelect value={product.category} onChange={(id) => set("category", id)} />
              </div>
              <div><label className="label">Position</label><input type="number" className="input" value={product.position} onChange={(e) => set("position", Number(e.target.value))} /></div>
              <div><label className="label">Volume / net content (optional)</label><input className="input" placeholder="e.g. 30 ml" value={product.volume || ""} onChange={(e) => set("volume", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input min-h-[90px]" value={product.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className="label">Brand copy</label><textarea className="input min-h-[70px]" value={product.brand_copy} onChange={(e) => set("brand_copy", e.target.value)} /></div>
              <div><label className="label">Ingredients</label><textarea className="input min-h-[70px]" value={product.ingredients} onChange={(e) => set("ingredients", e.target.value)} /></div>
              <div><label className="label">How to use</label><textarea className="input min-h-[70px]" value={product.how_to_use} onChange={(e) => set("how_to_use", e.target.value)} /></div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-1 font-serif text-lg">Sourcing (internal only)</h3>
            <p className="mb-4 text-xs text-taupe">Never shown on the storefront or public API. Where you buy/fulfil this product from.</p>
            <label className="label">Supplier link</label>
            <input className="input" placeholder="https://supplier.example.com/product/123" value={product.supplier_url} onChange={(e) => set("supplier_url", e.target.value)} />
            <label className="label mt-4">Unit cost from supplier</label>
            <input type="number" min={0} step="0.01" className="input" placeholder="e.g. 4.20" value={product.supplier_cost ?? ""} onChange={(e) => set("supplier_cost", e.target.value)} />
            <label className="label mt-4">Supplier notes</label>
            <textarea className="input min-h-[70px]" value={product.supplier_notes} onChange={(e) => set("supplier_notes", e.target.value)} />
            {product.supplier_url && (
              <a href={product.supplier_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-plum hover:underline">Open supplier page &rarr;</a>
            )}
          </Card>

          <VariantsSection productId={id} variants={product.variants} images={product.images} onChange={refreshRelated} />

          <Card>
            <h3 className="mb-4 font-serif text-lg">Images</h3>
            <div className="flex flex-wrap gap-3">
              {product.images.map((img) => (
                <div key={img.id} className="relative h-28 w-24 overflow-hidden rounded-lg bg-cream ring-1 ring-taupe/10">
                  {img.image_url && <img src={img.image_url} alt={img.alt_text} className="h-full w-full object-cover" />}
                  <button onClick={() => deleteImage(img.id)} className="absolute right-1 top-1 rounded-full bg-espresso/80 px-1.5 text-xs text-ivory">&times;</button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()} className="flex h-28 w-24 items-center justify-center rounded-lg border border-dashed border-taupe/40 text-2xl text-taupe hover:bg-cream">+</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-serif text-lg">Visibility</h3>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={product.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active (visible in store)</label>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={product.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured (best sellers)</label>
          </Card>
          <Card>
            <h3 className="mb-4 font-serif text-lg">SEO</h3>
            <label className="label">Meta title</label>
            <input className="input" value={product.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
            <label className="label mt-3">Meta description</label>
            <textarea className="input min-h-[70px]" value={product.meta_description} onChange={(e) => set("meta_description", e.target.value)} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function VariantsSection({
  productId,
  variants,
  images,
  onChange,
}: {
  productId: string;
  variants: AdminVariant[];
  images: AdminProductImage[];
  onChange: () => void;
}) {
  const [rows, setRows] = useState<Partial<AdminVariant>[]>(variants);
  useEffect(() => setRows(variants), [variants]);
  const [busy, setBusy] = useState(false);

  function update(i: number, key: keyof AdminVariant, value: unknown) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  }

  async function saveRow(i: number) {
    const row = rows[i];
    setBusy(true);
    try {
      const payload = {
        product: Number(productId), name: row.name, sku: row.sku, price: row.price,
        compare_at_price: row.compare_at_price || null, stock: row.stock ?? 0,
        swatch_hex: row.swatch_hex || "", is_active: row.is_active ?? true, position: row.position ?? 0,
        image: row.image ?? null,
      };
      if (row.id) await adminApi.patch(`/variants/${row.id}/`, payload);
      else await adminApi.post("/variants/", payload);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function del(i: number) {
    const row = rows[i];
    if (row.id) { await adminApi.del(`/variants/${row.id}/`); onChange(); }
    else setRows((r) => r.filter((_, idx) => idx !== i));
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg">Variants</h3>
        <button className="btn-outline" onClick={() => setRows((r) => [...r, { ...BLANK_VARIANT }])}>Add variant</button>
      </div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-taupe">No variants yet. Add one so the product is purchasable.</p>}
        {rows.map((v, i) => {
          const linked = images.find((img) => img.id === v.image);
          return (
            <div key={v.id ?? `new-${i}`} className="grid grid-cols-2 items-end gap-2 rounded-xl bg-cream/60 p-3 sm:grid-cols-6">
              <div className="col-span-2"><label className="label">Name</label><input className="input" value={v.name || ""} onChange={(e) => update(i, "name", e.target.value)} /></div>
              <div><label className="label">SKU</label><input className="input" value={v.sku || ""} onChange={(e) => update(i, "sku", e.target.value)} /></div>
              <div><label className="label">Price</label><input className="input" value={v.price || ""} onChange={(e) => update(i, "price", e.target.value)} /></div>
              <div><label className="label">Stock</label><input type="number" className="input" value={v.stock ?? 0} onChange={(e) => update(i, "stock", Number(e.target.value))} /></div>
              <div className="col-span-2 sm:col-span-3">
                <label className="label">Swatch color (optional, shown as a dot on the shade button)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(v.swatch_hex || "") ? (v.swatch_hex as string) : "#ffffff"}
                    onChange={(e) => update(i, "swatch_hex", e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border border-taupe/20 bg-white p-0.5"
                    aria-label="Pick swatch color"
                  />
                  <input
                    className="input"
                    placeholder="#c77467"
                    maxLength={7}
                    value={v.swatch_hex || ""}
                    onChange={(e) => update(i, "swatch_hex", e.target.value)}
                  />
                  {v.swatch_hex && (
                    <button
                      type="button"
                      className="text-xs text-taupe hover:text-espresso"
                      onClick={() => update(i, "swatch_hex", "")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-primary px-3 py-1.5 text-xs" disabled={busy} onClick={() => saveRow(i)}>Save</button>
                <button className="text-xs text-terracotta" onClick={() => del(i)}>Del</button>
              </div>
              <div className="col-span-2 sm:col-span-6">
                <label className="label">Gallery photo (shown when this variant is selected)</label>
                <div className="flex items-center gap-2">
                  {linked?.image_url && (
                    <span className="relative h-9 w-8 shrink-0 overflow-hidden rounded border border-taupe/20 bg-white">
                      <img src={linked.image_url} alt="" className="h-full w-full object-contain" />
                    </span>
                  )}
                  <select
                    className="input"
                    value={v.image ?? ""}
                    onChange={(e) => update(i, "image", e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">No specific photo</option>
                    {images.map((img, idx) => (
                      <option key={img.id} value={img.id}>
                        Photo {idx + 1}{img.alt_text ? ` — ${img.alt_text}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
