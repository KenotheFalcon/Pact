## 2024-03-17 - Textarea Focus Styling Regressions
**Learning:** Altering foundational form styles (like Textarea padding, border radius, and custom focus rings) in isolation causes visual inconsistencies with other form components like Select. Furthermore, using a custom focus ring color with low opacity (e.g., ring-pact-green/20) and removing the ring-offset significantly reduces keyboard focus visibility and creates accessibility contrast regressions.
**Action:** Always test focus states across multiple components when changing form styles, and maintain high-contrast focus rings with visible offsets to ensure keyboard navigation accessibility.

## 2024-03-17 - Adding Tooltips to Icon-Only Buttons
**Learning:** Icon-only toggle buttons (like the password visibility eye icon) already have aria-labels for screen readers, but sighted users benefit greatly from a visual tooltip to clarify the button's action.
**Action:** Consistently wrap icon-only action buttons in Radix UI Tooltip components, using the asChild prop on TooltipTrigger to pass event handlers and refs correctly.
