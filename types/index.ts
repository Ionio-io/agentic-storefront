export interface Product {
  _id?: string;
  id: string;
  title: string;
  handle: string;
  description: string;
  product_type: string;
  vendor: string;
  gender: "male" | "female";
  price: number;
  available: boolean;
  image_urls: string[];
  tags: string[];
  sizes: string[];
  vton_category: "upper" | "lower" | "one-pieces";
  main_category?: string;
  sub_category?: string;
  is_new?: boolean;
  imported_at?: string;
  is_featured?: boolean;
  price_override?: number;
  available_sizes?: string[];
  view_count?: number;
  last_viewed_at?: string;
}

export interface SyncStore {
  _id?: string;
  storeUrl: string;
  name: string;
  schedule: "manual" | "6h" | "12h" | "24h";
  lastSync?: string;
  lastCount?: number;
  enabled: boolean;
}

export interface Collection {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  productIds: string[];
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  vtoResult?: string;
  imageBase64?: string;
  timestamp: Date;
}

export interface VTORequest {
  product_image_url: string;
  person_image_base64?: string;
  person_image_url?: string;
  vton_category: "upper" | "lower" | "one-pieces";
}

export interface OrderItem {
  productId: string;
  title: string;
  size: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  _id?: string;
  orderId: string;
  userId?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  total: number;
  paymentMethod: "COD";
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
}
