## 2024-06-25 - Cart Icon Button Accessibility & Tooltip Insight
**Learning:** Adding Tooltips to isolated icon buttons significantly improves UX, but wrapping individual buttons deeply nested inside mapping functions requires hoisting a `<TooltipProvider>` higher up the DOM tree (e.g., at the page or root layout level) to ensure global state management works without introducing React boundary errors.
**Action:** Always wrap the highest practical parent component in a `<TooltipProvider>` when deploying multiple nested `<Tooltip>` components inside lists.
