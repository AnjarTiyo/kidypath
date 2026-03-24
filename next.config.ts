import type { NextConfig } from "next";

function getImageHostnames(): { hostname: string }[] {
  const raw = process.env.MINIO_PUBLIC_URL || process.env.MINIO_ENDPOINT || "";
  if (!raw) return [];
  try {
    const { hostname } = new URL(raw);
    return [{ hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true, // Keep enabled to catch bugs, but be aware it causes double renders in dev
  images: {
    remotePatterns: getImageHostnames().map(({ hostname }) => ({
      protocol: "http",
      hostname,
    })),
  },
};

export default nextConfig;
