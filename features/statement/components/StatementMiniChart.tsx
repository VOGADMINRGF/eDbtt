"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function StatementMiniChart({ statementId }: { statementId: string }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/statements/${encodeURIComponent(statementId)}/timeseries`, { cache: "no-store" })
      .then(r=>r.json()).then(j=>setData(j.series || [])).catch(()=>setData([]));
  }, [statementId]);

  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="agree" />
          <Line type="monotone" dataKey="neutral" />
          <Line type="monotone" dataKey="disagree" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
