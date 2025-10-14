import { absUrl } from "@/utils/serverBaseUrl";

async function getContribs() {
  const r = await fetch(absUrl("/api/contributions"), { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function ContributionsPage() {
  const items = await getContribs();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Beiträge</h1>
      <div className="space-y-3">
        {items.map((c: any) => (
          <div key={c.id} className="border rounded p-3 bg-white/60">
            <div className="font-semibold">
              {c.title || c.text?.slice(0, 80)}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(c.createdAt).toLocaleString()}
            </div>
            <p className="text-sm mt-2">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
