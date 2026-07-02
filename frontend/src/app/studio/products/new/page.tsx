"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminProduct } from "@/lib/adminTypes";
import { Card, PageHeader } from "@/components/studio/ui";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const p = await adminApi.post<AdminProduct>("/products/", { name, tagline, is_active: false });
      router.replace(`/studio/products/${p.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="New product" subtitle="Create a draft, then add variants, images and details." />
      <Card>
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </div>
          {error && <p className="text-sm text-terracotta">{error}</p>}
          <button className="btn-primary" disabled={busy}>{busy ? "Creating..." : "Create draft"}</button>
        </form>
      </Card>
    </div>
  );
}
