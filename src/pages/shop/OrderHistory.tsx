import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, shopItems } from "@/components/layout/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

const statuses = ["Pending", "Confirmed", "Out for Delivery", "Delivered"] as const;

type Order = {
  id: string;
  date: string;
  status: typeof statuses[number];
  total: number;
};

const mockOrders: Order[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `ORD-${1000 + i}`,
  date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
  status: statuses[Math.min(i, statuses.length - 1)],
  total: Math.round(200 + Math.random() * 1000),
}));

export default function OrderHistory() {
  const [filter, setFilter] = useState<string>("");
  const items = useMemo(() =>
    mockOrders.filter(o => (filter ? o.status === filter : true)), [filter]);

  return (
    <>
      <SEO title="Order History • Green Path Trade" description="Track and reorder from your purchase history." />
      <AppLayout>
        <AppSidebar items={shopItems} />
        <main className="flex-1 p-4 space-y-4">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <select className="border rounded-md px-3 py-2 bg-background" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <section className="grid gap-3">
            {items.map(o => (
              <Card key={o.id} className="row-hover transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.id}</div>
                    <div className="text-sm text-muted-foreground">{o.date}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-secondary text-secondary-foreground">{o.status}</Badge>
                    <div className="font-medium">₹{o.total.toFixed(2)}</div>
                    <Button size="sm" variant="outline">Re-order</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </main>
      </AppLayout>
    </>
  );
}
