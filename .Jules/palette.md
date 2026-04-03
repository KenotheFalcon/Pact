## 2024-05-24 - Accessible Password Toggle
**Learning:** Icon-only action buttons (like password visibility toggles) that use `tabIndex={-1}` completely break keyboard navigation for that element. Relying only on visual feedback is insufficient.
**Action:** Always wrap icon-only buttons in a Radix UI Tooltip to clarify purpose for sighted users, ensure standard `aria-label` and `aria-pressed` attributes are present for screen readers, and remove `tabIndex={-1}` while adding `focus-visible` utility classes to guarantee keyboard accessibility.
