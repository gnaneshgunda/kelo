# 🛍️ KELO Storefront Frontend API Documentation

This guide provides all the API endpoints, payload formats, and integration examples needed to build the customer-facing storefront for **KELO Handcrafted Gifts**.

**Base URL (Production Worker):**
```
https://kelo.dpdns.org
```
*(Both `/api/...` and root `/...` paths are supported, e.g. `/api/products` and `/products` are equivalent).*

---

## 📑 Table of Contents
1. [Health & Diagnostics](#1-health--diagnostics)
2. [Get All Products (`GET /api/products`)](#2-get-all-products)
3. [Get Single Product (`GET /api/products/:id`)](#3-get-single-product)
4. [Get All Specials & Combos (`GET /api/specials`)](#4-get-all-specials--combos)
5. [Get Single Special (`GET /api/specials/:id`)](#5-get-single-special)
6. [Store Catalog Stats (`GET /api/stats`)](#6-store-catalog-stats)
7. [Customer Checkout (`POST /api/checkout`)](#7-customer-checkout)
8. [Frontend Code Examples (Vanilla JS & React)](#8-frontend-code-examples)

---

## 1. Health & Diagnostics

### `GET /api/health`
Check if the API and Cloudflare bindings (KV, D1, AI) are operational.

#### Response (`HTTP 200 OK`)
```json
{
  "status": "ok",
  "service": "KELO Cloudflare Worker",
  "hasAiBinding": true,
  "hasKvBinding": true,
  "hasDbBinding": true,
  "timestamp": "2026-08-22T10:35:00.000Z"
}
```

---

## 2. Get All Products

### `GET /api/products` *(or `GET /products`)*
Fetches all active products available in the store catalog.

#### Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "p1",
      "name": "Memory Heart Frame",
      "description": "A beautifully crafted geometric heart photo display...",
      "price": 399,
      "category": "Decor",
      "imageUrl": "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg",
      "images": [
        "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg",
        "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248579/WhatsApp_Image_2026-08-20_at_23.21.20.jpg"
      ]
    },
    {
      "id": "p2",
      "name": "Photo Frames",
      "description": "Premium handcrafted photo frames...",
      "price": 149,
      "category": "Frames",
      "imageUrl": "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Photo-frames.jpg",
      "images": ["https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Photo-frames.jpg"]
    }
  ]
}
```

---

## 3. Get Single Product

### `GET /api/products/:id` *(or `GET /products/:id`)*
Fetches detailed information for a specific product by its ID.

#### Parameters:
- `id` *(path parameter, required)*: e.g. `p1`

#### Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "p1",
    "name": "Memory Heart Frame",
    "description": "A beautifully crafted geometric heart photo display, designed to illuminate your most cherished memories. Adorned with delicate, warm fairy lights, charming heart-shaped clips, and a modern wireframe to hang your favorite polaroids.",
    "price": 399,
    "category": "Decor",
    "imageUrl": "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg",
    "images": [
      "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg",
      "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248579/WhatsApp_Image_2026-08-20_at_23.21.20.jpg"
    ]
  }
}
```

#### Error Response (`HTTP 404 Not Found`)
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

## 4. Get All Specials & Combos

### `GET /api/specials` *(or `GET /specials`)*
Fetches exclusive promotional hampers, festive bundles, and special deals.

#### Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "s1",
      "name": "Valentine's Romantic Combo",
      "description": "Memory Heart Frame bundled with fairy lights and custom polaroids.",
      "price": 499,
      "category": "Combos",
      "imageUrl": "https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg",
      "images": ["https://res.cloudinary.com/zo7u3tba/image/upload/v1787248483/Heart-frame.jpg"]
    }
  ]
}
```

---

## 5. Get Single Special

### `GET /api/specials/:id` *(or `GET /specials/:id`)*
Fetches details for a specific promotional deal or combo by ID.

#### Parameters:
- `id` *(path parameter, required)*: e.g. `s1`

---

## 6. Store Catalog Stats

### `GET /api/stats`
Fetches a high-level summary of the store catalog (product count, specials count, categories, price range).

#### Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "data": {
    "totalProducts": 4,
    "totalSpecials": 2,
    "categories": ["Decor", "Frames", "Hampers", "Combos"],
    "priceRange": {
      "min": 149,
      "max": 499
    }
  }
}
```

---

## 7. Customer Checkout

### `POST /api/checkout` *(or `POST /checkout`)*
Submits a customer order. 
- Automatically validates customer information (`phoneno` is mandatory).
- **Calculates all item prices server-side** from active product & special catalogs.
- Inserts the order record into the Cloudflare D1 database.
- Dispatches an automated confirmation email to the customer with BCC to the warehouse.

#### Request Headers:
```http
Content-Type: application/json
```

#### Request Body Fields:
| Field | Type | Required? | Description / Examples |
|---|---|---|---|
| `name` | `string` | Optional | Customer's full name (defaults to `"Valued Customer"`). |
| `email` | `string` | Optional | Customer's email address for confirmation receipt. |
| `phoneno` | `string` | **YES** | Contact phone number (also accepts `phone`, `phoneNumber`, `mobile`). |
| `shipping_address` | `string` | Optional | Delivery address (also accepts `address`). |
| `product_ids` | `array` or `string` | **YES** | List of product IDs or cart objects (see formats below). |

---

### Supported Checkout Payload Formats

#### Format A: Array of Product IDs (Simple)
```json
{
  "name": "Arjun Sharma",
  "email": "arjun@example.com",
  "phoneno": "+91 9876543210",
  "product_ids": ["p1", "p3"],
  "shipping_address": "Hall 5, IIT Kharagpur, WB 721302"
}
```

#### Format B: Standard Shopping Cart (with Quantities)
```json
{
  "name": "Pooja Verma",
  "email": "pooja@example.com",
  "phoneno": "+91 9123456789",
  "cart": [
    { "id": "p1", "quantity": 1 },
    { "id": "p2", "quantity": 2 }
  ],
  "shipping_address": "Technology Guest House, Room 204, IIT Kharagpur"
}
```

#### Format C: Nested Product Object Cart (e.g. Redux / Zustand State)
```json
{
  "name": "Rohan Gupta",
  "email": "rohan@example.com",
  "phoneno": "+91 9988776655",
  "cart": [
    {
      "product": { "id": "p1", "name": "Memory Heart Frame", "price": 399 },
      "quantity": 1
    }
  ],
  "shipping_address": "Patel Hall, IIT Kharagpur"
}
```

---

#### Success Response (`HTTP 201 Created`):
```json
{
  "success": true,
  "message": "Order created successfully and recorded in D1 database",
  "orderId": 7,
  "calculatedTotal": 848,
  "emailStatus": {
    "success": true,
    "to": "arjun@example.com",
    "bcc": "kelo.keylove.admin@gmail.com",
    "message": "Email sent successfully"
  },
  "order": {
    "orderid": 7,
    "name": "Arjun Sharma",
    "email": "arjun@example.com",
    "phoneno": "+91 9876543210",
    "product_ids": "Memory Heart Frame (p1 × 1 = ₹399), Rakhi Gift Hamper (p3 × 1 = ₹449)",
    "total_amount": 848,
    "status": "PENDING",
    "shipping_address": "Hall 5, IIT Kharagpur, WB 721302",
    "created_at": "2026-08-22T10:45:00.000Z"
  }
}
```

#### Error Responses:
- **Missing Phone Number (`HTTP 400 Bad Request`)**:
  ```json
  {
    "success": false,
    "error": "Phone number is required for order delivery"
  }
  ```
- **Empty Cart (`HTTP 400 Bad Request`)**:
  ```json
  {
    "success": false,
    "error": "product_ids or cart items are required"
  }
  ```

---

## 8. Frontend Code Examples

### A. Vanilla JavaScript API Client (`api.js`)

```javascript
const API_BASE = 'https://kelo-worker.dsainvg.workers.dev';

// Fetch all products
export async function getProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch products');
  return json.data;
}

// Fetch all specials
export async function getSpecials() {
  const res = await fetch(`${API_BASE}/api/specials`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch specials');
  return json.data;
}

// Submit checkout order
export async function submitCheckout({ name, email, phoneno, shipping_address, cart }) {
  const res = await fetch(`${API_BASE}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      phoneno,
      shipping_address,
      cart, // array of { id, quantity }
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Checkout failed');
  }
  return json;
}
```

---

### B. React Custom Hook (`useKeloCatalog.ts`)

```typescript
import { useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  images: string[];
}

