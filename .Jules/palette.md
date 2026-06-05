## 2024-06-05 - Missing ARIA label on cart remove button
**Learning:** Icon-only buttons (like the `Trash2` icon on the cart page) require an `aria-label` attribute to be accessible to screen readers, especially when they perform critical actions like removing items from a cart. The `size="icon"` prop on `Button` components is a strong signal to check for this.
**Action:** Always verify the presence of `aria-label` when using `<Button size="icon">` combined with an icon-only child.
