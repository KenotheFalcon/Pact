import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updatePayoutStatus, processAllPendingPayouts } from "../actions"
import { verifyAdminAccess } from "@/lib/auth/admin-utils"
import { sanitizeLikePattern } from "@/lib/utils"
import type { PayoutStatus } from "@/types/database"
import {
  Banknote,
  CheckCircle,
  Clock,
  Search,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Payout {
  id: string
  amount: number
  platform_fee: number
  reference: string
  status: PayoutStatus
  paid_at: string | null
  created_at: string
  updated_at: string
  farmer: {
    id: string
    display_name: string | null
    email: string
  } | null
  pool: {
    id: string
    listing: {
      name: string
    } | null
  } | null
}

const PAYOUT_FIELDS = `
  id,
  amount,
  platform_fee,
  reference,
  status,
  paid_at,
  created_at,
  updated_at,
  farmer:profiles!payouts_farmer_id_fkey(
    id,
    display_name,
    email
  ),
  pool:pools!payouts_pool_id_fkey(
    id,
    listing:listings(name)
  )
`

function getStatusBadgeVariant(status: PayoutStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default"
    case "processing":
      return "secondary"
    case "pending":
      return "outline"
    case "failed":
      return "destructive"
    default:
      return "outline"
  }
}

function getStatusIcon(status: PayoutStatus) {
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3" />
    case "processing":
      return <Loader2 className="h-3 w-3 animate-spin" />
    case "completed":
      return <CheckCircle className="h-3 w-3" />
    case "failed":
      return <XCircle className="h-3 w-3" />
    default:
      return null
  }
}

interface PayoutsTableProps {
  payouts: Payout[]
}

