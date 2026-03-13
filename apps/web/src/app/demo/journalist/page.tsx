import { redirect } from "next/navigation";

export default function DemoJournalistEntry() {
  const target = "/demo?persona=journalist";
  if (!target) {
    return (
      <main>
        <h1>Demo Journalist</h1>
      </main>
    );
  }
  redirect(target);
}
