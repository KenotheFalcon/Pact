## 2026-04-09 - Accessibility for Icon-only Buttons
**Learning:** Removing `tabIndex={-1}` from icon-only buttons allows keyboard navigation, while wrapping them in tooltips and adding `aria-label`/`aria-pressed` makes their function clear to both sighted users and screen readers.
**Action:** Ensure all icon-only action buttons (like password visibility toggles) are keyboard navigable, include tooltips, and utilize proper ARIA attributes.
