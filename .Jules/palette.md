## 2025-05-18 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Some developers use `size="icon"` on the custom `<Button>` component without including the mandatory `aria-label` for screen readers, meaning users reliant on assistive technology cannot perceive the button's action (e.g., removing from a cart).
**Action:** When adding `size="icon"` buttons in the future or auditing existing ones, verify they have a proper accessible name (using `aria-label`).
