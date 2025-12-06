# syntax=docker/dockerfile:1
# Frontend Dockerfile for Quality Gate Web App
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Install git (sometimes needed for npm dependencies)
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies with cache
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# Copy application code
COPY . .

# Clear Next.js cache
RUN rm -rf .next

# Expose port for Next.js dev server
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Set environment for Next.js to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Run Next.js dev server
CMD ["npm", "run", "dev"]
