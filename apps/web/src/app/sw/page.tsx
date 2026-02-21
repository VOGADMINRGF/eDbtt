import { redirect } from "next/navigation";

export default function SwRedirectPage() {
  redirect("/swipes");
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Swipes</h1>
    </main>
  );
}
