'use client'

import { useState, useEffect, useRef } from 'react'

type ScrollDirection = 'up' | 'down' | null

interface UseScrollDirectionOptions {
  /** Minimum scroll distance to trigger direction change (default: 10) */
  threshold?: number
  /** Initial direction (default: null) */
  initialDirection?: ScrollDirection
}

/**
 * Hook to detect scroll direction
 * Useful for hiding/showing navigation on scroll
 * 
 * @example
 * const scrollDirection = useScrollDirection()
 * // scrollDirection is 'up', 'down', or null
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): ScrollDirection {
  const { threshold = 10, initialDirection = null } = options
  
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    // Initialize last scroll position
    lastScrollY.current = window.scrollY

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const difference = scrollY - lastScrollY.current

      // Only update if we've scrolled more than threshold
      if (Math.abs(difference) < threshold) {
        ticking.current = false
        return
      }

      // Determine direction
      const direction = difference > 0 ? 'down' : 'up'
      
      if (direction !== scrollDirection) {
        setScrollDirection(direction)
      }

      lastScrollY.current = scrollY > 0 ? scrollY : 0
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        // Use requestAnimationFrame for performance
        window.requestAnimationFrame(updateScrollDirection)
        ticking.current = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [scrollDirection, threshold])

  return scrollDirection
}

/**
 * Hook to detect if user is at the top of the page
 */
export function useAtTop(offset: number = 0): boolean {
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setAtTop(window.scrollY <= offset)
    }

    // Check initial position
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [offset])

  return atTop
}
