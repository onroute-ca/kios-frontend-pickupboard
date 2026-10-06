# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps (reproducible)
COPY package*.json ./
RUN npm ci

# Vite bakes env vars at BUILD time, so pass the service URLs as build args.
# Values must be deployed endpoints (https domains), never localhost or raw IPs —
# those are for local .env files only.
ARG VITE_AUTH_API_BASE_URL
ARG VITE_WEBSOCKET_URL
ARG VITE_ORDER_API_BASE_URL
ENV VITE_AUTH_API_BASE_URL=$VITE_AUTH_API_BASE_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_ORDER_API_BASE_URL=$VITE_ORDER_API_BASE_URL

COPY . .
RUN npm run build          # -> /app/dist

# ---------- Serve stage ----------
FROM nginx:alpine
# Custom config: SPA fallback + health endpoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Static build output
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
