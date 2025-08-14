import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, adminItems } from "@/components/layout/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";

const data = Array.from({ length: 14 }).map((_, i) => ({
  day: `D${i + 1}`,
  orders: Math.floor(20 + Math.random() * 80),
}));

function Counter({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const duration = 800;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setN(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <span>{n}</span>;
}

export default function Overview() {
  return (
    <>
      <SEO title="Admin Overview • Green Path Trade" description="KPIs and latest activity across the platform." />
      <AppLayout>
        <AppSidebar items={adminItems} />
        <main className="flex-1 p-4 grid gap-4">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="card-hover"><CardHeader><CardTitle>Orders/day</CardTitle></CardHeader><CardContent className="text-2xl font-head"><Counter to={98} /></CardContent></Card>
            <Card className="card-hover"><CardHeader><CardTitle>Active Shops</CardTitle></CardHeader><CardContent className="text-2xl font-head"><Counter to={245} /></CardContent></Card>
            <Card className="card-hover"><CardHeader><CardTitle>Total Sales</CardTitle></CardHeader><CardContent className="text-2xl font-head">Rs<Counter to={1250} /></CardContent></Card>
            <Card className="card-hover"><CardHeader><CardTitle>Late Deliveries</CardTitle></CardHeader><CardContent className="text-2xl font-head"><Counter to={4} /></CardContent></Card>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 card-hover">
              <CardHeader><CardTitle>Orders Trend</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader><CardTitle>Latest Orders</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ORD-{3000 + i}</span>
                    <span className="font-medium">Rs{Math.round(200 + Math.random() * 2000)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </main>
      </AppLayout>
    </>
  );
}
