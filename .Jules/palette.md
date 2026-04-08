## 2024-04-08 - Added Tooltip to Icon-only Button
**Learning:** Icon-only buttons without labels (like a generic trash can for "remove") can be ambiguous and lack accessibility for sighted users who may not understand the icon, complementing the `aria-label` intended for screen readers.
**Action:** Always wrap icon-only action buttons (e.g., in lists or tables) with a Radix UI `Tooltip` to clarify their specific purpose and improve the micro-UX.
