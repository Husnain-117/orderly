import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, shopItems } from "@/components/layout/AppSidebar";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const currency = (n: number) => `Rs${n.toFixed(0)}`;

function getCurrentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const ShopAnalytics: React.FC = () => {
  const [month, setMonth] = React.useState<string>(getCurrentMonthStr());

  const { data, isLoading } = useQuery({
    queryKey: ['analytics','shop','summary', month],
    queryFn: () => api.analytics.shop.summary(month),
  });

  const { data: frequent } = useQuery({
    queryKey: ['analytics','shop','frequent', 3],
    queryFn: () => api.analytics.shop.frequentItems(3, 10),
  });

  const totals = data?.totals || { orders: 0, items: 0, spend: 0, avgOrderValue: 0 };
  const trend = data?.trend || [];

  return (
    <AppLayout>
      <AppSidebar items={[...shopItems, { title: 'Analytics', url: '/shop/analytics', icon: (p:any)=> <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>}]} />
      <main className="w-full max-w-7xl mx-auto px-6 py-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI title="Total Spent" value={currency(totals.spend)} />
          <KPI title="Orders" value={String(totals.orders)} />
          <KPI title="Avg. Order Value" value={currency(totals.avgOrderValue)} />
          <KPI title="Items" value={String(totals.items)} />
        </div>

        {/* Spend trend */}
        <Card className="p-4 mb-6">
          <div className="text-sm font-semibold text-slate-800 mb-2">Monthly purchases</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, n: string) => n === 'spend' ? currency(Number(v)) : v} />
                <Line type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Frequently bought */}
        <Card className="p-4">
          <div className="text-sm font-semibold text-slate-800 mb-2">Frequently bought items (last 3 months)</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={(frequent?.items || []).map(x=> ({ ...x, label: x.name?.slice(0,18) }))} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </main>
    </AppLayout>
  );
};

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Simple 12-month lookback selector
  const options = React.useMemo(() => {
    const arr: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
  }, []);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44"><SelectValue placeholder="Month" /></SelectTrigger>
      <SelectContent>
        {options.map((m) => (
          <SelectItem key={m} value={m}>{m}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function KPI({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </Card>
  );
}

export default ShopAnalytics;
