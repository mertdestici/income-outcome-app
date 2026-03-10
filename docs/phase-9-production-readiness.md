# Phase 9: Production Readiness

## Status: Complete ✓ (deploy step remaining)

## Overview
Harden the application for real-world deployment: CORS, API documentation, structured logging, Dockerfile, and deployment to a free-tier cloud platform. Several items (input validation, global exception handler) are already done in earlier phases and can be checked off immediately.

---

## Items by Category

### Already Done (from earlier phases)
- [x] Environment-based config (dev/prod profiles) — Phase 1
- [x] Input validation (Bean Validation) — Phases 2, 3, 4
- [x] Global exception handler (`@RestControllerAdvice`) — Phase 2

---

### 1. CORS Configuration

Add to `SecurityConfig.java`:

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(
        "http://localhost:5173",          // Vite dev
        "${app.cors.allowed-origin}"      // prod domain from env
    ));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    cfg.setAllowCredentials(false);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", cfg);
    return source;
}
```

Update `securityFilterChain`:
```java
.cors(cors -> cors.configurationSource(corsConfigurationSource()))
```

Add to `application-prod.yml`:
```yaml
app:
  cors:
    allowed-origin: ${CORS_ALLOWED_ORIGIN}
```

---

### 2. API Documentation (SpringDoc OpenAPI / Swagger UI)

Add dependency to `build.gradle.kts`:
```kotlin
implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4")
```

Add to `application.yml`:
```yaml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    operations-sorter: method
```

Permit Swagger UI paths in `SecurityConfig`:
```java
.requestMatchers(
    "/api/auth/**",
    "/api/rates",
    "/api-docs/**",
    "/swagger-ui/**",
    "/swagger-ui.html"
).permitAll()
```

Annotate controllers with `@Tag`, endpoints with `@Operation` as needed.

---

### 3. Structured Logging (SLF4J + Logback)

Spring Boot includes SLF4J + Logback by default. Add structured request logging:

- `config/RequestLoggingConfig.java`
  ```java
  @Bean
  CommonsRequestLoggingFilter requestLoggingFilter() {
      CommonsRequestLoggingFilter filter = new CommonsRequestLoggingFilter();
      filter.setIncludeQueryString(true);
      filter.setIncludeClientInfo(true);
      filter.setMaxPayloadLength(1000);
      return filter;
  }
  ```

- Add to `application-dev.yml`:
  ```yaml
  logging:
    level:
      org.springframework.web.filter.CommonsRequestLoggingFilter: DEBUG
  ```

- Add to `application-prod.yml`:
  ```yaml
  logging:
    level:
      com.incomeoutcome: INFO
    pattern:
      console: '{"time":"%d","level":"%p","logger":"%logger","msg":"%m"}%n'
  ```

---

### 4. Dockerfile

```dockerfile
# backend/Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Update `docker-compose.yml` to include the app service:
```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: income_outcome_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DATABASE_URL: jdbc:postgresql://postgres:5432/income_outcome_dev
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
```

---

### 5. Rate Limiting

Add dependency:
```kotlin
implementation("com.bucket4j:bucket4j-core:8.10.1")
```

- `config/RateLimitFilter.java` — `OncePerRequestFilter`
  - Bucket per IP: 60 requests/minute for general API, 10 requests/minute for `/api/auth/**`
  - Returns `429 Too Many Requests` when bucket exhausted

---

### 6. Deployment (Railway or Render)

**Railway (recommended):**
1. Connect GitHub repo
2. Set env vars: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`, `SPRING_PROFILES_ACTIVE=prod`
3. Railway auto-detects Dockerfile and builds

**Frontend (Vercel/Netlify):**
1. `cd frontend && npm run build`
2. Deploy `dist/` folder
3. Set `VITE_API_BASE_URL` to Railway backend URL

---

## Environment Variables Reference (Prod)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full JDBC URL |
| `DATABASE_USERNAME` | DB user |
| `DATABASE_PASSWORD` | DB password |
| `JWT_SECRET` | ≥256-bit random string |
| `CORS_ALLOWED_ORIGIN` | Frontend domain (e.g. `https://myapp.vercel.app`) |
| `SPRING_PROFILES_ACTIVE` | `prod` |

---

## Security Checklist Before Deploy

- [ ] `JWT_SECRET` is a cryptographically random ≥32-char string (not the dev placeholder)
- [ ] `show-sql: false` in prod profile
- [ ] CORS `allowedOrigins` lists only the production frontend domain
- [ ] Swagger UI disabled or protected in prod (add `springdoc.swagger-ui.enabled: false` in `application-prod.yml`)
- [ ] File upload directory outside the JAR/container working directory
- [ ] No `DEBUG` logging in prod

---

## Verification Steps

```bash
# Build Docker image
cd backend
docker build -t income-outcome-app .

# Run with prod config
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/income_outcome_dev \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=postgres \
  -e JWT_SECRET=supersecretkey32charsminimumhere \
  -e CORS_ALLOWED_ORIGIN=http://localhost:5173 \
  income-outcome-app

# Swagger UI
open http://localhost:8080/swagger-ui.html

# Health check
curl http://localhost:8080/actuator/health
```
