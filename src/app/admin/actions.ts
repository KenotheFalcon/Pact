"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminAccess } from "@/lib/auth/admin-utils";
import { logStateChange, logSimpleAction } from "@/lib/auth/audit-log";
import {
  resolveDisputeSchema,
  updateDisputeStatusSchema,
  addDisputeNoteSchema,
  toggleVerificationSchema,
  updateUserRoleSchema,
  toggleUserSuspensionSchema,
  deleteListingSchema,
  approveListingSchema,
  rejectListingSchema,
  cancelPoolSchema,
  updateContactSubmissionStatusSchema,
  deleteContactSubmissionSchema,
  updatePayoutStatusSchema,
} from "@/lib/validations/admin";

function buildTimestamp() {
  return new Date().toISOString();
}

/**
 * Release funds for all funded pools (mark as completed)
 */
export async function releaseFunds() {
  const { supabase, userId } = await verifyAdminAccess();

  const { data: pools, error } = await supabase.from("pools").select("id").eq("status", "funded");

  if (error) {
    throw new Error(`Failed to fetch funded pools: ${error.message}`);
  }

  if (!pools?.length) {
    revalidatePath("/admin");
    return;
  }

  for (const pool of pools) {
    const { error: updateError } = await supabase
      .from("pools")
      .update({ status: "completed", updated_at: buildTimestamp() })
      .eq("id", pool.id);

    if (updateError) {
      throw new Error(`Failed to mark pool ${pool.id} as completed: ${updateError.message}`);
    }

    // Log each pool completion
    await logStateChange(
      supabase,
      userId,
      "release_funds",
      "pool",
      pool.id,
      { status: "funded" },
      { status: "completed" }
    );
  }

  revalidatePath("/admin");
}

/**
 * Resolve a dispute with a resolution message
 */
export async function resolveDispute(
  disputeId: string,
  resolution: string,
  status: "open" | "under_review" | "resolved" | "rejected" = "resolved"
) {
  // Validate input
  const result = resolveDisputeSchema.safeParse({ disputeId, resolution, status });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current state for audit log
  const { data: currentDispute } = await supabase
    .from("disputes")
    .select("status, resolution")
    .eq("id", disputeId)
    .single();

  const { error } = await supabase
    .from("disputes")
    .update({
      status,
      resolution,
      resolved_by: userId,
      resolved_at: buildTimestamp(),
      updated_at: buildTimestamp(),
    })
    .eq("id", disputeId);

  if (error) {
    throw new Error(`Failed to resolve dispute: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "resolve_dispute",
    "dispute",
    disputeId,
    { status: currentDispute?.status, resolution: currentDispute?.resolution },
    { status, resolution }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/disputes");
}

/**
 * Update a dispute's status
 */
export async function updateDisputeStatus(disputeId: string, status: "open" | "under_review" | "resolved" | "rejected") {
  // Validate input
  const result = updateDisputeStatusSchema.safeParse({ disputeId, status });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current state for audit log
  const { data: currentDispute } = await supabase
    .from("disputes")
    .select("status")
    .eq("id", disputeId)
    .single();

  const updates: Record<string, unknown> = {
    status,
    updated_at: buildTimestamp(),
  };

  if (status === "resolved" || status === "rejected") {
    updates.resolved_by = userId;
    updates.resolved_at = buildTimestamp();
  }

  const { error } = await supabase.from("disputes").update(updates).eq("id", disputeId);

  if (error) {
    throw new Error(`Failed to update dispute status: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "update_dispute_status",
    "dispute",
    disputeId,
    { status: currentDispute?.status },
    { status }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/disputes");
}

/**
 * Add a note to a dispute
 */
export async function addDisputeNote(disputeId: string, note: string) {
  // Validate input
  const result = addDisputeNoteSchema.safeParse({ disputeId, note });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current state for audit log
  const { data: currentDispute } = await supabase
    .from("disputes")
    .select("admin_notes")
    .eq("id", disputeId)
    .single();

  const { error } = await supabase
    .from("disputes")
    .update({
      admin_notes: note,
      updated_at: buildTimestamp(),
    })
    .eq("id", disputeId);

  if (error) {
    throw new Error(`Failed to add note to dispute: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "add_dispute_note",
    "dispute",
    disputeId,
    { admin_notes: currentDispute?.admin_notes },
    { admin_notes: note }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/disputes");
}

/**
 * Toggle farmer verification status
 */
export async function toggleVerification(userId: string, currentStatus: boolean) {
  // Validate input
  const result = toggleVerificationSchema.safeParse({ userId, currentStatus });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId: adminId } = await verifyAdminAccess();

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: !currentStatus, updated_at: buildTimestamp() })
    .eq("id", userId)
    .eq("role", "farmer");

  if (error) {
    throw new Error(`Failed to update verification: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    adminId,
    "toggle_verification",
    "profile",
    userId,
    { is_verified: currentStatus },
    { is_verified: !currentStatus }
  );

  revalidatePath("/admin");
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: string, newRole: "buyer" | "farmer" | "admin") {
  // Validate input
  const result = updateUserRoleSchema.safeParse({ userId, newRole });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId: adminId } = await verifyAdminAccess();

  if (userId === adminId) {
    throw new Error("Cannot modify your own role");
  }

  // Get current role for audit log
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: buildTimestamp() })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    adminId,
    "update_user_role",
    "profile",
    userId,
    { role: currentProfile?.role },
    { role: newRole }
  );

  revalidatePath("/admin");
}

