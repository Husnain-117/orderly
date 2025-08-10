import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, wholesaleItems } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { SEO } from "@/components/SEO";

const orders = Array.from({ length: 10 }).map((_, i) => ({
  id: `ORD-${2000 + i}`,
  shop: `Shop ${i + 1}`,
  items: Math.floor(Math.random() * 8) + 1,
  qty: Math.floor(Math.random() * 20) + 1,
  price: Math.round(500 + Math.random() * 5000),
}));

export default function OrdersManagement() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<typeof orders[number] | null>(null);

  return (
    <>
      <SEO title="Orders Management • Green Path Trade" description="Confirm, edit, and progress incoming orders." />
      <AppLayout>
        <AppSidebar items={wholesaleItems} />
        <main className="flex-1 p-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b">
                    <th className="py-3 px-4">Order</th>
                    <th className="px-4">Shop</th>
                    <th className="px-4">Items</th>
                    <th className="px-4">Qty</th>
                    <th className="px-4">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="row-hover cursor-pointer" onClick={() => { setActive(o); setOpen(true); }}>
                      <td className="py-3 px-4 font-medium">{o.id}</td>
                      <td className="px-4">{o.shop}</td>
                      <td className="px-4">{o.items}</td>
                      <td className="px-4">{o.qty}</td>
                      <td className="px-4">₹{o.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </AppLayout>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="animate-slide-in-right">
          <DrawerHeader>
            <DrawerTitle>Order {active?.id}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Shop</div>
                <div className="font-medium">{active?.shop}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="font-medium">₹{active?.price.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">Confirm</Button>
              <Button variant="outline">Mark Packed</Button>
              <Button variant="cta">Out for Delivery</Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
