"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WeeklyChart({ data }: { data: { day: string; done: number }[] }) {
  return (
    <div className="h-44 w-full" role="img" aria-label={`Items completed per day: ${data.map((d) => `${d.day} ${d.done}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="#26262A" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#A1A1AA", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#A1A1AA", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} contentStyle={{ background: "#1A1A1D", border: "1px solid #26262A", borderRadius: 12, color: "#fff" }} />
          <Bar dataKey="done" name="Completed" fill="#3B82F6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
