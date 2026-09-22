# ==============================================================================
# Stage 1: Build React 19 Frontend with TypeScript & Vite
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with clean cache
COPY package*.json ./
RUN npm ci

# Copy application code and build
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Production Nginx Server
# ==============================================================================
FROM nginx:alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
