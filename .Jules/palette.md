## 2025-02-12 - Aria Labels on icon Buttons
**Learning:** In Next.js shadcn/ui apps, when using standard `Button` components with `size="icon"` containing only decorative `lucide-react` icons (like `Trash2`, `LogOut`, etc), they often lack an accessible name, making them unreadable by screen readers. It's a common oversight in complex layouts like carts and sidebars.
**Action:** Always write a quick grep or script to verify `<Button size="icon"` elements also contain a matching `aria-label` attribute if they do not contain meaningful text content.
