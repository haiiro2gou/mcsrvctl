# Stage 1: Build
FROM node:20.16-alpine3.19 AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Runtime
FROM node:20.16-alpine3.19
ENV NODE_ENV=production
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node --from=builder /build/dist ./dist/

USER node
CMD ["node", "dist/index.js"]
