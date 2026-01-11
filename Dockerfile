# SafeOS Guardian - Docker Configuration
# Multi-stage build for optimized production image

# =============================================================================
# Stage 1: Base Dependencies
# =============================================================================
FROM node:20-alpine AS base

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev

WORKDIR /app

# =============================================================================
# Stage 2: Install Dependencies
# =============================================================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/guardian-ui/package.json ./apps/guardian-ui/

# Install dependencies
RUN npm install --legacy-peer-deps

# =============================================================================
# Stage 3: Build Backend
# =============================================================================
FROM base AS builder-backend

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript
RUN npm run build || echo "Build script not found, using tsc directly" && \
    npx tsc -p tsconfig.json || true

# =============================================================================
# Stage 4: Build Frontend
# =============================================================================
FROM base AS builder-frontend

WORKDIR /app/apps/guardian-ui

# Copy dependencies and source
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/guardian-ui/node_modules ./node_modules
COPY apps/guardian-ui .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# =============================================================================
# Stage 5: Production Backend
# =============================================================================
FROM node:20-alpine AS backend

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache sqlite-libs

# Copy built backend
COPY --from=builder-backend /app/dist ./dist
COPY --from=builder-backend /app/node_modules ./node_modules
COPY package.json ./

# Create data directory
RUN mkdir -p /app/db_data

# Environment variables
ENV NODE_ENV=production
ENV SAFEOS_PORT=3001
ENV SAFEOS_DB_PATH=/app/db_data/safeos.sqlite3

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/index.js"]

# =============================================================================
# Stage 6: Production Frontend
# =============================================================================
FROM node:20-alpine AS frontend

WORKDIR /app

# Copy built frontend
COPY --from=builder-frontend /app/apps/guardian-ui/.next ./.next
COPY --from=builder-frontend /app/apps/guardian-ui/public ./public
COPY --from=builder-frontend /app/apps/guardian-ui/node_modules ./node_modules
COPY --from=builder-frontend /app/apps/guardian-ui/package.json ./

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]

# =============================================================================
# Stage 7: Full Stack (Development)
# =============================================================================
FROM base AS development

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN npm install --legacy-peer-deps

# Environment
ENV NODE_ENV=development
ENV SAFEOS_PORT=3001

# Expose ports
EXPOSE 3000 3001

# Start development
CMD ["npm", "run", "dev"]


