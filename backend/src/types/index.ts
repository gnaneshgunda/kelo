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
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export interface SpecialOffer {
  id: string;
  name: string;
  tagline?: string;
  price: number;
  originalPrice?: number;
  offerText?: string;
  imageUrl: string;
  images?: string[];
  productId?: string;
  category?: string;
  description?: string;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  name?: string;
  price?: number;
  quantity: number;
}

export interface Order {
  id: number;
  customerName: string;
  email?: string;
  phone: string;
  shippingAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export interface KeloEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  bannerUrl?: string;
  images?: string[];
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

export interface AdminUser {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface JwtPayload {
  role: 'admin';
  username: string;
}
