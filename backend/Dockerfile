# Build stage: uses the Maven image because the Maven wrapper is not committed to the repo
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Resolve dependencies first so they are cached between builds when only the sources change
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Tests are run by the CI pipeline; the image only packages the jar.
# spring-boot-maven-plugin is only declared in the pom's prod profile, so repackage explicitly to get an executable jar
RUN mvn -B -DskipTests package org.springframework.boot:spring-boot-maven-plugin:repackage

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
