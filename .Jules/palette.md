
## 2026-03-19 - Tooltips on Icon-Only Actions
**Learning:** While `aria-label` provides essential context for screen readers on icon-only buttons, sighted users navigating via mouse or keyboard focus may lack clear context for ambiguous icons. Tooltips provide this critical context without cluttering the UI.
**Action:** For all icon-only action buttons (such as password visibility toggles), wrap them in a Radix UI `Tooltip` component to clarify their purpose for sighted users, complementing the existing `aria-label`s intended for screen readers.
