import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, wholesaleItems } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { SEO } from "@/components/SEO";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";

export default function OrdersManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<any | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceHtml, setInvoiceHtml] = useState<string>("");
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);
  const [emailTo, setEmailTo] = useState<string>("");
  const [sendingInvoice, setSendingInvoice] = useState<boolean>(false);
  const [invoiceMsg, setInvoiceMsg] = useState<string>("");

  const toStatusCode = (s: string) => {
    const map: Record<string, string> = {
      Pending: 'pending',
      Confirmed: 'confirmed',
      Accepted: 'accepted',
      Placed: 'placed',
      'Out for Delivery': 'out_for_delivery',
      Delivered: 'delivered',
    };
    return map[s] || '';
  };

  const fetchOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter !== 'all' ? toStatusCode(statusFilter) : undefined;
      const qParam = search.trim() ? search.trim() : undefined;
      console.log(`[OrdersManagement] Fetching orders (auth distributor). status=${statusParam || 'any'} q=${qParam || ''}`);
      const res = await api.orders.forDistributorCurrent({ status: statusParam, q: qParam, sort: 'createdAt_desc' });
      const list = res.orders || [];
      setOrders(list);
    } catch (e: any) {
      console.error(`[OrdersManagement] Error fetching orders:`, e);
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // auto-refresh every 60s (less aggressive)
    const id = setInterval(() => {
      if (!loading && !updating) {
        fetchOrders();
      }
    }, 60000);
    return () => clearInterval(id);
  }, [user?.id, statusFilter, search]);

  const handleMarkPlaced = async (orderId: string) => {
    try {
      setUpdating(orderId);
      await api.orders.markPlaced(orderId);
      // Refresh orders using auth endpoint with current filters
      const statusParam = statusFilter !== 'all' ? toStatusCode(statusFilter) : undefined;
      const qParam = search.trim() ? search.trim() : undefined;
      const res = await api.orders.forDistributorCurrent({ status: statusParam, q: qParam, sort: 'createdAt_desc' });
      setOrders(res.orders || []);
    } catch (e: any) {
      setError(e.message || "Failed to mark order as placed");
    } finally {
      setUpdating(null);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setUpdating(orderId);
      await api.orders.accept(orderId);
      // Refresh orders using auth endpoint with current filters
      const statusParam = statusFilter !== 'all' ? toStatusCode(statusFilter) : undefined;
      const qParam = search.trim() ? search.trim() : undefined;
      const res = await api.orders.forDistributorCurrent({ status: statusParam, q: qParam, sort: 'createdAt_desc' });
      setOrders(res.orders || []);
    } catch (e: any) {
      setError(e.message || "Failed to accept order");
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkOutForDelivery = async (orderId: string) => {
    try {
      setUpdating(orderId);
      await api.orders.markOutForDelivery(orderId);
      // Refresh orders using auth endpoint with current filters
      const statusParam = statusFilter !== 'all' ? toStatusCode(statusFilter) : undefined;
      const qParam = search.trim() ? search.trim() : undefined;
      const res = await api.orders.forDistributorCurrent({ status: statusParam, q: qParam, sort: 'createdAt_desc' });
      setOrders(res.orders || []);
    } catch (e: any) {
      setError(e.message || "Failed to mark order as out for delivery");
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      setUpdating(orderId);
      await api.orders.markDelivered(orderId);
      // Refresh orders using auth endpoint with current filters
      const statusParam = statusFilter !== 'all' ? toStatusCode(statusFilter) : undefined;
      const qParam = search.trim() ? search.trim() : undefined;
      const res = await api.orders.forDistributorCurrent({ status: statusParam, q: qParam, sort: 'createdAt_desc' });
      setOrders(res.orders || []);
    } catch (e: any) {
      setError(e.message || "Failed to mark order as delivered");
    } finally {
      setUpdating(null);
    }
  };

  const normalizeStatus = (s?: string) => {
    if (!s) return "Unknown";
    const map: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      accepted: "Accepted",
      placed: "Placed",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
    };
    const key = String(s).toLowerCase();
    return map[key] || s.charAt(0).toUpperCase() + s.slice(1);
  };

  const filtered = useMemo(() => {
    // Server already filtered and sorted; just return orders as-is
    return Array.isArray(orders) ? orders : [];
  }, [orders]);

  return (
    <>
      <SEO title="Orders Management • Green Path Trade" description="Confirm, edit, and progress incoming orders." />
      <AppLayout>
        <AppSidebar items={wholesaleItems} />
        <main className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Total: <span className="font-medium text-foreground">{orders.length}</span></span>
              <span className="mx-1">•</span>
              <span>Showing: <span className="font-medium text-foreground">{filtered.length}</span></span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search by Order ID or Shop"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-2 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Accepted">Accepted</option>
                <option value="Placed">Placed</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
              <Button variant="outline" onClick={fetchOrders}>Refresh</Button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-left">
                  <tr className="border-b">
                    <th className="py-3 px-4">Order</th>
                    <th className="px-4">Shop</th>
                    <th className="px-4">Product</th>
                    <th className="px-4">Items</th>
                    <th className="px-4">Qty</th>
                    <th className="px-4">Price</th>
                    <th className="px-4">Status</th>
                    <th className="px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Loading orders…</td></tr>
                  )}
                  {error && (
                    <tr><td colSpan={8} className="py-8 text-center text-destructive">{error}</td></tr>
                  )}
                  {!loading && !error && orders.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No orders found.</td></tr>
                  )}
                  {!loading && !error && filtered.length === 0 && orders.length > 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No orders match your filters.</td></tr>
                  )}
                  {!loading && !error && filtered.map((o) => (
                    <tr key={o.id} className="group hover:bg-emerald-50/40 transition-all">
                      <td className="py-3 px-4 font-medium">{o.id}</td>
                      <td className="px-4">{o.shopName || o.distributorName || o.userId}</td>
                      <td className="px-4">
                        {o.items?.[0]?.name || '-'}
                        {o.items && o.items.length > 1 && (
                          <span className="text-xs text-muted-foreground"> +{o.items.length - 1} more</span>
                        )}
                      </td>
                      <td className="px-4">{o.items?.length ?? 0}</td>
                      <td className="px-4">{o.items?.reduce((sum, it) => sum + (it.qty || 0), 0)}</td>
                      <td className="px-4">Rs{(o.items?.reduce((sum, it) => sum + (it.qty * it.price), 0) || 0).toFixed(2)}</td>
                      <td className="px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (o.status === 'pending' || normalizeStatus(o.status) === 'Pending') ? 'bg-yellow-100 text-yellow-800' :
                          (o.status === 'confirmed' || normalizeStatus(o.status) === 'Confirmed') ? 'bg-purple-100 text-purple-800' :
                          (o.status === 'accepted' || normalizeStatus(o.status) === 'Accepted') ? 'bg-green-100 text-green-800' :
                          (o.status === 'placed' || normalizeStatus(o.status) === 'Placed') ? 'bg-blue-100 text-blue-800' :
                          (o.status === 'out_for_delivery' || normalizeStatus(o.status) === 'Out for Delivery') ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {normalizeStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-4 text-right">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="transition-all group-hover:border-emerald-500 group-hover:text-emerald-600" 
                            onClick={() => { setActive(o); setOpen(true); }}
                          >
                            View Details
                          </Button>
                          {(o.status === 'confirmed' || normalizeStatus(o.status) === 'Confirmed') && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-green-600 hover:bg-green-700"
                              disabled={updating === o.id}
                              onClick={() => handleAcceptOrder(o.id)}
                            >
                              {updating === o.id ? 'Accepting…' : 'Accept Order'}
                            </Button>
                          )}
                          {(o.status === 'accepted' || normalizeStatus(o.status) === 'Accepted') && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={updating === o.id}
                              onClick={() => handleMarkPlaced(o.id)}
                            >
                              {updating === o.id ? 'Updating…' : 'Mark Placed'}
                            </Button>
                          )}
                          {(o.status === 'placed' || normalizeStatus(o.status) === 'Placed') && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-orange-600 hover:bg-orange-700"
                              disabled={updating === o.id}
                              onClick={() => handleMarkOutForDelivery(o.id)}
                            >
                              {updating === o.id ? 'Updating…' : 'Out for Delivery'}
                            </Button>
                          )}
                          {(o.status === 'out_for_delivery' || normalizeStatus(o.status) === 'Out for Delivery') && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={updating === o.id}
                              onClick={() => handleMarkDelivered(o.id)}
                            >
                              {updating === o.id ? 'Updating…' : 'Mark Delivered'}
                            </Button>
                          )}
                        </div>
                      </td>
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
  <DrawerTitle>
    Order <span className="font-mono text-xs bg-muted px-2 py-1 rounded ml-1">{active?.id}</span>
  </DrawerTitle>
  <div className="text-xs text-muted-foreground mt-1">
    Shop: <span className="font-semibold">{active?.distributorName || active?.shop || active?.userId}</span>
    {active?.distributorId && (
      <span className="ml-2">(ID: <span className="font-mono">{active.distributorId}</span>)</span>
    )}
  </div>