/**
 * Toggle user suspension status
 */
export async function toggleUserSuspension(userId: string, reason?: string) {
  // Validate input
  const result = toggleUserSuspensionSchema.safeParse({ userId, reason });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId: adminId } = await verifyAdminAccess();

  if (userId === adminId) {
    throw new Error("Cannot suspend your own account");
  }

  // Get current suspension status
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("is_suspended")
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
  }

  const isSuspended = profile?.is_suspended ?? false;

  // Toggle suspension status
  const updates: Record<string, unknown> = {
    is_suspended: !isSuspended,
    updated_at: buildTimestamp(),
  };

  if (!isSuspended) {
    // Suspending the user
    updates.suspended_at = buildTimestamp();
    updates.suspended_by = adminId;
    updates.suspension_reason = reason || "Suspended by admin";
  } else {
    // Unsuspending the user
    updates.suspended_at = null;
    updates.suspended_by = null;
    updates.suspension_reason = null;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);

  if (error) {
    throw new Error(`Failed to update suspension status: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    adminId,
    isSuspended ? "unsuspend_user" : "suspend_user",
    "profile",
    userId,
    { is_suspended: isSuspended },
    { is_suspended: !isSuspended, reason: !isSuspended ? (reason || "Suspended by admin") : null }
  );

  revalidatePath("/admin");
}

/**
 * Delete a listing
 */
export async function deleteListing(listingId: string) {
  // Validate input
  const result = deleteListingSchema.safeParse({ listingId });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get listing info for audit log
  const { data: listing } = await supabase
    .from("listings")
    .select("name, farmer_id, status")
    .eq("id", listingId)
    .single();

  const { error } = await supabase.from("listings").delete().eq("id", listingId);

  if (error) {
    throw new Error(`Failed to delete listing: ${error.message}`);
  }

  // Log the action
  await logSimpleAction(
    supabase,
    userId,
    "delete_listing",
    "listing",
    listingId,
    { name: listing?.name, farmer_id: listing?.farmer_id, previous_status: listing?.status }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
}

/**
 * Approve a listing
 */
export async function approveListing(listingId: string) {
  // Validate input
  const result = approveListingSchema.safeParse({ listingId });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current status for audit log
  const { data: listing } = await supabase
    .from("listings")
    .select("status")
    .eq("id", listingId)
    .single();

  const { error } = await supabase
    .from("listings")
    .update({ status: "active", updated_at: buildTimestamp() })
    .eq("id", listingId);

  if (error) {
    throw new Error(`Failed to approve listing: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "approve_listing",
    "listing",
    listingId,
    { status: listing?.status },
    { status: "active" }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
}

/**
 * Reject a listing
 */
export async function rejectListing(listingId: string) {
  // Validate input
  const result = rejectListingSchema.safeParse({ listingId });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current status for audit log
  const { data: listing } = await supabase
    .from("listings")
    .select("status")
    .eq("id", listingId)
    .single();

  const { error } = await supabase
    .from("listings")
    .update({ status: "rejected", updated_at: buildTimestamp() })
    .eq("id", listingId);

  if (error) {
    throw new Error(`Failed to reject listing: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "reject_listing",
    "listing",
    listingId,
    { status: listing?.status },
    { status: "rejected" }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/marketplace");
}

/**
 * Cancel a pool
 */
export async function cancelPool(poolId: string) {
  // Validate input
  const result = cancelPoolSchema.safeParse({ poolId });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current status for audit log
  const { data: pool } = await supabase
    .from("pools")
    .select("status")
    .eq("id", poolId)
    .single();

  const { error } = await supabase
    .from("pools")
    .update({ status: "cancelled", updated_at: buildTimestamp() })
    .eq("id", poolId);

  if (error) {
    throw new Error(`Failed to cancel pool: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "cancel_pool",
    "pool",
    poolId,
    { status: pool?.status },
    { status: "cancelled" }
  );

  revalidatePath("/admin");
}

/**
 * Update contact submission status
 */
export async function updateContactSubmissionStatus(
  submissionId: string,
  status: "pending" | "in_progress" | "resolved" | "closed",
  adminNotes?: string
) {
  // Validate input
  const result = updateContactSubmissionStatusSchema.safeParse({ submissionId, status, adminNotes });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current state for audit log
  const { data: currentSubmission } = await supabase
    .from("contact_submissions")
    .select("status, admin_notes")
    .eq("id", submissionId)
    .single();

  const updates: Record<string, unknown> = {
    status,
    updated_at: buildTimestamp(),
  };

  if (status === "resolved" || status === "closed") {
    updates.resolved_by = userId;
    updates.resolved_at = buildTimestamp();
  }

  if (adminNotes !== undefined) {
    updates.admin_notes = adminNotes;
  }

  const { error } = await supabase
    .from("contact_submissions")
    .update(updates)
    .eq("id", submissionId);

  if (error) {
    throw new Error(`Failed to update contact submission: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "update_contact_submission",
    "contact_submission",
    submissionId,
    { status: currentSubmission?.status, admin_notes: currentSubmission?.admin_notes },
    { status, admin_notes: adminNotes }
  );

  revalidatePath("/admin");
}

/**
 * Delete a contact submission
 */
export async function deleteContactSubmission(submissionId: string) {
  // Validate input
  const result = deleteContactSubmissionSchema.safeParse({ submissionId });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get submission info for audit log
  const { data: submission } = await supabase
    .from("contact_submissions")
    .select("name, email, subject, status")
    .eq("id", submissionId)
    .single();

  const { error } = await supabase.from("contact_submissions").delete().eq("id", submissionId);

  if (error) {
    throw new Error(`Failed to delete contact submission: ${error.message}`);
  }

  // Log the action
  await logSimpleAction(
    supabase,
    userId,
    "delete_contact_submission",
    "contact_submission",
    submissionId,
    { name: submission?.name, email: submission?.email, subject: submission?.subject, previous_status: submission?.status }
  );

  revalidatePath("/admin");
}

/**
 * Update payout status
 */
export async function updatePayoutStatus(payoutId: string, status: "pending" | "processing" | "completed" | "failed") {
  // Validate input
  const result = updatePayoutStatusSchema.safeParse({ payoutId, status });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const { supabase, userId } = await verifyAdminAccess();

  // Get current status for audit log
  const { data: payout } = await supabase
    .from("payouts")
    .select("status")
    .eq("id", payoutId)
    .single();

  const updates: Record<string, unknown> = {
    status,
    updated_at: buildTimestamp(),
  };

  if (status === "completed") {
    updates.paid_at = buildTimestamp();
  }

  const { error } = await supabase.from("payouts").update(updates).eq("id", payoutId);

  if (error) {
    throw new Error(`Failed to update payout status: ${error.message}`);
  }

  // Log the action
  await logStateChange(
    supabase,
    userId,
    "update_payout_status",
    "payout",
    payoutId,
    { status: payout?.status },
    { status }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/payouts");
}

/**
 * Process all pending payouts (mark as processing)
 */
export async function processAllPendingPayouts() {
  const { supabase, userId } = await verifyAdminAccess();

  const { data: pendingPayouts, error: fetchError } = await supabase
    .from("payouts")
    .select("id")
    .eq("status", "pending");

  if (fetchError) {
    throw new Error(`Failed to fetch pending payouts: ${fetchError.message}`);
  }

  if (!pendingPayouts?.length) {
    revalidatePath("/admin");
    revalidatePath("/admin/payouts");
    return;
  }

  // Mark all as processing
  const { error: updateError } = await supabase
    .from("payouts")
    .update({ status: "processing", updated_at: buildTimestamp() })
    .eq("status", "pending");

  if (updateError) {
    throw new Error(`Failed to update payouts: ${updateError.message}`);
  }

  // Log the batch action
  await logSimpleAction(
    supabase,
    userId,
    "process_all_payouts",
    "payout",
    undefined,
    { count: pendingPayouts.length, payout_ids: pendingPayouts.map((p) => p.id) }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/payouts");
}
