"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminCategory, Paginated } from "@/lib/adminTypes";

const NEW_SENTINEL = "__new__";

/** Category dropdown with an inline "create new category" flow. */
export function CategorySelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function load() {
    return adminApi
      .get<Paginated<AdminCategory> | AdminCategory[]>("/categories/?page_size=100")
      .then((d) => {
        const list = Array.isArray(d) ? d : d.results;
        setCategories(list);
        return list;
      });
  }
  useEffect(() => {
    load();
  }, []);

  async function createCategory() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    setError("");
    try {
      const created = await adminApi.post<AdminCategory>("/categories/", { name, is_active: true });
      await load();
      onChange(created.id);
      setCreating(false);
      setNewName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    } finally {
      setBusy(false);
    }
  }

  if (creating) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            autoFocus
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createCategory();
              }
              if (e.key === "Escape") setCreating(false);
            }}
          />
          <button type="button" className="btn-primary px-3 py-1.5 text-xs" disabled={busy || !newName.trim()} onClick={createCategory}>
            {busy ? "..." : "Create"}
          </button>
          <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => { setCreating(false); setError(""); }}>
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-terracotta">{error}</p>}
      </div>
    );
  }

  return (
    <select
      className="input"
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value === NEW_SENTINEL) {
          setCreating(true);
          return;
        }
        onChange(e.target.value ? Number(e.target.value) : null);
      }}
    >
      <option value="">No category</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {!c.is_active ? " (hidden)" : ""}
        </option>
      ))}
      <option value={NEW_SENTINEL}>+ Create new category…</option>
    </select>
  );
}
