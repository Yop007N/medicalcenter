# Multi-stage build for Angular/Ionic Admin Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend-admin-profesional/package*.json ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps --no-audit --no-fund; else npm install --legacy-peer-deps --no-audit --no-fund; fi

# Copy source code
COPY frontend-admin-profesional/ .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy nginx configuration
COPY docker/frontend-admin-profesional/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/www/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
