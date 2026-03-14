# --- Stage 1: Build Stage ---
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# --- Stage 2: Production Stage ---
FROM nginx:stable-alpine

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Custom nginx config for Portal routing and its specific API bridge
RUN printf "server { \n\
    listen 8002; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html; \n\
        try_files \$uri \$uri/ /index.html; \n\
    } \n\
    location /api { \n\
        proxy_pass http://client-portal:8001; \n\
        rewrite ^/api/(.*) /\$1 break; \n\
    } \n\
}" > /etc/nginx/conf.d/default.conf

EXPOSE 8002

CMD ["nginx", "-g", "daemon off;"]
