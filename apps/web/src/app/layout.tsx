import Providers from './providers';
// apps/web/src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Header, Footer } from "@/shims/ui";

export const metadata: Metadata = { title: "e-Debatte | VoiceOpenGov", description: "…" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-white text-gray-900 flex flex-col">
        <Header />
        <main className="flex-1"><Providers>{children}</Providers></main>
        <Footer />
      </body>
    </html>
  );
}
