'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { ID_DISPLAY_LENGTH } from '@/lib/constants'
import { getStatusColor } from '@/lib/utils/status-colors'

import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { AnimatedOrdersGrid, AnimatedOrderCard } from '@/components/buyer/AnimatedOrdersGrid'

import { History } from 'lucide-react'

type OrderRow = {
  id: string
  buyer_id?: string
  status?: string
  amount?: number
  quantity?: number
  created_at?: string
}

/**
 * Loading skeleton for history
 */
function HistoryLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted animate-pulse rounded-lg w-48" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const [rows, setRows] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRows([])
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('orders')
        .select('id, buyer_id, status, amount, quantity, created_at')
        .eq('buyer_id', user.id)
        .in('status', ['delivered', 'cancelled'])
        .order('created_at', { ascending: false })
      setRows((data as OrderRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <HistoryLoadingSkeleton />
  }

  return (
    <section className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Order History</h1>
        <span className="text-sm text-muted-foreground">
          {rows.length} order{rows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={History}
          title="No history yet"
          description="Completed and cancelled orders will appear here"
          compact
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <AnimatedOrdersGrid className="grid gap-4 md:hidden">
            {rows.map((r) => (
              <AnimatedOrderCard key={r.id}>
                <Card className="border-border hover:shadow-card transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          Order #{r.id.slice(0, ID_DISPLAY_LENGTH)}
                        </p>
                         <p className="font-semibold text-foreground mt-1">
                           ₦{(r.amount ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(r.status ?? 'completed')}`}>
                        {r.status ?? 'completed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Qty: {r.quantity ?? '-'}</span>
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</span>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedOrderCard>
            ))}
          </AnimatedOrdersGrid>

          {/* Desktop List View */}
          <div className="rounded-xl border overflow-hidden hidden md:block bg-card">
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <span className="font-mono text-xs w-24">{r.id.slice(0, ID_DISPLAY_LENGTH)}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(r.status ?? 'completed')}`}>
                    {r.status ?? 'completed'}
                  </span>
                  <span className="text-sm text-muted-foreground w-16 text-center">
                    Qty: {r.quantity ?? '-'}
                  </span>
                   <span className="font-semibold text-pact-green w-32 text-right">
                     ₦{(r.amount ?? 0).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-sm w-28 text-right">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
