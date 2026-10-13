import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. A stray package-lock.json in the user's home
  // folder otherwise makes Turbopack treat that folder as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
