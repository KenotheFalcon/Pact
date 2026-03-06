# Backend Development - Comprehensive Reference Guide

Consolidated backend development reference covering all aspects: technologies, APIs, security, performance, testing, DevOps, and best practices.

**Navigation:**
- [Technologies](#technologies) - Languages, frameworks, databases
- [API Design](#api-design) - REST, GraphQL, gRPC patterns
- [Security](#security) - OWASP 2025, authentication, input validation
- [Performance](#performance) - Caching, optimization, scaling
- [Architecture](#architecture) - Microservices, patterns, decisions
- [Testing](#testing) - Unit, integration, E2E, strategies
- [DevOps](#devops) - CI/CD, containers, monitoring
- [Debugging](#debugging) - Tools, profiling, production issues
- [Code Quality](#code-quality) - SOLID, patterns, maintainability
- [Mindset](#mindset) - Problem-solving, collaboration

---

## Technologies

### Languages (2025)

| Language | Best For | Key Framework | When to Choose |
|----------|----------|---------------|----------------|
| **Node.js/TypeScript** | Full-stack JS teams, real-time apps | NestJS, Fastify | Team uses JS/TS, rapid prototyping |
| **Python** | Data/ML integration, scripting | FastAPI, Django | ML features, data science team |
| **Go** | High concurrency, microservices | Gin, Echo | Microservices, simple deployment |
| **Rust** | Max performance, memory safety | Axum, Actix-web | Performance critical, reliability needed |

### Databases

**PostgreSQL (ACID, complex queries)**
```sql
-- Create composite index
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
```

**MongoDB (flexible schema, horizontal scaling)**
```javascript
// Index for performance
db.users.createIndex({ email: 1 });

// Explain query
db.users.find({ email: 'test@example.com' }).explain('executionStats');
```

**Redis (caching, sessions, real-time)**
```typescript
// Cache-aside pattern
async function getUser(id: string) {
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  
  const user = await db.users.findById(id);
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

### Connection Pooling (5-10x Performance)

```typescript
// PostgreSQL
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## API Design

### RESTful Principles

```typescript
// Consistent endpoints
GET    /api/v1/users          // List
GET    /api/v1/users/:id      // Get one
POST   /api/v1/users          // Create
PUT    /api/v1/users/:id      // Update
DELETE /api/v1/users/:id      // Delete

// Consistent error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email"
  }
}
```

### GraphQL (Flexible Queries)

```typescript
// Schema
type User {
  id: ID!
  email: String!
  posts: [Post!]!
}

// Resolver with data loader (prevents N+1)
const resolvers = {
  User: {
    posts: (user, _, { dataLoaders }) => 
      dataLoaders.posts.load(user.id),
  },
};
```

### gRPC (High Performance)

```protobuf
// Protocol Buffers definition
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);
}
```

### N+1 Query Problem

```typescript
// ❌ BAD: N+1 queries
const posts = await Post.findAll();
for (const post of posts) {
  post.author = await User.findById(post.authorId); // N queries!
}

// ✅ GOOD: Single query with JOIN
const posts = await Post.findAll({
  include: [{ model: User, as: 'author' }],
});
```

---

## Security

### OWASP Top 10 (2025)

**1. Broken Access Control**
```typescript
// Server-side authorization (never trust client)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async deleteUser(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

**2. Cryptographic Failures**
```python
# Argon2id password hashing (2025 standard)
from argon2 import PasswordHasher
ph = PasswordHasher()
hash = ph.hash("password123")
ph.verify(hash, "password123")
```

**3. Injection Attacks (98% reduction)**
```typescript
// ❌ Vulnerable
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Safe parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);
```

**4. Security Misconfiguration**
```typescript
// Essential security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"] },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  message: 'Too many requests',
});

app.use('/api/', limiter);
```

### Input Validation

```typescript
// Class-validator with NestJS
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
}
```

---

## Performance

### Caching Strategy (90% DB Load Reduction)

```typescript
// Cache-aside pattern
async function getUser(userId: string) {
  // 1. Try cache
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Cache miss - fetch from DB
  const user = await db.users.findById(userId);
  
  // 3. Store in cache (TTL: 1 hour)
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}

// Cache invalidation on update
async function updateUser(userId: string, data: UpdateUserDto) {
  const user = await db.users.update(userId, data);
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
  return user;
}
```

### Database Optimization

**Indexing (30% I/O reduction)**
```sql
-- Create index on frequently queried columns
CREATE INDEX idx_users_email ON users(email);

-- Composite index for multi-column queries
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
```

### CDN Configuration (50%+ Latency Reduction)

```typescript
// Cache-Control headers
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Static assets
res.setHeader('Cache-Control', 'public, max-age=3600'); // API responses
```

### Asynchronous Processing

```typescript
// Bull queue for background jobs
const emailQueue = new Queue('email', { redis: { host: 'localhost', port: 6379 } });

// Producer
await emailQueue.add('send-welcome', { userId: user.id, email: user.email });

// Consumer
emailQueue.process('send-welcome', async (job) => {
  await sendWelcomeEmail(job.data.email);
});
```

---

## Architecture

### Microservices Patterns

**API Gateway Pattern**
```
Client → API Gateway (auth, rate limiting) → Services
              ↓
         Service A, B, C...
```

**Event-Driven Architecture**
```typescript
// Event emitter
const eventEmitter = new EventEmitter();

// Producer
eventEmitter.emit('order.created', { orderId: 123 });

// Consumer
eventEmitter.on('order.created', async (data) => {
  await sendConfirmationEmail(data.orderId);
});
```

### Domain-Driven Design (DDD)

```
Sales Context:          Inventory Context:
- Order                 - Product
- Customer              - StockLevel
- Payment               - Warehouse
```

### CAP Theorem

- **CP** (Consistency + Partition): Banking, financial transactions
- **AP** (Availability + Partition): Social feeds, product catalogs
- Choose based on domain requirements

---

## Testing

### Test Pyramid (70-20-10 Rule)

```
    /\  E2E Tests     (10%)
   /  \  - Expensive, validate real user flows
  /----\  
 /Integr.\ Integration (20%)
/----------\  - Verify component interactions
/   Unit     \ Unit Tests (70%)
/--------------\  - Fast, isolate bugs
```

### Unit Testing

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = { email: 'test@example.com', name: 'Test' };
      const user = await userService.createUser(userData);
      
      expect(user).toMatchObject(userData);
      expect(user.id).toBeDefined();
    });

    it('should throw error with duplicate email', async () => {
      await expect(userService.createUser({ email: 'existing@example.com' }))
        .rejects.toThrow('Email already exists');
    });
  });
});
```

### Integration Testing

```typescript
import request from 'supertest';

describe('POST /api/users', () => {
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);

    expect(response.body.email).toBe('test@example.com');
  });
});
```

### Load Testing (k6)

```javascript
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
  },
};

export default function () {
  http.get('https://api.example.com/users');
}
```

---

## DevOps

### Docker Multi-Stage Build

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nodejs
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    spec:
      containers:
      - name: api
        image: myapp:v1.0.0
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:ci
      - run: npm audit

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: docker build -t myapp:${{ github.sha }} .
      - run: kubectl set image deployment/api api=myapp:${{ github.sha }}
```

### Monitoring

```typescript
// Prometheus metrics
import { Counter, Histogram } from 'prom-client';

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestTotal.inc({ method: req.method, route: req.route?.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route: req.route?.path }, duration);
  });
  next();
});
```

---

## Debugging

### Production Debugging

**Application Performance Monitoring (APM)**
```typescript
// Sentry error tracking
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, { user: { id: userId } });
}
```

**Distributed Tracing (OpenTelemetry)**
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({ endpoint: 'http://localhost:14268/api/traces' }),
});
sdk.start();
```

