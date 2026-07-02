"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminProductListItem, Paginated } from "@/lib/adminTypes";
import { formatMoney } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Spinner } from "@/components/studio/ui";

export default function ProductsPage() {
  const [data, setData] = useState<Paginated<AdminProductListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), page_size: "50" });
    if (search) qs.set("search", search);
    adminApi.get<Paginated<AdminProductListItem>>(`/products/?${qs.toString()}`).then(setData);
  }, [search, page]);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.count} products` : undefined}
        action={<Link href="/studio/products/new" className="btn-primary">New product</Link>}
      />
      <input
        className="input mb-4 max-w-xs"
        placeholder="Search products..."
        value={search}
        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
      />
      {!data ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <Empty>No products yet.</Empty>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-taupe/15 text-left text-xs uppercase tracking-wider text-taupe">
                <th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">From</th>
                <th className="p-4">Variants</th><th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((p) => (
                <tr key={p.id} className="border-b border-taupe/10 last:border-0 hover:bg-cream/50">
                  <td className="p-4">
                    <Link href={`/studio/products/${p.id}`} className="flex items-center gap-3">
                      <span className="h-10 w-10 overflow-hidden rounded-lg bg-cream ring-1 ring-taupe/10">
                        {p.primary_image && <img src={p.primary_image} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span>
                        <span className="font-medium text-plum">{p.name}</span>
                        <span className="block text-xs text-taupe">{p.tagline}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="p-4 text-taupe">{p.category_name || "-"}</td>
                  <td className="p-4">{p.price_from ? formatMoney(p.price_from) : "-"}</td>
                  <td className="p-4">{p.variant_count}</td>
                  <td className="p-4">
                    <div className="flex gap-1.5">
                      {p.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Hidden</Badge>}
                      {p.is_featured && <Badge tone="plum">Featured</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data && (data.next || data.previous) && (
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-outline" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-sm text-taupe">Page {page}</span>
          <button className="btn-outline" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
