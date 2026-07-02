"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { StaffStats } from "@/lib/adminTypes";
import { formatMoney } from "@/lib/format";
import { Card, FulfillmentBadge, PageHeader, PaymentBadge, Spinner } from "@/components/studio/ui";

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <Card className="transition hover:shadow-soft">
      <p className="text-xs uppercase tracking-wider text-taupe">{label}</p>
      <p className="mt-2 font-serif text-3xl text-espresso">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function StudioDashboard() {
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.get<StaffStats>("/stats/").then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-terracotta">{error}</p>;
  if (!stats) return <Spinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your store at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue (paid)" value={formatMoney(stats.revenue_total)} />
        <Stat label="Orders" value={stats.orders_total} href="/studio/orders" />
        <Stat label="Open fulfilment" value={stats.open_fulfillment} href="/studio/orders" />
        <Stat label="Orders today" value={stats.orders_today} />
        <Stat label="Products" value={stats.products} href="/studio/products" />
        <Stat label="Low stock" value={stats.low_stock} href="/studio/products" />
        <Stat label="Pending reviews" value={stats.pending_reviews} href="/studio/reviews" />
        <Stat label="Subscribers" value={stats.subscribers} href="/studio/newsletter" />
      </div>

      <h2 className="mb-3 mt-10 font-serif text-xl text-espresso">Recent orders</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-taupe/15 text-left text-xs uppercase tracking-wider text-taupe">
              <th className="p-4">Order</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Total</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Fulfilment</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_orders.map((o) => (
              <tr key={o.number} className="border-b border-taupe/10 last:border-0 hover:bg-cream/50">
                <td className="p-4">
                  <Link href={`/studio/orders/${o.number}`} className="font-medium text-plum hover:underline">
                    {o.number}
                  </Link>
                </td>
                <td className="p-4">{o.full_name}</td>
                <td className="p-4">{formatMoney(o.total, o.currency)}</td>
                <td className="p-4"><PaymentBadge status={o.payment_status} /></td>
                <td className="p-4"><FulfillmentBadge status={o.fulfillment_status} /></td>
                <td className="p-4 text-taupe">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
