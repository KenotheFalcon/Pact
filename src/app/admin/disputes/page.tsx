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
import { updateDisputeStatus } from "../actions"
import { verifyAdminAccess } from "@/lib/auth/admin-utils"
import { sanitizeLikePattern } from "@/lib/utils"
import type { DisputeStatus, DisputeType, DisputePriority } from "@/types/database"
import { AlertTriangle, CheckCircle, Clock, Search, XCircle, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Dispute {
  id: string
  subject: string
  description: string
  type: DisputeType
  status: DisputeStatus
  priority: DisputePriority
  resolution: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  reporter: {
    id: string
    display_name: string | null
    email: string
  } | null
  order: {
    id: string
    amount: number
  } | null
  pool: {
    id: string
    listing: {
      name: string
    } | null
  } | null
}

const DISPUTE_FIELDS = `
  id,
  subject,
  description,
  type,
  status,
  priority,
  resolution,
  admin_notes,
  created_at,
  updated_at,
  reporter:profiles!disputes_reporter_id_fkey(
    id,
    display_name,
    email
  ),
  order:orders!disputes_order_id_fkey(
    id,
    amount
  ),
  pool:pools!disputes_pool_id_fkey(
    id,
    listing:listings(name)
  )
`

function getStatusBadgeVariant(status: DisputeStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "open":
      return "destructive"
    case "under_review":
      return "secondary"
    case "resolved":
      return "default"
    case "rejected":
      return "outline"
    default:
      return "outline"
  }
}

function getStatusIcon(status: DisputeStatus) {
  switch (status) {
    case "open":
      return <AlertTriangle className="h-3 w-3" />
    case "under_review":
      return <Clock className="h-3 w-3" />
    case "resolved":
      return <CheckCircle className="h-3 w-3" />
    case "rejected":
      return <XCircle className="h-3 w-3" />
    default:
      return null
  }
}

function getPriorityColor(priority: DisputePriority): string {
  switch (priority) {
    case "urgent":
      return "text-red-600 dark:text-red-400"
    case "high":
      return "text-orange-600 dark:text-orange-400"
    case "medium":
      return "text-amber-600 dark:text-amber-400"
    case "low":
      return "text-green-600 dark:text-green-400"
    default:
      return "text-muted-foreground"
  }
}

function getTypeLabel(type: DisputeType): string {
  switch (type) {
    case "order":
      return "Order Issue"
    case "payout":
      return "Payout Issue"
    case "quality":
      return "Quality Complaint"
    case "delivery":
      return "Delivery Issue"
    case "other":
      return "Other"
    default:
      return type
  }
}

interface DisputesTableProps {
  disputes: Dispute[]
}

