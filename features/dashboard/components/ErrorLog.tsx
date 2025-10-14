// features/dashboard/components/ErrorLog.tsx
interface ErrorEntry {
    code: string;
    count: number;
    path: string;
    lastSeen: string;
    traceIds: string[];
    affectedRegion?: string;
    affectedUser?: string;
  }
  const errors: ErrorEntry[] = [
    {
      code: "ANALYSIS_ERROR",
      count: 6,
      path: "/api/contribution/analyze",
      lastSeen: "vor 4 Min",
      traceIds: ["ERR-12AB34CD", "ERR-56EF78GH"],
      affectedRegion: "DE"
    },
    {
      code: "SAVE_ERROR",
      count: 2,
      path: "/api/contribution/save",
      lastSeen: "vor 13 Min",
      traceIds: ["ERR-9XYZ1234"],
      affectedUser: "User089"
    }
  ];
  
  export default function ErrorLog() {
    return (
      <table className="w-full text-left border border-gray-200 bg-white rounded-xl shadow">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2">Code</th>
            <th className="px-4 py-2">Anzahl</th>
            <th className="px-4 py-2">Pfad</th>
            <th className="px-4 py-2">Zuletzt</th>
            <th className="px-4 py-2">Trace-IDs</th>
            <th className="px-4 py-2">Region/User</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((entry, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2 font-semibold text-red-600">{entry.code}</td>
              <td className="px-4 py-2">{entry.count}</td>
              <td className="px-4 py-2 text-sm text-gray-600">{entry.path}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{entry.lastSeen}</td>
              <td className="px-4 py-2 flex gap-2 flex-wrap">
                {entry.traceIds.map((id) => (
                  <span key={id} className="bg-gray-100 rounded px-2 py-1 font-mono text-xs">{id}</span>
                ))}
              </td>
              <td className="px-4 py-2 text-xs">
                {entry.affectedRegion || entry.affectedUser || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  