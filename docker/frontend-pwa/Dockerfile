# Multi-stage build for Ionic PWA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend-pwa/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend-pwa/ .

# Build application
RUN npm run ionic:build

# Production stage with nginx
FROM nginx:alpine

# Copy nginx configuration
COPY docker/frontend-pwa/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/www /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
