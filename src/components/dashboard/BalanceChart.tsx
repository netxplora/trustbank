import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BalanceChartProps {
  data: any[];
}

export default function BalanceChart({ data }: BalanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
        <Tooltip 
          contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
          formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Balance"]}
        />
        <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBalance)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
