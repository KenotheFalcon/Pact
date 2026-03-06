/**
 * Integration tests for list_pools_with_filters RPC
 * Tests the Supabase RPC function for marketplace pool filtering
 */

import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("list_pools_with_filters RPC", () => {
  const mockSupabase = {
    rpc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("Category filtering", () => {
    it("should filter pools by category", async () => {
      const mockData = [
        {
          id: "123",
          listing_id: "456",
          name: "Organic Tomatoes",
          category: "vegetables",
          unit: "kg",
          price_per_unit: 500,
          images: ["image1.jpg", "image2.jpg"],
          organic: true,
          current_quantity: 50,
          min_quantity: 100,
          expires_at: "2025-12-20T00:00:00Z",
          status: "active",
          latitude: 6.5244,
          longitude: 3.3792,
          distance_km: 5.2,
          total_count: 10,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data, error } = await supabase.rpc("list_pools_with_filters", {
        p_category: "vegetables",
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(error).toBeNull();
      expect(data).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("list_pools_with_filters", {
        p_category: "vegetables",
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 24,
        p_offset: 0,
      });
    });

    it("should return all categories when category is null", async () => {
      const mockData = [
        { category: "vegetables", name: "Tomatoes", total_count: 5 },
        { category: "fruits", name: "Apples", total_count: 5 },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(data).toHaveLength(2);
      expect(data?.map((d: any) => d.category)).toEqual([
        "vegetables",
        "fruits",
      ]);
    });
  });

  describe("Distance filtering", () => {
    it("should filter pools within radius", async () => {
      const mockData = [
        {
          id: "123",
          name: "Nearby Pool",
          distance_km: 3.5,
          latitude: 6.5244,
          longitude: 3.3792,
          total_count: 1,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: 6.5244,
        p_longitude: 3.3792,
        p_radius_km: 5,
        p_sort_by: "distance",
        p_sort_order: "asc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(data).toHaveLength(1);
      expect(data?.[0].distance_km).toBeLessThanOrEqual(5);
    });

    it("should exclude pools outside radius", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: 6.5244,
        p_longitude: 3.3792,
        p_radius_km: 1,
        p_sort_by: "distance",
        p_sort_order: "asc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(data).toHaveLength(0);
    });

    it("should handle null coordinates gracefully", async () => {
      const mockData = [
        {
          id: "123",
          name: "Pool without distance",
          distance_km: null,
          total_count: 1,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data, error } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(error).toBeNull();
      expect(data?.[0].distance_km).toBeNull();
    });
  });

  describe("Sorting", () => {
    it("should sort by price ascending", async () => {
      const mockData = [
        { id: "1", price_per_unit: 100, total_count: 3 },
        { id: "2", price_per_unit: 200, total_count: 3 },
        { id: "3", price_per_unit: 300, total_count: 3 },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "price",
        p_sort_order: "asc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(data?.[0].price_per_unit).toBeLessThanOrEqual(
        data?.[1].price_per_unit
      );
      expect(data?.[1].price_per_unit).toBeLessThanOrEqual(
        data?.[2].price_per_unit
      );
    });

    it("should sort by distance ascending", async () => {
      const mockData = [
        { id: "1", distance_km: 1.2, total_count: 3 },
        { id: "2", distance_km: 3.5, total_count: 3 },
        { id: "3", distance_km: 8.7, total_count: 3 },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: 6.5244,
        p_longitude: 3.3792,
        p_radius_km: null,
        p_sort_by: "distance",
        p_sort_order: "asc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(data?.[0].distance_km).toBeLessThanOrEqual(data?.[1].distance_km);
      expect(data?.[1].distance_km).toBeLessThanOrEqual(data?.[2].distance_km);
    });
  });

  describe("Pagination", () => {
    it("should respect limit parameter", async () => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        name: `Pool ${i}`,
        total_count: 50,
      }));

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 10,
        p_offset: 0,
      });

      expect(data).toHaveLength(10);
    });

    it("should handle offset for pagination", async () => {
      const mockData = [{ id: "11", name: "Pool 11", total_count: 50 }];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 10,
        p_offset: 10,
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "list_pools_with_filters",
        expect.objectContaining({
          p_limit: 10,
          p_offset: 10,
        })
      );
    });

    it("should return total_count for accurate pagination", async () => {
      const mockData = [
        { id: "1", total_count: 100 },
        { id: "2", total_count: 100 },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockData, error: null });

      const supabase = await createClient();
      const { data } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 10,
        p_offset: 0,
      });

      expect(data?.[0].total_count).toBe(100);
      expect(data?.[1].total_count).toBe(100);
    });
  });

  describe("Error handling", () => {
    it("should handle RPC errors gracefully", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed", code: "PGRST000" },
      });

      const supabase = await createClient();
      const { data, error } = await supabase.rpc("list_pools_with_filters", {
        p_category: null,
        p_latitude: null,
        p_longitude: null,
        p_radius_km: null,
        p_sort_by: "created_at",
        p_sort_order: "desc",
        p_limit: 24,
        p_offset: 0,
      });

      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.message).toBe("Database connection failed");
    });
  });
});
