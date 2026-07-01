// Curated Unsplash imagery for the storefront. Photo IDs are verified real.
// We keep these centralized so product/category/editorial art stays consistent
// and on-brand (warm, clean, editorial beauty photography).
//
// URLs point at the Unsplash CDN directly and are loaded `unoptimized` (see
// SmartImage) so the browser fetches from Unsplash's fast global CDN instead of
// proxying through our own image optimizer.

const UNSPLASH = "https://images.unsplash.com";

function u(id: string, w: number, h: number): string {
  return `${UNSPLASH}/photo-${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=80`;
}

export const IMAGES = {
  hero: u("1487412947147-5cebf100ffc2", 1100, 1300),
  heroWide: u("1487412947147-5cebf100ffc2", 1600, 1000),
  brandDark: u("1567721913486-6585f069b332", 1000, 1000),
  about: u("1590439471364-192aa70c0b53", 1100, 1100),
  editorial: u("1596704017254-9b121068fb31", 1200, 1400),
  og: u("1596462502278-27bfdc403348", 1200, 630),
};

export const CATEGORY_IMAGES: Record<string, string> = {
  lips: u("1586495777744-4413f21062fa", 900, 1100),
  face: u("1522335789203-aabd1fc54bc9", 900, 1100),
  eyes: u("1512496015851-a90fb38ba796", 900, 1100),
  skin: u("1571781926291-c477ebfd024b", 900, 1100),
};

// Placeholder art for the demo catalog only, keyed by the seeded demo slugs.
// Real dropship SKUs won't match these slugs, so their supplier photos always
// take precedence (see ProductCard / ProductDetailView ordering).
const DEMO_PRODUCT_IMAGES: Record<string, string> = {
  "velvet-matte-lipstick": u("1596462502278-27bfdc403348", 900, 1125),
  "glass-lip-oil": u("1522337660859-02fbefca4702", 900, 1125),
  "luminous-silk-foundation": u("1601049541289-9b1b7bbbfe19", 900, 1125),
  "soft-focus-blush": u("1503236823255-94609f598e71", 900, 1125),
  "defining-mascara": u("1631214540553-ff044a3ff1d4", 900, 1125),
  "nude-edit-palette": u("1596704017254-9b121068fb31", 900, 1125),
  "hydrating-primer-serum": u("1617897903246-719242758050", 900, 1125),
  "overnight-renewal-cream": u("1599305090598-fe179d501227", 900, 1125),
};

// Explicit demo-only override (known seeded slugs). Undefined for real SKUs.
export function demoProductImage(slug?: string | null): string | undefined {
  return slug ? DEMO_PRODUCT_IMAGES[slug] : undefined;
}

// Editorial fallback by category, used only when a product has no supplier image.
export function categoryImage(categorySlug?: string | null): string | undefined {
  return categorySlug ? CATEGORY_IMAGES[categorySlug] : undefined;
}

export function isUnsplash(src?: string | null): boolean {
  return !!src && src.includes("images.unsplash.com");
}
