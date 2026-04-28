
## 2024-04-28 - ARIA Enhancements for Password Input Controls
**Learning:** Custom UI components like password strength meters and toggle buttons often lack native semantics. `div`s used as meters are opaque to screen readers without specific roles (`role="meter"`) and live region announcements (`aria-live="polite"`). Similarly, toggle buttons without inner text need explicit `aria-label`, `aria-pressed`, and properly hidden icons.
**Action:** When implementing custom inputs or visual indicators (like strength meters or progress bars), always explicitly define their ARIA roles, state properties (min/max/val), and live region status for dynamic text. Use `focus-visible` to ensure keyboard navigability without disrupting mouse interactions.
