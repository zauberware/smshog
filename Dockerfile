# The node image no longer ships yarn, the lockfile is a yarn 1 lockfile
FROM node:26-alpine AS base

RUN npm install -g yarn@1.22.22

# Stage 1: install the workspace from the lockfile and build both packages
FROM base AS build

WORKDIR /app

COPY package.json yarn.lock ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN yarn install --frozen-lockfile

COPY backend/ backend/
COPY frontend/ frontend/

RUN yarn workspace smshog-backend build && yarn workspace smshog-frontend build

# Stage 2: production dependencies only
FROM base AS prod-deps

WORKDIR /app

COPY package.json yarn.lock ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN yarn install --frozen-lockfile --production

# Stage 3: final image with nginx and Node
FROM nginx:1.30-alpine

RUN apk add --no-cache nodejs supervisor

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY --from=build /app/backend/dist /app/backend/dist
COPY --from=prod-deps /app/node_modules /app/node_modules

WORKDIR /app/backend

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/api/v1/health || exit 1

# Start nginx and the backend using Supervisor
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
