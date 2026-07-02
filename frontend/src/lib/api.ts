import type {
  Category,
  GalleryImageT,
  Order,
  Paginated,
  ProductDetail,
  ProductListItem,
  Review,
  ShippingOptions,
  SiteContentData,
  Testimonial,
} from "./types";

// Browser uses the public base URL (through nginx). Server-side rendering uses
// the internal container URL when available.
const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost/api";
const INTERNAL_BASE = process.env.INTERNAL_API_BASE_URL || PUBLIC_BASE;

export function apiBase(): string {
  return typeof window === "undefined" ? INTERNAL_BASE : PUBLIC_BASE;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch (e) {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  categories: () => request<Category[]>("/categories/"),

  products: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<Paginated<ProductListItem>>(`/products/${qs ? `?${qs}` : ""}`);
  },

  product: (slug: string) => request<ProductDetail>(`/products/${slug}/`),

  reviews: (slug: string) => request<Review[]>(`/products/${slug}/reviews/`),

  createReview: (body: {
    product: string;
    author_name: string;
    author_email?: string;
    rating: number;
    title?: string;
    body: string;
  }) => request<Review>("/reviews/", { method: "POST", body: JSON.stringify(body) }),

  shippingOptions: (country: string, subtotal: number) =>
    request<ShippingOptions>(
      `/shipping/options/?country=${encodeURIComponent(country)}&subtotal=${subtotal}`,
    ),

  checkout: (payload: unknown) =>
    request<{ order: Order; client_secret: string; publishable_key: string }>("/checkout/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  order: (number: string) => request<Order>(`/orders/${number}/`),

  newsletter: (email: string, source = "site") =>
    request<{ detail: string }>("/newsletter/", {
      method: "POST",
      body: JSON.stringify({ email, source }),
    }),

  recordConsent: (payload: unknown) =>
    request<{ detail: string }>("/consent/", { method: "POST", body: JSON.stringify(payload) }),

  trackEvents: (events: unknown) =>
    request<{ created: number }>("/events/", { method: "POST", body: JSON.stringify(events) }),

  siteContent: () => request<SiteContentData>("/site-content/"),

  testimonials: () => request<Testimonial[]>("/testimonials/"),

  gallery: () => request<GalleryImageT[]>("/gallery/"),
};
