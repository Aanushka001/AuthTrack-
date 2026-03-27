FROM node:22-alpine AS builder
WORKDIR /app
RUN apk update && apk upgrade --no-cache

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx tsc

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk update && apk upgrade --no-cache

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001
CMD ["node", "dist/server.js"]