### Common Issues

**High CPU Usage**
```bash
# Profile Node.js
0x node app.js
# Look for hot functions in flamegraph
```

**Memory Leaks**
```typescript
// Take heap snapshot
import { writeHeapSnapshot } from 'v8';
app.get('/debug/heap', (req, res) => {
  const filename = writeHeapSnapshot();
  res.send(`Snapshot: ${filename}`);
});
```

**Connection Pool Exhaustion**
```typescript
// ❌ Bad: Connection leak
async function getUser(id) {
  const client = await pool.connect();
  const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0]; // Never released!
}

// ✅ Good: Always release
async function getUser(id) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release();
  }
}
```

---

## Code Quality

### SOLID Principles

**Single Responsibility**
```typescript
// ❌ Bad: Multiple responsibilities
class User {
  authenticate() {}
  sendEmail() {}
  logActivity() {}
}

// ✅ Good: Separate concerns
class User {
  authenticate() {}
}
class EmailService {
  sendEmail() {}
}
class Logger {
  logActivity() {}
}
```

**Open/Closed Principle**
```typescript
// ✅ Strategy pattern
interface PaymentStrategy {
  process(amount: number): Promise<PaymentResult>;
}

class StripePayment implements PaymentStrategy {
  async process(amount: number) { /* ... */ }
}
```

