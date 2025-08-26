import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, wholesaleItems } from "@/components/layout/AppSidebar";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

const currency = (n: number) => `Rs${n.toFixed(0)}`;

const DistributorAnalytics: React.FC = () => {
  const [range, setRange] = React.useState<'7d'|'30d'|'90d'>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics','distributor','summary', range],
    queryFn: () => api.analytics.distributor.summary(range),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['analytics','distributor','top-products', range],
    queryFn: () => api.analytics.distributor.topProducts(range, 10),
  });

  const { data: topShops } = useQuery({
    queryKey: ['analytics','distributor','top-shops', range],
    queryFn: () => api.analytics.distributor.topShops(range, 10),
  });

  const totals = data?.totals || { orders: 0, items: 0, revenue: 0, avgOrderValue: 0 };
  const trend = data?.trend || [];

  return (
    <AppLayout>
      <AppSidebar items={[...wholesaleItems, { title: 'Analytics', url: '/wholesale/analytics', icon: (p:any)=> <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>}]} />
      <main className="w-full max-w-7xl mx-auto px-6 py-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <Select value={range} onValueChange={(v)=> setRange(v as any)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI title="Revenue" value={currency(totals.revenue)} />
          <KPI title="Orders" value={String(totals.orders)} />
          <KPI title="Avg. Order Value" value={currency(totals.avgOrderValue)} />
          <KPI title="Items Sold" value={String(totals.items)} />
        </div>

        {/* Sales trend */}
        <Card className="p-4 mb-6">
          <div className="text-sm font-semibold text-slate-800 mb-2">Sales Trend</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, n: string) => n === 'revenue' ? currency(Number(v)) : v} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top products */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-slate-800 mb-2">Best-selling products</div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={(topProducts?.items || []).map(x=> ({ ...x, label: x.name?.slice(0,18) }))} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top shops */}
          <Card className="p-4">
            <div className="text-sm font-semibold text-slate-800 mb-2">Top shopkeepers</div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={(topShops?.shops || []).map(x=> ({ ...x, label: x.name?.slice(0,18) }))} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#eef2f7" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any)=> currency(Number(v))} />
                  <Bar dataKey="revenue" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

function KPI({ title, value }: { title: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </Card>
  );
}

export default DistributorAnalytics;
