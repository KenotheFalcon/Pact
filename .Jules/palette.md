
## 2024-05-24 - Accessible password input enhancement
**Learning:** Found that custom password input toggles lacked proper keyboard accessibility. `tabIndex={-1}` prevented keyboard users from toggling visibility, and visual strength meters lacked appropriate ARIA roles to expose their meaning.
**Action:** Always verify that interactive custom elements (like `button` used as toggles) can receive focus, have visible focus rings (`focus-visible:ring-2`), and convey their state (`aria-pressed`). Apply `role="meter"` and `aria-live="polite"` to dynamically changing visual indicators like strength bars to ensure screen reader users receive equivalent feedback.
