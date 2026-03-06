'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'spam';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
}

export default function AdminContactPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [stats, setStats] = useState({ new: 0, in_progress: 0, resolved: 0, spam: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/admin/contact-submissions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setSubmissions(data.submissions);
      setStats(data.stats);
    } catch {
      // Silent fail - submissions will remain empty
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  async function updateSubmission(id: string, newStatus: string, newNotes?: string) {
    try {
      setUpdating(true);
      const res = await fetch('/api/admin/contact-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          admin_notes: newNotes !== undefined ? newNotes : notes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      await fetchSubmissions();
      setSelectedId(null);
      setNotes('');
    } catch {
      // Silent fail - update unsuccessful
    } finally {
      setUpdating(false);
    }
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    spam: 'bg-red-100 text-red-800',
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="font-heading text-3xl font-bold mb-8">Contact Submissions</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(stats).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize">{status}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Input
          placeholder="Search by name, email, or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="spam">Spam</option>
        </select>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No submissions found</div>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader
                className="pb-3"
                onClick={() =>
                  setExpandedId(expandedId === submission.id ? null : submission.id)
                }
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{submission.name}</h3>
                      <Badge className={statusColors[submission.status]}>
                        {submission.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{submission.subject}</p>
                    <p className="text-xs text-muted-foreground">{submission.email}</p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>

              {expandedId === submission.id && (
                <CardContent className="space-y-4">
                  {/* Message */}
                  <div>
                    <p className="text-sm font-semibold mb-2">Message</p>
                    <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                      {submission.message}
                    </p>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <p className="text-sm font-semibold mb-2">Admin Notes</p>
                    {selectedId === submission.id ? (
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes…"
                        className="w-full p-2 border border-input bg-background rounded text-sm focus:ring-2 focus:ring-pact-green focus:border-transparent"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded min-h-[60px]">
                        {submission.admin_notes || '(no notes)'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {selectedId === submission.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateSubmission(submission.id, submission.status, notes)}
                          disabled={updating}
                        >
                          Save Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedId(null);
                            setNotes('');
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedId(submission.id);
                            setNotes(submission.admin_notes || '');
                          }}
                        >
                          Edit Notes
                        </Button>
                        {submission.status !== 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateSubmission(
                                submission.id,
                                'in_progress',
                                submission.admin_notes ?? undefined
                              )
                            }
                          >
                            Mark In Progress
                          </Button>
                        )}
                        {submission.status !== 'resolved' && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateSubmission(
                                submission.id,
                                'resolved',
                                submission.admin_notes ?? undefined
                              )
                            }
                          >
                            Resolve
                          </Button>
                        )}
                        {submission.status !== 'spam' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateSubmission(
                                submission.id,
                                'spam',
                                submission.admin_notes ?? undefined
                              )
                            }
                          >
                            Mark Spam
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Metadata */}
                  {submission.resolved_at && (
                    <div className="text-xs text-muted-foreground">
                      Resolved on {new Date(submission.resolved_at).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
