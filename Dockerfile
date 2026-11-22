# Stage 1: Build
FROM node:26.13-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --ignore-scripts
COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Runtime
FROM node:26.13-alpine AS runtime
ENV NODE_ENV=production
ENV NODE_OPTIONS=--enable-source-maps
RUN apk add --no-cache tini=~0.19
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund --ignore-scripts
COPY --chown=node:node --from=builder /build/dist ./dist/
RUN mkdir /data && chown node:node /data
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
