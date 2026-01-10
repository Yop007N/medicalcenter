# Multi-stage build for Angular Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend-web/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend-web/ .

# Build application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy nginx configuration
COPY docker/frontend-web/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist/medical-services-web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
