export interface TourStep {
  /** Unique step ID */
  id: string
  /** CSS selector for the target element */
  target: string
  /** Title shown in the tooltip */
  title: string
  /** Description/content of the step */
  content: string
  /** Position of the tooltip relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export interface WelcomeTourProps {
  /** Array of tour steps */
  steps: TourStep[]
  /** Unique key for localStorage (to track completion) */
  tourId: string
  /** Callback when tour is completed or skipped */
  onComplete?: () => void
  /** Force show even if completed before */
  forceShow?: boolean
  /** Additional CSS classes for the overlay */
  className?: string
}
