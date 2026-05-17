## 2024-05-17 - Add missing aria-label to custom icon buttons
**Learning:** Found an accessibility gap where `<Button size="icon">` components in `src/app/cart/page.tsx` lacked an `aria-label`. The icon is decorative/visual (`<Trash2 />`) and there is no inner text, so screen readers can't interpret the button's purpose without an `aria-label`.
**Action:** When using the custom `Button` component with `size="icon"`, always explicitly verify the presence of an `aria-label` property to ensure proper screen reader accessibility.
