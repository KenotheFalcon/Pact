# Efficiency Improvement Plan

**Date:** February 12, 2026
**Status:** Approved for Implementation
**Scope:** Performance, Type Safety, Bundle Size, Code Quality, Developer Tooling

---

## Executive Summary

A 5-phase plan to address critical runtime bugs, type safety gaps, bundle bloat, code quality issues, and missing developer tooling across the PACT marketplace codebase. Phases are ordered by severity (critical first). Each phase is designed as a self-contained Ralph Loop invocation.

**Total Estimated Iterations:** 55-66 across 5 phases
**Execution:** Sequential (each phase must pass `npm run build` before proceeding)
**Automation:** Ralph Loop CLI with per-phase prompt files

---

## Audit Findings Summary

Five parallel audits were conducted on February 10, 2026:

| Audit | Key Finding | Severity |
|-------|-------------|----------|
| **PRD vs Implementation** | 94% implemented. 5 partial gaps, 1 missing feature (loyalty/referrals) | LOW |
| **Test File Type Errors** | 52 errors across 3 test files (mock typing + NextRequest) | HIGH |
| **Missing DB Types** | 6 tables queried in code but absent from `src/types/supabase.ts` | HIGH |
| **Bundle & Performance** | Broken Cache-Control (1yr immutable on ALL paths), redundant middleware DB calls, no Supabase client singleton, 280KB sync-loaded libs | CRITICAL |
| **Code Quality** | 30+ `any` violations, 4 duplicate formatters, 5 API routes bypass response helpers, dead code, no ESLint type rules | MEDIUM |

---

## Phase 1: Critical Runtime Fixes

**Severity:** CRITICAL + HIGH
**Iterations:** 8-12
**Prompt:** `.ralph/prompts/phase-1-critical.md`

| # | Task | File(s) | Details |
|---|------|---------|---------|
| 1 | Fix Cache-Control headers | `next.config.js:61-81` | Remove `/:path*` catch-all (1yr immutable on HTML pages). Remove/scope API caching to GET-only or remove entirely. Image caching stays via `minimumCacheTTL`. |
| 2 | Optimize middleware DB calls | `src/lib/supabase/middleware.ts` | Only call `getUser()` + profile query for protected routes. Public pages and API webhooks should skip auth entirely. |
| 3 | Singleton browser Supabase client | `src/lib/supabase/client.ts` | Cache client instance at module level. Every call currently creates a new `createBrowserClient()`. |
| 4 | Dynamic import Leaflet | `src/components/marketplace/PoolMap.tsx` | Wrap with `next/dynamic` + `ssr: false`. Removes ~140KB from initial bundle. |
| 5 | Add framer-motion to optimizePackageImports | `next.config.js:9` | Append `'framer-motion'` to the array. Enables tree-shaking for ~140KB library used in 49 files. |

**Completion Criteria:**
- `npm run build` passes
- No `immutable` in Cache-Control for HTML responses
- Middleware skips DB calls for public routes
- Leaflet not in initial JS bundle (verify via build output)

**Run:**
```bash
ralph --prompt-file .ralph/prompts/phase-1-critical.md --max-iterations 12 --tasks
```

---

## Phase 2: Type System Completion

**Severity:** HIGH + MEDIUM
**Iterations:** 10-15
**Prompt:** `.ralph/prompts/phase-2-types.md`

| # | Task | File(s) | Details |
|---|------|---------|---------|
| 1 | Add 6 missing table types | `src/types/supabase.ts` | `FarmerBankAccountRow`, `FarmerRow`, `WebhookLogRow`, `ChargebackRow`, `FarmerPayoutStatsRow`, `AdminAuditLogRow`. Must use `type` not `interface`. |
| 2 | Remove `as any` casts | farmer/settings, farmer/onboarding, admin/webhook-logs, chargeback.service.ts | After types are added, replace all `as any` with proper typing. |
| 3 | Fix remaining `any` types | 24+ locations in non-test source files | Replace with proper types or `unknown` + type guards. |
| 4 | Fix 52 test file type errors | `contact-submissions.test.ts`, `farmer/payouts.test.ts`, `payments/init.test.ts` | Create typed mock factory. Fix `Request` to `NextRequest`. Fix `pool.listing` access. |

**Completion Criteria:**
- `npx tsc --noEmit` exits with 0 errors
- `npm run test` passes
- Zero `as any` in source files (excluding test helpers if absolutely necessary)

**Run:**
```bash
ralph --prompt-file .ralph/prompts/phase-2-types.md --max-iterations 15 --tasks
```

---

## Phase 3: Dead Code & Bundle Optimization

**Severity:** MEDIUM
**Iterations:** 8-12
**Prompt:** `.ralph/prompts/phase-3-bundle.md`

