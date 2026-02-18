FROM node:20-alpine

RUN apk add --no-cache jemalloc python3 py3-pip
ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2

ARG NODE_MAX_OLD_SPACE_SIZE=1024

WORKDIR /app
RUN mkdir -p /app && chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node api/package.json ./api/package.json
COPY --chown=node:node client/package.json ./client/package.json
COPY --chown=node:node packages/data-provider/package.json ./packages/data-provider/package.json
COPY --chown=node:node packages/data-schemas/package.json ./packages/data-schemas/package.json
COPY --chown=node:node packages/api/package.json ./packages/api/package.json

RUN touch .env \
    && mkdir -p /app/client/public/images /app/logs /app/uploads \
    && npm ci --no-audit

COPY --chown=node:node . .

RUN NODE_OPTIONS="--max-old-space-size=${NODE_MAX_OLD_SPACE_SIZE}" npm run frontend \
    && npm prune --production \
    && npm cache clean --force

EXPOSE 3080
ENV HOST=0.0.0.0
CMD ["npm", "run", "backend"]