### Layered Architecture

```
┌─────────────────────────────┐
│   Presentation Layer        │  Controllers, Routes
├─────────────────────────────┤
│   Business Logic Layer      │  Services, Use Cases
├─────────────────────────────┤
│   Data Access Layer         │  Repositories, ORMs
└─────────────────────────────┘
```

---

## Mindset

### Problem-Solving Approach

**Systems Thinking**
```
User Request → Load Balancer → API Gateway → Application → Cache → Database → External Services
```

**Questions to Ask:**
- What happens if this component fails?
- How does this scale under load?
- Where are the bottlenecks?
- What's the blast radius of changes?

### Trade-Off Analysis

**Performance vs Maintainability**
| Optimize For | When to Choose |
|--------------|---------------|
| **Performance** | Hot paths, high-traffic endpoints |
| **Maintainability** | Internal tools, admin dashboards |
| **Both** | Core business logic, payments |

### Designing for Failure

```typescript
// Circuit Breaker pattern
import { CircuitBreaker } from 'opossum';

const breaker = new CircuitBreaker(externalAPICall, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

breaker.fallback(() => ({ data: 'cached-response' }));
const result = await breaker.fire(requestParams);
```

---

## Quick Reference Checklist

### API Security
- [ ] HTTPS/TLS 1.3 only
- [ ] OAuth 2.1 + JWT authentication
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all inputs
- [ ] Parameterized queries (prevent SQL injection)
- [ ] Security headers configured
- [ ] CORS properly configured (not `*` in production)
- [ ] API versioning implemented

### Performance
- [ ] Redis caching for hot data
- [ ] Database indexes on frequently queried columns
- [ ] Connection pooling configured
- [ ] N+1 queries eliminated
- [ ] CDN for static assets
- [ ] Async processing for long tasks
- [ ] Compression enabled (gzip/brotli)

### Testing
- [ ] Unit tests cover 70% of codebase
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] Load tests configured (k6/Gatling)
- [ ] Security scanning in CI/CD
- [ ] Code coverage reports automated

### DevOps
- [ ] CI/CD pipeline configured
- [ ] Docker multi-stage builds
- [ ] Kubernetes deployment manifests
- [ ] Blue-green or canary deployment
- [ ] Health checks (liveness + readiness)
- [ ] Monitoring: Prometheus + Grafana
- [ ] Distributed tracing: Jaeger/OpenTelemetry
- [ ] Secrets management (Vault/AWS Secrets)

---

## Resources

- **NestJS:** https://nestjs.com
- **FastAPI:** https://fastapi.tiangolo.com
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Redis:** https://redis.io/docs/
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Docker:** https://docs.docker.com/
- **Kubernetes:** https://kubernetes.io/docs/

---

*This consolidated guide replaces: backend-api-design.md, backend-architecture.md, backend-authentication.md, backend-code-quality.md, backend-debugging.md, backend-devops.md, backend-mindset.md, backend-performance.md, backend-security.md, backend-technologies.md, backend-testing.md*
