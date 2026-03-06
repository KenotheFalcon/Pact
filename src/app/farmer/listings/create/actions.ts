"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { ListingFormData } from "@/types/farmer";

/**
 * Server Action: Create a new listing
 * Handles database insert with farmer auth validation
 * Revalidates farmer dashboard caches
 */
export async function createListingAction(
  formData: Omit<ListingFormData, "images"> & { images: string[] }
) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // 2. Verify farmer role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "farmer") {
      return { success: false, error: "Only farmers can create listings" };
    }

    // 3. Insert listing via admin (to ensure write permission)
    const { data: listing, error: listingError } = await adminSupabase
      .from("listings")
      .insert({
        farmer_id: profile.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price_per_unit: formData.pricePerUnit,
        unit: formData.unit,
        quantity: formData.quantity,
        min_quantity: formData.minQuantity,
        images: formData.images,
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        address: formData.location.address,
        harvest_date: formData.harvestDate,
        expiry_date: formData.expiryDate,
        organic: formData.organic,
        status: "available",
      } as never)
      .select()
      .single();

    if (listingError) {
      console.error("Listing insert error:", listingError);
      return { success: false, error: listingError.message };
    }

    // 4. Revalidate caches
    revalidatePath("/farmer/listings");
    revalidatePath("/marketplace");

    return { success: true, listing };
  } catch (error) {
    console.error("Create listing error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create listing",
    };
  }
}
