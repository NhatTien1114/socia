# Stage 1: build React
FROM node:22-bookworm-slim AS frontend-build

WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ENV VITE_API_BASE_URL=/socia/v1

RUN npm run build


# Stage 2: build Spring Boot
FROM maven:3.9-eclipse-temurin-21 AS backend-build

WORKDIR /build/backend

COPY backend/ ./

RUN mvn -B -DskipTests clean package


# Stage 3: runtime
FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --home-dir /app app \
    && mkdir -p /app/public \
    && chown -R app:app /app /var/lib/nginx /var/log/nginx

WORKDIR /app

COPY --from=backend-build --chown=app:app \
    /build/backend/target/demo-0.0.1-SNAPSHOT.jar \
    /app/socia.jar

COPY --from=frontend-build --chown=app:app \
    /build/frontend/dist/ \
    /app/public/

COPY --chown=app:app deploy/nginx.conf /app/nginx.conf
COPY --chown=app:app deploy/start.sh /app/start.sh

RUN sed -i 's/\r$//' /app/start.sh

ENV JAVA_TOOL_OPTIONS="-Xms64m -Xmx224m -Xss512k -XX:ReservedCodeCacheSize=32m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

USER app

EXPOSE 10000

ENTRYPOINT ["/bin/bash", "/app/start.sh"]