| # | Task | File(s) | Details |
|---|------|---------|---------|
| 1 | Delete dead files | 4 files (see prompt) | `AnimatedButton.tsx`, `product-card.tsx`, `farmer/demo-page.tsx`, `client-demo.ts`. Also remove `createDemoClient()` from `client.ts`. |
| 2 | Remove unused dependencies | `package.json` | `react-hook-form`, `@radix-ui/react-toast` (0 imports each). |
| 3 | Move dev dependencies | `package.json` | `supabase`, `@next/bundle-analyzer` should be in `devDependencies`. |
| 4 | Consolidate StatCard | `src/components/farmer/StatCard.tsx` -> `src/components/ui/stat-card.tsx` | Keep the configurable ui/ version. Update farmer/page.tsx imports. Delete farmer/ version. |
| 5 | Consolidate EmptyState | `src/components/marketplace/EmptyState.tsx` -> `src/components/ui/empty-state.tsx` | Keep the configurable ui/ version. Update marketplace/page.tsx. Delete marketplace/ version. |

**Completion Criteria:**
- `npm run build` passes
- Deleted files do not exist on disk
- No broken imports (build verifies this)
- `npm ls react-hook-form` shows "not found"

**Run:**
```bash
ralph --prompt-file .ralph/prompts/phase-3-bundle.md --max-iterations 12 --tasks
```

---

## Phase 4: Code Quality & Consistency

**Severity:** MEDIUM + LOW
**Iterations:** 10-15
**Prompt:** `.ralph/prompts/phase-4-quality.md`

| # | Task | File(s) | Details |
|---|------|---------|---------|
| 1 | Consolidate formatters | `src/lib/formatters.ts` (new), 6 inline implementations | Create shared `formatCurrency()`, `formatDate()`, `formatCompactCurrency()`. Replace all inline copies. |
| 2 | Migrate 5 API routes to response helpers | 5 route files (see prompt) | Replace `NextResponse.json()` with `apiSuccess()`, `apiError()`, etc. from `@/lib/api/responses`. |
| 3 | Replace console.error/warn in client code | ~16 locations | Use toast or silent handling in client components. Server-side console calls are acceptable. |
| 4 | Fix catch block typing | All `catch (error)` blocks | Change to `catch (error: unknown)` with `getErrorMessage()` from response helpers. |
| 5 | Fix barrel exports | Any `export *` patterns | Change to named exports for tree-shaking. |

**Completion Criteria:**
- `npm run build` passes
- `npm run lint` passes
- No `NextResponse.json(` in the 5 listed API route files
- No inline `formatCurrency` definitions outside `src/lib/`

**Run:**
```bash
ralph --prompt-file .ralph/prompts/phase-4-quality.md --max-iterations 15 --tasks
```

---

## Phase 5: Developer Tooling & PRD Gaps

**Severity:** LOW + Feature
**Iterations:** 8-12
**Prompt:** `.ralph/prompts/phase-5-tooling.md`

| # | Task | File(s) | Details |
|---|------|---------|---------|
| 1 | Add ESLint rules | `.eslintrc.json`, `package.json` | `@typescript-eslint/no-explicit-any`, `no-console`, import ordering. Install parser + plugin as devDeps. |
| 2 | Add Prettier config | `.prettierrc` (new), `package.json` | `singleQuote: true, semi: false, trailingComma: 'es5'`. Install prettier + eslint-config-prettier. Format codebase. |
| 3 | Update tsconfig.json | `tsconfig.json` | Set `lib: ["ES2022", "DOM", "DOM.Iterable"]`, narrow `include`. |
| 4 | Wire pool-lock notifications | Edge function / process-pools API | After pool status changes to 'locked', trigger notification send. |
| 5 | Background sync for pledges | `public/sw.js` | Add sync handler to queue and retry failed pledge submissions when back online. |

**Completion Criteria:**
- `npm run lint` passes with new rules (may require `eslint-disable` comments for intentional exceptions)
- `npm run build` passes
- `npx prettier --check "src/**/*.{ts,tsx}"` exits clean
- Pool lock triggers notification (testable via API)

**Run:**
```bash
ralph --prompt-file .ralph/prompts/phase-5-tooling.md --max-iterations 12 --tasks
```

---

## Execution Order

```
Phase 1 (Critical) -> npm run build -> Phase 2 (Types) -> npx tsc --noEmit -> npm run test
   -> Phase 3 (Bundle) -> npm run build -> Phase 4 (Quality) -> npm run build + lint
   -> Phase 5 (Tooling) -> npm run build + lint + prettier --check
```

Each phase MUST pass its verification commands before proceeding to the next.

---

## Risk Notes

| Phase | Risk | Mitigation |
|-------|------|------------|
| 1 | Removing Cache-Control could reveal latency issues | Profile after change; add targeted caching if needed |
| 1 | Middleware optimization could break auth on edge cases | Test all protected route combinations |
| 2 | Adding table types with wrong column names causes build errors | Cross-reference actual Supabase schema via MCP or migrations |
| 3 | Deleting components might break pages not covered by imports search | Full build verification after each deletion |
| 4 | Formatter consolidation could change displayed currency format | Visual comparison before/after |
| 5 | Stricter ESLint rules may surface dozens of new violations | Use `--fix` for auto-fixable, manual for the rest |

---

## Source

- Session 6 audit data (5 parallel audits)
- Codebase analysis: next.config.js, middleware.ts, supabase/client.ts, types/supabase.ts
- PRD.md, PROJECT_SUMMARY.md, AGENTS.md
