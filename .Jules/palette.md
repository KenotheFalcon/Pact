## 2025-02-12 - Sticky Headers Intercepting Clicks in Tests
**Learning:** In verification scripts, a fixed top navigation bar (`nav.fixed.top-0`) can frequently intercept Playwright `.click()` actions on interactive elements near the top of the viewport, leading to timeout errors.
**Action:** When writing Playwright scripts to interact with elements near the top of the page, add a temporary padding offset (e.g., `page.evaluate("document.body.style.paddingTop = '100px'")`) to ensure the elements are not occluded by the sticky header.
