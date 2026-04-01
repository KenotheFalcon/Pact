## 2026-04-01 - Icon-Only Button Context
**Learning:** Icon-only buttons (like password visibility toggles and theme switchers), while accompanied by `aria-label` for screen readers, often lack visual context for sighted users, leading to ambiguity.
**Action:** Wrap icon-only actionable buttons in Radix UI `Tooltip` components to provide explicit visual meaning on hover and focus.
