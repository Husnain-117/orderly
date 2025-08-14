import { useMemo, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, shopItems } from "@/components/layout/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { Clock, Package, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

// Only expose the statuses we want the user to filter by
const statuses = ["Pending", "Placed", "Delivered"] as const;

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string; // Add image URL to the order items
};

// Orders returned from API include an 'items' field: OrderItem[]
type Order = {
  id: string;
  date: string;
  status: typeof statuses[number];
  total: number;
  items: OrderItem[];
};

// Fetch real orders
// Orders will have id, status, date, total, and other backend fields


const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending": return <Clock className="w-4 h-4" />;
    case "Placed": return <Package className="w-4 h-4" />;
    case "Delivered": return <CheckCircle className="w-4 h-4" />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    // Slightly adjusted palette inspired by Amazon/eBay while keeping emerald brand accents
    case "Pending": return "bg-amber-100 text-amber-800";
    case "Placed": return "bg-blue-100 text-blue-800";
    case "Delivered": return "bg-emerald-100 text-emerald-800";
    default: return "bg-slate-100 text-slate-800";
  }
};

// Normalize backend statuses into the visible buckets for consistent filtering and display
function normalizeStatus(s: string): typeof statuses[number] | "Other" {
  if (!s) return "Other";
  const up = s.toLowerCase();
  if (up === "pending" || up === "confirmed") return "Pending";
  if (up === "accepted" || up === "placed") return "Placed";
   if (up === "delivered") return "Delivered";
  return "Other";
}

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

export default function OrderHistory() {
  const [filter, setFilter] = useState<string>("");
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.orders.my(),
  });
  // Normalize orders to always have a 'date' field
const normalizedOrders = (data?.orders || []).map((o: any) => ({
  ...o,
  date: o.date || o.createdAt || '',
  displayStatus: normalizeStatus(o.status),
}));
  // Date filter logic
const [dateFilter, setDateFilter] = useState<string>("all");
const now = new Date();

