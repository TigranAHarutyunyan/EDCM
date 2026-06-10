FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
# Install gettext for envsubst (needed to substitute $PORT at runtime)
RUN apk add --no-cache gettext && \
    addgroup -S appgroup && adduser -S -G appgroup appuser

# Store config as a template; envsubst fills in $PORT at startup
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && chmod -R 755 /var/cache/nginx

USER appuser
EXPOSE 8080

# Render injects $PORT. envsubst writes the final nginx.conf then starts nginx.
CMD ["sh", "-c", "envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf && nginx -c /tmp/nginx.conf -g 'daemon off;'"]
