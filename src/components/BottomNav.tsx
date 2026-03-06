'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  ShoppingBag, 
  History, 
  Star, 
  User,
  Package,
  BarChart3,
  Bell,
  Settings,
  Store
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'buyer' | 'farmer' | 'admin' | null

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// Role-specific navigation items
const BUYER_NAV: NavItem[] = [
  { name: 'Home', href: '/buyer', icon: Home },
  { name: 'Orders', href: '/buyer/orders', icon: ShoppingBag },
  { name: 'History', href: '/buyer/history', icon: History },
  { name: 'Reviews', href: '/buyer/reviews', icon: Star },
]

const FARMER_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/farmer', icon: Home },
  { name: 'Listings', href: '/farmer/listings', icon: Package },
  { name: 'Pools', href: '/farmer/pools', icon: Store },
  { name: 'Analytics', href: '/farmer/analytics', icon: BarChart3 },
]

const MARKETPLACE_NAV: NavItem[] = [
  { name: 'Browse', href: '/marketplace', icon: Store },
  { name: 'Cart', href: '/cart', icon: ShoppingBag },
  { name: 'Account', href: '/login', icon: User },
]

interface BottomNavProps {
  /** Force a specific role (otherwise auto-detected) */
  role?: UserRole
  /** Additional CSS classes */
  className?: string
  /** Whether to hide on scroll down */
  hideOnScroll?: boolean
}

/**
 * Mobile bottom navigation bar
 * - Role-aware navigation items
 * - Hides on scroll down, shows on scroll up
 * - Respects safe-area-inset-bottom for devices with home indicators
 */
export function BottomNav({ 
  role: forcedRole, 
  className,
  hideOnScroll = true 
}: BottomNavProps) {
  const pathname = usePathname()
  const scrollDirection = useScrollDirection({ threshold: 15 })
  const prefersReducedMotion = useReducedMotion()
  const [userRole, setUserRole] = useState<UserRole>(forcedRole ?? null)
  const [isMounted, setIsMounted] = useState(false)

  // Auto-detect role from current path or user session
  useEffect(() => {
    setIsMounted(true)
    
    if (forcedRole) {
      setUserRole(forcedRole)
      return
    }

    // Detect role from path
    if (pathname.startsWith('/buyer')) {
      setUserRole('buyer')
    } else if (pathname.startsWith('/farmer')) {
      setUserRole('farmer')
    } else if (pathname.startsWith('/admin')) {
      setUserRole('admin')
    } else {
      // For marketplace/public pages, check if user is logged in
      const checkUser = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          const profileData = profile as { role?: string } | null
          if (profileData?.role) {
            setUserRole(profileData.role as UserRole)
          }
        }
      }
      checkUser()
    }
  }, [pathname, forcedRole])

  // Don't render on server or for admin (they have sidebar)
  if (!isMounted || userRole === 'admin') {
    return null
  }

  // Select navigation items based on role
  const navItems = userRole === 'buyer' 
    ? BUYER_NAV 
    : userRole === 'farmer' 
      ? FARMER_NAV 
      : MARKETPLACE_NAV

  // Determine if nav should be visible
  const shouldHide = hideOnScroll && scrollDirection === 'down'

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.nav
          initial={prefersReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 md:hidden',
            'bg-background/95 backdrop-blur-md border-t border-border',
            'pb-safe', // Safe area for devices with home indicators
            className
          )}
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/buyer' && item.href !== '/farmer' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pact-green focus-visible:ring-offset-2',
                    isActive
                      ? 'text-pact-green'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

/**
 * Spacer to prevent content from being hidden behind bottom nav
 * Add this at the bottom of pages that use BottomNav
 */
export function BottomNavSpacer() {
  return <div className="h-20 md:h-0" aria-hidden="true" />
}
