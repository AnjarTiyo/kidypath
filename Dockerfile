FROM oven/bun:1.0.0 AS builder
WORKDIR /app

# Cache dependencies separately so rebuilds are faster when sources change
COPY bun.lockb package.json .
RUN bun install

# Copy the rest of the repository and run the production build
COPY . .
RUN bun run build

FROM oven/bun:1.0.0
WORKDIR /app

# Copy the compiled app and production dependencies from the builder
COPY --from=builder /app .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start", "--hostname", "0.0.0.0", "--port", "3000"]