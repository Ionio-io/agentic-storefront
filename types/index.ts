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
