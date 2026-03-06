/**
 * Zod validation schemas for admin actions
 * Provides type-safe input validation for all admin operations
 */
import { z } from 'zod'

// Common validation patterns
const uuidSchema = z.string().uuid('Invalid UUID format')
const nonEmptyString = z.string().min(1, 'This field is required')

// Role enum matching database
export const userRoleSchema = z.enum(['buyer', 'farmer', 'admin'], {
  errorMap: () => ({ message: 'Invalid role. Must be buyer, farmer, or admin' }),
})

// Dispute status enum matching database
export const disputeStatusSchema = z.enum(['open', 'under_review', 'resolved', 'rejected'], {
  errorMap: () => ({ message: 'Invalid dispute status' }),
})

// Contact submission status enum matching database
export const contactSubmissionStatusSchema = z.enum(['pending', 'in_progress', 'resolved', 'closed'], {
  errorMap: () => ({ message: 'Invalid contact submission status' }),
})

// Payout status enum matching database
export const payoutStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'], {
  errorMap: () => ({ message: 'Invalid payout status' }),
})

// ============================================
// Admin Action Schemas
// ============================================

/**
 * Schema for resolving a dispute
 */
export const resolveDisputeSchema = z.object({
  disputeId: uuidSchema,
  resolution: nonEmptyString.max(2000, 'Resolution must be 2000 characters or less'),
  status: disputeStatusSchema.optional().default('resolved'),
})

/**
 * Schema for updating dispute status
 */
export const updateDisputeStatusSchema = z.object({
  disputeId: uuidSchema,
  status: disputeStatusSchema,
})

/**
 * Schema for adding a note to a dispute
 */
export const addDisputeNoteSchema = z.object({
  disputeId: uuidSchema,
  note: nonEmptyString.max(2000, 'Note must be 2000 characters or less'),
})

/**
 * Schema for toggling farmer verification
 */
export const toggleVerificationSchema = z.object({
  userId: uuidSchema,
  currentStatus: z.boolean(),
})

/**
 * Schema for updating user role
 */
export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  newRole: userRoleSchema,
})

/**
 * Schema for toggling user suspension
 */
export const toggleUserSuspensionSchema = z.object({
  userId: uuidSchema,
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
})

/**
 * Schema for deleting a listing
 */
export const deleteListingSchema = z.object({
  listingId: uuidSchema,
})

/**
 * Schema for approving a listing
 */
export const approveListingSchema = z.object({
  listingId: uuidSchema,
})

/**
 * Schema for rejecting a listing
 */
export const rejectListingSchema = z.object({
  listingId: uuidSchema,
})

/**
 * Schema for cancelling a pool
 */
export const cancelPoolSchema = z.object({
  poolId: uuidSchema,
})

/**
 * Schema for updating contact submission status
 */
export const updateContactSubmissionStatusSchema = z.object({
  submissionId: uuidSchema,
  status: contactSubmissionStatusSchema,
  adminNotes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
})

/**
 * Schema for deleting a contact submission
 */
export const deleteContactSubmissionSchema = z.object({
  submissionId: uuidSchema,
})

/**
 * Schema for updating payout status
 */
export const updatePayoutStatusSchema = z.object({
  payoutId: uuidSchema,
  status: payoutStatusSchema,
})

// ============================================
// Type exports for use in actions
// ============================================

export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>
export type UpdateDisputeStatusInput = z.infer<typeof updateDisputeStatusSchema>
export type AddDisputeNoteInput = z.infer<typeof addDisputeNoteSchema>
export type ToggleVerificationInput = z.infer<typeof toggleVerificationSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type ToggleUserSuspensionInput = z.infer<typeof toggleUserSuspensionSchema>
export type DeleteListingInput = z.infer<typeof deleteListingSchema>
export type ApproveListingInput = z.infer<typeof approveListingSchema>
export type RejectListingInput = z.infer<typeof rejectListingSchema>
export type CancelPoolInput = z.infer<typeof cancelPoolSchema>
export type UpdateContactSubmissionStatusInput = z.infer<typeof updateContactSubmissionStatusSchema>
export type DeleteContactSubmissionInput = z.infer<typeof deleteContactSubmissionSchema>
export type UpdatePayoutStatusInput = z.infer<typeof updatePayoutStatusSchema>
