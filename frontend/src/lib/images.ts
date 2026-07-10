// Brand imagery for the storefront. These are locally hosted editorial assets
// generated for the "Life in the Spirit" identity (midnight navy, parchment,
// gold). Studio uploads (site content, seasons, categories, gallery) always
// take precedence — these are the built-in fallbacks so no section ever
// renders image-less.

export const IMAGES = {
  hero: "/brand/hero-dawn.jpg", // star over Bethlehem at first light
  editorialDark: "/brand/band-craft.jpg", // gold-embroidered star on navy fabric
  about: "/brand/about-stack.jpg", // folded garment stack, earth tones
  craft: "/brand/gallery-label.jpg", // woven neck label detail
  og: "/brand/og-star.jpg",
};

// "@caerora" lifestyle / editorial gallery strip (square crops).
export const GALLERY: string[] = [
  "/brand/gallery-sea.jpg",
  "/brand/gallery-courtyard.jpg",
  "/brand/gallery-flatlay.jpg",
  "/brand/gallery-hillside.jpg",
  "/brand/gallery-morning.jpg",
  "/brand/gallery-label.jpg",
];

// Fallback tiles for the "Shop by category" grid when a category has no
// uploaded image yet.
export const CATEGORY_IMAGES: Record<string, string> = {
  tees: "/brand/gallery-courtyard.jpg",
  "t-shirts": "/brand/gallery-courtyard.jpg",
  hoodies: "/brand/gallery-sea.jpg",
  sweatshirts: "/brand/gallery-flatlay.jpg",
  accessories: "/brand/gallery-label.jpg",
};

const CATEGORY_FALLBACKS = [
  "/brand/gallery-courtyard.jpg",
  "/brand/gallery-sea.jpg",
  "/brand/gallery-flatlay.jpg",
  "/brand/gallery-hillside.jpg",
];

// Kept for compatibility: no demo product art in the clothing catalog —
// products always use their own uploaded photography.
export function demoProductImage(slug?: string | null): string | undefined {
  void slug;
  return undefined;
}

// Editorial fallback by category, used only when a product has no image.
export function categoryImage(categorySlug?: string | null): string | undefined {
  if (!categorySlug) return CATEGORY_FALLBACKS[0];
  return (
    CATEGORY_IMAGES[categorySlug] ||
    CATEGORY_FALLBACKS[
      Math.abs([...categorySlug].reduce((a, c) => a + c.charCodeAt(0), 0)) % CATEGORY_FALLBACKS.length
    ]
  );
}

export function isUnsplash(src?: string | null): boolean {
  return !!src && src.includes("images.unsplash.com");
}