export function useKeloCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [specials, setSpecials] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const [prodRes, specRes] = await Promise.all([
          fetch('https://kelo-worker.dsainvg.workers.dev/api/products').then(r => r.json()),
          fetch('https://kelo-worker.dsainvg.workers.dev/api/specials').then(r => r.json()),
        ]);

        if (prodRes.success) setProducts(prodRes.data);
        if (specRes.success) setSpecials(specRes.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load catalog');
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  return { products, specials, loading, error };
}
```

---

### C. React Checkout Form Component (`CheckoutModal.tsx`)

```tsx
import React, { useState } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function CheckoutForm({ cartItems, onOrderComplete }: { cartItems: CartItem[]; onOrderComplete: (orderId: number) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setErrorMsg('Please enter your phone number');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('https://kelo-worker.dsainvg.workers.dev/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phoneno: phone,
          shipping_address: address,
          cart: cartItems.map(item => ({ id: item.id, quantity: item.quantity })),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Order created successfully
      onOrderComplete(data.orderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCheckout} className="space-y-4">
      {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
      
      <input
        type="text"
        placeholder="Your Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="tel"
        placeholder="Phone Number (Required)"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="email"
        placeholder="Email Address (for order confirmation)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <textarea
        placeholder="Shipping / Campus Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-amber-500 text-slate-900 font-bold py-2 rounded"
      >
        {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
      </button>
    </form>
  );
}
```
