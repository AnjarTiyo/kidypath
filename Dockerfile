FROM oven/bun:latest AS builder
WORKDIR /app

# Cache dependencies separately so rebuilds are faster when sources change
COPY bun.lockb package.json .
RUN bun install

# Copy the rest of the repository and run the production build.
# Secrets are mounted only for this step and do not persist in the image.
COPY . .
RUN --mount=type=secret,id=database_url,env=DATABASE_URL \
    --mount=type=secret,id=minio_endpoint,env=MINIO_ENDPOINT \
    --mount=type=secret,id=minio_bucket_name,env=MINIO_BUCKET_NAME \
    --mount=type=secret,id=minio_root_user,env=MINIO_ROOT_USER \
    --mount=type=secret,id=minio_root_password,env=MINIO_ROOT_PASSWORD \
    --mount=type=secret,id=minio_public_url,env=MINIO_PUBLIC_URL \
    --mount=type=secret,id=groq_api_key,env=GROQ_API_KEY \
    bun run build

FROM oven/bun:latest
WORKDIR /app

# Copy the compiled app and production dependencies from the builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start", "--hostname", "0.0.0.0", "--port", "3000"]