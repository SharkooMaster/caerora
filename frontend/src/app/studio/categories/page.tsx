"use client";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminCategory, Paginated } from "@/lib/adminTypes";
import { Card, Empty, PageHeader, Spinner } from "@/components/studio/ui";

export default function CategoriesPage() {
  const [items, setItems] = useState<AdminCategory[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    adminApi.get<Paginated<AdminCategory> | AdminCategory[]>("/categories/?page_size=100").then((d) =>
      setItems(Array.isArray(d) ? d : d.results),
    );
  }
  useEffect(load, []);

  async function addNew() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await adminApi.post("/categories/", { name, is_active: true });
      setNewName("");
      setAdding(false);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!items) return <Spinner />;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Categories"
        subtitle="Categories with active products appear in the store navigation automatically."
        action={<button className="btn-primary" onClick={() => setAdding(true)}>New category</button>}
      />
      {adding && (
        <Card className="mb-4">
          <form
            onSubmit={(e) => { e.preventDefault(); addNew(); }}
            className="flex items-center gap-2"
          >
            <input
              className="input flex-1"
              autoFocus
              placeholder="Category name (e.g. Lips)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="btn-primary px-4 py-1.5 text-xs" disabled={busy || !newName.trim()}>
              {busy ? "Creating..." : "Create"}
            </button>
            <button type="button" className="btn-outline px-4 py-1.5 text-xs" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </form>
        </Card>
      )}
      {items.length === 0 ? (
        <Empty>No categories.</Empty>
      ) : (
        <div className="space-y-4">
          {items.map((c) => <CategoryRow key={c.id} category={c} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function CategoryRow({ category, onChange }: { category: AdminCategory; onChange: () => void }) {
  const [c, setC] = useState(category);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setC(category), [category]);

  async function save() {
    setBusy(true);
    try {
      await adminApi.patch(`/categories/${c.id}/`, {
        name: c.name, description: c.description, position: c.position, is_active: c.is_active,
      });
      onChange();
    } finally { setBusy(false); }
  }
  async function del() {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    await adminApi.del(`/categories/${c.id}/`);
    onChange();
  }
  async function upload(file: File) {
    const form = new FormData();
    form.append("image", file);
    await adminApi.patchForm(`/categories/${c.id}/`, form);
    onChange();
  }

  return (
    <Card>
      <div className="flex gap-4">
        <button onClick={() => fileRef.current?.click()} className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-cream ring-1 ring-taupe/10">
          {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover" /> : <span className="text-xs text-taupe">+ Image</span>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
        <div className="flex-1 space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
            <input type="number" className="input" value={c.position} onChange={(e) => setC({ ...c, position: Number(e.target.value) })} placeholder="Position" />
            <label className="flex items-center gap-2 text-sm text-taupe"><input type="checkbox" checked={c.is_active} onChange={(e) => setC({ ...c, is_active: e.target.checked })} /> Active</label>
          </div>
          <input className="input" value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} placeholder="Short copy (shown on the tile)" />
          <div className="flex items-center gap-3">
            <button className="btn-primary px-4 py-1.5 text-xs" disabled={busy} onClick={save}>Save</button>
            <button className="text-xs text-terracotta" onClick={del}>Delete</button>
            <span className="text-xs text-taupe">{c.product_count} products</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
