---
name: backend-development
description: "Build robust backend systems with modern technologies. Primary skill for API design, authentication, database optimization, security, and DevOps. References consolidated backend reference guide for detailed implementations."
version: 1.0
priority: 6
depends_on: [web-design-guidelines]
communication_mode: adaptive
phase: implementation
documentation_path: "docs/handoffs/"
workflow_position: |
  ## Unified Workflow Position
  
  **Position in workflow: 6 of 7**
  
  **Previous Skills:** 
  1. brainstorming (requirements)
  2. ui-ux-pro-max (design inspiration)
  3. frontend-design (creative implementation)
  4. responsive-design (technical responsive patterns)
  5. web-design-guidelines (validation)
  
  **Purpose:** Backend API and system development
  
  **For API work that frontend will consume:**
  After completing backend work, use backend-to-frontend-handoff-docs 
  to create documentation for frontend developers.
  
  **Key References:**
  - See `references/backend-comprehensive.md` (consolidated guide)
  
  **Next Skill:** backend-to-frontend-handoff-docs (for API documentation)
  
  **Related Skills:**
  - brainstorming (for API requirements)
  - backend-to-frontend-handoff-docs (for handoff documentation)
license: MIT
---

# Backend Development Skill

Production-ready backend development with modern technologies, best practices, and proven patterns.

## When to Use

- Designing RESTful, GraphQL, or gRPC APIs
- Building authentication/authorization systems
- Optimizing database queries and schemas
- Implementing caching and performance optimization
- OWASP Top 10 security mitigation
- Designing scalable microservices
- Testing strategies (unit, integration, E2E)
- CI/CD pipelines and deployment
- Monitoring and debugging production systems

## Technology Selection Guide

**Languages:** Node.js/TypeScript (full-stack), Python (data/ML), Go (concurrency), Rust (performance)
**Frameworks:** NestJS, FastAPI, Django, Express, Gin
**Databases:** PostgreSQL (ACID), MongoDB (flexible schema), Redis (caching)
**APIs:** REST (simple), GraphQL (flexible), gRPC (performance)

See: `references/backend-technologies.md` for detailed comparisons

## Reference Navigation

**Consolidated Guide:**
- `backend-comprehensive.md` - **COMPLETE REFERENCE** covering all backend topics:
  - Technologies (languages, frameworks, databases)
  - API Design (REST, GraphQL, gRPC)
  - Security (OWASP 2025, authentication, validation)
  - Performance (caching, optimization, scaling)
  - Architecture (microservices, patterns)
  - Testing (unit, integration, E2E)
  - DevOps (Docker, Kubernetes, CI/CD)
  - Debugging (tools, profiling, production issues)
  - Code Quality (SOLID, patterns)
  - Mindset (problem-solving, collaboration)

**Quick Access:** See the comprehensive guide's table of contents for navigation.

## Key Best Practices (2025)

**Security:** Argon2id passwords, parameterized queries (98% SQL injection reduction), OAuth 2.1 + PKCE, rate limiting, security headers

**Performance:** Redis caching (90% DB load reduction), database indexing (30% I/O reduction), CDN (50%+ latency cut), connection pooling

**Testing:** 70-20-10 pyramid (unit-integration-E2E), Vitest 50% faster than Jest, contract testing for microservices, 83% migrations fail without tests

**DevOps:** Blue-green/canary deployments, feature flags (90% fewer failures), Kubernetes 84% adoption, Prometheus/Grafana monitoring, OpenTelemetry tracing

## Quick Decision Matrix

| Need | Choose |
|------|--------|
| Fast development | Node.js + NestJS |
| Data/ML integration | Python + FastAPI |
| High concurrency | Go + Gin |
| Max performance | Rust + Axum |
| ACID transactions | PostgreSQL |
| Flexible schema | MongoDB |
| Caching | Redis |
| Internal services | gRPC |
| Public APIs | GraphQL/REST |
| Real-time events | Kafka |

## Implementation Checklist

**API:** Choose style → Design schema → Validate input → Add auth → Rate limiting → Documentation → Error handling

**Database:** Choose DB → Design schema → Create indexes → Connection pooling → Migration strategy → Backup/restore → Test performance

**Security:** OWASP Top 10 → Parameterized queries → OAuth 2.1 + JWT → Security headers → Rate limiting → Input validation → Argon2id passwords

**Testing:** Unit 70% → Integration 20% → E2E 10% → Load tests → Migration tests → Contract tests (microservices)

**Deployment:** Docker → CI/CD → Blue-green/canary → Feature flags → Monitoring → Logging → Health checks

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OAuth 2.1: https://oauth.net/2.1/
- OpenTelemetry: https://opentelemetry.io/
