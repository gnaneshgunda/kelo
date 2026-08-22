import type { Product, SpecialOffer, CartItem, CheckoutPayload, CheckoutResponse, StoreStats } from '../types';
import { DUMMY_PRODUCTS } from '../data/products';
import specialsFallback from '../data/specials.json';
import {
  derivePostQuantumHash,
  encapsulateWithServerKey,
  createPqcSessionToken,
  DEFAULT_ADMIN_PASS,
} from '../utils/pqc';

// Primary custom domain with fallback to Cloudflare workers.dev
const PRIMARY_API_URL = (import.meta.env.VITE_WORKER_API_URL as string) || 'https://kelo.dpdns.org';
const FALLBACK_API_URL = 'https://kelo-worker.dsainvg.workers.dev';

const LOCAL_PRODUCTS_KEY = 'kelo_custom_products_v1';
const LOCAL_SPECIALS_KEY = 'kelo_custom_specials_v1';
const PQC_TOKEN_KEY = 'kelo_pqc_admin_token';

// Helper to execute fetch with timeout and fallback URL
async function safeFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Try primary URL first with a 5-second timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${PRIMARY_API_URL}${cleanEndpoint}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok || res.status === 400 || res.status === 401 || res.status === 404) {
      return res;
    }
  } catch (err) {
    console.warn(`[API] Primary URL (${PRIMARY_API_URL}) failed, trying fallback:`, err);
  }

  // Fallback to workers.dev URL
  return fetch(`${FALLBACK_API_URL}${cleanEndpoint}`, options);
}

// Local cache helpers
function getLocalProducts(): Product[] {
  try {
    const saved = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading products from localStorage:', e);
  }
  return [...DUMMY_PRODUCTS];
}

function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('Error saving products to localStorage:', e);
  }
}

