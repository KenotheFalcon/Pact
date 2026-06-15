## 2026-06-15 - Adding ARIA labels to Next.js components
**Learning:** Found an icon-only remove button without an aria-label in the cart page. It's important to remember these small accessibility details in components with inline SVGs/lucide icons inside Buttons.
**Action:** Always check `size="icon"` buttons across the codebase to ensure they possess a descriptive `aria-label` for screen-reader users.
