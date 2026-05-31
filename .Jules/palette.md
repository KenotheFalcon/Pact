## 2026-05-31 - Component Testing with Playwright
**Learning:** When using Playwright to visually verify component focus rings inside an arbitrary test route container, you should add padding to the body (e.g. `document.body.style.padding = '50px'`) to prevent focus rings from being visually cropped at the top/left edges of the viewport.
**Action:** Use page evaluate to add padding during frontend verification to ensure screenshots accurately reflect focus styles.
