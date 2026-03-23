This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment variables

Copy the example env file and fill in the values:

```bash
cp .env.example .env
```

### 2. Start services

```bash
docker compose up -d
```

This starts PostgreSQL, MinIO, and a one-shot `minio-init` container that automatically:
- Creates the `$MINIO_BUCKET_NAME` bucket (if it doesn't exist)
- Sets public `download` access so uploaded images are publicly readable

### 3. Run the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### MinIO console

The MinIO admin console is available at [http://localhost:9001](http://localhost:9001).  
Login with `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from your `.env`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
