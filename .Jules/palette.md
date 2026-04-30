## 2026-04-30 - Password Input Accessibility
**Learning:** Using `tabIndex={-1}` on interactive elements like password visibility toggles breaks keyboard accessibility. State toggles need `aria-label` and `aria-pressed`, while dynamic visual indicators like password strength meters must use `role="meter"` with value attributes and `aria-live="polite"` for the text readout.
**Action:** Always ensure interactive elements are keyboard focusable and dynamic states/indicators use correct ARIA roles and live regions for screen reader compatibility.
