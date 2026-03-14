# --- Stage 1: Build Stage ---
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# --- Stage 2: Production Stage ---
FROM nginx:stable-alpine

# Copy built assets to nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Add custom nginx config to handle SPA routing
RUN printf "server { \n\
    listen 5173; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html; \n\
        try_files \$uri \$uri/ /index.html; \n\
    } \n\
    location /api { \n\
        proxy_pass http://backend:8000; \n\
    } \n\
    location /admin { \n\
        proxy_pass http://backend:8000; \n\
    } \n\
    location /static/admin { \n\
        proxy_pass http://backend:8000; \n\
    } \n\
}" > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
