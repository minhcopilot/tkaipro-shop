# Use Node.js 22 for consistency between build and runtime
FROM node:22-alpine AS base

# Install dependencies stage  
FROM base AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Use npm install instead of npm ci to properly resolve platform-specific binaries
RUN npm install --frozen-lockfile || npm install

# Explicitly install platform-specific native binaries for Alpine Linux (musl)
RUN npm install lightningcss-linux-x64-musl @tailwindcss/oxide-linux-x64-musl --save-optional || true

# Build stage
FROM base AS builder
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (exclude unnecessary files for build)
COPY src ./src
COPY public ./public
COPY messages ./messages
COPY scripts ./scripts
COPY *.config.* ./
COPY *.json ./
COPY *.ts ./

# NEXT_PUBLIC_* được Next.js nhúng thẳng vào bundle lúc build, nên phải truyền
# vào đây chứ không thể set lúc chạy container. `docker-compose.production.yml`
# đọc chúng từ .env và truyền xuống qua `build.args`.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_SITE_FULL_NAME
ARG NEXT_PUBLIC_SUPPORT_TELEGRAM
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ARG NEXT_PUBLIC_SUPPORT_MESSENGER
ARG NEXT_PUBLIC_SUPPORT_FACEBOOK
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_INDEXNOW_KEY
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_SITE_FULL_NAME=$NEXT_PUBLIC_SITE_FULL_NAME
ENV NEXT_PUBLIC_SUPPORT_TELEGRAM=$NEXT_PUBLIC_SUPPORT_TELEGRAM
ENV NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL
ENV NEXT_PUBLIC_SUPPORT_MESSENGER=$NEXT_PUBLIC_SUPPORT_MESSENGER
ENV NEXT_PUBLIC_SUPPORT_FACEBOOK=$NEXT_PUBLIC_SUPPORT_FACEBOOK
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_INDEXNOW_KEY=$NEXT_PUBLIC_INDEXNOW_KEY
ENV NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ENV NEXT_SERVER_APP_URL=$NEXT_PUBLIC_BASE_URL

# Giá trị giả chỉ dùng để `next build` chạy qua được bước prerender — bị ghi đè
# bằng secret thật lúc container khởi động. KHÔNG đặt secret thật ở đây: mọi ENV
# trong Dockerfile đều nằm trong image và đọc được bằng `docker history`.
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV BETTER_AUTH_SECRET=build-time-placeholder-not-a-real-secret
ENV AUTH_SECRET=build-time-placeholder-not-a-real-secret

# Build with optimizations using npm
RUN npm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install dependencies needed for some native modules
RUN apk add --no-cache libc6-compat

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the application with Node.js
CMD ["node", "server.js"]
