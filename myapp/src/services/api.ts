import type {
  Product,
  SpecialOffer,
  CartItem,
  CheckoutPayload,
  CheckoutResponse,
  StoreStats,
  KeloEvent,
  Poll,
  PaintingApplication,
  SiteSettings,
  AdminOrder,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api';
const TOKEN_KEY = 'kelo_admin_token';

// Central fetch helper with credentials and authorization headers
async function fetchApi<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Sends & receives HttpOnly cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // ─── 1. Authentication ────────────────────────────────────────
  async login(password: string): Promise<{ success: boolean; message: string }> {
    const res = await fetchApi<{ success: boolean; message: string; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (res.success && res.token) {
      sessionStorage.setItem(TOKEN_KEY, res.token);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  },

  async checkAuth(): Promise<boolean> {
    try {
      const res = await fetchApi<{ success: boolean; authenticated: boolean }>('/auth/me');
      return Boolean(res.authenticated);
    } catch {
      sessionStorage.removeItem(TOKEN_KEY);
      return false;
    }
  },

  isAuthenticated(): boolean {
    return Boolean(sessionStorage.getItem(TOKEN_KEY));
  },

  // ─── 2. Products ──────────────────────────────────────────────
  async getProducts(includeInactive: boolean = false): Promise<Product[]> {
    const url = includeInactive ? '/products?all=true' : '/products';
    const res = await fetchApi<{ success: boolean; data: Product[] }>(url);
    return res.data || [];
  },

  async getProduct(id: string): Promise<Product | null> {
    const res = await fetchApi<{ success: boolean; data: Product }>(`/products/${id}`);
    return res.data || null;
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetchApi<{ success: boolean; data: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return res.data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetchApi<{ success: boolean; data: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetchApi<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  },

  // ─── 3. Specials & Stats ──────────────────────────────────────
  async getSpecials(): Promise<SpecialOffer[]> {
    const res = await fetchApi<{ success: boolean; data: SpecialOffer[] }>('/specials');
    return res.data || [];
  },

  async getStats(): Promise<StoreStats | null> {
    const res = await fetchApi<{ success: boolean; data: StoreStats }>('/stats');
    return res.data || null;
  },

  // ─── 4. Orders & Checkout ────────────────────────────────────
  async submitCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
    return fetchApi<CheckoutResponse>('/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAdminOrders(): Promise<AdminOrder[]> {
    const res = await fetchApi<{ success: boolean; data: AdminOrder[] }>('/admin/orders');
    return res.data || [];
  },

  async updateOrderStatus(id: number, status: string): Promise<AdminOrder> {
    const res = await fetchApi<{ success: boolean; data: AdminOrder }>(`/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  // ─── 5. Events ────────────────────────────────────────────────
  async getEvents(typeFilter?: string): Promise<KeloEvent[]> {
    const endpoint = typeFilter && typeFilter !== 'all' ? `/events?type=${encodeURIComponent(typeFilter)}` : '/events';
    const res = await fetchApi<{ success: boolean; data: KeloEvent[] }>(endpoint);
    return res.data || [];
  },

  async getAdminEvents(): Promise<KeloEvent[]> {
    const res = await fetchApi<{ success: boolean; data: KeloEvent[] }>('/events/admin/list');
    return res.data || [];
  },

  async createEvent(event: Partial<KeloEvent>): Promise<KeloEvent> {
    const res = await fetchApi<{ success: boolean; data: KeloEvent }>('/events/admin/create', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    return res.data;
  },

  async updateEvent(id: string, updates: Partial<KeloEvent>): Promise<KeloEvent> {
    const res = await fetchApi<{ success: boolean; data: KeloEvent }>(`/events/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteEvent(id: string): Promise<boolean> {
    const res = await fetchApi<{ success: boolean }>(`/events/admin/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  },

  // ─── 6. Polls & Admin Voting ──────────────────────────────────
  async getPolls(): Promise<Poll[]> {
    const res = await fetchApi<{ success: boolean; data: Poll[] }>('/polls');
    return res.data || [];
  },

  async createPoll(poll: { title: string; description?: string; eventId?: string; isOpen?: boolean; options: string[] }): Promise<Poll> {
    const res = await fetchApi<{ success: boolean; data: Poll }>('/admin/polls/create', {
      method: 'POST',
      body: JSON.stringify(poll),
    });
    return res.data;
  },

  async updatePoll(id: string, updates: { title?: string; description?: string; isOpen?: boolean; options?: (string | { id?: string; optionText: string })[] }): Promise<Poll> {
    const res = await fetchApi<{ success: boolean; data: Poll }>(`/admin/polls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deletePoll(id: string): Promise<boolean> {
    const res = await fetchApi<{ success: boolean }>(`/admin/polls/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  },

  // CRITICAL: Admin-only voting endpoint
  async voteAdmin(pollId: string, optionId: string): Promise<Poll> {
    const res = await fetchApi<{ success: boolean; data: Poll }>(`/admin/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
    return res.data;
  },

  // ─── 7. Painting Competition Applications (NO ARTWORK UPLOAD) ──
  async submitPaintingApplication(data: {
    eventId?: string;
    fullName: string;
    email: string;
    phone: string;
    rollNumber: string;
    department: string;
    hall: string;
    paintingCategory: string;
    description: string;
  }): Promise<PaintingApplication> {
    const res = await fetchApi<{ success: boolean; message: string; data: PaintingApplication }>(
      '/competitions/applications',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  async getPaintingApplications(statusFilter?: string): Promise<PaintingApplication[]> {
    const endpoint = statusFilter && statusFilter !== 'ALL'
      ? `/competitions/admin/applications?status=${encodeURIComponent(statusFilter)}`
      : '/competitions/admin/applications';
    const res = await fetchApi<{ success: boolean; data: PaintingApplication[] }>(endpoint);
    return res.data || [];
  },

  async updateApplicationStatus(id: string, status: 'PENDING' | 'ACCEPTED' | 'REJECTED'): Promise<PaintingApplication> {
    const res = await fetchApi<{ success: boolean; data: PaintingApplication }>(
      `/competitions/admin/applications/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return res.data;
  },

  // ─── 8. Website Content & Settings ───────────────────────────
  async getSettings(): Promise<SiteSettings> {
    const res = await fetchApi<{ success: boolean; data: SiteSettings }>('/settings');
    return res.data || {};
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<void> {
    await fetchApi('/settings/admin', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // ─── 9. AI Shopping Assistant ────────────────────────────────
  async sendAIChat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    activeProducts: Product[]
  ): Promise<{ content: string; suggestedProducts: Product[] }> {
    try {
      const res = await fetchApi<{ success: boolean; content: string; suggestedProducts: Product[] }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, currentProducts: activeProducts }),
      });
      return {
        content: res.content || '',
        suggestedProducts: res.suggestedProducts || [],
      };
    } catch (e) {
      console.warn('AI Chat fallback:', e);
      return {
        content: 'I recommend these lovely handcrafted pieces for your special occasion!',
        suggestedProducts: activeProducts.slice(0, 3),
      };
    }
  },

  async getAISuggestions(
    currentProduct: Product,
    cartItems: CartItem[]
  ): Promise<{ suggestions: Product[]; isAI: boolean }> {
    try {
      const res = await fetchApi<{ success: boolean; suggestions: Product[]; provider?: string }>('/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify({ currentProduct, cartItems }),
      });
      return {
        suggestions: res.suggestions || [],
        isAI: true,
      };
    } catch {
      return { suggestions: [], isAI: false };
    }
  },
};
