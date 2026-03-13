import { redirect } from "next/navigation";

export default function DemoBuergerEntry() {
  const target = "/demo?persona=citizen";
  if (!target) {
    return (
      <main>
        <h1>Demo Bürger</h1>
      </main>
    );
  }
  redirect(target);
}