function PayoutsTable({ payouts }: PayoutsTableProps) {
  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Banknote className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No payouts found</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="relative w-full overflow-auto hidden md:block">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Reference
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Farmer
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Pool / Listing
              </th>
              <th scope="col" className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Amount
              </th>
              <th scope="col" className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                Fee
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Status
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {payouts.map((payout) => (
              <tr
                key={payout.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle">
                  <div className="min-w-0">
                    <p className="font-mono text-sm truncate max-w-[120px]">{payout.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(payout.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {payout.farmer?.display_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {payout.farmer?.email}
                    </p>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <p className="truncate max-w-[150px]">
                    {payout.pool?.listing?.name || "N/A"}
                  </p>
                </td>
                <td className="p-4 align-middle text-right font-medium">
                  ₦{payout.amount.toLocaleString()}
                </td>
                <td className="p-4 align-middle text-right text-muted-foreground">
                  ₦{payout.platform_fee.toLocaleString()}
                </td>
                <td className="p-4 align-middle">
                  <Badge
                    variant={getStatusBadgeVariant(payout.status)}
                    className="flex items-center gap-1 w-fit capitalize"
                  >
                    {getStatusIcon(payout.status)}
                    {payout.status}
                  </Badge>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    {payout.status === "pending" && (
                      <form action={updatePayoutStatus.bind(null, payout.id, "processing")}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          aria-label={`Process payout ${payout.reference}`}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      </form>
                    )}
                    {payout.status === "processing" && (
                      <>
                        <form action={updatePayoutStatus.bind(null, payout.id, "completed")}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            aria-label={`Complete payout ${payout.reference}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        </form>
                        <form action={updatePayoutStatus.bind(null, payout.id, "failed")}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            aria-label={`Fail payout ${payout.reference}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Fail
                          </Button>
                        </form>
                      </>
                    )}
                    {payout.status === "failed" && (
                      <form action={updatePayoutStatus.bind(null, payout.id, "pending")}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          aria-label={`Retry payout ${payout.reference}`}
                        >
                          Retry
                        </Button>
                      </form>
                    )}
                    {payout.status === "completed" && (
                      <span className="text-xs text-muted-foreground">
                        Paid {payout.paid_at ? formatDistanceToNow(new Date(payout.paid_at), { addSuffix: true }) : ""}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {payouts.map((payout) => (
          <Card key={payout.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm truncate">{payout.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    {payout.farmer?.display_name || payout.farmer?.email || "Unknown"}
                  </p>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(payout.status)}
                  className="flex items-center gap-1 shrink-0 capitalize"
                >
                  {getStatusIcon(payout.status)}
                  {payout.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {payout.pool?.listing?.name || "N/A"}
                </span>
                <div className="text-right">
                  <p className="font-medium">₦{payout.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    Fee: ₦{payout.platform_fee.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                {payout.status === "pending" && (
                  <form action={updatePayoutStatus.bind(null, payout.id, "processing")} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-10">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Process
                    </Button>
                  </form>
                )}
                {payout.status === "processing" && (
                  <>
                    <form action={updatePayoutStatus.bind(null, payout.id, "completed")} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10 text-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    </form>
                    <form action={updatePayoutStatus.bind(null, payout.id, "failed")} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10 text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Fail
                      </Button>
                    </form>
                  </>
                )}
                {payout.status === "failed" && (
                  <form action={updatePayoutStatus.bind(null, payout.id, "pending")} className="flex-1">
                    <Button size="sm" variant="ghost" className="w-full h-10">
                      Retry
                    </Button>
                  </form>
                )}
                {payout.status === "completed" && payout.paid_at && (
                  <p className="text-xs text-muted-foreground w-full text-center">
                    Paid {formatDistanceToNow(new Date(payout.paid_at), { addSuffix: true })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const { supabase } = await verifyAdminAccess()
  const params = await searchParams

  // Build query with filters
  let query = supabase
    .from("payouts")
    .select(PAYOUT_FIELDS)
    .order("created_at", { ascending: false })

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  if (params.search) {
    query = query.ilike("reference", `%${sanitizeLikePattern(params.search)}%`)
  }

  const { data: payoutsData, error: payoutsError } = await query.limit(100)

  if (payoutsError) {
    throw new Error(`Failed to load payouts: ${payoutsError.message}`)
  }

  const payouts = (payoutsData || []).map((item) => {
    const farmer = Array.isArray(item.farmer) ? item.farmer[0] || null : item.farmer
    const poolData = Array.isArray(item.pool) ? item.pool[0] || null : item.pool
    
    // Handle nested listing inside pool
    let pool = null
    if (poolData) {
      const listing = Array.isArray(poolData.listing) ? poolData.listing[0] || null : poolData.listing
      pool = { ...poolData, listing }
    }
    
    return {
      ...item,
      farmer,
      pool,
    }
  }) as unknown as Payout[]

  // Calculate stats
  const pendingCount = payouts.filter((p) => p.status === "pending").length
  const processingCount = payouts.filter((p) => p.status === "processing").length
  const completedCount = payouts.filter((p) => p.status === "completed").length
  const totalPending = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0)
  const totalCompleted = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0)
  const totalFees = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.platform_fee, 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground mt-1">
            Manage farmer payouts and disbursements
          </p>
        </div>
        <form action={processAllPendingPayouts}>
          <Button
            type="submit"
            className="bg-pact-green hover:bg-emerald-600"
            disabled={pendingCount === 0}
          >
            Process All Pending ({pendingCount})
          </Button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₦{totalPending.toLocaleString()} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₦{totalCompleted.toLocaleString()} paid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">from completed payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="search" className="text-sm font-medium mb-2 block">
                Search Reference
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Search by reference…"
                  defaultValue={params.search || ""}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <label htmlFor="status" className="text-sm font-medium mb-2 block">
                Status
              </label>
              <Select name="status" defaultValue={params.status || "all"}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payouts ({payouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="py-6 text-sm text-muted-foreground">
                Loading payouts...
              </div>
            }
          >
            <PayoutsTable payouts={payouts} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
