FROM oven/bun:latest AS builder
WORKDIR /app

# Cache dependencies separately so rebuilds are faster when sources change
COPY bun.lockb package.json .
RUN bun install

# Copy the rest of the repository and run the production build
COPY . .
ARG DATABASE_URL
ARG MINIO_ENDPOINT
ARG MINIO_BUCKET_NAME
ARG MINIO_ROOT_USER
ARG MINIO_ROOT_PASSWORD
ARG MINIO_PUBLIC_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV MINIO_ENDPOINT=${MINIO_ENDPOINT}
ENV MINIO_BUCKET_NAME=${MINIO_BUCKET_NAME}
ENV MINIO_ROOT_USER=${MINIO_ROOT_USER}
ENV MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
ENV MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL}
RUN bun run build

FROM oven/bun:latest
WORKDIR /app

# Copy the compiled app and production dependencies from the builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start", "--hostname", "0.0.0.0", "--port", "3000"]