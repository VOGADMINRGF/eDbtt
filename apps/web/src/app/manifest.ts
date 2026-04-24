import { BRAND } from "@/lib/brand";

export default function manifest() {
  return {
    name: BRAND.name,
    short_name: "eDebatte",
    description: BRAND.tagline_de,
    start_url: "/start",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#06b6d4",
    lang: "de-DE",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
