"use client";
import { useRouter } from "next/navigation";

interface ErrorEntry {
  code: string;
  count: number;
  path: string;
  lastSeen: string;
  traceIds: string[];
}

export default function ErrorTable() {
  const router = useRouter();

  return (
    <table className="w-full text-left border border-gray-200">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-4 py-2">Code</th>
          <th className="px-4 py-2">Anzahl</th>
          <th className="px-4 py-2">Pfad</th>
          <th className="px-4 py-2">Zuletzt</th>
          <th className="px-4 py-2">Trace-IDs</th>
        </tr>
      </thead>
      <tbody>
        {errors.map((entry, i) => (
          <tr key={i} className="border-t">
            <td className="px-4 py-2 font-semibold text-red-600">
              {entry.code}
            </td>
            <td className="px-4 py-2">{entry.count}</td>
            <td className="px-4 py-2 text-sm text-gray-600">{entry.path}</td>
            <td className="px-4 py-2 text-sm text-gray-500">
              {entry.lastSeen}
            </td>
            <td className="px-4 py-2 flex gap-2 flex-wrap">
              {entry.traceIds.map((id) => (
                <button
                  key={id}
                  onClick={() => router.push(`/admin/errors/${id}`)}
                  className="bg-gray-100 rounded px-2 py-1 font-mono text-xs hover:bg-gray-200"
                >
                  {id}
                </button>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
