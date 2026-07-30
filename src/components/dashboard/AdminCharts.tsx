/**
 * AdminCharts — lazy-loaded Recharts charts for the admin dashboard.
 * This component is dynamically imported so the ~272KB recharts bundle
 * is not part of the initial admin page load.
 */
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LoanDistEntry {
  name: string;
  value: number;
  color: string;
}

interface TxVolumeEntry {
  name: string;
  deposits: number;
  withdrawals: number;
}

interface AdminChartsProps {
  loanDistribution: LoanDistEntry[];
  txVolumeData: TxVolumeEntry[];
}

export default function AdminCharts({ loanDistribution, txVolumeData }: AdminChartsProps) {
  return (
    <>
      {/* Credit Portfolio Pie Chart */}
      <div className="lg:col-span-1 bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm flex flex-col">
        <div className="mb-2">
          <h2 className="font-poppins font-bold text-foreground text-xs">Credit Portfolio Distribution</h2>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">By category</p>
        </div>
        <div className="h-36 flex-1">
          {loanDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loanDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {loanDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, ""]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center">
              <span className="text-xl mb-1 opacity-80">📉</span>
              <p className="text-xs font-bold text-muted-foreground">No active credit facilities</p>
            </div>
          )}
        </div>
        {loanDistribution.length > 0 && (
          <div className="grid grid-cols-1 gap-1.5 mt-2">
            {loanDistribution.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2 text-[11px]">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-muted-foreground font-semibold truncate">
                  {cat.name} <span className="opacity-50">({cat.value}%)</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Volume Bar Chart */}
      <div className="lg:col-span-2 bg-card rounded-xl border border-border/60 p-3.5 sm:p-4 shadow-sm flex flex-col">
        <div className="mb-2">
          <h2 className="font-poppins font-bold text-foreground text-xs">Transaction Volume Trends</h2>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Last 7 Days (Deposits vs Withdrawals)
          </p>
        </div>
        <div className="h-44 w-full">
          {txVolumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={txVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="deposits" fill="hsl(142, 71%, 45%)" radius={[3, 3, 0, 0]} name="Deposits" />
                <Bar dataKey="withdrawals" fill="hsl(350, 65%, 38%)" radius={[3, 3, 0, 0]} name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              No volume data available
            </div>
          )}
        </div>
      </div>
    </>
  );
}
