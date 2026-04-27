
## 2024-05-27 - Keyboard Accessibility for Password Visibility Toggle
**Learning:** Using `tabIndex={-1}` on state toggle buttons (like showing/hiding a password) blocks keyboard users from accessing that functionality. Furthermore, toggle buttons must use `aria-pressed` to convey their current state to screen readers, and decorative icons inside them should use `aria-hidden="true"`.
**Action:** When reviewing interactive elements, ensure they are in the natural tab order unless there's a specific reason to exclude them, apply consistent `focus-visible` styles, and verify stateful buttons use appropriate ARIA attributes.
