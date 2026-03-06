'use client'

import { useState } from 'react'

import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { AlertTriangle } from 'lucide-react'

interface ReportIssueButtonProps {
  orderId: string
  orderRef: string
}

const DISPUTE_TYPES = [
  { value: 'quality', label: 'Quality Issue', description: 'Product quality not as described' },
  { value: 'delivery', label: 'Delivery Problem', description: 'Late, damaged, or missing delivery' },
  { value: 'order', label: 'Order Issue', description: 'Wrong quantity or incorrect items' },
  { value: 'other', label: 'Other', description: 'Other issue with this order' },
] as const

const disputeSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(10, 'Please provide more detail (at least 10 characters)').max(2000),
  type: z.enum(['order', 'quality', 'delivery', 'other']),
})

export function ReportIssueButton({ orderId, orderRef }: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>('quality')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setType('quality')
    setSubject('')
    setDescription('')
  }

  const handleSubmit = async () => {
    const result = disputeSchema.safeParse({ subject, description, type })
    if (!result.success) {
      toast.error(result.error.errors[0].message)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          type,
          subject,
          description,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Dispute submitted. Our team will review it shortly.')
        resetForm()
        setOpen(false)
      } else {
        toast.error(json.error || 'Failed to submit dispute')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 px-2">
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Order #{orderRef} &mdash; describe the problem and our team will investigate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Issue type */}
          <div>
            <label className="block text-sm font-medium mb-2">Issue Type</label>
            <div className="grid grid-cols-2 gap-2">
              {DISPUTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`text-left p-2.5 rounded-lg border transition-colors ${
                    type === t.value
                      ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail. Include dates, quantities, or any other relevant information."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {description.length}/2000
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
            disabled={!subject || !description}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Submit Dispute
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
