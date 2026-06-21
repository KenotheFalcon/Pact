## 2024-06-21 - Added Accessibility to Password Visibility Toggle
**Learning:** Icon-only buttons used for state toggles (like password visibility) often miss `aria-label`, `aria-pressed`, and keyboard focus (`tabIndex={-1}`). Icons themselves should have `aria-hidden="true"`.
**Action:** When adding or reviewing custom toggle components or icon-only buttons, always ensure they have descriptive `aria-label`, correct `aria-pressed` state, visible keyboard focus rings (via `focus-visible`), and hide purely decorative icons from screen readers.
