import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactSubmissions } from "@/components/admin/contact-submissions"
import { AnimatedAdminContent } from "@/components/admin/AnimatedAdminContent"
import { StatCard, StatGrid } from "@/components/ui/stat-card"
import {
  releaseFunds,
  toggleVerification,
  updateUserRole,
} from "./actions"
import { getAdminStats, verifyAdminAccess } from "@/lib/auth/admin-utils"
import type { ContactSubmission, Profile } from "@/types/database"
import { Users, Package, TrendingUp, ShoppingCart, AlertTriangle, ArrowLeft } from "lucide-react"

const CONTACT_SUBMISSION_FIELDS = `
  id,
  user_id,
  name,
  email,
  subject,
  message,
  status,
  admin_notes,
  resolved_by,
  resolved_at,
  created_at,
  updated_at
`

const USER_FIELDS = "id, email, role, full_name, display_name, is_verified"

type AdminUser = Pick<Profile, "id" | "email" | "role" | "full_name" | "display_name" | "is_verified">

export default async function AdminPage() {
  const { supabase, userId: adminId } = await verifyAdminAccess()

  const [
    stats,
    { data: contactSubmissionsData, error: contactSubmissionsError },
    { data: usersData, error: usersError },
  ] = await Promise.all([
    getAdminStats(),
    supabase
      .from("contact_submissions")
      .select(CONTACT_SUBMISSION_FIELDS)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select(USER_FIELDS)
      .order("created_at", { ascending: false }),
  ])

  if (contactSubmissionsError) {
    throw new Error(`Failed to load contact submissions: ${contactSubmissionsError.message}`)
  }

  if (usersError) {
    throw new Error(`Failed to load users: ${usersError.message}`)
  }

  const contactSubmissions = (contactSubmissionsData ?? []) as ContactSubmission[]
  const users = (usersData ?? []) as AdminUser[]

  // Calculate some trends (mock data for now)
  const pendingSubmissions = contactSubmissions.filter(s => s.status === 'pending').length

  return (
    <AnimatedAdminContent className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, listings, pools, and contact submissions
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto gap-2">
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>
        </Button>
      </div>

      {/* Stats Grid using StatCard component */}
      <StatGrid columns={4}>
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend="up"
          trendValue={`${stats.totalBuyers} buyers · ${stats.totalFarmers} farmers`}
        />
        <StatCard
          label="Active Listings"
          value={stats.activeListings}
          icon={Package}
          trend="up"
          trendValue={`${stats.verifiedFarmers} verified farmers`}
        />
        <StatCard
          label="Active Pools"
          value={stats.activePools}
          icon={ShoppingCart}
          trend="neutral"
          trendValue={`${stats.totalOrders} total orders`}
        />
        <StatCard
          label="Platform Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          trendValue="From paid orders"
        />
      </StatGrid>

      {/* Quick Actions */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="destructive" asChild className="gap-2">
              <Link href="/admin/disputes">
                <AlertTriangle className="h-4 w-4" />
                Manage Disputes
              </Link>
            </Button>
            <form action={releaseFunds}>
              <Button className="bg-pact-green hover:bg-pact-green/90 gap-2" type="submit">
                <TrendingUp className="h-4 w-4" />
                Release Funds
              </Button>
            </form>
            <Button variant="outline" asChild>
              <Link href="/admin/payouts">View Payouts</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/listings">Moderate Listings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Submissions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Contact Submissions</h2>
          {pendingSubmissions > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              {pendingSubmissions} pending
            </Badge>
          )}
        </div>
        <Suspense
          fallback={
            <Card className="rounded-2xl">
              <CardContent className="py-6 text-sm text-muted-foreground">
                Loading contact submissions…
              </CardContent>
            </Card>
          }
        >
          {contactSubmissions.length > 0 ? (
            <ContactSubmissions submissions={contactSubmissions} />
          ) : (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No contact submissions yet
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>

      {/* User Management */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Promote admins, verify farmers, and keep roles accurate
          </p>
        </div>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="font-heading">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="relative w-full overflow-auto hidden md:block">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle font-medium">
                        {user.full_name || user.display_name || "No name"}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">{user.email}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={user.is_verified ? "default" : "secondary"}>
                          {user.is_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex gap-2">
                          {user.role === "farmer" && (
                            <form
                              action={toggleVerification.bind(null, user.id, user.is_verified)}
                            >
                              <Button size="sm" variant="outline">
                                {user.is_verified ? "Revoke" : "Verify"}
                              </Button>
                            </form>
                          )}
                          {user.id !== adminId && (
                            <form
                              action={updateUserRole.bind(
                                null,
                                user.id,
                                user.role === "admin" ? "buyer" : "admin"
                              )}
                            >
                              <Button size="sm" variant="ghost">
                                {user.role === "admin" ? "Demote" : "Make Admin"}
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
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.full_name || user.display_name || "No name"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                      {user.role}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={user.is_verified ? "default" : "secondary"}>
                      {user.is_verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {user.role === "farmer" && (
                      <form
                        action={toggleVerification.bind(null, user.id, user.is_verified)}
                      >
                        <Button size="sm" variant="outline" className="h-9">
                          {user.is_verified ? "Revoke" : "Verify"}
                        </Button>
                      </form>
                    )}
                    {user.id !== adminId && (
                      <form
                        action={updateUserRole.bind(
                          null,
                          user.id,
                          user.role === "admin" ? "buyer" : "admin"
                        )}
                      >
                        <Button size="sm" variant="ghost" className="h-9">
                          {user.role === "admin" ? "Demote" : "Make Admin"}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimatedAdminContent>
  )
}