</DrawerHeader>
          <div className="p-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Shop</div>
                <div className="font-medium">{active?.distributorName || active?.shop || active?.userId}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="font-medium">Rs{(active?.items?.reduce((sum, it) => sum + (it.qty * it.price), 0) || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Items</div>
                <div className="font-medium">{active?.items?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Quantity</div>
                <div className="font-medium">{active?.items?.reduce((sum, it) => sum + (it.qty || 0), 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (active?.status === 'pending' || normalizeStatus(active?.status) === 'Pending') ? 'bg-yellow-100 text-yellow-800' :
                    (active?.status === 'confirmed' || normalizeStatus(active?.status) === 'Confirmed') ? 'bg-purple-100 text-purple-800' :
                    (active?.status === 'accepted' || normalizeStatus(active?.status) === 'Accepted') ? 'bg-green-100 text-green-800' :
                    (active?.status === 'placed' || normalizeStatus(active?.status) === 'Placed') ? 'bg-blue-100 text-blue-800' :
                    (active?.status === 'out_for_delivery' || normalizeStatus(active?.status) === 'Out for Delivery') ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {normalizeStatus(active?.status)}
                  </span>
                </div>
              </div>
              {active?.confirmedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Confirmed At</div>
                  <div className="font-medium text-xs">{new Date(active.confirmedAt).toLocaleString()}</div>
                </div>
              )}
              {active?.placedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Placed At</div>
                  <div className="font-medium text-xs">{new Date(active.placedAt).toLocaleString()}</div>
                </div>
              )}
              {active?.outForDeliveryAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Out for Delivery At</div>
                  <div className="font-medium text-xs">{new Date(active.outForDeliveryAt).toLocaleString()}</div>
                </div>
              )}
            </div>
            {Array.isArray(active?.items) && active.items.length > 0 && (
  <div className="border rounded-md p-3 bg-muted/40">
    <div className="font-semibold mb-2 text-sm text-muted-foreground">Products</div>
    <ul className="divide-y">
      {active.items.map((item: any, idx: number) => (
        <li key={item.productId || idx} className="py-2 flex flex-col gap-1 text-xs">
          <div>
            <span className="font-medium">{item.name}</span>
            {item.productId && (
              <span className="ml-2 text-muted-foreground">(ID: <span className="font-mono">{item.productId}</span>)</span>
            )}
          </div>
          <div className="flex justify-between">
            <span>Qty: <span className="font-semibold">{item.qty}</span></span>
            <span>Rs{(item.price * item.qty).toFixed(2)}</span>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}
<div className="flex gap-2 mt-4">
              {(active?.status === 'confirmed' || normalizeStatus(active?.status) === 'Confirmed') && (
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={updating === active?.id}
                  onClick={async () => {
                    if (!active) return;
                    await handleAcceptOrder(active.id);
                    setOpen(false);
                  }}
                >
                  {updating === active?.id ? 'Accepting…' : 'Accept Order'}
                </Button>
              )}
              {(active?.status === 'accepted' || normalizeStatus(active?.status) === 'Accepted') && (
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updating === active?.id}
                  onClick={async () => {
                    if (!active) return;
                    await handleMarkPlaced(active.id);
                    setOpen(false);
                  }}
                >
                  {updating === active?.id ? 'Updating…' : 'Mark Placed'}
                </Button>
              )}
              {(active?.status === 'placed' || normalizeStatus(active?.status) === 'Placed') && (
                <Button
                  variant="default"
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={updating === active?.id}
                  onClick={async () => {
                    if (!active) return;
                    await handleMarkOutForDelivery(active.id);
                    setOpen(false);
                  }}
                >
                  {updating === active?.id ? 'Updating…' : 'Out for Delivery'}
                </Button>
              )}
              {(active?.status === 'out_for_delivery' || normalizeStatus(active?.status) === 'Out for Delivery') && (
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={updating === active?.id}
                  onClick={async () => {
                    if (!active) return;
                    await handleMarkDelivered(active.id);
                    setOpen(false);
                  }}
                >
                  {updating === active?.id ? 'Updating…' : 'Mark Delivered'}
                </Button>
              )}
              {/* Invoice Actions */}
              <Button
                variant="outline"
                disabled={invoiceLoading || !active?.id}
                onClick={async () => {
                  if (!active?.id) return;
                  try {
                    setInvoiceMsg("");
                    setInvoiceLoading(true);
                    const res = await api.orders.getInvoiceHtml(active.id);
                    setInvoiceHtml(res.html || "");
                  } catch (e: any) {
                    setInvoiceMsg(e.message || 'Failed to load invoice');
                    setInvoiceHtml("");
                  } finally {
                    setInvoiceLoading(false);
                  }
                }}
              >
                {invoiceLoading ? 'Loading Invoice…' : 'Preview Invoice'}
              </Button>
            </div>
            {/* Invoice Preview & Send */}
            {(invoiceHtml || invoiceLoading || invoiceMsg) && (
              <div className="mt-4 border rounded-md">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="text-sm font-semibold">Invoice Preview</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setInvoiceHtml(""); setInvoiceMsg(""); }}
                  >
                    Clear
                  </Button>
                </div>
                <div className="p-3 space-y-3">
                  {!!invoiceMsg && (
                    <div className="text-xs text-destructive">{invoiceMsg}</div>
                  )}
                  {invoiceLoading && (
                    <div className="text-sm text-muted-foreground">Generating invoice…</div>
                  )}
                  {!!invoiceHtml && (
                    <div className="max-h-[400px] overflow-auto rounded bg-white border">
                      <div dangerouslySetInnerHTML={{ __html: invoiceHtml }} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Recipient email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button
                      disabled={sendingInvoice || !active?.id}
                      onClick={async () => {
                        if (!active?.id) return;
                        try {
                          setInvoiceMsg("");
                          setSendingInvoice(true);
                          const res = await api.orders.sendInvoiceEmail(active.id, emailTo ? { to: emailTo } : undefined);
                          setInvoiceMsg(`Sent to ${res.to}`);
                        } catch (e: any) {
                          setInvoiceMsg(e.message || 'Failed to send invoice');
                        } finally {
                          setSendingInvoice(false);
                        }
                      }}
                    >
                      {sendingInvoice ? 'Sending…' : 'Send Invoice Email'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
