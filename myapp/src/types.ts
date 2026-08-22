export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  images?: string[];         // multiple gallery images
  rating?: number;           // e.g. 4.5
  reviews?: number;          // e.g. 128
  highlights?: string[];     // bullet points
  material?: string;
  dimensions?: string;
  deliveryInfo?: string;
}

export interface SpecialOffer {
  id: string;
  name: string;
  description?: string;
  tagline?: string;
  price: number;
  originalPrice?: number;
  offerText?: string;
  imageUrl: string;
  images?: string[];
  productId?: string;
  category?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutPayload {
  name?: string;
  email?: string;
  phoneno: string;
  shipping_address?: string;
  cart: Array<{
    id: string;
    quantity: number;
  }>;
}

export interface CheckoutResponse {
  success: boolean;
  message?: string;
  orderId?: number;
  calculatedTotal?: number;
  emailStatus?: {
    success: boolean;
    to?: string;
    bcc?: string;
    message?: string;
  };
  order?: {
    orderid: number;
    name: string;
    email: string;
    phoneno: string;
    product_ids: string;
    total_amount: number;
    status: string;
    shipping_address: string;
    created_at: string;
  };
  error?: string;
}

export interface StoreStats {
  totalProducts: number;
  totalSpecials: number;
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
}
