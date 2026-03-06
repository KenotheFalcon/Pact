import { formatCurrency, formatDate } from "./utils";
import type { FarmerStats, FarmerActivity } from "@/types/farmer";
import type { Listing, Transaction } from "@/types/database";

// Calculate farmer statistics from their data
export function calculateFarmerStats(
  listings: Listing[],
  sales: Transaction[]
): FarmerStats {
  const activeListings = listings.filter(
    (l) => l.status === "available"
  ).length;
  const totalEarnings = sales.reduce(
    (sum, sale) => sum + (sale.amount || 0),
    0
  );
  const pendingEarnings = sales
    .filter((sale) => sale.status === "pending")
    .reduce((sum, sale) => sum + (sale.amount || 0), 0);

  return {
    totalListings: listings.length,
    activeListings,
    totalEarnings,
    pendingEarnings,
    activePools: 0, // Will be calculated when pools data is passed
    totalSales: sales.length,
  };
}

// Format farmer activity for display
export function formatActivity(activity: FarmerActivity): {
  title: string;
  description: string;
  amount?: string;
  icon: string;
  color: string;
} {
  const base = {
    title: activity.title,
    description: activity.description,
    amount: activity.amount ? formatCurrency(activity.amount) : undefined,
  };

  switch (activity.type) {
    case "listing_created":
      return {
        ...base,
        icon: "🌱",
        color: "text-green-600 bg-green-100",
      };
    case "listing_sold":
      return {
        ...base,
        icon: "💰",
        color: "text-gray-600 bg-gray-100",
      };
    case "pool_completed":
      return {
        ...base,
        icon: "🛒",
        color: "text-purple-600 bg-purple-100",
      };
    case "payment_received":
      return {
        ...base,
        icon: "💳",
        color: "text-green-600 bg-green-100",
      };
    default:
      return {
        ...base,
        icon: "📊",
        color: "text-gray-600 bg-gray-100",
      };
  }
}

// Generate mock activity data for development
export function generateMockActivity(): FarmerActivity[] {
  return [
    {
      id: "1",
      type: "listing_created",
      title: "New Listing Created",
      description: "Fresh Tomatoes - 50kg available",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      status: "success",
    },
    {
      id: "2",
      type: "listing_sold",
      title: "Product Sold",
      description: "25kg of Fresh Carrots sold to Pool",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      amount: 12500,
      status: "success",
    },
    {
      id: "3",
      type: "payment_received",
      title: "Payment Received",
      description: "Payment for carrot sale completed",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      amount: 12500,
      status: "success",
    },
  ];
}

import type { ListingFormData } from "@/types/farmer";

// Validate listing data before submission
export function validateListingData(data: Partial<ListingFormData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push("Product name must be at least 3 characters long");
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push("Product description must be at least 10 characters long");
  }

  if (!data.category || data.category === "") {
    errors.push("Please select a product category");
  }

  if (!data.pricePerUnit || data.pricePerUnit <= 0) {
    errors.push("Price per unit must be greater than 0");
  }

  if (!data.quantity || data.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (!data.unit || data.unit === "") {
    errors.push("Please select a unit of measurement");
  }

  if (!data.harvestDate) {
    errors.push("Harvest date is required");
  }

  if (!data.expiryDate) {
    errors.push("Expiry date is required");
  }

  if (data.harvestDate && data.expiryDate) {
    const harvest = new Date(data.harvestDate);
    const expiry = new Date(data.expiryDate);
    if (harvest >= expiry) {
      errors.push("Expiry date must be after harvest date");
    }
  }

  if (!data.location?.address) {
    errors.push("Location address is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Calculate days until expiry
export function calculateDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Get expiry status color
export function getExpiryStatusColor(daysUntilExpiry: number): string {
  if (daysUntilExpiry < 0) return "text-gray-600 bg-gray-100";
  if (daysUntilExpiry <= 3) return "text-orange-600 bg-orange-100";
  if (daysUntilExpiry <= 7) return "text-yellow-600 bg-yellow-100";
  return "text-green-600 bg-green-100";
}
