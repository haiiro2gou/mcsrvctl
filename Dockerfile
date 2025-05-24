FROM node:20.16-alpine3.19
ENV NODE_ENV production

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node package-lock.json ./
RUN npm ci

COPY --chown=node:node dist/ ./dist/

USER node
CMD ["node", "dist/index.js"]
