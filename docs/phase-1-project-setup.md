# Phase 1: Project Setup

## Status: Complete ✓

## Overview
Initialize the Spring Boot backend with all base infrastructure: project structure, database connectivity, dependency management, and migration tooling.

---

## Stack Decisions

| Concern | Choice | Reason |
|---------|--------|--------|
| Language | Java 21 | LTS, virtual threads available |
| Framework | Spring Boot 3.4.3 | Latest stable, Jakarta EE namespace |
| Build tool | Gradle Kotlin DSL | Type-safe, modern |
| Database | PostgreSQL 17 | Robust, UUID native via pgcrypto |
| Migrations | Flyway | Simple, SQL-first, sequential versioning |
| Boilerplate | Lombok | Reduces entity/DTO noise |

---

## Dependencies (`build.gradle.kts`)

```
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-validation
flyway-core
postgresql
lombok
jjwt-api / jjwt-impl / jjwt-jackson (0.12.6)
```

---

## Project Structure

```
backend/
├── src/main/java/com/incomeoutcome/
│   ├── IncomeOutcomeApplication.java
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── dto/
│   ├── config/
│   └── exception/
├── src/main/resources/
│   ├── application.yml           # base config, active profile: dev
│   ├── application-dev.yml       # localhost:5432/income_outcome_dev
│   ├── application-prod.yml      # reads DATABASE_URL/USERNAME/PASSWORD env vars
│   └── db/migration/
│       └── V1__create_schema.sql # pgcrypto extension
├── docker-compose.yml            # postgres:17-alpine on port 5432
├── build.gradle.kts
└── settings.gradle.kts
```

---

## Configuration Profiles

### `application.yml` (base)
```yaml
spring:
  profiles:
    active: dev
  jpa:
    hibernate:
      ddl-auto: validate          # schema owned by Flyway, not Hibernate
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
```

### `application-dev.yml`
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/income_outcome_dev
    username: postgres
    password: postgres
  flyway:
    enabled: true
  jpa:
    show-sql: true
```

### `application-prod.yml`
```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

---

## Flyway V1 — Schema Bootstrap

```sql
-- V1__create_schema.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Enables `gen_random_uuid()` used as the default PK generator in all tables.

---

## Docker Compose

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
```

---

## Dev Commands

```bash
cd backend
docker compose up -d     # start Postgres
./gradlew bootRun        # start app (Flyway runs migrations on startup)
./gradlew test           # run tests
```

---

## Key Conventions Established

- JPA DDL set to `validate` — all schema changes go through numbered Flyway migrations
- Base package: `com.incomeoutcome`
- Layered architecture: controller → service → repository
- All primary keys are UUIDs (`@GeneratedValue(strategy = GenerationType.UUID)`)
