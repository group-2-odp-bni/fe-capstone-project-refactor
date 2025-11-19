FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner

RUN addgroup -S app && adduser -S app -G app

RUN mkdir -p /var/cache/nginx /var/run/nginx && \
    chown -R app:app /var/cache/nginx /var/run/nginx /usr/share/nginx/html /etc/nginx

RUN rm -f /etc/nginx/conf.d/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

USER app

HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
