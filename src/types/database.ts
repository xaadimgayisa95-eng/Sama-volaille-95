export interface Category {
  id: string;
  name: string;
  name_en: string | null;
  icon: string;
  slug: string;
  sort_order: number;
  image_url: string | null;
}

export interface Profile {
  id: string;
  name: string;
  username: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  verified: boolean;
  listings_count: number;
  role: 'admin' | 'moderator' | 'user' | null;
  is_banned: boolean;
  created_at: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  price_unit: string;
  quantity: number;
  category_id: string | null;
  user_id: string | null;
  location: string;
  phone: string | null;
  status: 'available' | 'reserved' | 'sold';
  featured: boolean;
  images: string[];
  attributes: Record<string, string | number | boolean>;
  created_at: string;
  category?: Category;
  profile?: Profile;
  is_favorited?: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing;
}

export interface Report {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  reviewed_by: string | null;
  created_at: string;
  listing?: Listing;
  reporter?: Profile;
  reviewer?: Profile;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator';
  created_at: string;
}

export type Screen = 'home' | 'search' | 'publish' | 'profile' | 'detail' | 'favorites' | 'admin' | 'admin-listings' | 'admin-reports' | 'admin-users' | 'auth';

export interface ModerationResult {
  isAppropriate: boolean;
  flags: string[];
  recommendation: 'approve' | 'review';
  message: string;
}
