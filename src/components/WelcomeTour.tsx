'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'

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

interface WelcomeTourProps {
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

const STORAGE_PREFIX = 'pact_tour_completed_'

/**
 * First-time user spotlight tour component
 * Highlights key features with a step-by-step guide
 */
export function WelcomeTour({
  steps,
  tourId,
  onComplete,
  forceShow = false,
  className
}: WelcomeTourProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const storageKey = `${STORAGE_PREFIX}${tourId}`

  // Check if tour was already completed
  useEffect(() => {
    if (forceShow) {
      setIsVisible(true)
      return
    }

    try {
      const completed = localStorage.getItem(storageKey)
      if (!completed) {
        // Small delay to let page render first
        const timer = setTimeout(() => setIsVisible(true), 500)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage not available
      setIsVisible(true)
    }
  }, [storageKey, forceShow])

  // Update target element position
  useEffect(() => {
    if (!isVisible || !steps[currentStep]) return

    const updateTarget = () => {
      const target = document.querySelector(steps[currentStep].target)
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)
        
        // Scroll target into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setTargetRect(null)
      }
    }

    updateTarget()
    
    // Update on resize/scroll
    window.addEventListener('resize', updateTarget)
    window.addEventListener('scroll', updateTarget)
    
    return () => {
      window.removeEventListener('resize', updateTarget)
      window.removeEventListener('scroll', updateTarget)
    }
  }, [isVisible, currentStep, steps])

  const completeTour = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // Ignore localStorage errors
    }
    setIsVisible(false)
    onComplete?.()
  }, [storageKey, onComplete])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    completeTour()
  }

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          completeTour()
          break
        case 'ArrowRight':
        case 'Enter':
          if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1)
          } else {
            completeTour()
          }
          break
        case 'ArrowLeft':
          if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, currentStep, steps.length, completeTour])

  if (!isVisible || !steps.length) return null

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
    }

    const padding = 16
    const tooltipWidth = 320
    const tooltipHeight = 180
    const placement = step.placement ?? 'bottom'

    switch (placement) {
      case 'top':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.top - tooltipHeight - padding,
          transform: 'translateX(-50%)'
        }
      case 'bottom':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + padding,
          transform: 'translateX(-50%)'
        }
      case 'left':
        return {
          left: targetRect.left - tooltipWidth - padding,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translateY(-50%)'
        }
      case 'right':
        return {
          left: targetRect.right + padding,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translateY(-50%)'
        }
      default:
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + padding,
          transform: 'translateX(-50%)'
        }
    }
  }

  // Create spotlight clip path
  const getSpotlightClipPath = (): string => {
    if (!targetRect) return 'none'
    
    const padding = 8
    const x = targetRect.left - padding
    const y = targetRect.top - padding
    const width = targetRect.width + padding * 2
    const height = targetRect.height + padding * 2
    const radius = 8

    // Create a rectangle with rounded corners using SVG path
    return `polygon(
      0% 0%, 0% 100%, 
      ${x}px 100%, ${x}px ${y + radius}px, 
      ${x + radius}px ${y}px, ${x + width - radius}px ${y}px, 
      ${x + width}px ${y + radius}px, ${x + width}px ${y + height - radius}px, 
      ${x + width - radius}px ${y + height}px, ${x + radius}px ${y + height}px, 
      ${x}px ${y + height - radius}px, ${x}px 100%, 
      100% 100%, 100% 0%
    )`
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className={cn(
          'fixed inset-0 z-[100]',
          className
        )}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome tour"
      >
        {/* Dark overlay with spotlight cutout */}
        <div
          className="absolute inset-0 bg-black/70 transition-[clip-path] duration-300"
          style={{
            clipPath: targetRect ? getSpotlightClipPath() : 'none'
          }}
          onClick={handleSkip}
        />

        {/* Tooltip */}
        <motion.div
          className="absolute z-10 w-80 bg-card border border-border rounded-xl shadow-2xl p-4"
          style={getTooltipStyle()}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          key={step.id}
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="pr-6">
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {step.content}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentStep ? 'bg-pact-green' : 'bg-muted'
                )}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>

            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-pact-green hover:bg-pact-green/90"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>

          {/* Step counter */}
          <p className="text-xs text-muted-foreground text-center mt-3">
            Step {currentStep + 1} of {steps.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Hook to reset a specific tour (useful for testing or settings)
 */
export function useResetTour(tourId: string) {
  return useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${tourId}`)
    } catch {
      // Ignore errors
    }
  }, [tourId])
}

/**
 * Predefined tour steps for different roles
 */
export const BUYER_TOUR_STEPS: TourStep[] = [
  {
    id: 'browse',
    target: '[data-tour="marketplace"]',
    title: 'Browse Fresh Produce',
    content: 'Explore listings from local farmers. Find fresh vegetables, fruits, and more at competitive prices.',
    placement: 'bottom'
  },
  {
    id: 'pools',
    target: '[data-tour="pools"]',
    title: 'Join Buying Pools',
    content: 'Pool your order with others to unlock bulk pricing. The more people join, the better the price!',
    placement: 'bottom'
  },
  {
    id: 'orders',
    target: '[data-tour="orders"]',
    title: 'Track Your Orders',
    content: 'Monitor your pool status, payment, and delivery right from your dashboard.',
    placement: 'left'
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Stay Updated',
    content: 'Get notified when pools fill up, prices drop, or new produce becomes available.',
    placement: 'left'
  }
]

export const FARMER_TOUR_STEPS: TourStep[] = [
  {
    id: 'listings',
    target: '[data-tour="listings"]',
    title: 'Create Listings',
    content: 'Add your produce with photos, pricing, and quantity. Buyers will see these in the marketplace.',
    placement: 'bottom'
  },
  {
    id: 'pools',
    target: '[data-tour="pools"]',
    title: 'Manage Pools',
    content: 'Create buying pools for your listings. Set minimum quantities and deadlines for bulk orders.',
    placement: 'bottom'
  },
  {
    id: 'analytics',
    target: '[data-tour="analytics"]',
    title: 'View Analytics',
    content: 'Track your sales, popular items, and buyer trends to optimize your offerings.',
    placement: 'left'
  },
  {
    id: 'payouts',
    target: '[data-tour="payouts"]',
    title: 'Receive Payouts',
    content: 'Get paid directly to your bank account when pools complete. Track all your earnings here.',
    placement: 'left'
  }
]
