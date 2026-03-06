'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

interface AnnouncementContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined)

export function useAnnouncement() {
  const context = useContext(AnnouncementContext)
  if (!context) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider')
  }
  return context
}

interface AnnouncementProviderProps {
  children: React.ReactNode
}

/**
 * Provides accessible announcements for screen readers via aria-live regions.
 * Use the `announce` function to announce dynamic content changes.
 * 
 * @example
 * const { announce } = useAnnouncement()
 * announce('Item added to cart')
 * announce('Error: Please try again', 'assertive')
 */
export function AnnouncementProvider({ children }: AnnouncementProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')
  const politeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const assertiveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      // Clear previous assertive message first to ensure announcement
      setAssertiveMessage('')
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current)
      }
      // Set new message after a brief delay
      assertiveTimeoutRef.current = setTimeout(() => {
        setAssertiveMessage(message)
        // Clear after announcement
        assertiveTimeoutRef.current = setTimeout(() => {
          setAssertiveMessage('')
        }, 1000)
      }, 100)
    } else {
      // Clear previous polite message first to ensure announcement
      setPoliteMessage('')
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current)
      }
      // Set new message after a brief delay
      politeTimeoutRef.current = setTimeout(() => {
        setPoliteMessage(message)
        // Clear after announcement
        politeTimeoutRef.current = setTimeout(() => {
          setPoliteMessage('')
        }, 1000)
      }, 100)
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (politeTimeoutRef.current) clearTimeout(politeTimeoutRef.current)
      if (assertiveTimeoutRef.current) clearTimeout(assertiveTimeoutRef.current)
    }
  }, [])

  return (
    <AnnouncementContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements - for non-urgent updates */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {politeMessage}
      </div>
      {/* Assertive announcements - for urgent updates/errors */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {assertiveMessage}
      </div>
    </AnnouncementContext.Provider>
  )
}
