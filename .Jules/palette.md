## 2024-05-18 - Icon-only buttons tooltip enhancement
**Learning:** Icon-only buttons (such as password visibility toggles) that rely solely on `aria-label`s for screen readers often lack clarity for sighted users who may be unsure of their purpose.
**Action:** Always wrap icon-only action buttons in a Radix UI `Tooltip` component to provide clear visual context for sighted users, complementing the existing `aria-label`s intended for screen readers.
