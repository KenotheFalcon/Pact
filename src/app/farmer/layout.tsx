'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import FarmerSidebar from '@/components/farmer/FarmerSidebar'
import { SkipLink } from '@/components/ui/page-layout'
import { BottomNav, BottomNavSpacer } from '@/components/BottomNav'

export default function FarmerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const verifyRole = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'farmer') {
        router.push(profile?.role === 'admin' ? '/admin' : '/marketplace')
        return
      }

      setIsVerifying(false)
    }

    verifyRole()
  }, [router])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  if (isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pact-green mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-background">
      <SkipLink targetId="main-content" />
      
      {/* Sidebar (Handles its own header/footer) - Hidden on mobile */}
      <FarmerSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main 
          id="main-content"
          role="main"
          aria-label="Farmer dashboard content"
          className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950"
        >
          <div className="h-full pb-safe">
            {children}
            {/* Spacer for mobile bottom nav */}
            <BottomNavSpacer />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav role="farmer" />
    </div>
  )
}