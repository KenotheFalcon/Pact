
## 2024-05-24 - Accessible Password Toggles
**Learning:** Icon-only buttons, such as password visibility toggles, can be confusing for sighted users who don't use screen readers, even if they have `aria-label`s. Furthermore, using `tabIndex={-1}` on interactive elements hinders keyboard navigation.
**Action:** Always wrap icon-only buttons in Radix UI `Tooltip` components to provide visible labels for all users, and ensure they are keyboard accessible by omitting `tabIndex={-1}` and adding appropriate focus styles (`focus-visible:ring-*`).
