import { runFactcheck } from "./actions";

export default async function Page() {
  const res = await runFactcheck("Beispielsatz …");
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Factcheck (Admin)</h1>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
        {JSON.stringify(res, null, 2)}
      </pre>
    </main>
  );
}
