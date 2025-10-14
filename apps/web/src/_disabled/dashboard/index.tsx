// features/dashboard/pages/index.tsx
import DashboardLayout from "../../../../../features/dashboard/components/DashboardLayout";
import SystemMatrix from "../../../../../features/dashboard/components/SystemMatrix";
import UsageKPIPanel from "../components/UsageKPIPanel";

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <SystemMatrix />
      </div>
      <UsageKPIPanel />
    </DashboardLayout>
  );
}
