'use client'

interface TopProduct {
  name: string
  revenue: number
  unitsSold: number
  orderCount: number
}

interface TopProductsProps {
  products: TopProduct[]
}

export function TopProducts({ products }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No product sales data yet. Create listings and open pools to start selling!
      </div>
    )
  }

  const maxRevenue = Math.max(...products.map(p => p.revenue))

  return (
    <div className="space-y-3">
      {products.map((product, index) => {
        const barWidth = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono text-xs w-5">
                  #{index + 1}
                </span>
                <span className="font-medium truncate max-w-[200px]">{product.name}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                <span>{product.orderCount} orders</span>
                <span>{product.unitsSold} units</span>
                <span className="font-semibold text-foreground">
                  ₦{(product.revenue / 100).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-pact-green/70 rounded-full transition-all"
                style={{ width: `${Math.max(barWidth, 2)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
