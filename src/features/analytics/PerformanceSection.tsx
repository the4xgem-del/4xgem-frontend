import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { usePerformance, useCategoryBreakdown } from "@/features/analytics/analyticsApi";

export default function PerformanceSection() {
  const { data: perfData, isLoading: perfLoading, isError: perfError } = usePerformance();
  const { data: pieData, isLoading: pieLoading } = useCategoryBreakdown();

  const latest = perfData[perfData.length - 1];
  const totalPips = perfData.reduce((sum, m) => sum + m.pips, 0);
  const avgWinRate = perfData.length ? Math.round(perfData.reduce((sum, m) => sum + m.winRate, 0) / perfData.length) : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111827]">Performance</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Monthly statistics and signal accuracy analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Monthly Profit", value: "—", sub: "Needs $ P/L tracking (not built yet)", color: "#10B981" },
          { label: "Accuracy", value: latest ? `${latest.winRate}%` : "—", sub: "This month", color: "#2563EB" },
          { label: "Win Rate", value: `${avgWinRate}%`, sub: "Trailing average", color: "#6D28D9" },
          { label: "Total Pips", value: String(totalPips), sub: "Across shown months", color: "#F5B301" },
          { label: "Avg RR Ratio", value: "—", sub: "Needs RR tracking (not built yet)", color: "#10B981" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-[#6B7280] font-medium mb-1">{kpi.label}</div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-xs text-[#6B7280]">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {perfError ? (
        <div className="text-center py-16 text-sm text-[#6B7280]">Couldn't load analytics right now. Please try again shortly.</div>
      ) : (
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-[#111827] mb-4">Monthly Pips Earned</h3>
          {perfLoading ? <div className="h-[220px] rounded-xl bg-[#F8FAFC] animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={perfData}>
              <defs>
                <linearGradient id="pipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, fontFamily: "Outfit, sans-serif" }} />
              <Area type="monotone" dataKey="pips" stroke="#2563EB" strokeWidth={2.5} fill="url(#pipGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-[#111827] mb-4">Signals by Market</h3>
          {pieLoading ? <div className="h-[180px] rounded-xl bg-[#F8FAFC] animate-pulse" /> : (
          <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[#6B7280]">{d.name}</span>
                </div>
                <span className="font-bold text-[#111827]">{d.value}%</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-[#111827] mb-4">Win Rate by Month (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={perfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
              <Bar dataKey="winRate" fill="#6D28D9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}
    </div>
  );
}
