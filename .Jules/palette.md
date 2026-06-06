## 2026-06-06 - Password Input with Strength Accessibility
**Learning:** Found a component using `tabIndex={-1}` on a show/hide password toggle which breaks keyboard navigation. Also missing `aria-label` and `aria-pressed`. Password strength meters need `role="meter"` for screen reader compatibility.
**Action:** Always ensure interactive toggles are keyboard-focusable with proper `focus-visible` styles, and include `aria-label`/`aria-pressed` attributes. Use `role="meter"` with appropriate ARIA attributes for dynamic visual indicators.
