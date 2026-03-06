import { useState, useEffect, useCallback } from 'react'

import { STORAGE_PREFIX } from './constants'
import { TourStep } from './types'

interface UseWelcomeTourProps {
  steps: TourStep[]
  tourId: string
  forceShow: boolean
  onComplete?: () => void
}

export function useWelcomeTour({ steps, tourId, forceShow, onComplete }: UseWelcomeTourProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

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

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }, [currentStep, steps.length, completeTour])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    completeTour()
  }, [completeTour])

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

  return {
    isVisible,
    currentStep,
    targetRect,
    handleNext,
    handlePrev,
    handleSkip,
    completeTour
  }
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
