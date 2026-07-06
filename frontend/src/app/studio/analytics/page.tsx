"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { Card, PageHeader, Spinner } from "@/components/studio/ui";

interface Kpis {
  page_views: number;
  sessions: number;
  revenue: number;
  purchases: number;
  avg_order_value: number;
  avg_time_on_product_seconds: number;
  ctr: number;
  view_to_cart_rate: number;
  cart_to_checkout_rate: number;
  checkout_to_purchase_rate: number;
  conversion_rate: number;
}
interface FunnelStep {
  step: string;
  sessions: number;
  rate_of_visits: number;
  rate_of_previous: number;
}
interface TimePoint {
  t: string;
  page_views: number;
  sessions: number;
  product_views: number;
  add_to_cart: number;
  begin_checkout: number;
  purchases: number;
}
interface TopPage {
  path: string;
  views: number;
  sessions: number;
  entries: number;
}
interface DepthRow {
  products_viewed: string;
  sessions: number;
  share: number;
}
interface TopProduct {
  name: string;
  slug: string;
  views: number;
}
interface SourceRow {
  source: string;
  campaign: string;
  sessions: number;
  purchases: number;
  revenue: number;
  conversion_rate: number;
}
interface ActivityRow {
  at: string;
  type: string;
  path: string;
  product: string | null;
  value: number | null;
  source: string;
  session: string;
}
interface AnalyticsData {
  days: number;
  internal_devices: number;
  kpis: Kpis;
  session_funnel: FunnelStep[];
  timeseries: TimePoint[];
  top_pages: TopPage[];
  browse_depth: DepthRow[];
  top_products: TopProduct[];
  sources: SourceRow[];
  recent_activity: ActivityRow[];
}

