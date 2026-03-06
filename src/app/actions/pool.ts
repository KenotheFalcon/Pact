"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ApiResponse,
  AuthenticationError,
  formatError,
} from "@/lib/utils/error-handling";
import { PactService } from "@/services/pact.service";
import { getErrorMessage } from "@/lib/api/responses";

export async function joinPool(
  poolId: string,
  quantity: number
): Promise<ApiResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError("Please log in to join a pool");
    }

    const result = await PactService.joinPool(
      poolId,
      user.id,
      quantity,
      user.email || "customer@example.com"
    );

    return {
      success: true,
      data: {
        authorizationUrl: result.data.authorization_url,
        reference: result.reference,
      },
    };
  } catch (error: unknown) {
    console.error("Join pool error:", error);
    return formatError(error);
  }
}

export async function createPool(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const listingId = formData.get("listingId") as string;
  const minQuantity = Number(formData.get("minQuantity"));
  const expiresAt = formData.get("expiresAt") as string;
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  if (!listingId || !minQuantity || !expiresAt) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    const pool = await PactService.createPool({
      listingId,
      leaderId: user.id,
      minQuantity,
      expiresAt,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
    });

    revalidatePath("/marketplace");
    revalidatePath("/farmer/pools");
    return { success: true, poolId: pool.id };
  } catch (error: unknown) {
    console.error("Error creating pool:", error);
    return { success: false, error: getErrorMessage(error, "Failed to create pool") };
  }
}
