# Stage 1: Build Backend
FROM node:slim AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm install && npm install -g typescript

COPY backend/ ./

RUN npm run build || echo "Backend build failed, check build script"

# Stage 2: Build Frontend
FROM node:slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install && npm install -g typescript vite

COPY frontend/ ./

RUN npm run build || (npx tsc && npx vite build)

# Stage 3: Final image with Nginx and Node
FROM nginx:alpine

# Install Node.js
RUN apk add --update nodejs npm supervisor

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf


# Copy frontend build
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Create directory for backend
RUN mkdir -p /app/backend

# Copy backend build
COPY --from=backend-build /app/backend/dist /app/backend/dist
COPY --from=backend-build /app/backend/package*.json /app/backend/

# Install production dependencies for backend
WORKDIR /app/backend
RUN npm install --production

# Create supervisor configuration
RUN mkdir -p /etc/supervisor/conf.d/
COPY supervisord/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY supervisord/start.sh /start.sh
RUN chmod +x /start.sh
# Create start script


EXPOSE 80
EXPOSE 3000
# Start Nginx and Node.js using Supervisor
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
# CMD ["/start.sh"]
