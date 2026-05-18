import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  allowedDevOrigins: (process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export default nextConfig;
