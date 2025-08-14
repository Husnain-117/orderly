import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/SEO';
import { useNavigate } from 'react-router-dom';
import { AppSidebar, shopItems } from '@/components/layout/AppSidebar';
import AppLayout from '@/components/layout/AppLayout';

export default function AddToCart() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.orders.my();
      console.log(`[AddToCart] Received ${res.orders?.length || 0} orders:`, res.orders);
      setAllOrders(res.orders || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch orders');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrder = async (orderId: string, items: any[]) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.orders.update(orderId, items);
      setMessage('Cart updated!');
      fetchOrders();
    } catch (e: any) {
      setError(e.message || 'Failed to update cart');
    }
    setLoading(false);
  };

  // Separate orders by status
  const pendingOrders = allOrders.filter((o: any) => o.status === 'pending');
  const confirmedOrders = allOrders.filter((o: any) => ['confirmed', 'accepted', 'placed', 'out_for_delivery'].includes(o.status));

  const removeOrder = async (orderId: string) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.orders.remove(orderId);
      setMessage('Order removed from cart.');
      fetchOrders(); // Refresh to get updated list
    } catch (e: any) {
      setError(e.message || 'Failed to remove order');
      fetchOrders(); // fallback to sync
    }
    setLoading(false);
  };

  const confirmOrder = async (orderId: string) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.orders.confirm(orderId);
      setMessage(res.message || 'Order confirmed!');
      // Refresh orders to get updated status instead of removing
      fetchOrders();
    } catch (e: any) {
      setError(e.message || 'Failed to confirm order');
      fetchOrders(); // fallback to sync
    }
    setLoading(false);
  };


  return (
    <AppLayout>
      <SEO title="My Cart - Orderly" description="Review and manage your cart items" />
      <AppSidebar items={shopItems} />
      <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Cart</h1>
          <p className="text-sm text-slate-600">Review items in your cart and track order status.</p>
        </div>
        <div className="sticky top-0 z-10 -mx-6 mb-6 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="px-6 py-3 flex justify-between items-center">
            <h2 className="text-sm font-medium uppercase tracking-wide text-slate-700">Orders</h2>
            <Button variant="outline" onClick={fetchOrders} disabled={loading} className="border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300">
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {loading && <div className="mb-4">Loading...</div>}
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {message && <div className="mb-4 text-green-600">{message}</div>}
        {/* Pending Orders Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-slate-800">Pending Orders (Cart)</h2>
          {pendingOrders.length === 0 ? (
            <div className="text-slate-500 text-center py-10 bg-white rounded-lg border border-slate-200">
              <span className="text-2xl">🛒</span>
              <div className="mt-2 text-sm">Your cart is empty. Add products to get started.</div>
            </div>
          ) : (
            pendingOrders.map((order: any) => (
            <Card key={order.id} className="mb-6 border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900">Order</span>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.id.slice(0, 8)}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-lg font-semibold text-slate-900">Rs{(order.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0)).toFixed(2)}</div>
                  </div>
                </div>
                <ul className="mb-3 text-sm">
                  {order.items.map((item: any, idx: number) => (
                    <li key={item.productId} className="flex items-center gap-2 py-1">
                      <span className="flex-1 text-slate-800">{item.name} <span className="text-slate-400">(Rs{item.price} each)</span></span>
                      <Input
                        type="number"
                        min={1}
                        value={item.qty}
                        className="w-16 h-8 text-center border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        onChange={e => {
                          const qty = Math.max(1, parseInt(e.target.value) || 1);
                          const newItems = order.items.map((it: any, i: number) => i === idx ? { ...it, qty } : it);
                          updateOrder(order.id, newItems);
                        }}
                      />
                      <Button size="sm" variant="outline" className="border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" onClick={() => {
                        const newItems = order.items.filter((_: any, i: number) => i !== idx);
                        if (newItems.length === 0) removeOrder(order.id);
                        else updateOrder(order.id, newItems);
                      }}>Remove</Button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button onClick={() => confirmOrder(order.id)} variant="cta" className="bg-emerald-600 hover:bg-emerald-700">
                    Confirm Order
                  </Button>
                  <Button variant="outline" className="border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" onClick={() => removeOrder(order.id)}>
                    Remove Entire Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </div>

        {/* Confirmed Orders Section */}
        {confirmedOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-slate-800">Order Status</h2>
            {confirmedOrders.map((order: any) => (
              <Card key={order.id} className="mb-4 border border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">Order</span>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{order.id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        order.status === 'placed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'out_for_delivery' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {order.status === 'out_for_delivery' ? 'Out for Delivery' : 
                         order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Total</div>
                      <div className="text-lg font-semibold text-slate-900">Rs{(order.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0)).toFixed(2)}</div>
                    </div>
                  </div>
                  <ul className="mb-2 text-sm">
                    {order.items.map((item: any, idx: number) => (
                      <li key={item.productId} className="flex justify-between items-center py-1">
                        <span>{item.name} × {item.qty}</span>
                        <span className="font-medium">Rs{(item.price * item.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-right text-xs text-slate-500">Prices include any applicable taxes</div>
                  {order.status === 'confirmed' && (
                    <div className="mt-2 text-sm text-purple-600">
                      ⏳ Waiting for distributor to accept your order...
                    </div>
                  )}
                  {order.status === 'accepted' && (
                    <div className="mt-2 text-sm text-green-600">
                      ✅ Order accepted! Preparing for shipment...
                    </div>
                  )}
                  {order.status === 'placed' && (
                    <div className="mt-2 text-sm text-blue-600">
                      📦 Order placed and being prepared...
                    </div>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <div className="mt-2 text-sm text-orange-600">
                      🚚 Your order is out for delivery!
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Button variant="outline" className="border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300" onClick={() => navigate('/shop/dashboard')}>Back to Shop</Button>
      </div>
    </AppLayout>
  );
};
