import React from "react";
import {
  DashboardLayout,
  SystemMatrix,
  UsageKIPanel,
} from "@/features/dashboard";

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <SystemMatrix />
      </div>
      <UsageKIPanel />
    </DashboardLayout>
  );
}