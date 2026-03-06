'use client'

import { usePathname } from 'next/navigation'
import { BottomNav, BottomNavSpacer } from '@/components/BottomNav'

/**
 * Client wrapper for root layout that adds mobile bottom navigation
 * for marketplace/public pages (excludes buyer/farmer/admin sections)
 */
export function RootClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show marketplace nav on dashboard pages (they have their own)
  const isDashboardPage = 
    pathname.startsWith('/buyer') || 
    pathname.startsWith('/farmer') || 
    pathname.startsWith('/admin')
  
  // Don't show on auth pages
  const isAuthPage = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup') || 
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email')

  // Don't show on onboarding pages
  const isOnboardingPage = pathname.includes('/onboarding')

  // Show bottom nav only for public/marketplace pages
  const showBottomNav = !isDashboardPage && !isAuthPage && !isOnboardingPage

  return (
    <>
      {children}
      {showBottomNav && (
        <>
          <BottomNavSpacer />
          <BottomNav />
        </>
      )}
    </>
  )
}
