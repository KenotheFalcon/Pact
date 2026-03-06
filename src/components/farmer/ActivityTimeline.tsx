import { memo } from 'react'
import { FarmerActivity } from '@/types/farmer'
import { Package, DollarSign, Users, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ActivityTimelineProps {
  activities: FarmerActivity[]
}

const activityIcons = {
  listing_created: Package,
  listing_sold: DollarSign,
  pool_completed: Users,
  payment_received: DollarSign
}

const activityColors = {
  success: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400',
  pending: 'text-amber-600 bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400',
  failed: 'text-red-600 bg-red-100 dark:bg-red-500/10 dark:text-red-400'
}

const statusIcons = {
  success: CheckCircle,
  pending: Clock,
  failed: AlertCircle
}

const ActivityTimelineInner = function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="font-medium text-lg text-zinc-900 dark:text-zinc-200">No recent activities</p>
        <p className="text-sm mt-1">Your farming activities will appear here</p>
      </div>
    )
  }

  return (
    <div className="flow-root p-6">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => {
          const Icon = activityIcons[activity.type] || Package
          const StatusIcon = statusIcons[activity.status]

          return (
            <motion.li
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: activityIdx * 0.1 }}
            >
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-zinc-900",
                      activityColors[activity.status]
                    )}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5 group cursor-default">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-pact-green transition-colors">
                        {activity.title}{' '}
                        {activity.amount && (
                          <span className="font-bold text-zinc-900 dark:text-white">
                            ₦{activity.amount.toLocaleString()}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{activity.description}</p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-zinc-500 dark:text-zinc-400">
                      <time dateTime={activity.timestamp} className="text-xs font-medium">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </time>
                      <div className="flex items-center justify-end mt-1">
                        <StatusIcon className={cn(
                          "h-3 w-3 mr-1",
                          activity.status === 'success' ? 'text-emerald-500' :
                            activity.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                        )} />
                        <span className="capitalize text-xs">{activity.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.li>
          )
        })}
       </ul>
    </div>
  )
}

export const ActivityTimelineMemo = memo(ActivityTimelineInner)

export default ActivityTimelineInner