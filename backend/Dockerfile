# =============================================
# Backend Dockerfile - Multi-stage Build
# =============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY local_market_price_checker/backend/package*.json ./

# Install dependencies
RUN npm install --only=production && \
    npm cache clean --force

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY local_market_price_checker/backend/src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001), (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
