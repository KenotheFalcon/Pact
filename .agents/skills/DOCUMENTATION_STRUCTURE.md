# Project Documentation Structure

Standardized documentation organization for all skills.

## Directory Structure

```
docs/
├── plans/           # Planning and design documents (from brainstorming)
│   └── YYYY-MM-DD-<feature>-design.md
├── designs/         # UI/UX design specifications
│   └── <feature>/
│       └── design-v<version>.md
├── handoffs/        # API and backend handoff documentation
│   └── <feature>/
│       └── api-v<version>.md
├── reviews/         # Code review and validation reports
│   └── YYYY-MM-DD-<feature>-review.md
└── reference/       # Consolidated reference guides
    └── backend-comprehensive.md
```

## Skill Documentation Mapping

| Skill | Outputs To | File Pattern |
|-------|------------|--------------|
| **brainstorming** | `docs/plans/` | `YYYY-MM-DD-<topic>-design.md` |
| **ui-ux-pro-max** | `docs/designs/` | `<feature>/design-system.md` |
| **frontend-design** | `docs/designs/` | `<feature>/implementation.md` |
| **responsive-design** | `docs/designs/` | `<feature>/responsive-spec.md` |
| **web-design-guidelines** | `docs/reviews/` | `YYYY-MM-DD-<feature>-review.md` |
| **backend-development** | `docs/handoffs/` | `<feature>/api-spec.md` |
| **backend-to-frontend-handoff-docs** | `docs/handoffs/` | `<feature>/api-handoff.md` |

## File Naming Conventions

### Plans (brainstorming)
- Format: `YYYY-MM-DD-<topic>-design.md`
- Example: `2025-02-09-user-authentication-design.md`

### Designs (ui-ux-pro-max, frontend-design, responsive-design)
- Format: `<feature>/<type>-v<version>.md`
- Example: `login/design-v1.md`, `login/responsive-spec-v1.md`

### Handoffs (backend-development, backend-to-frontend-handoff-docs)
- Format: `<feature>/api-v<version>.md`
- Example: `payment/api-v1.md`, `payment/api-handoff-v1.md`

### Reviews (web-design-guidelines)
- Format: `YYYY-MM-DD-<feature>-review.md`
- Example: `2025-02-09-dashboard-review.md`

## Workflow Integration

1. **Planning Phase** (brainstorming)
   - Creates: `docs/plans/YYYY-MM-DD-feature-design.md`
   - Contains: Requirements, architecture, success criteria

2. **Design Phase** (ui-ux-pro-max, frontend-design)
   - Creates: `docs/designs/feature/design-v1.md`
   - Contains: Visual design, component specs

3. **Implementation Phase** (frontend-design, responsive-design, backend-development)
   - Updates: `docs/designs/feature/implementation.md`
   - Contains: Technical implementation details

4. **Review Phase** (web-design-guidelines)
   - Creates: `docs/reviews/YYYY-MM-DD-feature-review.md`
   - Contains: Compliance check results

5. **Handoff Phase** (backend-to-frontend-handoff-docs)
   - Creates: `docs/handoffs/feature/api-handoff-v1.md`
   - Contains: API documentation for frontend team

## Versioning

- Use semantic versioning for design docs: `v1`, `v1.1`, `v2`
- Increment version on major changes
- Keep previous versions for reference
- Latest version is always `v<current>` without date

## Cross-References

All documents should reference related docs:

```markdown
## Related Documents

- **Requirements:** [../../plans/2025-02-09-feature-design.md](../../plans/2025-02-09-feature-design.md)
- **Design System:** [./design-system-v1.md](./design-system-v1.md)
- **Implementation:** [./implementation-v1.md](./implementation-v1.md)
- **Review:** [../../reviews/2025-02-10-feature-review.md](../../reviews/2025-02-10-feature-review.md)
```

## Communication Mode by Phase

| Phase | Skills | Communication Mode |
|-------|--------|-------------------|
| Planning | brainstorming | Collaborative (questions) |
| Design | ui-ux-pro-max, frontend-design | Collaborative (discussion) |
| Implementation | responsive-design, backend-development | Adaptive (mixed) |
| Review | web-design-guidelines | Silent (report only) |
| Documentation | backend-to-frontend-handoff-docs | Silent (output only) |

---

*This structure ensures consistent documentation across all skills and workflows.*
