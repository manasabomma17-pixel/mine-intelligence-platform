import { useEffect, useState } from "react";
import { apiJson } from "../api/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { KpiCard } from "../components/KpiCard";
import { ChartCard } from "../components/ChartCard";


import { AnomalyModal } from "../components/AnomalyModal";

import { Icon } from "../components/Icon";

const fmt = (v) => Number(v).toLocaleString();

const recentActivity = [
  { id: 1, text: "Mine X Geological Report processed", time: "2 h ago", kind: "doc" },
  { id: 2, text: "2024 production anomaly flagged (High)", time: "5 h ago", kind: "anomaly" },
  { id: 3, text: "Mine Intelligence Report generated", time: "1 d ago", kind: "report" },
  { id: 4, text: "Forecast for 2026–2028 updated", time: "2 d ago", kind: "forecast" },
];

const kindStyles = {
  doc: "bg-amber-100 text-amber-700",
  anomaly: "bg-red-100 text-red-700",
  report: "bg-orange-100 text-orange-700",
  forecast: "bg-amber-100 text-amber-700",
};

export function Dashboard() {
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [productionData, setProductionData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [forecastData, setForecastData] = useState(null);

    useEffect(() => {
      Promise.all([
        apiJson("/production"),
        apiJson("/production/kpis"),
        apiJson("/forecast"),
      ])
        .then(([production, kpis, forecast]) => {
          
          setProductionData(production);
          setKpiData(kpis);
          setForecastData(forecast);
        })
        .catch((error) => {
          console.error("Dashboard API error:", error);
        });
    }, []);

  if (!productionData || !kpiData || !forecastData) {
    return <div className="p-6 text-stone-500">Loading dashboard...</div>;
  }
  const trendData = productionData.years.map((y, i) => ({
    year: String(y),
    production: productionData.actual[i],
  }));


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900">Mining Intelligence Dashboard</h2>
        <p className="mt-1 text-sm text-stone-500">
          AI-powered mining &amp; geological intelligence — monitor operations, discover insights, and make evidence-backed decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {forecastData.years.map((year, index) => (
          <ChartCard key={year} title={year}>
            <div className="text-2xl font-semibold text-stone-900">
              {Number(forecastData.values[index]).toFixed(2)} MT
            </div>
            <div className="mt-1 text-xs text-stone-400">
              Linear trend forecast
            </div>
          </ChartCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Documents" value="—" icon={<Icon name="documents" />} accent="blue" footer="Document intelligence"/>
        <KpiCard label="Processed Documents" value="—" icon={<Icon name="file" />} accent="green" footer="Document processing"/>
        <KpiCard label="Production Anomalies"  value={kpiData.anomalies}  icon={<Icon name="orange" />}  accent="red" footer="Detected from official production data"/>
        <KpiCard label="Forecast Available"  value={`${forecastData.years.length} Years`}  icon={<Icon name="trend" />}  accent="amber"  footer={`${forecastData.years[0]} to ${forecastData.years[2]}`}/>

      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Production Trend" action={<span className="text-xs text-stone-400">India · MT/year</span>}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="prodDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8872d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c8872d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6dccd" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#756a5d" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#756a5d" }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `${Number(v).toFixed(0)}`} />
                <Tooltip formatter={(v) => `${fmt(v)} MT`} contentStyle={{ borderRadius: 8, border: "1px solid #e6dccd", fontSize: 12 }} />
                <Area type="monotone" dataKey="production" stroke="#c8872d" strokeWidth={2} fill="url(#prodDash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Annual Production" action={<span className="text-xs text-stone-400">MT/year</span>}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6dccd" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#756a5d" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#756a5d" }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `${Number(v).toFixed(0)}`} />
                <Tooltip formatter={(v) => `${fmt(v)} MT`} contentStyle={{ borderRadius: 8, border: "1px solid #e6dccd", fontSize: 12 }} />
                
                
                <Bar dataKey="production" name="Actual Production" fill="#b86b2a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Recent Documents" className="xl:col-span-1">
          <div className="py-8 text-center text-sm text-stone-400">
            No documents processed yet
          </div>
        </ChartCard>

        <ChartCard title="Recent Activity" className="xl:col-span-1">
          <div className="py-8 text-center text-sm text-stone-400">
            No recent activity
          </div>
        </ChartCard>

        <ChartCard title="Quick Actions" className="xl:col-span-1">
          <div className="py-8 text-center text-sm text-stone-400">
            No quick actions available
          </div>
        </ChartCard>
      </div>

      {selectedAnomaly && (
        <AnomalyModal anomaly={selectedAnomaly} onClose={() => setSelectedAnomaly(null)} />
      )}
    </div>
  );
}
