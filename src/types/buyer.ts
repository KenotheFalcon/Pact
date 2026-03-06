// Buyer-specific TypeScript types

export interface BuyerStats {
  totalOrders: number;
  activePools: number;
  totalSpent: number;
  savedAmount: number;
  favoriteFarmers: number;
  favoriteProducts: number;
}

export interface BuyerActivity {
  id: string;
  type:
    | "order_placed"
    | "pool_joined"
    | "order_delivered"
    | "review_submitted"
    | "favorite_added";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status: "success" | "pending" | "failed";
}

export interface FavoriteItem {
  id: string;
  type: "farmer" | "product";
  item_id: string;
  user_id: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  listing_id: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_price: number;
  farmer_id: string;
  farmer_name: string;
  product_name: string;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  total_amount: number;
  total_items: number;
}

export interface FilterOptions {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  location?: string;
  distance?: number; // in kilometers
  organic?: boolean;
  negotiable?: boolean;
  sortBy?: "price_asc" | "price_desc" | "distance" | "freshness" | "popularity";
  availability?: "available" | "pool" | "all";
}

export interface SearchFilters {
  query: string;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
  location: string;
  distance: number;
  organic: boolean;
  negotiable: boolean;
  sortBy: "price_asc" | "price_desc" | "distance" | "freshness" | "popularity";
  availability: "available" | "pool" | "all";
}
