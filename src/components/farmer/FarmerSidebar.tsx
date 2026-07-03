'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/farmer', icon: LayoutDashboard },
  { name: 'My Listings', href: '/farmer/listings', icon: Package },
  { name: 'Active Pools', href: '/farmer/pools', icon: Users },
  { name: 'Analytics', href: '/farmer/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/farmer/settings', icon: Settings }
]

interface FarmerSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface UserData {
  id: string
  email?: string
  user_metadata?: {
    avatar_url?: string
  }
}

interface FarmerProfileData {
  id: string
  display_name?: string | null
  avatar_url?: string | null
  role: string
}

export default function FarmerSidebar({ isCollapsed = false, onToggle }: FarmerSidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>(null)
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfileData | null>(null)
  const [notifications, setNotifications] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768)
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        const { data: farmerData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, role')
          .eq('id', authUser.id)
          .eq('role', 'farmer')
          .single()
        if (farmerData) setFarmerProfile(farmerData as FarmerProfileData)

        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .eq('is_read', false)
        setNotifications(count || 0)
      }
    } catch {
      // Silent error handling
    }
  }, [supabase])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen(!mobileOpen)
    else if (onToggle) onToggle()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-r border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-black/20">
      {/* Header */}
      <div className="flex items-center h-20 px-6 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3 w-full overflow-hidden">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-white dark:border-zinc-800 shadow-sm ring-2 ring-zinc-100 dark:ring-zinc-800">
              <AvatarImage src={farmerProfile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-pact-green to-emerald-600 text-white font-bold">
                {getInitials(farmerProfile?.display_name || user?.email || 'F')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {farmerProfile?.display_name || 'My Farm'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'text-pact-green bg-pact-green/5 dark:bg-pact-green/10'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                isCollapsed && !isMobile ? 'justify-center' : ''
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-pact-green rounded-r-full"
                />
              )}

              <Icon className={cn("h-5 w-5 flex-shrink-0 transition-colors duration-200", isActive ? "text-pact-green" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")} />

              <span className={cn("ml-3 truncate font-semibold tracking-tight", isCollapsed && !isMobile ? "sr-only" : "")}>
                {item.name}
              </span>

              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-200">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="space-y-1">
          <Link
            href="/farmer/notifications"
            className={cn(
              "group relative flex items-center px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all",
              isCollapsed && !isMobile ? 'justify-center' : ''
            )}
          >
            <div className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full ring-2 ring-white dark:ring-zinc-900 animate-pulse">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </div>
            <span className={cn("ml-3", isCollapsed && !isMobile ? "sr-only" : "")}>
              Notifications
            </span>

            {/* Tooltip for collapsed state */}
            {isCollapsed && !isMobile && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-200">
                Notifications
              </div>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className={cn(
              "group relative flex items-center w-full px-3 py-2 text-sm font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all",
              isCollapsed && !isMobile ? 'justify-center' : ''
            )}
          >
            <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className={cn("ml-3", isCollapsed && !isMobile ? "sr-only" : "")}>
              Logout
            </span>

            {/* Tooltip for collapsed state */}
            {isCollapsed && !isMobile && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-200">
                Logout
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 md:hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm border border-zinc-200 dark:border-zinc-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
              >
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <motion.div
      className="hidden md:block h-screen sticky top-0 z-30"
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <SidebarContent />

      {/* Collapse Toggle Button */}
      {!isMobile && onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center shadow-md text-zinc-500 hover:text-pact-green transition-colors z-50"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}
    </motion.div>
  )
}