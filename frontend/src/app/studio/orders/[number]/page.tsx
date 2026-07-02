"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminOrderDetail } from "@/lib/adminTypes";
import { formatMoney } from "@/lib/format";
import { Card, FulfillmentBadge, PaymentBadge, Spinner } from "@/components/studio/ui";

export default function OrderDetailPage() {
  const params = useParams<{ number: string }>();
  const number = params.number;
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    adminApi.get<AdminOrderDetail>(`/orders/${number}/`).then((o) => {
      setOrder(o);
      setTracking(o.tracking_number || "");
      setNotes(o.admin_notes || "");
    });
  }
  useEffect(load, [number]);

  async function act(path: string, body?: unknown) {
    setBusy(true);
    setMsg("");
    try {
      const o = await adminApi.post<AdminOrderDetail>(`/orders/${number}/${path}`, body);
      setOrder(o);
      setTracking(o.tracking_number || "");
      setMsg("Updated.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails() {
    setBusy(true);
    setMsg("");
    try {
      await adminApi.patch(`/orders/${number}/`, { tracking_number: tracking, admin_notes: notes });
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!order) return <Spinner />;

  return (
    <div>
      <Link href="/studio/orders" className="text-sm text-taupe hover:text-espresso">&larr; All orders</Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl text-espresso md:text-3xl">{order.number}</h1>
        <PaymentBadge status={order.payment_status} />
        <FulfillmentBadge status={order.fulfillment_status} />
        <span className="text-sm text-taupe">{new Date(order.created_at).toLocaleString()}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-taupe/15 text-left text-xs uppercase tracking-wider text-taupe">
                  <th className="p-4">Item</th><th className="p-4">SKU</th><th className="p-4">Qty</th><th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id} className="border-b border-taupe/10 last:border-0">
                    <td className="p-4">{it.product_name} <span className="text-taupe">/ {it.variant_name}</span></td>
                    <td className="p-4 text-taupe">{it.sku}</td>
                    <td className="p-4">{it.quantity}</td>
                    <td className="p-4 text-right">{formatMoney(it.line_total, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 border-t border-taupe/15 p-4 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
              <Row label={`Shipping (${order.shipping_method})`} value={formatMoney(order.shipping_total, order.currency)} />
              <Row label="Tax" value={formatMoney(order.tax_total, order.currency)} />
              <Row label="Total" value={formatMoney(order.total, order.currency)} bold />
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-serif text-lg">Fulfilment</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              <button className="btn-outline" disabled={busy} onClick={() => act("mark_processing/")}>Mark processing</button>
              <button className="btn-outline" disabled={busy} onClick={() => act("mark_shipped/", { tracking_number: tracking })}>Mark shipped + email</button>
              <button className="btn-outline" disabled={busy} onClick={() => act("mark_delivered/")}>Mark delivered</button>
              <button className="btn-outline" disabled={busy} onClick={() => act("mark_paid/")}>Mark paid</button>
              <button className="btn-outline" disabled={busy} onClick={() => act("cancel/")}>Cancel</button>
            </div>
            <label className="label">Tracking number</label>
            <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            <label className="label mt-4">Internal notes</label>
            <textarea className="input min-h-[90px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="mt-3 flex items-center gap-3">
              <button className="btn-primary" disabled={busy} onClick={saveDetails}>Save</button>
              {msg && <span className="text-sm text-taupe">{msg}</span>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-2 font-serif text-lg">Customer</h3>
            <p className="text-sm">{order.full_name}</p>
            <p className="text-sm text-taupe">{order.email}</p>
            {order.phone && <p className="text-sm text-taupe">{order.phone}</p>}
            <p className="mt-1 text-xs text-taupe">Marketing opt-in: {order.marketing_opt_in ? "yes" : "no"}</p>
          </Card>
          <Card>
            <h3 className="mb-2 font-serif text-lg">Shipping address</h3>
            <p className="text-sm leading-relaxed">
              {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ""}<br />
              {order.postal_code} {order.city}{order.region ? `, ${order.region}` : ""}<br />
              {order.country}
            </p>
          </Card>
          <Card>
            <h3 className="mb-2 font-serif text-lg">Payment</h3>
            <p className="text-sm text-taupe break-all">Stripe: {order.stripe_payment_intent_id || "-"}</p>
            <p className="text-sm text-taupe">Paid at: {order.paid_at ? new Date(order.paid_at).toLocaleString() : "-"}</p>
            {(order.utm_source || order.utm_campaign) && (
              <p className="mt-2 text-xs text-taupe">Source: {order.utm_source || "-"} / {order.utm_campaign || "-"}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-espresso" : "text-taupe"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
