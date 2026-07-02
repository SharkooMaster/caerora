"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminOrderListItem, Paginated } from "@/lib/adminTypes";
import { formatMoney } from "@/lib/format";
import { Card, Empty, FulfillmentBadge, PageHeader, PaymentBadge, Spinner } from "@/components/studio/ui";

const FULFILMENT = ["", "unfulfilled", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const [data, setData] = useState<Paginated<AdminOrderListItem> | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page) });
    if (search) qs.set("search", search);
    if (status) qs.set("fulfillment_status", status);
    adminApi
      .get<Paginated<AdminOrderListItem>>(`/orders/?${qs.toString()}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [search, status, page]);

  return (
    <div>
      <PageHeader title="Orders" subtitle={data ? `${data.count} total` : undefined} />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search number, email, name..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        />
        <select className="input max-w-[200px]" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          {FULFILMENT.map((s) => (
            <option key={s} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : "All fulfilment"}</option>
          ))}
        </select>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : data && data.results.length === 0 ? (
        <Empty>No orders found.</Empty>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-taupe/15 text-left text-xs uppercase tracking-wider text-taupe">
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Fulfilment</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((o) => (
                <tr key={o.number} className="border-b border-taupe/10 last:border-0 hover:bg-cream/50">
                  <td className="p-4">
                    <Link href={`/studio/orders/${o.number}`} className="font-medium text-plum hover:underline">{o.number}</Link>
                  </td>
                  <td className="p-4"><div>{o.full_name}</div><div className="text-xs text-taupe">{o.email}</div></td>
                  <td className="p-4">{o.item_count}</td>
                  <td className="p-4">{formatMoney(o.total, o.currency)}</td>
                  <td className="p-4"><PaymentBadge status={o.payment_status} /></td>
                  <td className="p-4"><FulfillmentBadge status={o.fulfillment_status} /></td>
                  <td className="p-4 text-taupe">{new Date(o.created_at).toLocaleDateString()}</td>
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
