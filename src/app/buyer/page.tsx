import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedOrdersGrid, AnimatedOrderCard } from "@/components/buyer/AnimatedOrdersGrid"
import { Order, Listing, Pool } from "@/types/database"

type OrderWithDetails = Order & {
  listing?: Pick<Listing, "id" | "name" | "images" | "unit"> | null
  pool?: Pick<Pool, "id" | "status" | "expires_at"> | null
}

export default async function BuyerDashboard() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      listing:listings!orders_listing_id_fkey (
        id,
        name,
        images,
        unit
      ),
      pool:pools!orders_pool_id_fkey (
        id,
        status,
        expires_at
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="font-heading text-3xl font-bold text-foreground">My Orders</h1>
            <Button asChild className="bg-pact-green hover:bg-pact-green/90">
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </div>

          {orders && orders.length > 0 ? (
            <AnimatedOrdersGrid className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order: OrderWithDetails) => {
            const title = order.listing?.name || "Listing"
            const unit = order.listing?.unit || "unit"
            const image = order.listing?.images?.[0] || "/placeholder-produce.jpg"

            return (
            <AnimatedOrderCard key={order.id}>
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {title}
                </CardTitle>
                <Badge variant={order.payment_status === 'paid' ? 'success' : 'secondary'}>
                  {order.payment_status}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex gap-4 items-center mt-2">
                  <div className="relative h-16 w-16 rounded overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={title}
                      className="object-cover h-full w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Quantity: {order.quantity} {unit}s
                    </p>
                    <p className="text-lg font-bold text-pact-green">
                      ₦{order.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </AnimatedOrderCard>
            )
          })}
        </AnimatedOrdersGrid>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-muted-foreground text-lg">You haven&apos;t placed any orders yet.</p>
            <Button asChild variant="outline">
              <Link href="/marketplace">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  )
}