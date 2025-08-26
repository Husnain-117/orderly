import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, wholesaleItems } from "@/components/layout/AppSidebar";
import { Package, ShoppingCart, Users, UserCheck } from "lucide-react";
import { api } from "@/lib/api";

const DistributorDashboard: React.FC = () => {
  const { data: ordersData, isLoading: loadingOrders, isError: ordersError } = useQuery({
    queryKey: ["orders", "for-distributor", { scope: "dashboard" }],
    queryFn: () => api.orders.forDistributorCurrent({ limit: 100 }),
  });

  const { data: productsData, isLoading: loadingProducts, isError: productsError } = useQuery({
    queryKey: ["products", "list"],
    queryFn: () => api.products.list(),
  });

  const { data: salesReqData, isLoading: loadingSalesReqs } = useQuery({
    queryKey: ["distributor", "sales-requests", { scope: "dashboard" }],
    queryFn: () => api.distributor.salesRequests(),
  });

  const orders = ordersData?.orders ?? [];
  const products = productsData?.products ?? [];
  const salesRequests = salesReqData?.requests ?? [];

  // Status counts (based on currently fetched orders page)
  const totalOrders = orders.length;
  const pendingConfirmations = orders.filter((o: any) => o.status === "confirmed").length;
  const accepted = orders.filter((o: any) => o.status === "accepted").length;

  const stats = [
    { label: "Orders (recent)", value: loadingOrders ? "…" : totalOrders, icon: ShoppingCart, color: "text-emerald-600" },
    { label: "Pending confirmations", value: loadingOrders ? "…" : pendingConfirmations, icon: Users, color: "text-amber-600" },
    { label: "SKUs in inventory", value: loadingProducts ? "…" : products.length, icon: Package, color: "text-blue-600" },
    { label: "Accepted (recent)", value: loadingOrders ? "…" : accepted, icon: ShoppingCart, color: "text-emerald-700" },
    { label: "Salesperson requests", value: loadingSalesReqs ? "…" : salesRequests.filter((r: any) => r.status === 'pending').length, icon: UserCheck, color: "text-purple-700" },
  ];

  return (
    <>
      <SEO title="Wholesaler Dashboard • Orderly" description="Manage inventory and monitor incoming orders from retail partners." />
      <AppLayout>
        <AppSidebar items={wholesaleItems} />
        <main className="w-full max-w-7xl mx-auto px-6 py-6 bg-slate-50 min-h-screen">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-600">Monitor orders and manage your inventory.</p>
          </div>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <Card key={stat.label} className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-white border border-slate-200 ${stat.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/wholesale/inventory" className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Package className="mr-2 h-4 w-4" />
                    Manage Inventory
                  </Button>
                </Link>
                <Link to="/wholesale/orders" className="block">
                  <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Orders
                  </Button>
                </Link>
                <Link to="/wholesale/sales-requests" className="block">
                  <Button variant="secondary" className="w-full">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Manage Salesperson Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>
            {/* Removed recent activity placeholder to keep dashboard focused on real data */}
          </section>
        </main>
      </AppLayout>
    </>
  );
};

export default DistributorDashboard;