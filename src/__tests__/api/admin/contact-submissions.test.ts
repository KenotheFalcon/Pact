/**
 * Tests for admin contact submissions API
 * Validates filtering, search, triage workflow
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { GET, PATCH } from '@/app/api/admin/contact-submissions/route'

jest.mock('@/lib/supabase/server')

describe('Admin Contact Submissions API', () => {
  const mockAdminId = 'admin-123'
  const mockSubmissions = [
    {
      id: 'sub-1',
      email: 'user@example.com',
      subject: 'Bug in payment flow',
      message: 'Payment verification seems broken',
      status: 'new',
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-01T10:00:00Z',
      admin_notes: null,
      resolved_by: null,
      resolved_at: null
    },
    {
      id: 'sub-2',
      email: 'farmer@example.com',
      subject: 'Pool listing issue',
      message: 'Cannot update my pool parameters',
      status: 'in_progress',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T09:30:00Z',
      admin_notes: 'Investigating database query',
      resolved_by: mockAdminId,
      resolved_at: null
    },
    {
      id: 'sub-3',
      email: 'spam@example.com',
      subject: 'Buy cheap followers',
      message: 'Click here for cheap engagement',
      status: 'spam',
      created_at: '2026-01-01T08:00:00Z',
      updated_at: '2026-01-01T08:15:00Z',
      admin_notes: 'Marked as spam',
      resolved_by: mockAdminId,
      resolved_at: '2026-01-01T08:15:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/admin/contact-submissions', () => {
    it('should return all submissions with status counts', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockAdminId } },
            error: null
          })
        },
        rpc: jest.fn((name: string) => {
          if (name === 'get_user_role') {
            return Promise.resolve({ data: 'admin', error: null })
          }
          return Promise.resolve({ data: null, error: null })
        }),
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockSubmissions,
            error: null,
            count: 3
          })
        }))
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/admin/contact-submissions', {
        headers: { authorization: 'Bearer token' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.submissions).toHaveLength(3)
      expect(data.statusCounts).toEqual({
        new: 1,
        in_progress: 1,
        resolved: 0,
        spam: 1
      })
    })

    it('should filter submissions by status', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockAdminId } },
            error: null
          })
        },
        rpc: jest.fn().mockResolvedValue({ data: 'admin', error: null }),
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [mockSubmissions[0]], // Only 'new' status
            error: null,
            count: 1
          })
        }))
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request(
        'http://localhost/api/admin/contact-submissions?status=new',
        { headers: { authorization: 'Bearer token' } }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.submissions).toHaveLength(1)
      expect(data.submissions[0].status).toBe('new')
    })

    it('should search submissions by email, subject, or message', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockAdminId } },
            error: null
          })
        },
        rpc: jest.fn().mockResolvedValue({ data: 'admin', error: null }),
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [mockSubmissions[0]], // Payment-related bug
            error: null,
            count: 1
          })
        }))
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request(
        'http://localhost/api/admin/contact-submissions?search=payment',
        { headers: { authorization: 'Bearer token' } }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.submissions).toHaveLength(1)
      expect(data.submissions[0].subject).toContain('payment')
    })

    it('should handle pagination', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockAdminId } },
            error: null
          })
        },
        rpc: jest.fn().mockResolvedValue({ data: 'admin', error: null }),
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn((from: number, to: number) => {
            expect(from).toBe(0)
            expect(to).toBe(9) // 10 items per page
            return Promise.resolve({
              data: mockSubmissions,
              error: null,
              count: 3
            })
          })
        }))
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request(
        'http://localhost/api/admin/contact-submissions?limit=10&offset=0',
        { headers: { authorization: 'Bearer token' } }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.pagination.total).toBe(3)
    })

    it('should reject non-admin users', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        rpc: jest.fn().mockResolvedValue({ data: 'buyer', error: null })
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/admin/contact-submissions', {
        headers: { authorization: 'Bearer token' }
      })

      const response = await GET(request)

      expect(response.status).toBe(403)
    })
  })

  describe('PATCH /api/admin/contact-submissions', () => {
    it('should update submission status and notes', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockAdminId } },
            error: null
          })
        },
        rpc: jest.fn((name: string) => {
          if (name === 'get_user_role') {
            return Promise.resolve({ data: 'admin', error: null })
          }
        }),
        from: jest.fn(() => ({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: {
              ...mockSubmissions[0],
              status: 'in_progress',
              admin_notes: 'Investigating issue',
              resolved_by: mockAdminId
            },
            error: null
          })
        }))
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/admin/contact-submissions', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token'
        },
        body: JSON.stringify({
          id: 'sub-1',
          status: 'in_progress',
          admin_notes: 'Investigating issue'
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.submission.status).toBe('in_progress')
      expect(data.submission.admin_notes).toBe('Investigating issue')
    })

    it('should auto-set resolved_by and resolved_at when marking resolved', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const now = new Date().toISOString()

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockAdminId } },
            error: null
          })
        },
        rpc: jest.fn((name: string) => {
          if (name === 'get_user_role') {
            return Promise.resolve({ data: 'admin', error: null })
          }
        }),
        from: jest.fn(() => ({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: {
              ...mockSubmissions[0],
              status: 'resolved',
              resolved_by: mockAdminId,
              resolved_at: now
            },
            error: null
          })
        }))
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/admin/contact-submissions', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token'
        },
        body: JSON.stringify({
          id: 'sub-1',
          status: 'resolved'
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.submission.status).toBe('resolved')
      expect(data.submission.resolved_by).toBe(mockAdminId)
    })

    it('should allow marking submission as spam', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: mockAdminId } },
            error: null
          })
        },
        rpc: jest.fn((name: string) => {
          if (name === 'get_user_role') {
            return Promise.resolve({ data: 'admin', error: null })
          }
        }),
        from: jest.fn(() => ({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: {
              ...mockSubmissions[2],
              status: 'spam',
              admin_notes: 'Promotional content'
            },
            error: null
          })
        }))
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/admin/contact-submissions', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token'
        },
        body: JSON.stringify({
          id: 'sub-3',
          status: 'spam',
          admin_notes: 'Promotional content'
        })
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.submission.status).toBe('spam')
    })

    it('should reject non-admin updates', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        },
        rpc: jest.fn().mockResolvedValue({ data: 'buyer', error: null })
      } as any

      ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

      const request = new Request('http://localhost/api/admin/contact-submissions', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token'
        },
        body: JSON.stringify({
          id: 'sub-1',
          status: 'in_progress'
        })
      })

      const response = await PATCH(request)

      expect(response.status).toBe(403)
    })
  })
})
