plugins {
    java
    id("org.springframework.boot") version "3.4.3"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.incomeoutcome"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // Data / JPA
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")

    // Security
    implementation("org.springframework.boot:spring-boot-starter-security")

    // Validation
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Flyway
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")

    // PostgreSQL driver
    runtimeOnly("org.postgresql:postgresql")

    // Lombok
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    // JWT (for Phase 2)
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // Actuator
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // OpenAPI / Swagger UI
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4")

    // Rate limiting
    implementation("com.bucket4j:bucket4j-core:8.10.1")

    // AWS SDK v2 (S3 — optional, activated via app.storage.type=s3)
    implementation("software.amazon.awssdk:s3:2.29.52")

    // Email
    implementation("org.springframework.boot:spring-boot-starter-mail")

    // PDF generation (monthly report)
    implementation("org.apache.pdfbox:pdfbox:3.0.3")

    // Tesseract OCR (optional, activated via app.ocr.provider=tesseract)
    implementation("net.sourceforge.tess4j:tess4j:5.11.0")

    // Tests
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
