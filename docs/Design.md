# Design System & UX (UI/UX Director)

## Visual Language
- Typography: Inter (swap/preload) as base; recommend adding display/secondary face for hierarchy.
- Color: Tailwind tokens (background/foreground/card/border, primary, pact-green). Use gradients (pact-green→emerald) for emphasis; maintain light/dark parity.
- Layout: grid and cards with generous radius; hero overlays with gradients and texture grid; CTA pairs primary/outline.
- Imagery: agriculture photography; maintain high-contrast overlays for readability.

## Components & Patterns
- Primitives: shadcn/ui buttons, badges, cards, progress, toaster; Navbar/Footer/ThemeProvider/PageTransition wrappers.
- Motion: Framer Motion stagger, slideUp, hover lift; scroll cue; honor prefers-reduced-motion via hook.
- States: show remaining/committed counts, progress bars; CTA disabled when ineligible.
- Forms: minimal currently; plan inline validation and descriptive labels.

## Accessibility
- Respect reduced motion; semantic headings; color contrast on dark hero overlays.
- **[RED] Missing**: documented focus states, skip-to-content, aria labels on icon-only controls, error text patterns, WCAG AA palette tokens.

## Responsiveness & Mobile
- Hero/text responsive scaling; grids collapse to single column on small screens; images use Next/Image with sizes.
- **[RED] Missing**: touch target spacing guidance, mobile nav pattern, bottom-sheet modals for native feel.

## PWA & Native Feel
- Goals: installable, offline shell, optimistic UI for pledges, push for pool status, pull-to-refresh gesture, light haptics (where available).
- **[RED] Missing**: manifest, service worker, offline/low-connectivity UI states, add-to-home-screen prompts.

## Design Tokens (proposed)
- Spacing: 4/8/12/16/24/32; Radius: 8/12/16; Elevation: 0/2/6/12 with subtle shadows.
- Typography scale: 12/14/16/18/24/32/48/64; weights 400/600/700/800.
- Motion: normal 0.25s ease-out; slow 0.6s; use stagger for lists; disable on prefers-reduced-motion.

## Content Tone
- Confident, fair-trade, community-first; microcopy uppercase for badges; avoid jargon; highlight savings and freshness.
