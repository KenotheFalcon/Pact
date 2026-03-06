'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * Main page layout wrapper with proper ARIA landmarks
 * Provides consistent structure for all pages
 */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  children: React.ReactNode
  className?: string
}

/**
 * Page header section with banner landmark
 * Use for page title and primary actions
 */
export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <header 
      role="banner"
      className={cn(
        'sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border',
        className
      )}
    >
      {children}
    </header>
  )
}

interface PageMainProps {
  children: React.ReactNode
  className?: string
  /** Accessible label for the main content area */
  'aria-label'?: string
}

/**
 * Main content area with proper landmark
 */
export function PageMain({ 
  children, 
  className,
  'aria-label': ariaLabel 
}: PageMainProps) {
  return (
    <main 
      role="main"
      aria-label={ariaLabel}
      className={cn('flex-1', className)}
    >
      {children}
    </main>
  )
}

interface PageSidebarProps {
  children: React.ReactNode
  className?: string
  /** Position of sidebar */
  position?: 'left' | 'right'
  /** Accessible label for the sidebar */
  'aria-label'?: string
}

/**
 * Sidebar with complementary landmark
 */
export function PageSidebar({ 
  children, 
  className,
  position = 'left',
  'aria-label': ariaLabel = 'Sidebar navigation'
}: PageSidebarProps) {
  return (
    <aside 
      role="complementary"
      aria-label={ariaLabel}
      className={cn(
        'flex-shrink-0',
        position === 'left' ? 'order-first' : 'order-last',
        className
      )}
    >
      {children}
    </aside>
  )
}

interface PageFooterProps {
  children: React.ReactNode
  className?: string
}

/**
 * Page footer with contentinfo landmark
 */
export function PageFooter({ children, className }: PageFooterProps) {
  return (
    <footer 
      role="contentinfo"
      className={cn(
        'mt-auto border-t border-border bg-muted/30',
        className
      )}
    >
      {children}
    </footer>
  )
}

interface SectionProps {
  children: React.ReactNode
  className?: string
  /** Section heading (required for accessibility) */
  heading?: string
  /** Heading level (default: h2) */
  headingLevel?: 'h2' | 'h3' | 'h4'
  /** Hide heading visually but keep for screen readers */
  hideHeading?: boolean
  /** ID for the section (for skip links) */
  id?: string
}

/**
 * Content section with region landmark
 * Requires a heading for proper accessibility
 */
export function Section({ 
  children, 
  className,
  heading,
  headingLevel = 'h2',
  hideHeading = false,
  id
}: SectionProps) {
  const HeadingTag = headingLevel as keyof JSX.IntrinsicElements
  const headingId = id ? `${id}-heading` : undefined

  return (
    <section 
      role="region"
      aria-labelledby={heading ? headingId : undefined}
      id={id}
      className={className}
    >
      {heading && (
        <HeadingTag 
          id={headingId}
          className={cn(
            hideHeading && 'sr-only',
            !hideHeading && 'text-xl font-semibold mb-4'
          )}
        >
          {heading}
        </HeadingTag>
      )}
      {children}
    </section>
  )
}

interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string
  /** Link text */
  children?: React.ReactNode
}

/**
 * Skip link for keyboard navigation
 * Appears on focus, allows users to skip to main content
 */
export function SkipLink({ targetId, children = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only',
        'fixed top-4 left-4 z-[100]',
        'bg-pact-green text-white px-4 py-2 rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-pact-green focus:ring-offset-2',
        'transition-transform'
      )}
    >
      {children}
    </a>
  )
}

/**
 * Visually hidden text for screen readers only
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}
