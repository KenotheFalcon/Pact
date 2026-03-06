import { memo } from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
}

const StatCardInner = function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 group",
        "bg-white dark:bg-zinc-900",
        className
      )}
    >
      {/* Background Gradient Blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pact-green/5 dark:bg-pact-green/10 rounded-full blur-3xl group-hover:bg-pact-green/10 dark:group-hover:bg-pact-green/20 transition-colors duration-500" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">{title}</p>
          <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2 tracking-tight">{value}</h3>

          {trend && (
            <div className="flex items-center mt-3 space-x-2">
              <div className={cn(
                "flex items-center px-2 py-0.5 rounded-full text-xs font-bold border",
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
              )}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
              <span className="text-xs text-zinc-400 font-medium">
                {trend.label}
              </span>
            </div>
          )}
        </div>

        <div className={cn(
          "p-3 rounded-xl shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
          "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
          "group-hover:bg-pact-green group-hover:text-white dark:group-hover:bg-pact-green dark:group-hover:text-white"
        )}>
          <Icon className="w-6 h-6" />
        </div>
         </div>
    </motion.div>
  )
}

export const StatCardMemo = memo(StatCardInner)

export default StatCardInner