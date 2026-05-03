FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

COPY src ./src
RUN ./gradlew --no-daemon bootJar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk add --no-cache wget && \
    addgroup -S app && adduser -S app -G app

COPY --from=builder /app/build/libs/*.jar app.jar
RUN chown app:app app.jar

USER app
EXPOSE 8080

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]  
