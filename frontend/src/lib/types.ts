export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  product_count?: number;
}

export interface SiteContentData {
  promo_bar_text: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_title_accent: string;
  hero_subtitle: string;
  hero_cta_label: string;
  hero_cta_href: string;
  hero_image: string | null;
  brand_band_title: string;
  brand_band_body: string;
  brand_band_image: string | null;
  newsletter_title: string;
  newsletter_body: string;
  og_image: string | null;
}

export interface Testimonial {
  id: number;
  author_name: string;
  handle: string;
  quote: string;
  rating: number;
  photo: string | null;
  position: number;
}

export interface GalleryImageT {
  id: number;
  image: string | null;
  alt_text: string;
  link_url: string;
  position: number;
}

export interface ProductImage {
  id: number;
  image: string | null;
  alt_text: string;
  position: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  swatch_hex: string;
  price: string;
  compare_at_price: string | null;
  stock: number;
  is_active: boolean;
}

export interface ReviewStats {
  average: number;
  count: number;
}

export interface QuickVariant {
  id: number;
  name: string;
  price: string;
  compare_at_price: string | null;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  category: Category | null;
  is_featured: boolean;
  primary_image: string | null;
  price_from: string | null;
  in_stock: boolean;
  review_stats: ReviewStats;
  quick_variant?: QuickVariant | null;
  variant_count?: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  brand_copy: string;
  ingredients: string;
  how_to_use: string;
  category: Category | null;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  images: ProductImage[];
  variants: ProductVariant[];
  review_stats: ReviewStats;
}

export interface Review {
  id: number;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface ShippingRate {
  id: number;
  name: string;
  price: string;
  free_over: string | null;
  delivery_estimate: string;
  effective_price?: string;
}

export interface ShippingOptions {
  zone: string | null;
  currency: string;
  rates: ShippingRate[];
}

export interface OrderItem {
  product_name: string;
  variant_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface Order {
  number: string;
  email: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  region: string;
  country: string;
  currency: string;
  subtotal: string;
  shipping_total: string;
  tax_total: string;
  discount_total: string;
  discount_code?: string;
  total: string;
  shipping_method: string;
  payment_status: string;
  fulfillment_status: string;
  tracking_number: string;
  created_at: string;
  items: OrderItem[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
