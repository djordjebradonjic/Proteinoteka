
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app


COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline


COPY src src
RUN ./mvnw package -DskipTests


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

ARG CACHEBUST=1


RUN apk add --no-cache \
      nodejs \
      npm \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      udev

ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]