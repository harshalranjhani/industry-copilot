import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pi is ESM-only and Node-only; load it at runtime instead of bundling it.
  serverExternalPackages: ["@earendil-works/pi-agent-core", "@earendil-works/pi-ai"],
};

export default nextConfig;
