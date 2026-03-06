'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

import { WelcomeTourProps } from './types'
import { useWelcomeTour } from './useWelcomeTour'
import { getTooltipStyle, getSpotlightClipPath } from './utils'

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
  const overlayRef = useRef<HTMLDivElement>(null)

  const {
    isVisible,
    currentStep,
    targetRect,
    handleNext,
    handlePrev,
    handleSkip
  } = useWelcomeTour({ steps, tourId, forceShow, onComplete })

  if (!isVisible || !steps.length) return null

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

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
            clipPath: targetRect ? getSpotlightClipPath(targetRect) : 'none'
          }}
          onClick={handleSkip}
        />

        {/* Tooltip */}
        <motion.div
          className="absolute z-10 w-80 bg-card border border-border rounded-xl shadow-2xl p-4"
          style={getTooltipStyle(targetRect, step.placement)}
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
