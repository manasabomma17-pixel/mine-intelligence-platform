import { useEffect, useState } from "react";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line } from "recharts";
import { apiJson } from "../api/client";

import { ChartCard } from "../components/ChartCard";

export function Forecast() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiJson("/forecast")
      .then(setData)
      .catch((error) => console.error("Forecast API error:", error));
  }, []);
  
  if (!data) {
    return <div className="p-6 text-stone-500">Loading forecast...</div>;
  }

  const series = data.years.map((year, i) => ({ year: String(year), forecast: data.values[i], lower: data.lower[i], upper: data.upper[i] }));
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-semibold text-stone-900">Production Forecasting</h2><p className="mt-1 text-sm text-stone-500">Estimate future India raw coal production from historical trends.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">{data.years.map((year,i)=><div key={year} className="rounded-xl border border-stone-200 bg-[#fffaf1] p-5"><div className="text-xs font-semibold uppercase tracking-wide text-stone-400">{year} forecast</div><div className="mt-2 text-2xl font-bold text-stone-900">{Number(data.values[i]).toLocaleString()}</div><div className="mt-1 text-xs text-stone-400">MT</div></div>)}</div>
      <ChartCard title="Forecast with confidence band" action={<span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Trend Forecast</span>}>
        <div className="h-80"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={series}><CartesianGrid strokeDasharray="3 3" stroke="#e6dccd" vertical={false}/><XAxis dataKey="year"/><YAxis tickFormatter={(v) => Number(v).toFixed(0)}/><Tooltip formatter={(v)=>Number(v).toLocaleString()}/><Legend/><Area dataKey="upper" name="Upper bound" stroke="none" fill="#e6c48a" fillOpacity={0.4}/><Area dataKey="lower" name="Lower bound" stroke="none" fill="#e6c48a" fillOpacity={0.4}/><Line dataKey="forecast" name="Forecast" stroke="#b86b2a" strokeWidth={3} dot={{r:4}}/></ComposedChart></ResponsiveContainer></div>
      </ChartCard>
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs leading-5 text-stone-500">
        <b>Method:</b> Linear trend based on official historical production data from the Ministry of Coal, Coal Directory of India 2024-25. Forecast values are trend-based estimates.
      </div>

    </div>
  );
}
