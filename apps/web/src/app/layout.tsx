import type { ReactNode } from "react";
export const dynamic = "force-static";
export const metadata = { title: "VoiceOpenGov" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
