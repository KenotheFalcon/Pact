// Database helper functions

import { createClient } from "@/lib/supabase/server";
import { sanitizeLikePattern } from "@/lib/utils";
import type {
  Listing,
  Pool,
  Order,
  ListingFilters,
  PoolFilters,
} from "@/types/database";

/**
 * Fetch listings with optional filters
 */
export async function getListings(filters?: ListingFilters) {
  const supabase = await createClient();

  let query = supabase.from("listings").select(`
      *,
      farmer:profiles!listings_farmer_id_fkey (
        id,
        display_name,
        rating,
        total_reviews,
        city
      )
    `);

  // Apply filters
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.ilike("name", `%${sanitizeLikePattern(filters.search)}%`);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte("price_per_unit", filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte("price_per_unit", filters.maxPrice);
  }

  if (filters?.organic !== undefined) {
    query = query.eq("organic", filters.organic);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", "available");
  }

  // Sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";

  if (sortBy !== "distance") {
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
  }

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }

  let listings = (data || []) as Listing[];

  // Calculate distance if location is provided
  if (filters?.latitude && filters?.longitude) {
    const { calculateDistance } = await import("@/lib/location");

    listings = listings.map((listing) => ({
      ...listing,
      distance: calculateDistance(
        filters.latitude!,
        filters.longitude!,
        listing.latitude,
        listing.longitude
      ),
    }));

    // Filter by radius if specified
    if (filters.radius) {
      listings = listings.filter(
        (listing) => listing.distance! <= filters.radius!
      );
    }

    // Sort by distance if requested
    if (sortBy === "distance") {
      listings.sort((a, b) => {
        const distA = a.distance || 0;
        const distB = b.distance || 0;
        return sortOrder === "asc" ? distA - distB : distB - distA;
      });
    }
  }

  return {
    data: listings,
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > to + 1,
  };
}

/**
 * Fetch single listing by ID
 */
export async function getListing(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      farmer:profiles!listings_farmer_id_fkey (
        id,
        display_name,
        full_name,
        rating,
        total_reviews,
        bio,
        avatar_url,
        city,
        country
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch listing: ${error.message}`);
  }

  return data as Listing;
}

/**
 * Create a new listing (farmers only)
 */
export async function createListing(listing: Partial<Listing>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      ...listing,
      farmer_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`);
  }

  return data as Listing;
}

/**
 * Fetch pools with filters
 */
export async function getPools(filters?: PoolFilters) {
  const supabase = await createClient();

  let query = supabase.from("pools").select(`
      *,
      listing:listings!pools_listing_id_fkey (
        id,
        name,
        price_per_unit,
        unit,
        images,
        category,
        latitude,
        longitude,
        city,
        organic
      ),
      leader:profiles!pools_leader_id_fkey (
        id,
        display_name
      )
    `);

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.in("status", ["active", "funded"]);
  }

  // Sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch pools: ${error.message}`);
  }

  let pools = (data || []) as Pool[];

  // Calculate progress percentage and distance
  if (filters?.latitude && filters?.longitude) {
    const { calculateDistance } = await import("@/lib/location");
    pools = pools.map((pool) => ({
      ...pool,
      progress: Math.min(
        100,
        Math.round((pool.current_quantity / pool.min_quantity) * 100)
      ),
      distance: calculateDistance(
        filters.latitude!,
        filters.longitude!,
        pool.latitude || pool.listing?.latitude || 0,
        pool.longitude || pool.listing?.longitude || 0
      ),
    }));

    // Filter by radius if specified
    if (filters.radius) {
      pools = pools.filter((p) => (p.distance || 0) <= filters.radius!);
    }
  } else {
    pools = pools.map((pool) => ({
      ...pool,
      progress: Math.min(
        100,
        Math.round((pool.current_quantity / pool.min_quantity) * 100)
      ),
    }));
  }

  return {
    data: pools,
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > to + 1,
  };
}

/**
 * Fetch single pool by ID
 */
export async function getPool(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pools")
    .select(
      `
      *,
      listing:listings!pools_listing_id_fkey (
        *,
        farmer:profiles!listings_farmer_id_fkey (
          id,
          display_name,
          rating,
          total_reviews
        )
      ),
      leader:profiles!pools_leader_id_fkey (
        id,
        display_name,
        avatar_url
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch pool: ${error.message}`);
  }

  const pool = data as Pool;
  pool.progress = Math.min(
    100,
    Math.round((pool.current_quantity / pool.min_quantity) * 100)
  );

  return pool;
}

/**
 * Create a new pool
 */
export async function createPool(pool: Partial<Pool>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("pools")
    .insert({
      ...pool,
      leader_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create pool: ${error.message}`);
  }

  return data as Pool;
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      listing:listings!orders_listing_id_fkey (
        id,
        name,
        images
      ),
      pool:pools!orders_pool_id_fkey (
        id,
        status,
        expires_at
      )
    `
    )
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data as Order[];
}
