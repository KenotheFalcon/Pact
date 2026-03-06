import { Suspense } from "react"
import Image from "next/image"
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
import { approveListing, rejectListing, deleteListing } from "../actions"
import { verifyAdminAccess } from "@/lib/auth/admin-utils"
import { sanitizeLikePattern } from "@/lib/utils"
import { Package, Check, X, Trash2, Search } from "lucide-react"

interface Listing {
  id: string
  name: string
  description: string | null
  price_per_unit: number
  unit: string
  quantity: number
  category: string | null
  status: string
  image_url: string | null
  created_at: string
  farmer: {
    id: string
    display_name: string | null
    email: string | null
  } | null
}

const LISTING_FIELDS = `
  id,
  name,
  description,
  price_per_unit,
  unit,
  quantity,
  category,
  status,
  image_url,
  created_at,
  farmer:profiles!listings_farmer_id_fkey(
    id,
    display_name,
    email
  )
`

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "pending":
      return "secondary"
    case "rejected":
      return "destructive"
    default:
      return "outline"
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active"
    case "pending":
      return "Pending Review"
    case "rejected":
      return "Rejected"
    case "sold_out":
      return "Sold Out"
    default:
      return status
  }
}

interface ListingsTableProps {
  listings: Listing[]
}

function ListingsTable({ listings }: ListingsTableProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No listings found</p>
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
                Listing
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Farmer
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Price
              </th>
              <th scope="col" className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Category
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
            {listings.map((listing) => (
              <tr
                key={listing.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {listing.image_url ? (
                        <Image
                          src={listing.image_url}
                          alt={listing.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{listing.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {listing.quantity} {listing.unit}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {listing.farmer?.display_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {listing.farmer?.email}
                    </p>
                  </div>
                </td>
                <td className="p-4 align-middle font-medium">
                  ₦{listing.price_per_unit.toLocaleString()}
                </td>
                <td className="p-4 align-middle">
                  <Badge variant="outline" className="capitalize">
                    {listing.category || "Uncategorized"}
                  </Badge>
                </td>
                <td className="p-4 align-middle">
                  <Badge variant={getStatusBadgeVariant(listing.status)}>
                    {getStatusLabel(listing.status)}
                  </Badge>
                </td>
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    {listing.status === "pending" && (
                      <>
                        <form action={approveListing.bind(null, listing.id)}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            aria-label={`Approve ${listing.name}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </form>
                        <form action={rejectListing.bind(null, listing.id)}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                            aria-label={`Reject ${listing.name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </form>
                      </>
                    )}
                    {listing.status === "rejected" && (
                      <form action={approveListing.bind(null, listing.id)}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                        >
                          Reactivate
                        </Button>
                      </form>
                    )}
                    <form action={deleteListing.bind(null, listing.id)}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        aria-label={`Delete ${listing.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="rounded-lg border bg-card overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {listing.image_url ? (
                    <Image
                      src={listing.image_url}
                      alt={listing.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{listing.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {listing.quantity} {listing.unit}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    ₦{listing.price_per_unit.toLocaleString()}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(listing.status)} className="shrink-0">
                  {getStatusLabel(listing.status)}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="text-muted-foreground truncate">
                    {listing.farmer?.display_name || listing.farmer?.email || "Unknown"}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize shrink-0">
                  {listing.category || "Uncategorized"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                {listing.status === "pending" && (
                  <>
                    <form action={approveListing.bind(null, listing.id)} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </form>
                    <form action={rejectListing.bind(null, listing.id)} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-10 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </form>
                  </>
                )}
                {listing.status === "rejected" && (
                  <form action={approveListing.bind(null, listing.id)} className="flex-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-10 text-green-600 hover:text-green-700"
                    >
                      Reactivate
                    </Button>
                  </form>
                )}
                {listing.status === "active" && (
                  <div className="flex-1 text-center text-sm text-muted-foreground">
                    Active listing
                  </div>
                )}
                <form action={deleteListing.bind(null, listing.id)}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    aria-label={`Delete ${listing.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>
}) {
  const { supabase } = await verifyAdminAccess()
  const params = await searchParams

  // Build query with filters
  let query = supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .order("created_at", { ascending: false })

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category)
  }

  if (params.search) {
    query = query.ilike("name", `%${sanitizeLikePattern(params.search)}%`)
  }

  const { data: listingsData, error: listingsError } = await query.limit(100)

  if (listingsError) {
    throw new Error(`Failed to load listings: ${listingsError.message}`)
  }

  // Get unique categories for filter
  const { data: categoriesData } = await supabase
    .from("listings")
    .select("category")
    .not("category", "is", null)

  const categories = Array.from(new Set((categoriesData || []).map((c) => c.category).filter(Boolean)))

  const listings = (listingsData || []).map((item) => ({
    ...item,
    farmer: Array.isArray(item.farmer) ? item.farmer[0] || null : item.farmer,
  })) as Listing[]

  // Count stats
  const pendingCount = listings.filter((l) => l.status === "pending").length
  const activeCount = listings.filter((l) => l.status === "active").length
  const rejectedCount = listings.filter((l) => l.status === "rejected").length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Listings Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, or reject farmer listings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
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
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Search listings…"
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="sold_out">Sold Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <label htmlFor="category" className="text-sm font-medium mb-2 block">
                Category
              </label>
              <Select name="category" defaultValue={params.category || "all"}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat || ""} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Listings ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="py-6 text-sm text-muted-foreground">
                Loading listings...
              </div>
            }
          >
            <ListingsTable listings={listings} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
