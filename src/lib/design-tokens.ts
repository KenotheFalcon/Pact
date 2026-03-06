/**
 * PACT Design Tokens
 * Centralized design values for consistency across the application
 */

// Spacing tokens for consistent layout
export const spacing = {
  section: {
    sm: 'py-12',
    md: 'py-16 md:py-20',
    lg: 'py-20 md:py-28',
  },
  container: 'px-4 sm:px-6 lg:px-8',
  card: {
    sm: 'p-4',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8',
  },
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
  },
} as const

// Border radius tokens
export const radius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
} as const

// Shadow tokens - refined for modern look
export const shadow = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  card: 'shadow-card',
  elevated: 'shadow-elevated',
  float: 'shadow-float',
  glow: 'shadow-glow',
} as const

// Typography tokens using the new font system
export const typography = {
  // Headings use Plus Jakarta Sans
  h1: 'font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight',
  h2: 'font-heading text-3xl sm:text-4xl font-bold tracking-tight',
  h3: 'font-heading text-xl sm:text-2xl font-semibold tracking-tight',
  h4: 'font-heading text-lg sm:text-xl font-semibold',
  h5: 'font-heading text-base font-semibold',
  
  // Body text uses Inter
  body: 'font-body text-base',
  bodyLg: 'font-body text-lg',
  bodySm: 'font-body text-sm',
  
  // Special text styles
  label: 'font-body text-sm font-medium',
  caption: 'font-body text-xs text-muted-foreground',
  overline: 'font-body text-xs font-semibold uppercase tracking-widest',
  
  // Muted variants
  muted: 'text-muted-foreground',
  mutedSm: 'text-sm text-muted-foreground',
  mutedLg: 'text-lg text-muted-foreground',
} as const

// Transition tokens for consistent animations
export const transition = {
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  colors: 'transition-colors duration-150',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
} as const

// Interactive state tokens
export const interactive = {
  // Hover lift effect for cards
  hoverLift: 'hover:-translate-y-0.5 hover:shadow-elevated',
  // Hover scale for buttons/icons
  hoverScale: 'hover:scale-105',
  // Press effect
  press: 'active:scale-[0.98]',
  // Focus ring
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pact-green focus-visible:ring-offset-2',
} as const

// Color semantic tokens (for programmatic use)
export const colors = {
  primary: 'pact-green',
  secondary: 'pact-orange',
  success: 'emerald-500',
  warning: 'amber-500',
  error: 'red-500',
  info: 'blue-500',
} as const

// Z-index scale
export const zIndex = {
  dropdown: 'z-50',
  sticky: 'z-40',
  fixed: 'z-30',
  overlay: 'z-20',
  base: 'z-10',
  below: 'z-0',
} as const

/**
 * Combine multiple token classes together
 * Filters out falsy values for conditional classes
 */
export function tw(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Create a section wrapper with consistent spacing
 */
export function sectionClasses(size: keyof typeof spacing.section = 'md', className?: string): string {
  return tw(spacing.section[size], 'relative', className)
}

/**
 * Create a container wrapper with consistent padding
 */
export function containerClasses(className?: string): string {
  return tw('container mx-auto', spacing.container, className)
}

// Export all tokens as a single object for convenience
export const tokens = {
  spacing,
  radius,
  shadow,
  typography,
  transition,
  interactive,
  colors,
  zIndex,
} as const

export default tokens
