FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline
COPY src src
RUN ./mvnw package -DskipTests

FROM mcr.microsoft.com/playwright/java:v1.42.0-jammy
WORKDIR /app

RUN apt-get update && apt-get install -y openjdk-21-jre --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*


COPY --from=build /app/target/*.jar app.jar


ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]