## 2026-07-04 - Add ARIA label to cart remove button
**Learning:** Found an icon-only button without an accessible name (`aria-label`) in the shopping cart component `src/app/cart/page.tsx` for the "Remove from cart" action. This makes the button's action indiscernible to screen readers.
**Action:** Always include an `aria-label` or `.sr-only` text for icon-only buttons (`size="icon"`). Added an `aria-label` that includes the product title for better context to users of assistive technologies.
