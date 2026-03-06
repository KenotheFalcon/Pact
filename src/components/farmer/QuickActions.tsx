'use client'

import { useRouter } from 'next/navigation'
import { Plus, Package, Users, BarChart3, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      title: 'Create Listing',
      description: 'Add fresh produce',
      icon: Plus,
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-teal-600',
      onClick: () => router.push('/farmer/create-pact')
    },
    {
      title: 'My Listings',
      description: 'Manage inventory',
      icon: Package,
      color: 'bg-pact-orange',
      gradient: 'from-orange-500 to-red-500',
      onClick: () => router.push('/farmer/listings')
    },
    {
      title: 'Group Pools',
      description: 'Manage bulk orders',
      icon: Users,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-indigo-600',
      onClick: () => router.push('/farmer/pools')
    },
    {
      title: 'Analytics',
      description: 'View sales insights',
      icon: BarChart3,
      color: 'bg-violet-500',
      gradient: 'from-violet-500 to-purple-600',
      onClick: () => router.push('/farmer/analytics')
    }
  ]

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.title}
              onClick={action.onClick}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative overflow-hidden rounded-2xl p-5 text-left shadow-md transition-all group",
                "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
              )}
            >
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br",
                action.gradient
              )} />

              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "p-3 rounded-xl text-white shadow-lg bg-gradient-to-br",
                  action.gradient
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-pact-green transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {action.description}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}