function isToday(date: Date) {
  return date.toDateString() === now.toDateString();
}
function isYesterday(date: Date) {
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  return date.toDateString() === yest.toDateString();
}
function isLast7Days(date: Date) {
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  return date >= weekAgo && date <= now;
}
function isThisMonth(date: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

const filteredItems = useMemo(() => {
  let filtered = normalizedOrders;
  if (filter) filtered = filtered.filter(o => o.displayStatus === filter);
  filtered = filtered.filter(o => {
    if (dateFilter === 'all') return true;
    const od = new Date(o.date);
    if (dateFilter === 'today') return isToday(od);
    if (dateFilter === 'yesterday') return isYesterday(od);
    if (dateFilter === 'last7') return isLast7Days(od);
    if (dateFilter === 'month') return isThisMonth(od);
    return true;
  });
  // Sort descending (latest first)
  filtered = filtered.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return filtered;
}, [normalizedOrders, filter, dateFilter]);

// Counts per normalized status for the UI cards
const statusCounts = useMemo(() => {
  const base: Record<string, number> = { All: 0 };
  statuses.forEach(s => { base[s] = 0; });
  normalizedOrders.forEach((o: any) => {
    base.All += 1;
    if (o.displayStatus && base[o.displayStatus] !== undefined) {
      base[o.displayStatus] += 1;
    }
  });
  return base as Record<"All" | typeof statuses[number], number>;
}, [normalizedOrders]);

  return (
    <>
      <SEO title="Order History • Orderly" description="Track and reorder from your purchase history." />
      <AppLayout>
        <AppSidebar items={shopItems} />
        <main className="w-full max-w-7xl mx-auto px-6 py-6 bg-slate-50 min-h-screen">
          {/* Loading/Error/Empty States */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="animate-spin mb-2"><RefreshCw className="w-8 h-8" /></span>
              Loading your orders...
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              Failed to load orders. Please try again later.
            </div>
          )}
          {!isLoading && !error && filteredItems.length === 0 && (
  <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
    <span className="relative flex h-16 w-16 mb-4">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
      <Package className="relative w-16 h-16 text-emerald-500 drop-shadow-lg" />
    </span>
    <span className="text-xl font-semibold text-slate-600 mb-2">No orders found!</span>
    <span className="text-slate-400 mb-6">Try adjusting your filters or go back to the shop to place a new order.</span>
    <Button
      variant="cta"
      className="px-6 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 transition-all"
      onClick={() => window.location.href = '/shop/dashboard'}
    >
      &larr; Back to Shop
    </Button>
  </div>
          )}
          {!isLoading && !error && filteredItems.length > 0 && (
            <>
              {/* Simple Header */}
              <div className="mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Order history</h1>
                <p className="text-sm text-slate-600">Track your orders and quickly access details.</p>
              </div>
              {/* Filters (sticky bar) */}
              <div className="sticky top-0 z-10 -mx-6 mb-6 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="px-6 py-3 flex flex-wrap gap-3 items-center">
                  {/* Status Filter as cards with counts */}
                  <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 shadow-sm flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-600 mr-1">Status</span>
                    <div className="flex gap-2">
                      {/* All card */}
                      <button
                        onClick={() => setFilter("")}
                        className={`group px-3 py-1.5 rounded-md text-sm transition-all duration-200 border ${
                          filter === "" ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                        title={`All (${statusCounts.All || 0})`}
                      >
                        <div className="flex items-center gap-2">
                          <Package className={`w-4 h-4 ${filter === '' ? 'text-white' : 'text-slate-500 group-hover:text-emerald-600'}`} />
                          <span className="font-medium">All</span>
                          <span className={`ml-1 text-xs ${filter === '' ? 'text-emerald-50' : 'text-slate-400'}`}>({statusCounts.All || 0})</span>
                        </div>
                      </button>
                      {statuses.map(status => (
                        <button
                          key={status}
                          onClick={() => setFilter(status)}
                          className={`group px-3 py-1.5 rounded-md text-sm transition-all duration-200 border ${
                            filter === status ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                          title={`${status} (${statusCounts[status] || 0})`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`${filter === status ? 'text-white' : 'text-slate-500 group-hover:text-emerald-600'}`}>{getStatusIcon(status)}</span>
                            <span className="font-medium whitespace-nowrap">{status}</span>
                            <span className={`ml-1 text-xs ${filter === status ? 'text-emerald-50' : 'text-slate-400'}`}>({statusCounts[status] || 0})</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Date Filter */}
                  <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 shadow-sm flex items-center gap-2 ml-auto">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Date</span>
                    <select
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                      className="px-2 py-1 rounded-md text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="all">All</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="last7">Last 7 Days</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Orders List */}
              <div className="space-y-4">
                {filteredItems.map(o => (
                  <Card key={o.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-200 bg-white">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-10 h-10 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-100">
                            <Package className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-slate-900 truncate">Order #{o.id}</h3>
                              <span className="text-slate-300">•</span>
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(o.displayStatus)}`}>
                                {getStatusIcon(o.displayStatus)}
                                <span>{o.displayStatus}</span>
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {(() => {
  const od = new Date(o.date);
  let dateLabel = "";
  if (isToday(od)) dateLabel = "Today";
  else if (isYesterday(od)) dateLabel = "Yesterday";
  else if (isLast7Days(od)) dateLabel = od.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  else if (isThisMonth(od)) dateLabel = od.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  else dateLabel = od.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeLabel = od.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dateLabel} • ${timeLabel}`;
})()}
                            </div>
                            {/* Compact item preview thumbnails */}
                            {Array.isArray(o.items) && o.items.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                {o.items.slice(0, 3).map((item, idx) => (
                                  <div key={`${item.productId || idx}-thumb`} className="w-8 h-8 rounded border border-slate-200 overflow-hidden bg-white">
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = '/products/placeholder.png';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                        <Package className="w-4 h-4 text-slate-300" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {o.items.length > 3 && (
                                  <div className="text-xs text-slate-500">+{o.items.length - 3} more</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Total</div>
                            <div className="text-lg font-semibold text-slate-900">{typeof o.total === 'number' ? `Rs${o.total.toFixed(2)}` : '--'}</div>
                            {Array.isArray(o.items) && (
                              <div className="text-xs text-slate-500">{o.items.length} item{o.items.length === 1 ? '' : 's'}</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all duration-200"
                                >
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Order Details</DialogTitle>
                                  <DialogDescription>Order ID: {o.id}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-slate-700">Order Items</h4>
                                    <div className="space-y-3">
                                      {o.items.map((item, idx) => (
                                        <div key={`${item.productId}-${idx}`} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                          <div className="w-16 h-16 flex-shrink-0 bg-white rounded-md border border-slate-200 overflow-hidden">
                                            {item.image ? (
                                              <img 
                                                src={item.image} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  // Fallback to a placeholder if image fails to load
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = '/products/placeholder.png';
                                                }}
                                              />
                                            ) : (
                                              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                <Package className="w-6 h-6 text-slate-300" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-slate-800 truncate">{item.name}</h4>
                                            <div className="flex items-center justify-between text-sm text-slate-500">
                                              <span>Qty: {item.qty}</span>
                                              <span className="font-medium">Rs{(item.price * item.qty).toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-slate-400">Rs{item.price.toFixed(2)} each</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-200 pt-4 mt-4">
                                    <div className="flex justify-between items-center font-medium text-slate-800">
                                      <span>Total</span>
                                      <span>Rs{o.total?.toFixed(2) || '0.00'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <table className="min-w-full text-sm border rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-700">Product</th>
                                        <th className="px-3 py-2 text-right font-semibold text-slate-700">Quantity</th>
                                        <th className="px-3 py-2 text-right font-semibold text-slate-700">Price</th>
                                        <th className="px-3 py-2 text-right font-semibold text-slate-700">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Array.isArray(o.items) && o.items.length > 0 ? (
                                        o.items.map((item, idx) => (
                                          <tr key={item.productId || idx} className="border-t">
                                            <td className="px-3 py-2">{item.name}</td>
                                            <td className="px-3 py-2 text-right">{item.qty}</td>
                                            <td className="px-3 py-2 text-right">Rs{item.price.toFixed(2)}</td>
                                            <td className="px-3 py-2 text-right">Rs{(item.qty * item.price).toFixed(2)}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={4} className="px-3 py-4 text-center text-slate-400">No products found in this order.</td>
                                        </tr>
                                      )}
                                    </tbody>
                                    <tfoot>
                                      <tr>
                                        <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td>
                                        <td className="px-3 py-2 text-right font-bold">{typeof o.total === 'number' ? `Rs${o.total.toFixed(2)}` : '--'}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                                <DialogClose asChild>
                                  <Button className="mt-6 w-full" variant="secondary">Close</Button>
                                </DialogClose>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </main>
      </AppLayout>
    </>
  );
}
