export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  /** Shopify Storefront API IDs used to create a hosted checkout. */
  shopifyProductId?: string;
  shopifyVariantId?: string;
  shopifyVariants?: Array<{
    id: string;
    title: string;
    availableForSale: boolean;
    selectedOptions: Record<string, string>;
  }>;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  images: string[];
  specifications?: Record<string, string>;
  features?: string[];
  sizes?: string[];
  colors?: ColorOption[];
  variations?: string[];
  stockCount?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  reviewsCount?: number;
  rating?: number;
  status: 'published' | 'hidden';
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemCount?: number;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  description: string;
  logoUrl?: string;
  currencySymbol: string;
  currencyCode: string;
  whatsappNumber: string;
  whatsappPrefillGreeting: string;
  phone: string;
  email: string;
  address: string;
  announcementText: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroImageUrl: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  aboutText: string;
  adminPasswordHash?: string;
  adminPasswordSalt?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
}

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google';
  lastSignInAt: string;
  loginCount?: number;
  createdAt?: string;
}

export type PageType =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'categories'
  | 'about'
  | 'contact'
  | 'policy'
  | 'wishlist'
  | 'login'
  | 'account'
  | 'admin-login'
  | 'admin-dashboard';

export type PolicyTab = 'privacy' | 'terms' | 'shipping' | 'refund';

export interface FilterState {
  search: string;
  categoryId: string;
  minPrice?: number;
  maxPrice?: number;
  featuredOnly?: boolean;
  trendingOnly?: boolean;
  newArrivalsOnly?: boolean;
  discountOnly?: boolean;
  inStockOnly?: boolean;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}
