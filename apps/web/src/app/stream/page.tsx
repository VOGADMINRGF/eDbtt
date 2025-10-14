"use client";
import { useUser } from "@features/user/context/UserContext";
import StreamList from "@features/stream/components/StreamList";
import DashboardLayout from "@features/dashboard/components/DashboardLayout";

export default function StreamPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-8 text-xl text-center">Bitte einloggen, um Streams zu sehen.</div>
      </DashboardLayout>
    );
  }

  if (user.verification !== "legitimized") {
    return (
      <DashboardLayout>
        <div className="p-8 text-xl text-center text-red-600">
          <b>Bitte PostIdent abschließen, um Live-Streams zu sehen.</b>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Live & Replay</h1>
        <StreamList />
      </main>
    </DashboardLayout>
  );
}
