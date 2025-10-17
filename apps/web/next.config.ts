import type { NextConfig } from "next";
const origins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ??
  "http://localhost:3000,http://127.0.0.1:3000").split(",");

const config: NextConfig = {
  experimental: {
    allowedDevOrigins: origins,
    typedRoutes: true,
    externalDir: true,
  },
};
export default config;

