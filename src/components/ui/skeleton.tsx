import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
    /** Use shimmer animation instead of pulse */
    shimmer?: boolean
}

/**
 * Skeleton loader component for loading states
 * Supports both pulse (default) and shimmer animations
 */
export function Skeleton({ className, shimmer = false }: SkeletonProps) {
    return (
        <div
            className={cn(
                'rounded-md bg-muted',
                shimmer ? 'animate-shimmer' : 'animate-pulse',
                className
            )}
            aria-hidden="true"
        />
    )
}

/**
 * Card skeleton for product/listing cards
 */
export function CardSkeleton() {
    return (
        <div className="border rounded-lg overflow-hidden shadow-lg">
            <Skeleton className="h-40 sm:h-44 w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        </div>
    )
}

/**
 * List skeleton for multiple items
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    )
}

/**
 * Grid skeleton for product grids
 */
export function GridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}
