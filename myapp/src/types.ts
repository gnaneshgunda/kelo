export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  highlights?: string[];
  material?: string;
  dimensions?: string;
  deliveryInfo?: string;
  isActive?: boolean;
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
  isActive?: boolean;
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

export interface AdminOrderItem {
  id: string;
  name?: string;
  price?: number;
  quantity: number;
}

export interface AdminOrder {
  id: number;
  customerName: string;
  email?: string;
  phone: string;
  shippingAddress?: string;
  items: AdminOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
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

// ─── Events & Contests ──────────────────────────────────────

export interface KeloEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  bannerUrl?: string;
  eventType: 'general' | 'hall_day' | 'poll' | 'painting_competition';
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  votes: number;
}

export interface Poll {
  id: string;
  eventId?: string;
  title: string;
  description?: string;
  isOpen: boolean;
  options: PollOption[];
  totalVotes?: number;
  createdAt?: string;
}

// Painting competition application (Participant Details ONLY - NO artwork_url)
export interface PaintingApplication {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  rollNumber: string;
  department: string;
  hall: string;
  paintingCategory: string;
  description: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt?: string;
}

export interface SiteSettings {
  announcementText?: string;
  announcementSubtext?: string;
  isAnnouncementActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  instagramHandle?: string;
  specialsTitle?: string;
}
