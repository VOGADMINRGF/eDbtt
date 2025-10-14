// features/dashboard/components/DashboardLayout.tsx
import SidebarNav from "./SidebarNav";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <SidebarNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
