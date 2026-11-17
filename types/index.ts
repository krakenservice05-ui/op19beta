export interface Game {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  description: string;
  coverImage: string;
  heroImage?: string;
  bannerImage?: string;
  trailerYouTubeId?: string;
  platforms: Platform[];
  genres: string[];
  rating?: number;
  reviewCount?: number;
  releaseDate?: string;
  developer?: string;
  publisher?: string;
  variants: ProductVariant[];
  featured?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
}

export interface ProductVariant {
  id: string;
  platform: string;
  region: string;
  edition: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  deliveryType: DeliveryType;
  availability: "IN_STOCK" | "OUT_OF_STOCK" | "PRE_ORDER";
  inStock: boolean;
}

export type DeliveryType =
  | "DIGITAL_CODE"
  | "DIRECT_ACTIVATION"
  | "MANUAL_FULFILLMENT"
  | "ACCOUNT";

export interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  gradient: string;
  logoInvert?: boolean; // true = render logo in white (for dark logos on colored bg)
}

export interface CartItem {
  gameId: string;
  variantId: string;
  title: string;
  coverImage: string;
  platform: string;
  region: string;
  edition: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  quantity: number;
  deliveryType: DeliveryType;
}

export interface HeroSlide {
  id: string;
  gameSlug: string;
  title: string;
  subtitle: string;
  tagline?: string;
  heroImage: string;
  ctaText: string;
  ctaLink: string;
  accentColor?: string;
  imagePosition?: string;
  hideOverlayText?: boolean;
  containImage?: boolean;       // true = object-contain + gradient bg (for small images)
  containBg?: string;           // custom bg color behind contained image
}

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_PROCESSING"
  | "PAID"
  | "FULFILLMENT_PENDING"
  | "FULFILLED"
  | "EMAIL_PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type PaymentMethod =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CRYPTO"
  | "APPLE_GIFT_CARD"
  | "STEAM_GIFT_CARD";
