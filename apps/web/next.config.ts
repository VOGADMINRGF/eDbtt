import path from "node:path";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: { externalDir: true, typedRoutes: true },
  transpilePackages: ["@ui"],
  webpack(cfg) {
    cfg.resolve.alias = {
      ...(cfg.resolve.alias ?? {}),
      "@":         path.resolve(__dirname, "src"),
      "src":       path.resolve(__dirname, "src"),
      "@config":   path.resolve(__dirname, "src/config"),
      "@lib":      path.resolve(__dirname, "src/lib"),
      "@features": path.resolve(__dirname, "../../features"),
      "@core":     path.resolve(__dirname, "../../core"),
      // ⬇️ wichtig: direkt aufs UI-Paket zeigen
      "@ui":       path.resolve(__dirname, "../../packages/ui/src"),
      "@db-web":   path.resolve(__dirname, "../../packages/db-web/src"),
      "@db/web":   path.resolve(__dirname, "../../packages/db-web/src"),
    };
    return cfg;
  },
};

export default config;
