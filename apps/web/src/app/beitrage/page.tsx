import { redirect } from "next/navigation";

export default function BeitraegeAliasPage() {
  redirect("/beitraege");
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Beiträge</h1>
    </main>
  );
}
