import { Variants, TargetAndTransition } from "framer-motion";

/**
 * PERFORMANCE-OPTIMIZED ANIMATION SYSTEM
 *
 * Principles:
 * - Use CSS transforms (opacity, scale, x, y) only
 * - Avoid animate: width, height, color (triggers layout recalculation)
 * - Respect prefers-reduced-motion via hook
 * - Keep durations under 500ms
 * - Use will-change sparingly
 */

// ===== TRANSITION PRESETS =====
export const transitions = {
  fast: { duration: 0.15, ease: "easeOut" },
  normal: { duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] }, // Custom cubic-bezier
  slow: { duration: 0.5, ease: "easeInOut" },
  spring: { type: "spring" as const, stiffness: 300, damping: 30 },
} as const;

// ===== PAGE TRANSITIONS =====
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transitions.normal },
  exit: { opacity: 0, y: -8, transition: transitions.fast },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
};

export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: transitions.normal },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: transitions.normal },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: transitions.normal },
};

// ===== STAGGER PATTERNS =====
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
};

// ===== INTERACTIVE STATES =====
export const cardHoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, transition: transitions.fast },
};

export const buttonHoverVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.04, transition: transitions.fast },
  tap: { scale: 0.97, transition: transitions.fast },
};

// ===== MENU ANIMATIONS =====
export const mobileMenuVariants: Variants = {
  closed: { x: "100%", transition: transitions.normal },
  open: { x: 0, transition: transitions.normal },
};

export const mobileMenuItemVariants: Variants = {
  closed: { opacity: 0, x: 12 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { ...transitions.normal, delay: i * 0.05 },
  }),
};

// ===== MODAL/DIALOG =====
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: transitions.normal },
  exit: { opacity: 0, scale: 0.92, transition: transitions.fast },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
};

// ===== LOADING STATES =====
export const loadingSpinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};

export const loadingPulseVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity },
  },
};

// ===== SUCCESS/ERROR FEEDBACK =====
export const successCheckVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: transitions.spring },
};

export const errorShakeVariants: Variants = {
  tap: {
    x: [-8, 8, -8, 8, 0],
    transition: { duration: 0.4, ease: "easeInOut" },
  },
};

// ===== EXPANDABLE/COLLAPSIBLE =====
export const expandCollapseVariants: Variants = {
  collapsed: { opacity: 0, height: 0, overflow: "hidden" },
  expanded: {
    opacity: 1,
    height: "auto",
    overflow: "hidden",
    transition: transitions.normal,
  },
};

// ===== ENHANCED PAGE TRANSITIONS =====
export const pageSlideVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: transitions.normal },
  exit: { opacity: 0, x: -20, transition: transitions.fast },
};

export const pageFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: transitions.fast },
};

export const pageScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: transitions.normal },
  exit: { opacity: 0, scale: 1.02, transition: transitions.fast },
};

// ===== NOTIFICATION/TOAST =====
export const notificationVariants: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: transitions.fast },
};

// ===== BOTTOM SHEET =====
export const bottomSheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { type: "spring", damping: 30, stiffness: 300 } },
  exit: { y: "100%", transition: transitions.fast },
};

// ===== SPOTLIGHT/TOUR =====
export const spotlightVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const tooltipPopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring", damping: 25, stiffness: 400 } 
  },
  exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
};

// ===== SECTION REVEAL (for homepage sections) =====
export const sectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
  },
};

// ===== ICON HOVER =====
export const iconHoverVariants: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 3, transition: transitions.fast },
};

// ===== STAT COUNTER (for animated numbers) =====
export const statCounterVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: "easeOut" } 
  },
};

// ===== LIST ITEM STAGGER (faster for shorter lists) =====
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: transitions.fast },
};

// ===== FLOATING ANIMATION (subtle bob for cards/badges) =====
export const floatVariants: Variants = {
  animate: {
    y: [-2, 2, -2],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

// ===== PRESS FEEDBACK =====
export const pressVariants: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.98, transition: { duration: 0.1 } },
};
