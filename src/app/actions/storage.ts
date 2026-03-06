'use server';

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/api/responses";

const BUCKET_NAME = "listing-images";

/**
 * Delete an image from Supabase Storage (server-side)
 */
export async function deleteImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/");
    const filePath = pathParts
      .slice(pathParts.indexOf(BUCKET_NAME) + 1)
      .join("/");

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Delete error:", error);
    return { success: false, error: getErrorMessage(error, "Failed to delete image") };
  }
}

/**
 * Delete multiple images from Supabase Storage (server-side)
 */
export async function deleteImages(
  imageUrls: string[]
): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  for (const url of imageUrls) {
    const result = await deleteImage(url);

    if (result.error) {
      errors.push(`${url}: ${result.error}`);
    } else {
      deleted++;
    }
  }

  return { deleted, errors };
}
