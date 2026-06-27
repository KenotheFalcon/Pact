## 2026-06-27 - Password Strength Input Accessibility
**Learning:** The password strength input lacks keyboard navigability, clear ARIA roles for its meter, and dynamic readouts. It used `tabIndex={-1}` on the toggle button which actively broke keyboard access.
**Action:** Ensure custom meters use `role="meter"` with `aria-valuenow/min/max` and `aria-live="polite"` for text readouts. Avoid `tabIndex={-1}` on interactive toggles and provide full focus-visible utility classes.
