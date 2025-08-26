// In production on Vercel, default to same-origin '/api' so rewrites route to serverless backend without CORS
export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '');

function joinUrl(path: string): string {
  if (!path) return API_BASE;
  return path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options && typeof options === 'object' && options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  const res = await fetch(joinUrl(path), {
    credentials: 'include',
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export type Distributor = {
  id: string;
  email: string;
  role: string;
  organizationName?: string;
  createdAt: string;
};

export type PublicProduct = {
  id: string;
  ownerId: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  description: string;
  distributorName: string;
  createdAt: string;
  updatedAt: string;
};

export const api = {
  orders: {
    forDistributorCurrent(params?: { status?: string; q?: string; sort?: string; limit?: number; offset?: number }) {
      const usp = new URLSearchParams();
      if (params?.status) usp.set('status', params.status);
      if (params?.q) usp.set('q', params.q);
      if (params?.sort) usp.set('sort', params.sort);
      if (typeof params?.limit !== 'undefined') usp.set('limit', String(params.limit));
      if (typeof params?.offset !== 'undefined') usp.set('offset', String(params.offset));
      const qs = usp.toString();
      const path = `/orders/for-distributor${qs ? `?${qs}` : ''}`;
      return request<{ ok: boolean; total?: number; orders: any[] }>(path);
    },
    forDistributor(distributorId: string) {
      return request<{ ok: boolean; orders: any[] }>(`/orders/for-distributor/${distributorId}`);
    },
    my() {
      return request<{ ok: boolean; orders: any[] }>(`/orders/my`);
    },
    addToCart(items: Array<{ productId: string; qty: number }>) {
      return request<{ ok: boolean; order: any }>(`/orders/cart`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
    },
    confirm(orderId: string) {
      return request<{ ok: boolean; message: string }>(`/orders/confirm`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
    },
    accept(orderId: string) {
      return request<{ ok: boolean; message: string }>(`/orders/accept`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
    },
    markPlaced(orderId: string) {
      return request<{ ok: boolean; message: string }>(`/orders/mark-placed`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
    },
    markOutForDelivery(orderId: string) {
      return request<{ ok: boolean; message: string }>(`/orders/mark-out-for-delivery`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
    },
    markDelivered(orderId: string) {
      return request<{ ok: boolean; message: string }>(`/orders/mark-delivered`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
    },
    getInvoiceHtml(orderId: string) {
      return request<{ ok: boolean; html: string }>(`/orders/invoice/${orderId}`);
    },
    invoicePdfUrl(orderId: string) {
      return joinUrl(`/orders/invoice/${orderId}/pdf`);
    },
    async downloadInvoicePdf(orderId: string) {
      const url = joinUrl(`/orders/invoice/${orderId}/pdf`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to download invoice PDF');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      return true;
    },
    sendInvoiceEmail(orderId: string, payload?: { to?: string }) {
      return request<{ ok: boolean; message: string; to: string }>(`/orders/invoice/${orderId}/send`, {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      });
    },
    update(orderId: string, items: Array<{ productId: string; qty: number }>) {
      return request<{ ok: boolean; order: any }>(`/orders/cart`, {
        method: 'PUT',
        body: JSON.stringify({ orderId, items }),
      });
    },
    remove(orderId: string) {
      return request<{ ok: boolean }>(`/orders/cart`, {
        method: 'DELETE',
        body: JSON.stringify({ orderId }),
      });
    },
  },
  notifications: {
    list(params?: { unread?: boolean }) {
      const usp = new URLSearchParams();
      if (typeof params?.unread !== 'undefined') usp.set('unread', String(params.unread));
      const qs = usp.toString();
      const path = `/notifications${qs ? `?${qs}` : ''}`;
      return request<{ ok: boolean; notifications: Array<{ id: string; userId: string; type: string; title: string; message: string; data?: any; read: boolean; createdAt: string }> }>(path);
    },
    markRead(id: string) {
      return request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'POST' });
    },
    markUnread(id: string) {
      return request<{ ok: boolean }>(`/notifications/${id}/unread`, { method: 'POST' });
    },
    markAllRead() {
      return request<{ ok: boolean }>(`/notifications/mark-all-read`, { method: 'POST' });
    },
    clearAll() {
      return request<{ ok: boolean }>(`/notifications/clear`, { method: 'DELETE' });
    },
  },
  sendOtp(email: string) {
    return request<{ ok: boolean }>(`/auth/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  verifyOtp(payload: { email: string; otp: string }) {
    return request<{ ok: boolean; email: string }>(`/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  register(payload: { email: string; password: string; role?: string; organizationName?: string }) {
    return request<{ ok: boolean; user: { id: string; email: string; role?: string | null } }>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string; role: 'distributor' | 'shopkeeper' | 'salesperson' }) {
    return request<{ ok: boolean; user: { id: string; email: string; role?: string | null }, salespersonLinkStatus?: { state: string; distributorId?: string; requestId?: string } }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  logout() {
    return request<{ ok: boolean }>(`/auth/logout`, { method: 'POST' });
  },
  me() {
    return request<{ ok: boolean; user: { id: string; email: string; role?: string | null } }>(`/auth/me`);
  },
  getProfile() {
    return request<{ ok: boolean; profile: any }>('/auth/profile');
  },
  updateProfile(profileData: { name?: string; organizationName?: string; phone?: string; address?: string; photo?: string }) {
    return request<{ ok: boolean; profile: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  forgotPasswordSendOtp(email: string) {
    return request<{ ok: boolean }>(`/auth/forgot-password/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(payload: { email: string; otp: string; newPassword: string }) {
    return request<{ ok: boolean; user: { id: string; email: string; role?: string | null } }>(`/auth/forgot-password/reset`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  salesperson: {
    requestLink(distributorEmail: string) {
      return request<{ ok: boolean; request: { id: string; status: string; distributorId: string } }>(`/auth/salesperson/link-request`, {
        method: 'POST',
        body: JSON.stringify({ distributorEmail }),
      });
    },
    linkStatus() {
      return request<{ ok: boolean; status: { state: 'unlinked' | 'pending' | 'approved' | 'rejected'; distributorId?: string; requestId?: string } }>(`/auth/salesperson/link-status`);
    },
  },
  distributor: {
    salesRequests() {
      return request<{ ok: boolean; requests: Array<{ id: string; salespersonId: string; distributorId: string; status: string; createdAt: string; updatedAt: string }> }>(
        `/auth/distributor/sales-requests`
      );
    },
    approveSalesRequest(id: string) {
      return request<{ ok: boolean; request: any }>(`/auth/distributor/sales-requests/${id}/approve`, { method: 'POST' });
    },
    rejectSalesRequest(id: string) {
      return request<{ ok: boolean; request: any }>(`/auth/distributor/sales-requests/${id}/reject`, { method: 'POST' });
    },
    salespersons() {
      return request<{ ok: boolean; salespersons: Array<{ id: string; salespersonId: string; distributorId: string; status: string; createdAt: string; updatedAt: string }> }>(
        `/auth/distributor/salespersons`
      );
    },
    unlinkSalesperson(salespersonId: string) {
      return request<{ ok: boolean; unlink: any }>(`/auth/distributor/salespersons/${salespersonId}`, { method: 'DELETE' });
    },
  },
  products: {
    list() {
      return request<{ ok: boolean; products: Array<{ id: string; name: string; price: number; stock: number; image: string | null; description: string; createdAt: string; updatedAt: string }> }>(
        `/products`
      );
    },
    create(payload: { name: string; price: number; stock?: number; image?: string | null; description?: string }) {
      return request<{ ok: boolean; product: { id: string; name: string; price: number; stock: number; image: string | null; description: string } }>(
        `/products`,
        { method: 'POST', body: JSON.stringify(payload) }
      );
    },
    get(id: string) {
      return request<{ ok: boolean; product: { id: string; name: string; price: number; stock: number; image: string | null; description: string } }>(
        `/products/${id}`
      );
    },
    update(id: string, payload: Partial<{ name: string; price: number; stock: number; image: string | null; description: string }>) {
      return request<{ ok: boolean; product: { id: string; name: string; price: number; stock: number; image: string | null; description: string } }>(
        `/products/${id}`,
        { method: 'PUT', body: JSON.stringify(payload) }
      );
    },
    remove(id: string) {
      return request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' });
    },
    bulkCreate(items: Array<{ name: string; price: number; stock?: number; image?: string | null; description?: string }>) {
      return request<{ ok: boolean; created: number; products: any[] }>(`/products/bulk`, {
        method: 'POST',
        body: JSON.stringify({ products: items }),
      });
    },
  },
  public: {
    async listDistributors(): Promise<{ ok: boolean; distributors: Distributor[] }> {
      return request<{ ok: boolean; distributors: Distributor[] }>(`/auth/distributors`);
    },
    async listProducts(): Promise<{ ok: boolean; products: PublicProduct[] }> {
      return request<{ ok: boolean; products: PublicProduct[] }>(`/products/public`);
    },
  },
  upload: {
    async image(file: File) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(joinUrl('/upload/image'), {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'upload failed');
      return data as { ok: boolean; url: string };
    },
  },
  analytics: {
    distributor: {
      summary(range: '7d' | '30d' | '90d' | string = '30d') {
        return request<{ ok: boolean; rangeDays: number; totals: { orders: number; items: number; revenue: number; avgOrderValue: number }; trend: Array<{ date: string; orders: number; items: number; revenue: number }> }>(`/analytics/distributor/summary?range=${encodeURIComponent(range)}`);
      },
      topProducts(range: string = '30d', limit = 10) {
        return request<{ ok: boolean; items: Array<{ productId: string; name: string; qty: number; revenue: number }> }>(`/analytics/distributor/top-products?range=${encodeURIComponent(range)}&limit=${limit}`);
      },
      topShops(range: string = '30d', limit = 10) {
        return request<{ ok: boolean; shops: Array<{ shopId: string; name: string; orders: number; revenue: number }> }>(`/analytics/distributor/top-shops?range=${encodeURIComponent(range)}&limit=${limit}`);
      },
    },
    shop: {
      summary(month?: string) {
        const q = month ? `?month=${encodeURIComponent(month)}` : '';
        return request<{ ok: boolean; month: string; totals: { orders: number; items: number; spend: number; avgOrderValue: number }; trend: Array<{ date: string; orders: number; items: number; spend: number }> }>(`/analytics/shop/summary${q}`);
      },
      frequentItems(months = 3, limit = 10) {
        return request<{ ok: boolean; items: Array<{ productId: string; name: string; count: number; qty: number; spend: number }> }>(`/analytics/shop/frequent-items?months=${months}&limit=${limit}`);
      },
    },
  },
};
