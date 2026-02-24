# Multi-stage build for Ionic PWA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend-paciente/package*.json ./

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install --legacy-peer-deps --no-audit --no-fund; fi

# Copy source code
COPY frontend-paciente/ .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy nginx configuration
COPY docker/frontend-paciente/nginx.conf /etc/nginx/nginx.conf

# Copy built application (Angular output is nested under browser/)
COPY --from=builder /app/www/browser/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
