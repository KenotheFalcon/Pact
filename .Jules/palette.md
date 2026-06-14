## 2026-06-14 - Accessible icon buttons
**Learning:** The `<Button size="icon">` components lacking internal text node children across the codebase require immediate attention. They are completely silent to screen readers without an `aria-label`.
**Action:** Always search for `size="icon"` usages when checking components to ensure explicit `aria-label` coverage is present, falling back to contextual variables (e.g. `listing?.title`) where helpful to the screen reader user.
