// features/dashboard/components/UsageKPIPanel.tsx
interface UsageKPI {
    label: string;
    value: string;
    type?: "cost" | "token";
  }
  const usageKPIs: UsageKPI[] = [
    { label: "Tokens heute (GPT-4)", value: "81.200", type: "token" },
    { label: "Kosten heute (GPT-4)", value: "2,43 €", type: "cost" },
    { label: "Tokens heute (ARI)", value: "13.800", type: "token" },
    { label: "Tokens alle Dienste", value: "123.100", type: "token" },
    { label: "Region mit höchstem Verbrauch", value: "DE" },
    { label: "Budgetwarnung", value: "68 % erreicht", type: "cost" }
  ];
  
  export default function UsageKPIPanel() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-4">
        {usageKPIs.map((kpi, i) => (
          <div key={i} className={`
            rounded-xl shadow p-4 bg-white border-l-4
            ${kpi.type === "cost" ? "border-l-red-400" : "border-l-violet-400"}`}>
            <div className="text-xs text-gray-500">{kpi.label}</div>
            <div className="text-xl font-bold">{kpi.value}</div>
          </div>
        ))}
      </div>
    );
  }
  