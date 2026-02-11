# ──────────────────────────────────────────────
# TERRAPRISMA Backend — Multi-stage Dockerfile
# ──────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs public/ ./public/

# Create logs directory
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

USER nodejs
EXPOSE 3000

ENV NODE_ENV=production

# Health check using Node native fetch (no wget dependency)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
