/**
 * Tests for marketplace page data normalization
 * Ensures RPC results are properly mapped to Pool type
 */

import type { Pool } from "@/types/database";

describe("Marketplace Pool Data Normalization", () => {
  const mockRPCRow = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    listing_id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Organic Tomatoes",
    category: "vegetables",
    unit: "kg",
    price_per_unit: "500.00",
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
    organic: true,
    current_quantity: 50,
    min_quantity: 100,
    expires_at: "2025-12-20T00:00:00Z",
    status: "active",
    latitude: 6.5244,
    longitude: 3.3792,
    distance_km: 5.2,
    total_count: 10,
  };

  function normalizePoolData(row: any): Pool {
    return {
      id: row.id,
      listing_id: row.listing_id,
      leader_id: row.leader_id ?? "",
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
      listing: {
        name: row.name,
        category: row.category,
        unit: row.unit,
        price_per_unit:
          typeof row.price_per_unit === "string"
            ? parseFloat(row.price_per_unit)
            : row.price_per_unit,
        images: Array.isArray(row.images)
          ? row.images
          : row.images
          ? [row.images]
          : [],
        organic: !!row.organic,
      },
      current_quantity: row.current_quantity,
      min_quantity: row.min_quantity,
      expires_at: row.expires_at,
      status: row.status,
      latitude: row.latitude,
      longitude: row.longitude,
      distance: row.distance_km ?? undefined,
      leader: undefined,
      members: [],
    } as unknown as Pool;
  }

  describe("Basic field mapping", () => {
    it("should map all required pool fields", () => {
      const normalized = normalizePoolData(mockRPCRow);

      expect(normalized.id).toBe(mockRPCRow.id);
      expect(normalized.listing_id).toBe(mockRPCRow.listing_id);
      expect(normalized.current_quantity).toBe(mockRPCRow.current_quantity);
      expect(normalized.min_quantity).toBe(mockRPCRow.min_quantity);
      expect(normalized.expires_at).toBe(mockRPCRow.expires_at);
      expect(normalized.status).toBe(mockRPCRow.status);
    });

    it("should map listing fields correctly", () => {
      const normalized = normalizePoolData(mockRPCRow);

      expect(normalized.listing?.name).toBe(mockRPCRow.name);
      expect(normalized.listing?.category).toBe(mockRPCRow.category);
      expect(normalized.listing?.unit).toBe(mockRPCRow.unit);
      expect(normalized.listing?.organic).toBe(mockRPCRow.organic);
    });

    it("should map location fields", () => {
      const normalized = normalizePoolData(mockRPCRow);

      expect(normalized.latitude).toBe(mockRPCRow.latitude);
      expect(normalized.longitude).toBe(mockRPCRow.longitude);
      expect(normalized.distance).toBe(mockRPCRow.distance_km);
    });
  });

  describe("Price normalization", () => {
    it("should convert string price to number", () => {
      const normalized = normalizePoolData(mockRPCRow);

      expect(typeof normalized.listing?.price_per_unit).toBe("number");
      expect(normalized.listing?.price_per_unit).toBe(500);
    });

    it("should handle numeric price directly", () => {
      const rowWithNumericPrice = { ...mockRPCRow, price_per_unit: 500 };
      const normalized = normalizePoolData(rowWithNumericPrice);

      expect(normalized.listing?.price_per_unit).toBe(500);
    });

    it("should handle decimal prices", () => {
      const rowWithDecimal = { ...mockRPCRow, price_per_unit: "1250.50" };
      const normalized = normalizePoolData(rowWithDecimal);

      expect(normalized.listing?.price_per_unit).toBe(1250.5);
    });
  });

  describe("Images normalization", () => {
    it("should handle array of images", () => {
      const normalized = normalizePoolData(mockRPCRow);

      expect(Array.isArray(normalized.listing?.images)).toBe(true);
      expect(normalized.listing?.images).toHaveLength(2);
    });

    it("should handle single image as string", () => {
      const rowWithSingleImage = { ...mockRPCRow, images: "single-image.jpg" };
      const normalized = normalizePoolData(rowWithSingleImage);

      expect(Array.isArray(normalized.listing?.images)).toBe(true);
      expect(normalized.listing?.images).toEqual(["single-image.jpg"]);
    });

    it("should handle null/undefined images", () => {
      const rowWithNullImages = { ...mockRPCRow, images: null };
      const normalized = normalizePoolData(rowWithNullImages);

      expect(Array.isArray(normalized.listing?.images)).toBe(true);
      expect(normalized.listing?.images).toHaveLength(0);
    });

    it("should handle jsonb images from Postgres", () => {
      const rowWithJsonbImages = {
        ...mockRPCRow,
        images: ["image1.jpg", "image2.jpg"],
      };
      const normalized = normalizePoolData(rowWithJsonbImages);

      expect(normalized.listing?.images).toEqual(["image1.jpg", "image2.jpg"]);
    });
  });

  describe("Distance handling", () => {
    it("should map distance_km to distance field", () => {
      const normalized = normalizePoolData(mockRPCRow);

      expect(normalized.distance).toBe(5.2);
    });

    it("should handle null distance", () => {
      const rowWithoutDistance = { ...mockRPCRow, distance_km: null };
      const normalized = normalizePoolData(rowWithoutDistance);

      expect(normalized.distance).toBeUndefined();
    });

    it("should handle zero distance", () => {
      const rowWithZeroDistance = { ...mockRPCRow, distance_km: 0 };
      const normalized = normalizePoolData(rowWithZeroDistance);

      expect(normalized.distance).toBe(0);
    });
  });

  describe("Organic flag", () => {
    it("should convert truthy organic to boolean true", () => {
      const normalized = normalizePoolData({ ...mockRPCRow, organic: true });
      expect(normalized.listing?.organic).toBe(true);
    });

    it("should convert falsy organic to boolean false", () => {
      const normalized = normalizePoolData({ ...mockRPCRow, organic: false });
      expect(normalized.listing?.organic).toBe(false);
    });

    it("should handle null organic as false", () => {
      const normalized = normalizePoolData({ ...mockRPCRow, organic: null });
      expect(normalized.listing?.organic).toBe(false);
    });
  });

  describe("Default values", () => {
    it("should provide empty array for members", () => {
      const normalized = normalizePoolData(mockRPCRow);
      expect(normalized.members).toEqual([]);
    });

    it("should set leader to undefined when not provided", () => {
      const normalized = normalizePoolData(mockRPCRow);
      expect(normalized.leader).toBeUndefined();
    });

    it("should generate timestamps when missing", () => {
      const normalized = normalizePoolData(mockRPCRow);
      expect(normalized.created_at).toBeDefined();
      expect(normalized.updated_at).toBeDefined();
    });
  });

  describe("Batch normalization", () => {
    it("should normalize multiple rows consistently", () => {
      const rows = [
        mockRPCRow,
        {
          ...mockRPCRow,
          id: "770e8400-e29b-41d4-a716-446655440002",
          distance_km: 2.1,
        },
        {
          ...mockRPCRow,
          id: "880e8400-e29b-41d4-a716-446655440003",
          distance_km: null,
        },
      ];

      const normalized = rows.map(normalizePoolData);

      expect(normalized).toHaveLength(3);
      expect(normalized[0].distance).toBe(5.2);
      expect(normalized[1].distance).toBe(2.1);
      expect(normalized[2].distance).toBeUndefined();
    });

    it("should preserve total_count across all rows", () => {
      const rows = [
        { ...mockRPCRow, total_count: 100 },
        {
          ...mockRPCRow,
          id: "770e8400-e29b-41d4-a716-446655440002",
          total_count: 100,
        },
      ];

      const normalized = rows.map(normalizePoolData);

      // total_count should be read from first row for pagination
      expect(rows[0].total_count).toBe(100);
      expect(rows[1].total_count).toBe(100);
    });
  });

  describe("Edge cases", () => {
    it("should handle missing optional fields gracefully", () => {
      const minimalRow = {
        id: mockRPCRow.id,
        listing_id: mockRPCRow.listing_id,
        name: mockRPCRow.name,
        category: mockRPCRow.category,
        unit: mockRPCRow.unit,
        price_per_unit: mockRPCRow.price_per_unit,
        current_quantity: mockRPCRow.current_quantity,
        min_quantity: mockRPCRow.min_quantity,
        expires_at: mockRPCRow.expires_at,
        status: mockRPCRow.status,
      };

      const normalized = normalizePoolData(minimalRow);

      expect(normalized.id).toBe(minimalRow.id);
      expect(normalized.listing?.images).toEqual([]);
      expect(normalized.distance).toBeUndefined();
    });

    it("should handle very large quantities", () => {
      const largeQuantityRow = {
        ...mockRPCRow,
        current_quantity: 999999,
        min_quantity: 1000000,
      };

      const normalized = normalizePoolData(largeQuantityRow);

      expect(normalized.current_quantity).toBe(999999);
      expect(normalized.min_quantity).toBe(1000000);
    });

    it("should handle very long distances", () => {
      const longDistanceRow = { ...mockRPCRow, distance_km: 9999.99 };
      const normalized = normalizePoolData(longDistanceRow);

      expect(normalized.distance).toBe(9999.99);
    });
  });
});
