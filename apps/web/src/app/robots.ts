import { BRAND } from "@/lib/brand";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    host: BRAND.baseUrl,
    sitemap: `${BRAND.baseUrl}/sitemap.xml`,
  };
}
