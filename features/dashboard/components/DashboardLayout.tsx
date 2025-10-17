/* @ts-nocheck */
import SidebarNav from "./SidebarNav";
import { ReactNode } from "react";

const items = [
  { title: "Übersicht", href: "/admin", icon: "layout-dashboard" },
  { title: "Einstellungen", href: "/admin/settings", icon: "settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <SidebarNav items={items} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
