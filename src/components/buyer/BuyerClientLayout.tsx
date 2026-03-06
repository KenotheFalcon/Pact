'use client'

import { BottomNav, BottomNavSpacer } from '@/components/BottomNav'

interface BuyerClientLayoutProps {
  children: React.ReactNode
}

/**
 * Client-side wrapper for buyer layout
 * Handles mobile bottom navigation
 */
export function BuyerClientLayout({ children }: BuyerClientLayoutProps) {
  return (
    <>
      {children}
      {/* Mobile bottom navigation spacer */}
      <BottomNavSpacer />
      {/* Mobile bottom navigation */}
      <BottomNav role="buyer" />
    </>
  )
}
