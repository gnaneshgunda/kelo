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
  highlights?: string[];     // bullet points like Amazon
  material?: string;
  dimensions?: string;
  deliveryInfo?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