const RANGES = [
  { days: 1, label: "24h" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const SERIES: { key: keyof TimePoint; label: string; color: string }[] = [
  { key: "sessions", label: "Sessions", color: "#6D4C5E" },
  { key: "product_views", label: "Product views", color: "#B88F93" },
  { key: "begin_checkout", label: "Checkouts", color: "#C4A46A" },
  { key: "purchases", label: "Purchases", color: "#7A8B6F" },
];

const EVENT_LABEL: Record<string, string> = {
  page_view: "Viewed page",
  view_item_list: "Saw product list",
  select_item: "Clicked product",
  view_item: "Viewed product",
  add_to_cart: "Added to cart",
  begin_checkout: "Went to checkout",
  add_shipping_info: "Entered shipping",
  add_payment_info: "Entered payment",
  purchase: "PURCHASED",
  newsletter_signup: "Joined newsletter",
  search: "Searched",
};
const EVENT_COLOR: Record<string, string> = {
  purchase: "text-sage font-semibold",
  begin_checkout: "text-plum font-medium",
  add_to_cart: "text-rose",
};

function LineChart({ points, hourly }: { points: TimePoint[]; hourly: boolean }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const W = 720;
  const H = 220;
  const PAD = { top: 10, right: 10, bottom: 24, left: 34 };
  const visible = SERIES.filter((s) => !hidden.has(s.key as string));
  const max = Math.max(1, ...points.flatMap((p) => visible.map((s) => p[s.key] as number)));
  const x = (i: number) =>
    PAD.left + (points.length > 1 ? (i / (points.length - 1)) * (W - PAD.left - PAD.right) : (W - PAD.left - PAD.right) / 2);
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);

  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return hourly
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-3">
        {SERIES.map((s) => (
          <button
            key={s.key as string}
            onClick={() =>
              setHidden((prev) => {
                const next = new Set(prev);
                if (next.has(s.key as string)) next.delete(s.key as string);
                else next.add(s.key as string);
                return next;
              })
            }
            className={`flex items-center gap-1.5 text-xs ${hidden.has(s.key as string) ? "opacity-35" : ""}`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(max * f)}
              y2={y(max * f)}
              stroke="#8A7968"
              strokeOpacity="0.12"
            />
            <text x={PAD.left - 6} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill="#8A7968">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={p.t} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#8A7968">
              {fmt(p.t)}
            </text>
          ) : null
        )}
        {visible.map((s) => (
          <g key={s.key as string}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              points={points.map((p, i) => `${x(i)},${y(p[s.key] as number)}`).join(" ")}
            />
            {points.map((p, i) => (
              <circle key={i} cx={x(i)} cy={y(p[s.key] as number)} r="2.5" fill={s.color}>
                <title>{`${fmt(p.t)} — ${s.label}: ${p[s.key]}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(1, steps[0]?.sessions ?? 1);
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s.step}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-espresso">{s.step}</span>
            <span className="text-taupe">
              <span className="font-medium text-espresso">{s.sessions}</span>
              {" · "}
              {s.rate_of_visits}% of visits
              {i > 0 && <span className="text-taupe/70"> · {s.rate_of_previous}% of previous</span>}
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-cream">
            <div
              className="h-full rounded-full bg-gradient-to-r from-plum to-rose"
              style={{ width: `${Math.max(1.5, (100 * s.sessions) / max)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarRow({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  return (
    <div className="py-1.5">
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-espresso">{label}</span>
        <span className="shrink-0 text-taupe">
          <span className="font-medium text-espresso">{value}</span>
          {detail && <span className="text-taupe/70"> {detail}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-cream">
        <div className="h-full rounded-full bg-rose/70" style={{ width: `${Math.max(1, (100 * value) / max)}%` }} />
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function StudioAnalytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    adminApi
      .get<AnalyticsData>(`/analytics/?days=${days}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [days]);

  if (error) return <p className="text-terracotta">{error}</p>;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={`Who lands where, who keeps browsing, and who buys.${
          data && data.internal_devices
            ? ` Excluding ${data.internal_devices} internal team device${data.internal_devices === 1 ? "" : "s"}.`
            : ""
        }`}
        action={
          <div className="flex rounded-lg bg-ivory p-1 ring-1 ring-taupe/15">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                  days === r.days ? "bg-espresso text-ivory" : "text-taupe hover:text-espresso"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {!data ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <p className="text-xs uppercase tracking-wider text-taupe">Sessions</p>
              <p className="mt-2 font-serif text-3xl text-espresso">{data.kpis.sessions}</p>
              <p className="mt-1 text-xs text-taupe">{data.kpis.page_views} page views</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-taupe">Purchases</p>
              <p className="mt-2 font-serif text-3xl text-espresso">{data.kpis.purchases}</p>
              <p className="mt-1 text-xs text-taupe">{data.kpis.conversion_rate}% of sessions</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-taupe">Revenue</p>
              <p className="mt-2 font-serif text-3xl text-espresso">
                €{data.kpis.revenue.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-taupe">
                {data.kpis.purchases ? `€${data.kpis.avg_order_value.toFixed(2)} avg order` : "no orders yet"}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wider text-taupe">Time on product</p>
              <p className="mt-2 font-serif text-3xl text-espresso">
                {data.kpis.avg_time_on_product_seconds}s
              </p>
              <p className="mt-1 text-xs text-taupe">{data.kpis.view_to_cart_rate}% view-to-cart</p>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 font-serif text-xl text-espresso">Traffic over time</h2>
            {data.timeseries.length ? (
              <LineChart points={data.timeseries} hourly={days <= 2} />
            ) : (
              <p className="py-8 text-center text-sm text-taupe">No events in this period.</p>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-1 font-serif text-xl text-espresso">Visitor funnel</h2>
              <p className="mb-4 text-xs text-taupe">Unique sessions reaching each step.</p>
              <Funnel steps={data.session_funnel} />
            </Card>

            <Card>
              <h2 className="mb-1 font-serif text-xl text-espresso">Browse depth</h2>
              <p className="mb-4 text-xs text-taupe">
                How many different products a session looked at — are they exploring the catalog?
              </p>
              {data.browse_depth.map((d) => (
                <BarRow
                  key={d.products_viewed}
                  label={`${d.products_viewed} product${d.products_viewed === "1" ? "" : "s"} viewed`}
                  value={d.sessions}
                  max={Math.max(1, ...data.browse_depth.map((r) => r.sessions))}
                  detail={`· ${d.share}%`}
                />
              ))}
            </Card>

            <Card>
              <h2 className="mb-1 font-serif text-xl text-espresso">Top pages</h2>
              <p className="mb-4 text-xs text-taupe">
                Views per page. &ldquo;entered&rdquo; = sessions that landed there first.
              </p>
              {data.top_pages.length ? (
                data.top_pages.map((p) => (
                  <BarRow
                    key={p.path}
                    label={p.path}
                    value={p.views}
                    max={Math.max(1, ...data.top_pages.map((r) => r.views))}
                    detail={`· ${p.sessions} sessions · ${p.entries} entered`}
                  />
                ))
              ) : (
                <p className="text-sm text-taupe">No page views yet.</p>
              )}
            </Card>

            <Card>
              <h2 className="mb-1 font-serif text-xl text-espresso">Most viewed products</h2>
              <p className="mb-4 text-xs text-taupe">Product detail page views.</p>
              {data.top_products.length ? (
                data.top_products.map((p) => (
                  <BarRow
                    key={p.slug}
                    label={p.name}
                    value={p.views}
                    max={Math.max(1, ...data.top_products.map((r) => r.views))}
                  />
                ))
              ) : (
                <p className="text-sm text-taupe">No product views yet.</p>
              )}
            </Card>
          </div>

          <Card className="overflow-x-auto p-0">
            <div className="p-5 pb-0">
              <h2 className="font-serif text-xl text-espresso">Traffic sources</h2>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-taupe/15 text-left text-xs uppercase tracking-wider text-taupe">
                  <th className="p-4">Source</th>
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Sessions</th>
                  <th className="p-4">Purchases</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s, i) => (
                  <tr key={i} className="border-b border-taupe/10 last:border-0">
                    <td className="p-4 font-medium text-espresso">{s.source}</td>
                    <td className="p-4 text-taupe">{s.campaign}</td>
                    <td className="p-4">{s.sessions}</td>
                    <td className="p-4">{s.purchases}</td>
                    <td className="p-4">€{s.revenue.toFixed(2)}</td>
                    <td className="p-4">{s.conversion_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-0">
            <div className="p-5 pb-3">
              <h2 className="font-serif text-xl text-espresso">Live activity</h2>
              <p className="mt-1 text-xs text-taupe">The latest things visitors did, most recent first.</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {data.recent_activity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-4 border-t border-taupe/10 px-5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <span className={EVENT_COLOR[a.type] || "text-espresso"}>
                      {EVENT_LABEL[a.type] || a.type}
                    </span>
                    {a.product && <span className="text-taupe"> — {a.product}</span>}
                    {!a.product && a.path && <span className="truncate text-taupe"> — {a.path}</span>}
                    {a.value != null && <span className="text-sage"> €{a.value.toFixed(2)}</span>}
                    {a.source && (
                      <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-[10px] uppercase tracking-wider text-taupe">
                        {a.source}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-taupe">
                    <span title={new Date(a.at).toLocaleString()}>{timeAgo(a.at)}</span>
                    {a.session && <span className="ml-2 text-taupe/50">#{a.session}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
