# UX Comprehensive Improvement Design

**Date:** January 27, 2026  
**Status:** Approved for Implementation  
**Scope:** All user roles (Buyer, Farmer, Admin)

---

## Executive Summary

This design outlines a three-tier approach to comprehensively improve the user experience across the PACT marketplace. The improvements span five areas: onboarding, mobile experience, accessibility, animations, and live feedback.

**Total Estimated Effort:** 2-3 weeks  
**Approach:** Incremental enhancement of existing solid foundation

---

## Current State Analysis

### Strengths
- Solid animation system with Framer Motion
- Good reduced motion support via `useReducedMotion` hook
- Accessible touch targets (44px+ buttons)
- Mobile-responsive with Radix Sheet for navigation
- Real-time pool chat capabilities
- Toast notification system integrated
- Multi-step farmer onboarding exists

### Gaps Identified
- No buyer onboarding flow
- Limited inline form validation
- No network status indicator
- Skeleton loading without shimmer animation
- No page exit animations
- Missing `aria-busy` on loading forms
- No mobile bottom navigation
- No first-time user tour

---

## Implementation Plan

### Tier 1: Quick Wins (4-6 hours)

Low-effort, high-impact improvements:

| # | Item | Description | File(s) |
|---|------|-------------|---------|
| 1 | `aria-busy` on forms | Add `aria-busy={isLoading}` to form containers | `loading-button.tsx`, forms |
| 2 | CSS reduced-motion | Add `@media (prefers-reduced-motion)` CSS fallback | `globals.css` |
| 3 | Password toggle a11y | Change `tabIndex={-1}` to `tabIndex={0}` | `password-input.tsx` |
| 4 | Skeleton shimmer | Add animated gradient shimmer effect | `skeleton.tsx` |
| 5 | Button loading animation | Add subtle pulse/scale to spinner | `loading-button.tsx` |
| 6 | Toast mobile positioning | Move toasts higher for keyboard visibility | `sonner.tsx` |
| 7 | Onboarding step labels | Add text labels below progress circles | `farmer/onboarding/page.tsx` |

### Tier 2: Core Improvements (3-5 days)

Medium-effort foundational improvements:

| # | Item | Description | New Files |
|---|------|-------------|-----------|
| 1 | Buyer onboarding wizard | 3-step: location → preferences → notifications | `buyer/onboarding/page.tsx` |
| 2 | Role description tooltips | Info icons explaining Buyer vs Farmer | Modify signup page |
| 3 | `useFieldValidation` hook | Debounced Zod validation with real-time feedback | `hooks/useFieldValidation.ts` |
| 4 | Enhanced form field | Form field with inline validation display | `components/ui/form-field.tsx` |
| 5 | Network status indicator | Banner/icon for offline/reconnecting states | `network-status.tsx`, `useNetworkStatus.ts` |
| 6 | Success checkmark animation | Animated checkmark on form success | `success-check.tsx`, `animations.ts` |

### Tier 3: Polish & Delight (1-2 weeks)

Larger enhancements for professional polish:

| # | Item | Description | New Files |
|---|------|-------------|-----------|
| 1 | Mobile bottom navigation | Role-aware fixed bottom bar, hide on scroll | `BottomNav.tsx`, `useScrollDirection.ts` |
| 2 | First-time welcome tour | Spotlight tour of 3-4 key features per role | `WelcomeTour.tsx` |
| 3 | Page exit animations | Add exit variants to `PageTransition` | Modify `PageTransition.tsx` |
| 4 | Heading/landmarks audit | Ensure h1→h2→h3 structure, add ARIA landmarks | Multiple page modifications |

---

## Technical Specifications

### New Hooks

#### `useFieldValidation`
```typescript
interface UseFieldValidationOptions<T> {
  schema: z.ZodType<T>
  debounceMs?: number
}

function useFieldValidation<T>(
  value: T,
  options: UseFieldValidationOptions<T>
): {
  isValid: boolean
  error: string | null
  isValidating: boolean
}
```

#### `useNetworkStatus`
```typescript
function useNetworkStatus(): {
  isOnline: boolean
  isReconnecting: boolean
}
```

#### `useScrollDirection`
```typescript
function useScrollDirection(): 'up' | 'down' | null
```

### New Components

#### `<FormField />`
- Wraps input with label, error display, and success indicator
- Integrates with `useFieldValidation`
- Shows inline validation as user types

#### `<NetworkStatus />`
- Fixed position banner when offline
- Fades in/out with animation
- Dismissible

#### `<BottomNav />`
- Role-aware navigation items
- Hides on scroll down, shows on scroll up
- Respects `safe-area-inset-bottom`

#### `<WelcomeTour />`
- Spotlight overlay with step progression
- Skip functionality
- Persists completion to localStorage

### Animation Additions

```typescript
// Add to src/lib/animations.ts
export const successCheckmark = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

export const shimmer = {
  // CSS-based gradient animation for skeletons
}

export const pageExit = {
  opacity: 0,
  y: -20,
  transition: { duration: 0.2 }
}
```

---

## File Structure

```
src/
├── app/
│   ├── buyer/
│   │   └── onboarding/
│   │       └── page.tsx              # NEW
│   ├── farmer/
│   │   └── onboarding/
│   │       └── page.tsx              # MODIFY
│   └── globals.css                   # MODIFY
├── components/
│   ├── BottomNav.tsx                 # NEW
│   ├── WelcomeTour.tsx               # NEW
│   ├── PageTransition.tsx            # MODIFY
│   └── ui/
│       ├── form-field.tsx            # NEW
│       ├── success-check.tsx         # NEW
│       ├── network-status.tsx        # NEW
│       ├── skeleton.tsx              # MODIFY
│       ├── loading-button.tsx        # MODIFY
│       ├── password-input.tsx        # MODIFY
│       └── sonner.tsx                # MODIFY
├── hooks/
│   ├── useFieldValidation.ts         # NEW
│   ├── useNetworkStatus.ts           # NEW
│   └── useScrollDirection.ts         # NEW
└── lib/
    └── animations.ts                 # MODIFY
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Lighthouse Accessibility | 95+ |
| Lighthouse Performance | 90+ |
| Touch target compliance | 100% WCAG 2.5.5 |
| Reduced motion support | 100% of animations |
| Form completion rate | Track via analytics |
| Onboarding completion | Both roles have flows |
| Mobile usability | No zoom, proper keyboards |

---

## Implementation Order

1. Tier 1 (all items) - Immediate quality boost
2. Tier 2.3-2.4 - Form validation foundation
3. Tier 2.1 - Buyer onboarding (uses new forms)
4. Tier 2.2 - Role tooltips
5. Tier 2.5-2.6 - Status indicators & success animations
6. Tier 3.1 - Bottom navigation
7. Tier 3.2 - Welcome tour
8. Tier 3.3-3.4 - Exit animations & audit

---

## Testing Requirements

### Accessibility Testing
- Axe DevTools audit on all modified pages
- VoiceOver/NVDA testing for screen reader flows
- Keyboard-only navigation test
- Reduced motion preference verification

### Mobile Testing
- iOS Safari + Android Chrome
- Touch target verification
- Bottom safe area on notched devices
- Keyboard visibility with toasts

### Animation Testing
- 60fps verification via DevTools
- Reduced motion fallback confirmation
- Page transition smoothness

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Design | - | - |
| Development | - | - |
| QA | - | - |
