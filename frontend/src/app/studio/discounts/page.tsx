"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminDiscount, Paginated } from "@/lib/adminTypes";
import { Badge, Card, Empty, PageHeader, Spinner } from "@/components/studio/ui";

const EMPTY_FORM = { code: "", percent_off: 10, max_uses: "", min_subtotal: "", ends_at: "" };

export default function DiscountsPage() {
  const [items, setItems] = useState<AdminDiscount[] | null>(null);
  const [showNew, setShowNew] = useState(false);

  function load() {
    adminApi.get<Paginated<AdminDiscount> | AdminDiscount[]>("/discounts/?page_size=100").then((d) =>
      setItems(Array.isArray(d) ? d : d.results),
    );
  }
  useEffect(load, []);

  if (!items) return <Spinner />;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Discount codes"
        subtitle="Promo codes customers can redeem at checkout."
        action={<button className="btn-primary" onClick={() => setShowNew((v) => !v)}>{showNew ? "Close" : "New code"}</button>}
      />
      {showNew && <NewDiscountForm onCreated={() => { setShowNew(false); load(); }} />}
      {items.length === 0 ? (
        <Empty>No discount codes yet.</Empty>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((d) => <DiscountRow key={d.id} discount={d} onChange={load} />)}
        </div>
      )}
    </div>
  );
}

function NewDiscountForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!form.code.trim() || !form.percent_off) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.post("/discounts/", {
        code: form.code.trim().toUpperCase(),
        percent_off: Number(form.percent_off),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        min_subtotal: form.min_subtotal || "0",
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: true,
      });
      setForm(EMPTY_FORM);
      onCreated();
    } catch (e: any) {
      setError(e.message || "Could not create the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input uppercase" placeholder="Code (e.g. SUMMER26)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={100} className="input" value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: Number(e.target.value) })} />
          <span className="text-sm text-taupe">% off</span>
        </div>
        <input type="number" min={1} className="input" placeholder="Max uses (blank = unlimited)" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
        <input type="number" min={0} step="0.01" className="input" placeholder="Min order subtotal (optional)" value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })} />
        <label className="text-xs text-taupe sm:col-span-2">
          Expires (optional)
          <input type="datetime-local" className="input mt-1" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        </label>
      </div>
      {error && <p className="mt-2 text-xs text-terracotta">{error}</p>}
      <button className="btn-primary mt-4 px-5 py-2 text-sm" disabled={busy || !form.code.trim()} onClick={create}>
        {busy ? "Creating..." : "Create code"}
      </button>
    </Card>
  );
}

function DiscountRow({ discount, onChange }: { discount: AdminDiscount; onChange: () => void }) {
  const [d, setD] = useState(discount);
  const [busy, setBusy] = useState(false);
  useEffect(() => setD(discount), [discount]);

  const expired = d.ends_at ? new Date(d.ends_at) < new Date() : false;
  const exhausted = d.max_uses !== null && d.used_count >= d.max_uses;

  async function save() {
    setBusy(true);
    try {
      await adminApi.patch(`/discounts/${d.id}/`, {
        percent_off: d.percent_off,
        is_active: d.is_active,
        max_uses: d.max_uses,
        min_subtotal: d.min_subtotal || "0",
        ends_at: d.ends_at,
      });
      onChange();
    } finally { setBusy(false); }
  }

  async function del() {
    if (!confirm(`Delete code "${d.code}"?`)) return;
    await adminApi.del(`/discounts/${d.id}/`);
    onChange();
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-espresso px-3 py-1.5 font-mono text-sm tracking-wider text-ivory">{d.code}</span>
        {!d.is_active && <Badge tone="gray">Inactive</Badge>}
        {expired && <Badge tone="red">Expired</Badge>}
        {exhausted && <Badge tone="red">Fully redeemed</Badge>}
        <span className="ml-auto text-xs text-taupe">
          Used {d.used_count}{d.max_uses !== null ? ` / ${d.max_uses}` : ""} times
        </span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={100} className="input" value={d.percent_off} onChange={(e) => setD({ ...d, percent_off: Number(e.target.value) })} />
          <span className="text-xs text-taupe">%</span>
        </div>
        <input type="number" min={1} className="input" placeholder="Max uses" value={d.max_uses ?? ""} onChange={(e) => setD({ ...d, max_uses: e.target.value ? Number(e.target.value) : null })} />
        <input type="number" min={0} step="0.01" className="input" placeholder="Min subtotal" value={d.min_subtotal} onChange={(e) => setD({ ...d, min_subtotal: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-taupe">
          <input type="checkbox" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} /> Active
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn-primary px-4 py-1.5 text-xs" disabled={busy} onClick={save}>Save</button>
        <button className="text-xs text-terracotta" onClick={del}>Delete</button>
        {d.ends_at && <span className="text-xs text-taupe">Expires {new Date(d.ends_at).toLocaleString()}</span>}
      </div>
    </Card>
  );
}
