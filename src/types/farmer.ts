import { Listing, Pool } from "@/types/database";

export interface FarmerStats {
  totalListings: number;
  activeListings: number;
  totalEarnings: number;
  pendingEarnings: number;
  activePools: number;
  totalSales: number;
}

export interface FarmerActivity {
  id: string;
  type:
    | "listing_created"
    | "listing_sold"
    | "pool_completed"
    | "payment_received";
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status: "success" | "pending" | "failed";
}

export interface ListingFormData {
  name: string;
  description: string;
  category: string;
  pricePerUnit: number;
  unit: string;
  quantity: number;
  minQuantity: number;
  images: File[];
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  harvestDate: string;
  expiryDate: string;
  organic: boolean;
  negotiable: boolean;
}

export interface ListingStatus {
  id: string;
  status: "available" | "sold" | "expired" | "draft";
  quantitySold: number;
  quantityAvailable: number;
  views: number;
  lastUpdated: string;
}

export interface FarmerDashboardData {
  stats: FarmerStats;
  recentActivity: FarmerActivity[];
  recentListings: Listing[];
  activePools: Pool[];
}
