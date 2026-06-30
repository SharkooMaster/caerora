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
    dataLayer?: unknown[];
  }
}

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
};
const META_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
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

  // Forward to GA4 / Meta only with analytics/marketing consent.
  if (consent.analytics && window.gtag && GA_MAP[payload.event_type]) {
    window.gtag("event", GA_MAP[payload.event_type], {
      value: payload.value,
      currency: payload.currency?.toUpperCase(),
      items: payload.meta?.items,
    });
  }
  if (consent.marketing && window.fbq && META_MAP[payload.event_type]) {
    window.fbq("track", META_MAP[payload.event_type], {
      value: payload.value,
      currency: payload.currency?.toUpperCase(),
    });
  }
}
