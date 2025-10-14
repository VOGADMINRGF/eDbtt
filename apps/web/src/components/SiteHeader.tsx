// apps/web/src/components/SiteHeader.tsx
import { getCookie } from "@/lib/http/typedCookies";

function toVal(v: unknown): string | undefined {
  return typeof v === "string" ? v : (v as any)?.value;
}

export default async function SiteHeader() {
  // Cookie asynchron lesen (Helper kann string ODER { value } liefern)
  const role = toVal(await getCookie("u_role")) ?? "guest";

  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="font-semibold">VoiceOpenGov</div>

      <nav className="ml-auto flex items-center gap-4">
        <span className="text-sm opacity-80">Role: {role}</span>
        {role === "admin" && (
          <a href="/admin" className="underline">
            Admin
          </a>
        )}
      </nav>
    </header>
  );
}