function DisputesTable({ disputes }: DisputesTableProps) {
  if (disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No disputes found</p>
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
                Dispute
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Reporter
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Type
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Priority
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
            {disputes.map((dispute) => (
              <tr
                key={dispute.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle">
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-[200px]">{dispute.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {dispute.reporter?.display_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {dispute.reporter?.email}
                    </p>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <Badge variant="outline" className="capitalize">
                    {getTypeLabel(dispute.type)}
                  </Badge>
                </td>
                <td className="p-4 align-middle">
                  <span className={`font-medium capitalize ${getPriorityColor(dispute.priority)}`}>
                    {dispute.priority}
                  </span>
                </td>
                <td className="p-4 align-middle">
                  <Badge
                    variant={getStatusBadgeVariant(dispute.status)}
                    className="flex items-center gap-1 w-fit"
                  >
                    {getStatusIcon(dispute.status)}
                    <span className="capitalize">{dispute.status.replace("_", " ")}</span>
                  </Badge>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    {dispute.status === "open" && (
                      <form action={updateDisputeStatus.bind(null, dispute.id, "under_review")}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          aria-label={`Review dispute: ${dispute.subject}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </form>
                    )}
                    {dispute.status === "under_review" && (
                      <>
                        <form action={updateDisputeStatus.bind(null, dispute.id, "resolved")}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            aria-label={`Resolve dispute: ${dispute.subject}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </form>
                        <form action={updateDisputeStatus.bind(null, dispute.id, "rejected")}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            aria-label={`Reject dispute: ${dispute.subject}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </form>
                      </>
                    )}
                    {(dispute.status === "resolved" || dispute.status === "rejected") && (
                      <form action={updateDisputeStatus.bind(null, dispute.id, "open")}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          aria-label={`Reopen dispute: ${dispute.subject}`}
                        >
                          Reopen
                        </Button>
                      </form>
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
        {disputes.map((dispute) => (
          <Card key={dispute.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{dispute.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {dispute.reporter?.display_name || dispute.reporter?.email || "Unknown"}
                  </p>
                </div>
                <Badge
                  variant={getStatusBadgeVariant(dispute.status)}
                  className="flex items-center gap-1 shrink-0"
                >
                  {getStatusIcon(dispute.status)}
                  <span className="capitalize">{dispute.status.replace("_", " ")}</span>
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm mb-3">
                <Badge variant="outline" className="capitalize">
                  {getTypeLabel(dispute.type)}
                </Badge>
                <span className={`font-medium capitalize ${getPriorityColor(dispute.priority)}`}>
                  {dispute.priority} priority
                </span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {dispute.description}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t">
                {dispute.status === "open" && (
                  <form action={updateDisputeStatus.bind(null, dispute.id, "under_review")} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-10">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </form>
                )}
                {dispute.status === "under_review" && (
                  <>
                    <form action={updateDisputeStatus.bind(null, dispute.id, "resolved")} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10 text-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </form>
                    <form action={updateDisputeStatus.bind(null, dispute.id, "rejected")} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10 text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </form>
                  </>
                )}
                {(dispute.status === "resolved" || dispute.status === "rejected") && (
                  <form action={updateDisputeStatus.bind(null, dispute.id, "open")} className="flex-1">
                    <Button size="sm" variant="ghost" className="w-full h-10">
                      Reopen
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; priority?: string; search?: string }>
}) {
  const { supabase } = await verifyAdminAccess()
  const params = await searchParams

  // Build query with filters
  let query = supabase
    .from("disputes")
    .select(DISPUTE_FIELDS)
    .order("created_at", { ascending: false })

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  if (params.type && params.type !== "all") {
    query = query.eq("type", params.type)
  }

  if (params.priority && params.priority !== "all") {
    query = query.eq("priority", params.priority)
  }

  if (params.search) {
    query = query.ilike("subject", `%${sanitizeLikePattern(params.search)}%`)
  }

  const { data: disputesData, error: disputesError } = await query.limit(100)

  if (disputesError) {
    throw new Error(`Failed to load disputes: ${disputesError.message}`)
  }

  const disputes = (disputesData || []).map((item) => {
    const reporter = Array.isArray(item.reporter) ? item.reporter[0] || null : item.reporter
    const order = Array.isArray(item.order) ? item.order[0] || null : item.order
    const poolData = Array.isArray(item.pool) ? item.pool[0] || null : item.pool
    
    // Handle nested listing inside pool
    let pool = null
    if (poolData) {
      const listing = Array.isArray(poolData.listing) ? poolData.listing[0] || null : poolData.listing
      pool = { ...poolData, listing }
    }
    
    return {
      ...item,
      reporter,
      order,
      pool,
    }
  }) as unknown as Dispute[]

  // Count stats
  const openCount = disputes.filter((d) => d.status === "open").length
  const reviewCount = disputes.filter((d) => d.status === "under_review").length
  const resolvedCount = disputes.filter((d) => d.status === "resolved").length
  const urgentCount = disputes.filter((d) => d.priority === "urgent" && d.status !== "resolved").length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Disputes</h1>
        <p className="text-muted-foreground mt-1">
          Review and resolve user disputes and complaints
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Under Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{reviewCount}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="search" className="text-sm font-medium mb-2 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Search disputes…"
                  defaultValue={params.search || ""}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-36">
              <label htmlFor="status" className="text-sm font-medium mb-2 block">
                Status
              </label>
              <Select name="status" defaultValue={params.status || "all"}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <label htmlFor="type" className="text-sm font-medium mb-2 block">
                Type
              </label>
              <Select name="type" defaultValue={params.type || "all"}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="order">Order Issue</SelectItem>
                  <SelectItem value="payout">Payout Issue</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <label htmlFor="priority" className="text-sm font-medium mb-2 block">
                Priority
              </label>
              <Select name="priority" defaultValue={params.priority || "all"}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="sm:self-end">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Disputes ({disputes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="py-6 text-sm text-muted-foreground">
                Loading disputes...
              </div>
            }
          >
            <DisputesTable disputes={disputes} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
