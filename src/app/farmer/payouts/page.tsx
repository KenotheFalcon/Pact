import { createClient } from '@/lib/supabase/server'
import { requestPayout } from './actions'
import { PayoutStats } from '@/components/farmer/PayoutStats'
import { PayoutChart } from '@/components/farmer/PayoutChart'
import { BankAccountForm } from '@/components/farmer/BankAccountForm'

export default async function PayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div className="p-6">Please log in to view payouts.</div>
  }

  // Fetch payouts
  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch payout stats
  const { data: stats } = await supabase
    .from('farmer_payout_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch monthly earnings for chart
  const { data: monthlyEarnings } = await supabase
    .rpc('get_farmer_monthly_earnings', { p_user_id: user.id, p_months: 6 })

  // Fetch bank accounts
  const { data: bankAccounts } = await supabase
    .from('farmer_bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  const defaultAccount = bankAccounts?.find(a => a.is_default) || bankAccounts?.[0]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Payouts</h1>
        <span className="text-sm text-muted-foreground">
          All amounts in Nigerian Naira (₦)
        </span>
      </div>

      {/* Stats Cards */}
      <PayoutStats 
        totalEarned={(stats?.total_earned || 0) / 100}
        pendingAmount={(stats?.pending_amount || 0) / 100}
        thisMonthEarned={(stats?.this_month_earned || 0) / 100}
        lastMonthEarned={(stats?.last_month_earned || 0) / 100}
        completedCount={stats?.completed_count || 0}
        pendingCount={stats?.pending_count || 0}
      />

      {/* Earnings Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-4">Earnings Overview</h2>
          <PayoutChart data={monthlyEarnings || []} />
        </div>

        {/* Bank Account Management */}
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-4">Bank Account</h2>
          <BankAccountForm 
            defaultAccount={defaultAccount}
            allAccounts={bankAccounts || []}
          />
        </div>
      </div>

      {/* Request Payout Form */}
      <div className="border rounded-lg p-4 bg-card">
        <h2 className="text-lg font-medium mb-4">Request Payout</h2>
        <form action={requestPayout} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₦)</label>
              <input 
                name="amount" 
                type="number" 
                placeholder="Enter amount" 
                className="w-full border rounded-md p-2 bg-background"
                min="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Code</label>
              <input 
                name="bankCode" 
                type="text" 
                placeholder="e.g., 044" 
                defaultValue={defaultAccount?.bank_code || ''}
                className="w-full border rounded-md p-2 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input 
                name="accountNumber" 
                type="text" 
                placeholder="10 digits" 
                defaultValue={defaultAccount?.account_number || ''}
                className="w-full border rounded-md p-2 bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              type="submit" 
              className="bg-pact-green text-white px-6 py-2 rounded-md hover:bg-pact-green/90 transition-colors font-medium"
            >
              Request Payout
            </button>
            {stats?.pending_amount > 0 && (
              <span className="text-sm text-muted-foreground">
                Available: ₦{((stats.pending_amount || 0) / 100).toLocaleString()}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Recent Payouts */}
      <div className="border rounded-lg p-4 bg-card">
        <h2 className="text-lg font-medium mb-4">Recent Payouts</h2>
        <div className="space-y-2">
          {(payouts || []).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No payouts yet. Complete pool sales to start earning!
            </p>
          ) : (
            (payouts || []).map((p: Record<string, unknown>) => (
              <div key={p.id as string} className="border rounded-lg p-3 flex justify-between items-center hover:bg-muted/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : p.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {(p.status as string).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Ref: {(p.reference as string)?.slice(-12)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    ₦{((p.amount as number)/100).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(p.created_at as string).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
