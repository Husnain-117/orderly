export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options && typeof options === 'object' && options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
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
  login(payload: { email: string; password: string }) {
    return request<{ ok: boolean; user: { id: string; email: string; role?: string | null } }>(`/auth/login`, {
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
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'upload failed');
      return data as { ok: boolean; url: string };
    },
  },
};
