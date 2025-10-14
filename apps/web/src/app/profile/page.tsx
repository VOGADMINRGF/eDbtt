// apps/web/src/app/profile/page.tsx
"use client";

import UserProfile from "@/components/profile/UserProfile";

export default function ProfilePage() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <UserProfile />
    </main>
  );
}
