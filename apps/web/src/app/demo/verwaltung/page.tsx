import { redirect } from "next/navigation";

export default function DemoVerwaltungEntry() {
  const target = "/demo?persona=administration";
  if (!target) {
    return (
      <main>
        <h1>Demo Verwaltung</h1>
      </main>
    );
  }
  redirect(target);
}
