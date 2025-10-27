import path from "path";

const config = {
  experimental: { externalDir: true, typedRoutes: true },
  webpack: (cfg) => {
    cfg.resolve.alias = {
      ...(cfg.resolve.alias || {}),
      "@features": path.join(__dirname, "../../features"),
      "@core": path.join(__dirname, "../../core"),
      "@packages": path.join(__dirname, "../../packages"),
    };
    return cfg;
  },
};
export default config;

// --- added by vog_preflight_bundle ---
export const experimental = {
  ...(typeof experimental!=="undefined" ? experimental : {}),
  allowedDevOrigins: ["http://localhost:3000"],
};
