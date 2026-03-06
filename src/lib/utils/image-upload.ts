// Utility functions for Supabase Storage operations

import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "listing-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is not set");
  }
  return url;
}

/**
 * Upload a single image via Supabase Edge Function
 */
export async function uploadImage(
  file: File,
  folder: string = "listings"
): Promise<{ url: string; error?: string }> {
  try {
    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        url: "",
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { url: "", error: "File size exceeds 10MB limit." };
    }

    const supabase = createClient();
    
    // Get the current session to retrieve the JWT token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { url: "", error: "Authentication required. Please log in." };
    }

    // Prepare FormData for the edge function
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prefix", folder);

// Call the image-upload edge function
    const response = await fetch(
      `${getSupabaseUrl()}/functions/v1/image-upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { url: "", error: errorData.error || "Upload failed" };
    }

    const data = await response.json();
    return { url: data.publicUrl };
} catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload image";
    console.error("Upload error:", error);
    return { url: "", error: message };
  }
}

/**
 * Upload multiple images to Supabase Storage (client-side)
 */
export async function uploadImages(
  files: File[],
  folder: string = "listings",
  onProgress?: (uploaded: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(files[i], folder);

    if (result.error) {
      errors.push(`${files[i].name}: ${result.error}`);
    } else {
      urls.push(result.url);
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return { urls, errors };
}

/**
 * Compress and resize image before upload (client-side)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
