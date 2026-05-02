# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# Stage deps: instala dependências com cache de layer (package-lock)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage builder: gera Prisma Client e build Nest (dist/)
# -----------------------------------------------------------------------------
FROM deps AS builder
COPY prisma ./prisma/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/
RUN npx prisma generate
RUN npm run build

# -----------------------------------------------------------------------------
# Stage production: só dependências de produção + artefatos compilados
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Cliente Prisma e CLI: copiar do builder (migrate deploy no startup do compose)
COPY prisma ./prisma/
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY tsconfig.json ./

RUN npx prisma generate

EXPOSE 3000

# tsconfig-paths resolve @common, @config, @modules no dist em runtime
CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]
