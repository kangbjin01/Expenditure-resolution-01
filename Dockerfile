FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build the source code
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data directory and set environment for build
RUN mkdir -p /app/data
ENV DATABASE_URL="file:/app/data/expense.db"
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client and create initial database
RUN npx prisma generate
RUN npx prisma db push --accept-data-loss

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/data/expense.db"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy initial database to a backup location
COPY --from=builder /app/data/expense.db /app/init-expense.db

# Create data directory
RUN mkdir -p /app/data

# Create entrypoint script inside Dockerfile to avoid CRLF issues
RUN printf '#!/bin/sh\nif [ ! -f /app/data/expense.db ]; then\n  echo "Initializing database..."\n  cp /app/init-expense.db /app/data/expense.db\nfi\nexec node server.js\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Run entrypoint
CMD ["/bin/sh", "/app/entrypoint.sh"]
