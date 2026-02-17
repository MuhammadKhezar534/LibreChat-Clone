# v0.8.2

FROM node:20-alpine AS node

# Install dependencies
RUN apk add --no-cache jemalloc python3 py3-pip uv
ENV LD_PRELOAD=/usr/lib/libjemalloc.so.2

# Add uv binary
COPY --from=ghcr.io/astral-sh/uv:0.9.5-python3.12-alpine /usr/local/bin/uv /usr/local/bin/uvx /bin/
RUN uv --version

ARG NODE_MAX_OLD_SPACE_SIZE=6144

RUN mkdir -p /app && chown node:node /app
WORKDIR /app
USER node

# Copy package.json files
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node api/package.json ./api/package.json
COPY --chown=node:node client/package.json ./client/package.json
COPY --chown=node:node packages/data-provider/package.json ./packages/data-provider/package.json
COPY --chown=node:node packages/data-schemas/package.json ./packages/data-schemas/package.json
COPY --chown=node:node packages/api/package.json ./packages/api/package.json

# Install dependencies
RUN touch .env \
    && mkdir -p /app/client/public/images /app/logs /app/uploads \
    && npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 15000 \
    && npm ci --no-audit

# Copy the full repo
COPY --chown=node:node . .

# 🌟 Critical fix: Build internal API package BEFORE backend
RUN npm run build

# Build React frontend
RUN NODE_OPTIONS="--max-old-space-size=${NODE_MAX_OLD_SPACE_SIZE}" npm run frontend \
    && npm prune --production \
    && npm cache clean --force

# Expose port & start backend
EXPOSE 3080
ENV HOST=0.0.0.0
CMD ["npm", "run", "backend"]



