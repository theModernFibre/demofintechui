# Build stage: compile the Spring Boot app with Maven
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom
COPY mvnw .
COPY .mvn ./.mvn
COPY pom.xml .

# Download dependencies (cached unless pom changes)
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN ./mvnw package -DskipTests -B

# Run stage: minimal JRE + the built JAR
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Render sets PORT (default 10000); Spring Boot reads it via server.port=${PORT:8080}
ENV PORT=8080
EXPOSE 8080

COPY --from=build /app/target/fintech-blockchain-*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
