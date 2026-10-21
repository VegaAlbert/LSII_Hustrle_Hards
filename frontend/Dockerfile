# Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# .env.production leaves the API/media domains empty, so the bundle calls /api and /media on its own origin
RUN npm run build:prod

# Runtime stage: nginx serves the SPA and proxies /api and /media to the backend
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
