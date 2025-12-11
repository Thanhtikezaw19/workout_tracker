// next.config.ts
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Explicitly tell Next.js to not use Turbopack for this config if possible
  experimental: {
    // any experimental features can go here
  }
};

export default withPWA(nextConfig);