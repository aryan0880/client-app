# ------- Stage 1: Build dependencies & compile TypeScript -------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --include=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ------- Stage 2: Production runtime image -------
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache dumb-init tini

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

ENV PORT=5001
EXPOSE 5001

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["dumb-init", "--"]
CMD ["docker-entrypoint.sh"]
