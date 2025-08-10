import { useMemo, useRef, useState } from "react";
import { AppSidebar, shopItems } from "@/components/layout/AppSidebar";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { ShoppingCart } from "lucide-react";
import { flyToCart } from "@/utils/flyToCart";

const sampleProducts = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.round(50 + Math.random() * 500) / 10,
  image: "/placeholder.svg",
}));

export default function ShopDashboard() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const cartIconRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() =>
    sampleProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase())), [query]);

  const total = useMemo(() =>
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = sampleProducts.find(pp => pp.id === Number(id));
      return sum + (p ? p.price * qty : 0);
    }, 0), [cart]);

  const addToCart = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    const fromEl = (e.currentTarget as HTMLElement);
    const toEl = cartIconRef.current!;
    flyToCart(fromEl, toEl);
  };

  return (
    <>
      <SEO title="Shopkeeper Dashboard • Green Path Trade" description="Quick order from favourites and live cart." />
      <AppLayout headerRight={<div ref={cartIconRef} className="flex items-center gap-2">
        <ShoppingCart className="text-primary" />
        <span className="text-sm">₹{total.toFixed(2)}</span>
      </div>}>
        <AppSidebar items={shopItems} />
        <main className="flex-1 p-4 space-y-4">
          <div className="flex items-end gap-3">
            <div className="w-full max-w-sm space-y-2">
              <Label>Search products</Label>
              <Input placeholder="Type to filter" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Button variant="cta" className="hover-scale">Place Order</Button>
          </div>

          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <Card key={p.id} className="card-hover">
                <CardContent className="p-3">
                  <img src={p.image} alt={`${p.name} image`} className="w-full h-28 object-contain mb-2" loading="lazy" />
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">₹{p.price.toFixed(2)}</div>
                  <div className="mt-3">
                    <Button size="sm" onClick={(e) => addToCart(p.id, e)} className="hover-scale">+ Add</Button>
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
