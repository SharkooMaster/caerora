"use client";
import { ReactNode } from "react";

const TONES: Record<string, string> = {
  green: "bg-sage/25 text-espresso ring-sage/40",
  amber: "bg-champagne/40 text-espresso ring-champagne",
  red: "bg-terracotta/20 text-terracotta ring-terracotta/40",
  gray: "bg-taupe/15 text-taupe ring-taupe/25",
  plum: "bg-plum/15 text-plum ring-plum/30",
};

export function Badge({ tone = "gray", children }: { tone?: keyof typeof TONES | string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ${TONES[tone] || TONES.gray}`}>
      {children}
    </span>
  );
}

const PAYMENT_TONE: Record<string, string> = { paid: "green", pending: "amber", failed: "red", refunded: "gray" };
const FULFILL_TONE: Record<string, string> = {
  unfulfilled: "amber", processing: "plum", shipped: "green", delivered: "green", cancelled: "red",
};
const REVIEW_TONE: Record<string, string> = { approved: "green", pending: "amber", rejected: "red" };
const CAMPAIGN_TONE: Record<string, string> = { draft: "gray", sending: "amber", sent: "green", failed: "red" };

export function PaymentBadge({ status }: { status: string }) {
  return <Badge tone={PAYMENT_TONE[status] || "gray"}>{status}</Badge>;
}
export function FulfillmentBadge({ status }: { status: string }) {
  return <Badge tone={FULFILL_TONE[status] || "gray"}>{status}</Badge>;
}
export function ReviewBadge({ status }: { status: string }) {
  return <Badge tone={REVIEW_TONE[status] || "gray"}>{status}</Badge>;
}
export function CampaignBadge({ status }: { status: string }) {
  return <Badge tone={CAMPAIGN_TONE[status] || "gray"}>{status}</Badge>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl text-espresso md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-taupe">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-ivory p-5 shadow-card ring-1 ring-taupe/10 ${className}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-taupe/25 p-10 text-center text-sm text-taupe">{children}</div>;
}

export function Spinner() {
  return <div className="py-16 text-center text-sm text-taupe">Loading...</div>;
}

export function Stars({ n }: { n: number }) {
  return <span className="text-rose" aria-label={`${n} stars`}>{"\u2605".repeat(n)}{"\u2606".repeat(Math.max(0, 5 - n))}</span>;
}