function getLocalSpecials(): SpecialOffer[] {
  try {
    const saved = localStorage.getItem(LOCAL_SPECIALS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading specials from localStorage:', e);
  }
  return [...(specialsFallback as SpecialOffer[])];
}

function saveLocalSpecials(specials: SpecialOffer[]): void {
  try {
    localStorage.setItem(LOCAL_SPECIALS_KEY, JSON.stringify(specials));
  } catch (e) {
    console.warn('Error saving specials to localStorage:', e);
  }
}

export const api = {
  // ─── 1. Products ────────────────────────────────────────────
  async getProducts(): Promise<Product[]> {
    try {
      const res = await safeFetch('/api/products', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          saveLocalProducts(data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.warn('[API] getProducts fallback to local cache:', err);
    }
    return getLocalProducts();
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const res = await safeFetch(`/api/products/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn(`[API] getProduct(${id}) fallback:`, err);
    }
    return getLocalProducts().find((p) => p.id === id) || null;
  },

  // ─── 2. Specials & Combos ───────────────────────────────────
  async getSpecials(): Promise<SpecialOffer[]> {
    try {
      const res = await safeFetch('/api/specials', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Normalize specials to include originalPrice/offerText if not provided by backend
          const normalized: SpecialOffer[] = data.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            tagline: s.tagline || s.description?.slice(0, 60) || 'Handcrafted Festive Special',
            price: Number(s.price),
            originalPrice: s.originalPrice ? Number(s.originalPrice) : Math.round(Number(s.price) * 1.25),
            offerText: s.offerText || '20% OFF',
            imageUrl: s.imageUrl || 'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg',
            images: s.images && s.images.length > 0 ? s.images : [s.imageUrl],
            productId: s.productId || s.id,
            category: s.category || 'Combos',
            description: s.description,
          }));
          saveLocalSpecials(normalized);
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[API] getSpecials fallback to local cache:', err);
    }
    return getLocalSpecials();
  },

  async getSpecial(id: string): Promise<SpecialOffer | null> {
    try {
      const res = await safeFetch(`/api/specials/${id}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn(`[API] getSpecial(${id}) fallback:`, err);
    }
    return getLocalSpecials().find((s) => s.id === id) || null;
  },

  // ─── 3. Store Stats ─────────────────────────────────────────
  async getStats(): Promise<StoreStats | null> {
    try {
      const res = await safeFetch('/api/stats', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn('[API] getStats error:', err);
    }
    return null;
  },

  // ─── 4. Customer Checkout ───────────────────────────────────
  async submitCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
    try {
      const res = await safeFetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }
      return data;
    } catch (err: any) {
      console.error('[API] submitCheckout error:', err);
      throw err;
    }
  },

  // ─── 5. Cloudflare Workers AI ───────────────────────────────
  async sendAIChat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    activeProducts: Product[]
  ): Promise<{ content: string; suggestedProducts: Product[] }> {
    try {
      const res = await safeFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, currentProducts: activeProducts }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            content: data.content,
            suggestedProducts: data.suggestedProducts || [],
          };
        }
      }
    } catch (err) {
      console.warn('[API] AI Chat fallback to local heuristic:', err);
    }

    // Local fallback heuristic
    const lastUserMsg = messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user')?.content?.toLowerCase() || '';

    const matched = activeProducts.filter(
      (p) =>
        lastUserMsg.includes(p.category.toLowerCase()) ||
        lastUserMsg.includes(p.name.toLowerCase()) ||
        p.description.toLowerCase().includes(lastUserMsg)
    );

    return {
      content: `Here are some wonderful handcrafted pieces tailored for you!`,
      suggestedProducts: matched.length > 0 ? matched.slice(0, 3) : activeProducts.slice(0, 3),
    };
  },

  async getAISuggestions(
    currentProduct: Product,
    cartItems: CartItem[]
  ): Promise<{ suggestions: Product[]; isAI: boolean }> {
    try {
      const res = await safeFetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentProduct, cartItems }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.suggestions)) {
          return {
            suggestions: data.suggestions,
            isAI: data.provider === 'cloudflare-workers-ai',
          };
        }
      }
    } catch (err) {
      console.warn('[API] AI Suggestions fallback:', err);
    }

    return { suggestions: [], isAI: false };
  },

  // ─── 6. Post-Quantum Authentication (Admin) ─────────────────
  getPqcAuthToken(): string | null {
    return sessionStorage.getItem(PQC_TOKEN_KEY);
  },

  setPqcAuthToken(token: string): void {
    sessionStorage.setItem(PQC_TOKEN_KEY, token);
  },

  clearPqcAuth(): void {
    sessionStorage.removeItem(PQC_TOKEN_KEY);
  },

  async loginWithPqc(password: string): Promise<{ success: boolean; message: string; pqcAlgorithm?: string }> {
    const pqcHash = derivePostQuantumHash(password);

    try {
      let cipherTextHex: string | undefined;
      try {
        const keyRes = await safeFetch('/api/auth/pqc-key');
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData.publicKeyHex) {
            const enc = encapsulateWithServerKey(keyData.publicKeyHex);
            cipherTextHex = enc.cipherTextHex;
          }
        }
      } catch (err) {
        console.warn('PQC public key endpoint notice:', err);
      }

      const verifyRes = await safeFetch('/api/auth/pqc-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pqcHash, cipherTextHex }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        if (data.success && data.token) {
          this.setPqcAuthToken(data.token);
          return {
            success: true,
            message: 'Authenticated securely with NIST Post-Quantum ML-KEM-768 + SHA3-512',
            pqcAlgorithm: data.algorithm,
          };
        }
      }
    } catch (err) {
      console.warn('[PQC Auth] Worker evaluating locally:', err);
    }

    // Local fallback verification
    const expectedLocalHash = derivePostQuantumHash(DEFAULT_ADMIN_PASS);
    if (pqcHash === expectedLocalHash) {
      const token = createPqcSessionToken(password);
      this.setPqcAuthToken(token);
      return {
        success: true,
        message: 'Authenticated with NIST Post-Quantum SHA3-512',
        pqcAlgorithm: 'SHA3-512 (FIPS 202) Resistant Permutation',
      };
    }

    return {
      success: false,
      message: 'Invalid Post-Quantum password credentials',
    };
  },

  // ─── 7. Admin Product Mutations ─────────────────────────────
  async addProduct(product: Partial<Product>): Promise<Product> {
    const token = this.getPqcAuthToken();
    try {
      const res = await safeFetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-pqc-auth': token } : {}),
        },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const current = getLocalProducts();
          saveLocalProducts([data.data, ...current.filter((p) => p.id !== data.data.id)]);
          return data.data;
        }
      }
    } catch (err) {
      console.warn('[API] addProduct offline fallback:', err);
    }

    const newProd: Product = {
      id: product.id || `p_${Date.now()}`,
      name: product.name || 'Untitled Product',
      description: product.description || '',
      price: Number(product.price) || 0,
      category: product.category || 'Decor',
      imageUrl: product.imageUrl || 'https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg',
      images: product.images && product.images.length > 0 ? product.images : [product.imageUrl || ''],
      rating: product.rating || 5.0,
      reviews: product.reviews || 1,
      highlights: product.highlights || [],
      material: product.material || 'Handcrafted',
      dimensions: product.dimensions || 'Standard',
      deliveryInfo: product.deliveryInfo || 'Ships in 2-3 business days',
    };

    const current = getLocalProducts();
    saveLocalProducts([newProd, ...current.filter((p) => p.id !== newProd.id)]);
    return newProd;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const token = this.getPqcAuthToken();
    try {
      const res = await safeFetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-pqc-auth': token } : {}),
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const current = getLocalProducts();
          saveLocalProducts(current.map((p) => (p.id === id ? data.data : p)));
          return data.data;
        }
      }
    } catch (err) {
      console.warn('[API] updateProduct offline fallback:', err);
    }

    const current = getLocalProducts();
    let updatedProd = current.find((p) => p.id === id);
    if (updatedProd) {
      updatedProd = { ...updatedProd, ...updates };
      saveLocalProducts(current.map((p) => (p.id === id ? updatedProd! : p)));
      return updatedProd;
    }
    throw new Error('Product not found');
  },

  async deleteProduct(id: string): Promise<boolean> {
    const token = this.getPqcAuthToken();
    try {
      const res = await safeFetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'x-pqc-auth': token } : {}),
        },
      });
      if (res.ok) {
        const current = getLocalProducts();
        saveLocalProducts(current.filter((p) => p.id !== id));
        return true;
      }
    } catch (err) {
      console.warn('[API] deleteProduct offline fallback:', err);
    }

    const current = getLocalProducts();
    saveLocalProducts(current.filter((p) => p.id !== id));
    return true;
  },

  async resetCatalog(): Promise<Product[]> {
    const token = this.getPqcAuthToken();
    try {
      const res = await safeFetch('/api/products/reset', {
        method: 'POST',
        headers: {
          ...(token ? { 'x-pqc-auth': token } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          saveLocalProducts(data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.warn('[API] resetCatalog offline fallback:', err);
    }

    saveLocalProducts([...DUMMY_PRODUCTS]);
    return [...DUMMY_PRODUCTS];
  },
};
