// apps/web/src/app/admin/test/page.tsx
"use client";

import Link from "next/link";

export default function AdminTestPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">✅ VOG Admin Checkliste</h1>
      <ul className="space-y-4">
        {checkItems.map((item) => (
          <li
            key={item.href}
            className="border rounded-lg p-4 hover:bg-gray-50"
          >
            <Link href={item.href} className="text-coral font-medium">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-gray-500">
        Hinweis: Für Punkt 8 bitte Logs in Konsole prüfen (<code>pnpm dev</code>{" "}
        &amp; <code>pnpm build</code>).
      </p>
    </div>
  );
}
