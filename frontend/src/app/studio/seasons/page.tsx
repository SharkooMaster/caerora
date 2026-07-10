"use client";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminSeason, Paginated } from "@/lib/adminTypes";
import { Card, Empty, PageHeader, Spinner } from "@/components/studio/ui";

export default function SeasonsPage() {
  const [items, setItems] = useState<AdminSeason[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNumber, setNewNumber] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    adminApi
      .get<Paginated<AdminSeason> | AdminSeason[]>("/seasons/?page_size=100")
      .then((d) => setItems(Array.isArray(d) ? d : d.results));
  }
  useEffect(load, []);

  async function addNew() {
    const name = newName.trim();
    if (!name || newNumber === "") return;
    setBusy(true);
    setError("");
    try {
      await adminApi.post("/seasons/", { name, number: newNumber, is_active: true });
      setNewName("");
      setNewNumber("");
      setAdding(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create season");
    } finally {
      setBusy(false);
    }
  }

  if (!items) return <Spinner />;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Seasons"
        subtitle="The thirteen collections of the Caerora story. Names, order, scripture and imagery are all editable — the storefront updates automatically."
        action={<button className="btn-primary" onClick={() => setAdding(true)}>New season</button>}
      />
      {adding && (
        <Card className="mb-4">
          <form onSubmit={(e) => { e.preventDefault(); addNew(); }} className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              className="input w-24"
              placeholder="No."
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value === "" ? "" : Number(e.target.value))}
            />
            <input
              className="input flex-1"
              autoFocus
              placeholder="Season name (e.g. The Dawn)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="btn-primary px-4 py-1.5 text-xs" disabled={busy || !newName.trim() || newNumber === ""}>
              {busy ? "Creating..." : "Create"}
            </button>
            <button type="button" className="btn-outline px-4 py-1.5 text-xs" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-terracotta">{error}</p>}
        </Card>
      )}
      {items.length === 0 ? (
        <Empty>No seasons yet.</Empty>
      ) : (
        <div className="space-y-4">
          {items.map((s) => <SeasonRow key={s.id} season={s} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function SeasonRow({ season, onChange }: { season: AdminSeason; onChange: () => void }) {
  const [s, setS] = useState(season);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setS(season), [season]);

  function set<K extends keyof AdminSeason>(k: K, v: AdminSeason[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      await adminApi.patch(`/seasons/${s.id}/`, {
        number: s.number,
        name: s.name,
        subtitle: s.subtitle,
        act: s.act,
        description: s.description,
        scripture_ref: s.scripture_ref,
        scripture_text: s.scripture_text,
        is_active: s.is_active,
      });
      setMsg("Saved.");
      onChange();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(`Delete season "${s.name}"? Products in it are kept but lose their season.`)) return;
    await adminApi.del(`/seasons/${s.id}/`);
    onChange();
  }

  async function upload(file: File) {
    const form = new FormData();
    form.append("image", file);
    await adminApi.patchForm(`/seasons/${s.id}/`, form);
    onChange();
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream ring-1 ring-taupe/10"
          title="Upload season image"
        >
          {s.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-taupe">+ Image</span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-serif text-lg text-gold">{s.numeral}.</span>
            <span className="font-serif text-lg text-espresso">{s.name}</span>
            {s.subtitle && <span className="text-sm text-taupe">— {s.subtitle}</span>}
            {!s.is_active && (
              <span className="rounded-full bg-taupe/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-taupe">Hidden</span>
            )}
            <span className="text-xs text-taupe">{s.product_count} products</span>
          </div>
          {s.act && <p className="mt-0.5 text-xs uppercase tracking-widest text-taupe">{s.act}</p>}
          <button
            className="mt-2 text-xs uppercase tracking-wider text-gold hover:text-espresso"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Edit"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-taupe/15 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="label">Number (order)</label>
              <input type="number" min={1} className="input" value={s.number} onChange={(e) => set("number", Number(e.target.value))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Name</label>
              <input className="input" value={s.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className="label">Subtitle</label>
              <input className="input" placeholder="e.g. The Birth" value={s.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Act</label>
              <input className="input" placeholder="e.g. Act I — The Coming" value={s.act} onChange={(e) => set("act", e.target.value)} />
            </div>
            <div>
              <label className="label">Scripture reference</label>
              <input className="input" placeholder="e.g. Luke 2:11" value={s.scripture_ref} onChange={(e) => set("scripture_ref", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Scripture text</label>
            <textarea className="input min-h-[60px]" value={s.scripture_text} onChange={(e) => set("scripture_text", e.target.value)} />
          </div>
          <div>
            <label className="label">Description (shown on season tiles / pages)</label>
            <textarea className="input min-h-[70px]" value={s.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-taupe">
              <input type="checkbox" checked={s.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Active (visible in store)
            </label>
            <button className="btn-primary px-4 py-1.5 text-xs" disabled={busy} onClick={save}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button className="text-xs text-terracotta" onClick={del}>Delete</button>
            {msg && <span className="text-xs text-taupe">{msg}</span>}
          </div>
        </div>
      )}
    </Card>
  );
}
