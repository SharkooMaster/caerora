export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface StaffStats {
  orders_total: number;
  orders_today: number;
  revenue_total: string | number;
  open_fulfillment: number;
  pending_reviews: number;
  subscribers: number;
  products: number;
  low_stock: number;
  recent_orders: AdminOrderListItem[];
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus = "unfulfilled" | "processing" | "shipped" | "delivered" | "cancelled";

export interface AdminOrderListItem {
  number: string;
  full_name: string;
  email: string;
  total: string;
  currency: string;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  tracking_number: string;
  item_count: number;
  created_at: string;
}

export interface AdminOrderItem {
  id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  supplier_url: string;
  supplier_cost: string | null;
  supplier_notes: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  phone: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  region: string;
  country: string;
  subtotal: string;
  shipping_total: string;
  tax_total: string;
  discount_total: string;
  discount_code: string;
  shipping_method: string;
  paid_at: string | null;
  shipped_at: string | null;
  admin_notes: string;
  stripe_payment_intent_id: string;
  marketing_opt_in: boolean;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  items: AdminOrderItem[];
  updated_at: string;
}

export interface AdminVariant {
  id: number;
  product?: number;
  name: string;
  sku: string;
  swatch_hex: string;
  price: string;
  compare_at_price: string | null;
  stock: number;
  position: number;
  is_active: boolean;
  /** ProductImage id the PDP gallery jumps to when this variant is selected. */
  image: number | null;
}

export interface AdminProductImage {
  id: number;
  product?: number;
  image_url: string | null;
  video_url?: string | null;
  alt_text: string;
  position: number;
}

export interface AdminProductListItem {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  category: number | null;
  category_name: string;
  is_active: boolean;
  is_featured: boolean;
  position: number;
  primary_image: string | null;
  price_from: string | null;
  in_stock: boolean;
  variant_count: number;
}

export interface AdminProduct {
  id: number;
  category: number | null;
  name: string;
  slug: string;
  brand?: string;
  tagline: string;
  /** Optional net content, e.g. "30 ml". */
  volume?: string;
  description: string;
  benefits: string;
  brand_copy: string;
  ingredients: string;
  how_to_use: string;
  is_active: boolean;
  is_featured: boolean;
  position: number;
  supplier_url: string;
  supplier_notes: string;
  supplier_cost: string | null;
  meta_title: string;
  meta_description: string;
  variants: AdminVariant[];
  images: AdminProductImage[];
  primary_image: string | null;
}

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  position: number;
  is_active: boolean;
  product_count: number;
}

export type ReviewStatus = "pending" | "approved" | "rejected";
export interface AdminReview {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  author_name: string;
  author_email: string;
  rating: number;
  title: string;
  body: string;
  is_verified_purchase: boolean;
  status: ReviewStatus;
  created_at: string;
}

export interface AdminSiteContent {
  promo_bar_text: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_title_accent: string;
  hero_subtitle: string;
  hero_cta_label: string;
  hero_cta_href: string;
  hero_image_url: string | null;
  brand_band_title: string;
  brand_band_body: string;
  brand_band_image_url: string | null;
  newsletter_title: string;
  newsletter_body: string;
  og_image_url: string | null;
}

export interface AdminGalleryImage {
  id: number;
  image_url: string | null;
  alt_text: string;
  link_url: string;
  position: number;
  is_active: boolean;
}

export interface AdminTestimonial {
  id: number;
  author_name: string;
  handle: string;
  quote: string;
  rating: number;
  photo_url: string | null;
  position: number;
  is_active: boolean;
}

export interface AdminSubscriber {
  id: number;
  email: string;
  is_active: boolean;
  source: string;
  created_at: string;
}

export interface AdminDiscount {
  id: number;
  code: string;
  percent_off: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  used_count: number;
  min_subtotal: string;
  created_at: string;
}

export type CampaignStatus = "draft" | "sending" | "sent" | "failed";
export interface AdminCampaign {
  id: number;
  subject: string;
  preheader: string;
  body_html: string;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  created_at: string;
}
