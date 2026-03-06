'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ContactSubmission } from '@/types/database'
import {
  updateContactSubmissionStatus,
  deleteContactSubmission,
} from '@/app/admin/actions'
import { Mail, MessageSquare, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error) return error.message
  return fallback
}

interface ContactSubmissionsProps {
  submissions: ContactSubmission[]
}

export function ContactSubmissions({ submissions }: ContactSubmissionsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const pendingCount = submissions.filter((s) => s.status === 'pending').length
  const resolvedCount = submissions.filter((s) => s.status === 'resolved').length

  const handleStatusUpdate = async (
    submissionId: string,
    status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  ) => {
    try {
      setIsLoading(true)
      await updateContactSubmissionStatus(submissionId, status, adminNotes)
      toast.success(`Submission marked as ${status}`)
      setSelectedSubmission(null)
      setAdminNotes('')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update submission'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return

    try {
      setIsLoading(true)
      await deleteContactSubmission(submissionId)
      toast.success('Submission deleted')
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete submission'))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
      case 'resolved':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      case 'closed':
        return 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
      default:
        return 'bg-background'
    }
  }

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'pending':
        return 'destructive'
      case 'in_progress':
        return 'secondary'
      case 'resolved':
        return 'default'
      case 'closed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contact submissions yet
              </div>
            ) : (
              submissions.map((submission) => (
                <Dialog key={submission.id}>
                  <div className={`p-4 rounded-lg border ${getStatusColor(submission.status)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold truncate">{submission.subject}</h4>
                          <Badge variant={getStatusBadgeVariant(submission.status)}>
                            {submission.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: <a href={`mailto:${submission.email}`} className="hover:underline">{submission.email}</a>
                        </p>
                        {submission.name && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Name: {submission.name}
                          </p>
                        )}
                        <p className="text-sm line-clamp-2 mb-3">{submission.message}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(submission.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(submission.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{submission.subject}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">From</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {submission.name && <span>{submission.name} - </span>}
                          <a href={`mailto:${submission.email}`} className="hover:underline">
                            {submission.email}
                          </a>
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Message</label>
                        <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg whitespace-pre-wrap break-words">
                          {submission.message}
                        </p>
                      </div>

                      <div>
                        <label htmlFor="notes" className="text-sm font-medium">
                          Admin Notes
                        </label>
                        <Textarea
                          id="notes"
                          placeholder="Add internal notes about this submission…"
                          value={adminNotes || submission.admin_notes || ''}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="mt-2"
                          rows={4}
                        />
                      </div>

                      {submission.resolved_at && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Resolved on {new Date(submission.resolved_at).toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => handleStatusUpdate(submission.id, 'in_progress')}
                          disabled={isLoading || submission.status === 'in_progress'}
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          onClick={() => handleStatusUpdate(submission.id, 'resolved')}
                          disabled={isLoading || submission.status === 'resolved'}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
