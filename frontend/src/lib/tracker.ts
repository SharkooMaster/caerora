"use client";
import { api } from "./api";
import { readConsent } from "./consent";

const ANON_KEY = "caerora-anon-id";
const SESSION_KEY = "caerora-session-id";
const UTM_KEY = "caerora-utm";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, props?: Record<string, unknown>, opts?: { event_id?: string }) => void;
      page: () => void;
      load: (id: string) => void;
    };
    dataLayer?: unknown[];
  }
}

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const GOOGLE_ADS_PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxxxxxx4xxxyxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export interface Utm {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export function captureUtm(): Utm {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const keys: (keyof Utm)[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const found: Utm = {};
  keys.forEach((k) => {
    const v = params.get(k);
    if (v) found[k] = v;
  });
  if (Object.keys(found).length > 0) {
    localStorage.setItem(UTM_KEY, JSON.stringify(found));
    return found;
  }
  return getStoredUtm();
}

export function getStoredUtm(): Utm {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(UTM_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

export interface TrackPayload {
  event_type: string;
  path?: string;
  product_slug?: string;
  variant_id?: number;
  value?: number;
  currency?: string;
  dwell_ms?: number;
  meta?: Record<string, unknown>;
}

// Map our event names to GA4/Meta standard events for the ad platforms.
const GA_MAP: Record<string, string> = {
  view_item: "view_item",
  select_item: "select_item",
  add_to_cart: "add_to_cart",
  begin_checkout: "begin_checkout",
  purchase: "purchase",
  view_item_list: "view_item_list",
  search: "search",
};
const META_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  search: "Search",
};
const TIKTOK_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "CompletePayment",
  search: "Search",
};

export function track(payload: TrackPayload) {
  if (typeof window === "undefined") return;
  const consent = readConsent();

  // Always send first-party events to our own backend (necessary analytics).
  const body = {
    ...payload,
    path: payload.path || window.location.pathname,
    referrer: document.referrer || "",
    anonymous_id: getAnonId(),
    session_id: getSessionId(),
    ...getStoredUtm(),
  };
  api.trackEvents(body).catch(() => {});

  // Forward to ad platforms only with analytics/marketing consent.
  const searchTerm = payload.meta?.search_term as string | undefined;
  if (consent.analytics && window.gtag && GA_MAP[payload.event_type]) {
    window.gtag("event", GA_MAP[payload.event_type], {
      value: payload.value,
      currency: payload.currency?.toUpperCase(),
      items: payload.meta?.items,
      ...(searchTerm ? { search_term: searchTerm } : {}),
    });
  }
  if (consent.marketing && window.fbq && META_MAP[payload.event_type]) {
    const fbContentId = payload.product_slug || (payload.variant_id ? String(payload.variant_id) : undefined);
    window.fbq("track", META_MAP[payload.event_type], {
      value: payload.value,
      currency: payload.currency?.toUpperCase(),
      ...(fbContentId ? { content_ids: [fbContentId], content_type: "product" } : {}),
      ...(searchTerm ? { search_string: searchTerm } : {}),
    });
  }
  if (consent.marketing && window.ttq && TIKTOK_MAP[payload.event_type]) {
    // content_id/content_type let TikTok attribute events to products, which
    // raises the EMQ score and improves conversion optimization.
    const contentId = payload.product_slug || (payload.variant_id ? String(payload.variant_id) : undefined);
    window.ttq.track(TIKTOK_MAP[payload.event_type], {
      value: payload.value,
      currency: payload.currency?.toUpperCase(),
      ...(contentId
        ? {
            contents: [
              {
                content_id: contentId,
                content_type: "product",
                ...(payload.meta?.name ? { content_name: payload.meta.name as string } : {}),
              },
            ],
          }
        : {}),
      ...(searchTerm ? { query: searchTerm } : {}),
    });
  }
}

const PURCHASED_KEY = "caerora-purchased-orders";

/**
 * Fire the purchase conversion on the thank-you page, exactly once per order.
 * Uses the order number as transaction/event id so platforms dedup this
 * against the server-side event (GA4 Measurement Protocol / Meta CAPI).
 */
export interface PurchaseItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export function trackPurchase(
  orderNumber: string,
  value: number,
  currency: string,
  items: PurchaseItem[] = [],
) {
  if (typeof window === "undefined") return;
  let seen: string[] = [];
  try {
    seen = JSON.parse(localStorage.getItem(PURCHASED_KEY) || "[]");
  } catch (e) {
    seen = [];
  }
  if (seen.includes(orderNumber)) return;
  localStorage.setItem(PURCHASED_KEY, JSON.stringify([...seen.slice(-19), orderNumber]));

  const consent = readConsent();
  const cur = currency.toUpperCase();

  // First-party purchase events are recorded server-side by the Stripe
  // webhook, so here we only feed the ad pixels.
  const gaItems = items.map((i) => ({
    item_id: i.sku,
    item_name: i.name,
    quantity: i.quantity,
    price: i.price,
  }));
  const contents = items.map((i) => ({
    content_id: i.sku,
    content_type: "product",
    content_name: i.name,
    quantity: i.quantity,
    price: i.price,
  }));

  if (consent.analytics && window.gtag) {
    window.gtag("event", "purchase", {
      transaction_id: orderNumber,
      value,
      currency: cur,
      ...(gaItems.length ? { items: gaItems } : {}),
    });
    // Google Ads conversion (needs the AW- tag + a conversion label).
    if (GOOGLE_ADS_ID && GOOGLE_ADS_PURCHASE_LABEL) {
      window.gtag("event", "conversion", {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
        transaction_id: orderNumber,
        value,
        currency: cur,
      });
    }
  }
  if (consent.marketing && window.fbq) {
    window.fbq(
      "track",
      "Purchase",
      {
        value,
        currency: cur,
        ...(contents.length
          ? { content_ids: contents.map((c) => c.content_id), content_type: "product" }
          : {}),
      },
      { eventID: orderNumber },
    );
  }
  if (consent.marketing && window.ttq) {
    window.ttq.track(
      "CompletePayment",
      { value, currency: cur, ...(contents.length ? { contents } : {}) },
      { event_id: orderNumber },
    );
  }
}
