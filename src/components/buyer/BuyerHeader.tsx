'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, ShoppingBag, History, Star, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Overview', href: '/buyer', icon: Home },
  { name: 'Orders', href: '/buyer/orders', icon: ShoppingBag },
  { name: 'History', href: '/buyer/history', icon: History },
  { name: 'Reviews', href: '/buyer/reviews', icon: Star },
]

export default function BuyerHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-background/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-border/50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="font-heading text-2xl font-semibold">Buyer</h1>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-3" aria-label="Buyer navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md transition-colors',
                  isActive
                    ? 'bg-pact-green/10 text-pact-green font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-accent/10'
                )}
              >
                {item.name}
              </Link>
            )
          })}
          <ThemeToggle />
        </nav>

        {/* Mobile: Theme toggle visible */}
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile navigation sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>Buyer Dashboard</SheetTitle>
          </SheetHeader>

          <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile buyer navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <SheetClose asChild key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-pact-green/10 text-pact-green'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
