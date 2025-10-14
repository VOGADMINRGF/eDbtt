import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true }, experimental: { externalDir: true },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@":        path.resolve(__dirname, "src"),
      "@lib":     path.resolve(__dirname, "src/lib"),
      "@features":path.resolve(__dirname, "../../features"),
      "@core":    path.resolve(__dirname, "../../core"),

      // UI: Ordner + exakter Index-Match für bare "@ui"
      "@ui":      path.resolve(__dirname, "../../features/ui"),
      "@ui$":     path.resolve(__dirname, "../../features/ui/index.ts"),

      // Prisma Web-Client
      "@db-web":  path.resolve(__dirname, "../../packages/db-web/src"),
    };
    return config;
  },
};

export default nextConfig;
