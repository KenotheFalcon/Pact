'use client'

import { useEffect, useState, useCallback } from 'react'

import { z } from 'zod'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { getStatusColor } from '@/lib/utils/status-colors'

import type { ReviewRow } from '@/types/supabase'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Textarea } from '@/components/ui/textarea'
import { LoadingButton } from '@/components/ui/loading-button'
import { AnimatedOrdersGrid, AnimatedOrderCard } from '@/components/buyer/AnimatedOrdersGrid'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { Star, MessageSquare, PenLine } from 'lucide-react'

// --- Types ---

type ReviewableOrder = {
  id: string
  listing_id: string | null
  listing_name: string
  farmer_id: string
  quantity: number
  amount: number
  created_at: string
}

// --- Validation ---

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().max(1000, 'Comment must be under 1000 characters').optional(),
})

// --- Sub-components ---

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  )
}

function InteractiveStarRating({
  rating,
  onRate,
}: {
  rating: number
  onRate: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating}/5
        </span>
      )}
    </div>
  )
}

function ReviewsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted animate-pulse rounded-lg w-48" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// --- Review Creation Dialog ---

function WriteReviewDialog({
  reviewableOrders,
  onReviewSubmitted,
}: {
  reviewableOrders: ReviewableOrder[]
  onReviewSubmitted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ReviewableOrder | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setSelectedOrder(null)
    setRating(0)
    setComment('')
  }

  const handleSubmit = async () => {
    if (!selectedOrder) {
      toast.error('Please select an order to review')
      return
    }

    const result = reviewSchema.safeParse({ rating, comment: comment || undefined })
    if (!result.success) {
      toast.error(result.error.errors[0].message)
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to submit a review')
        return
      }

      const { error } = await supabase.from('reviews').insert({
        order_id: selectedOrder.id,
        buyer_id: user.id,
        farmer_id: selectedOrder.farmer_id,
        listing_id: selectedOrder.listing_id,
        rating,
        comment: comment.trim() || null,
      })

      if (error) {
        toast.error('Failed to submit review. Please try again.')
        return
      }

      toast.success('Review submitted successfully!')
      resetForm()
      setOpen(false)
      onReviewSubmitted()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={reviewableOrders.length === 0}>
          <PenLine className="h-4 w-4 mr-1.5" />
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with a completed order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Order selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Order</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {reviewableOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedOrder?.id === order.id
                      ? 'border-pact-green bg-green-50 dark:bg-green-950/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{order.listing_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Qty: {order.quantity} &middot; ₦{(order.amount / 100).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <InteractiveStarRating rating={rating} onRate={setRating} />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Comment <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience with this order?"
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>
            Cancel
          </Button>
          <LoadingButton
            loading={submitting}
            loadingText="Submitting..."
            onClick={handleSubmit}
            disabled={!selectedOrder || rating === 0}
          >
            Submit Review
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Main Page ---

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reviewableOrders, setReviewableOrders] = useState<ReviewableOrder[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setReviews([])
      setReviewableOrders([])
      setLoading(false)
      return
    }

    // Fetch reviews and reviewable orders in parallel
    const [reviewsResult, ordersResult] = await Promise.all([
      supabase
        .from('reviews')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, listing_id, quantity, amount, created_at')
        .eq('buyer_id', user.id)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false }),
    ])

    const fetchedReviews = reviewsResult.data ?? []
    setReviews(fetchedReviews as ReviewRow[])

    // Find orders not yet reviewed
    const reviewedOrderIds = new Set(fetchedReviews.map(r => r.order_id))
    const unreviewedOrders = (ordersResult.data ?? []).filter(o => !reviewedOrderIds.has(o.id))

    // Fetch listing details for unreviewed orders
    const listingIds = Array.from(new Set(
      unreviewedOrders.map(o => o.listing_id).filter((id): id is string => id !== null)
    ))
    let listingMap = new Map<string, { name: string; farmer_id: string }>()

    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from('listings')
        .select('id, name, farmer_id')
        .in('id', listingIds)

      for (const l of listings ?? []) {
        listingMap.set(l.id, { name: l.name, farmer_id: l.farmer_id })
      }
    }

    const reviewable: ReviewableOrder[] = unreviewedOrders
      .map(o => {
        const listing = o.listing_id ? listingMap.get(o.listing_id) : null
        if (!listing) return null
        return {
          id: o.id,
          listing_id: o.listing_id,
          listing_name: listing.name,
          farmer_id: listing.farmer_id,
          quantity: o.quantity ?? 0,
          amount: o.amount ?? 0,
          created_at: o.created_at,
        }
      })
      .filter((o): o is ReviewableOrder => o !== null)

    setReviewableOrders(reviewable)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return <ReviewsLoadingSkeleton />
  }

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Your Reviews</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </span>
          <WriteReviewDialog
            reviewableOrders={reviewableOrders}
            onReviewSubmitted={loadData}
          />
        </div>
      </div>

      {reviewableOrders.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
          You have {reviewableOrders.length} completed order{reviewableOrders.length !== 1 ? 's' : ''} awaiting review.
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="After completing orders, you can leave reviews for farmers here"
          compact
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <AnimatedOrdersGrid className="grid gap-4 md:hidden">
            {reviews.map((r) => (
              <AnimatedOrderCard key={r.id}>
                <Card className="border-border hover:shadow-card transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground mb-1">
                          Order #{r.order_id?.slice(0, 8) ?? 'N/A'}
                        </p>
                        <StarRating rating={r.rating ?? 0} />
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor('completed')}`}>
                        Submitted
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-foreground line-clamp-2 mb-2">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                    </p>
                  </CardContent>
                </Card>
              </AnimatedOrderCard>
            ))}
          </AnimatedOrdersGrid>

          {/* Desktop Table View */}
          <div className="rounded-xl border overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Order</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Rating</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Comment</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.order_id?.slice(0, 8) ?? 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <StarRating rating={r.rating ?? 0} />
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">
                      {r.comment ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
