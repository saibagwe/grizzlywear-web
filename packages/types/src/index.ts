// ============================================
// Grizzlywear Shared Types
// ============================================

// --- API Response ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// --- User ---
export interface Address {
  _id?: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  _id: string;
  firebaseUid: string;
  email: string;
  name: string;
  phone: string;
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Product ---
export interface ProductImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  reserved: number;
  price: number;
  comparePrice: number;
}

export type ProductCategory = 'men' | 'women' | 'new-arrivals' | 'accessories';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  subcategory: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  basePrice: number;
  discount: number;
  isActive: boolean;
  isFeatured: boolean;
  rating: { average: number; count: number };
  aiDescription?: string;
  aiTags?: string[];
  clipEmbeddingId?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Cart ---
export interface CartItem {
  product: string | Product;
  variant: { sku: string; size: string; color: string };
  quantity: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  expiresAt: string;
}

// --- Order ---
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  product: string | Product;
  variant: { sku: string; size: string; color: string; colorHex: string };
  quantity: number;
  priceAtPurchase: number;
  imageUrl: string;
}

export interface OrderPayment {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt?: string;
}

export interface OrderShipping {
  address: Address;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  trackingId?: string;
  courier?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface Order {
  _id: string;
  orderId: string;
  user: string | User;
  items: OrderItem[];
  status: OrderStatus;
  payment: OrderPayment;
  shipping: OrderShipping;
  refund?: {
    razorpayRefundId: string;
    amount: number;
    status: string;
    processedAt?: string;
  };
  returnRequest?: {
    reason: string;
    requestedAt: string;
    status: string;
    resolvedAt?: string;
  };
  invoicePdfUrl?: string;
  emailsSent: string[];
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Review ---
export interface Review {
  _id: string;
  product: string | Product;
  user: string | User;
  order: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

// --- Support Ticket ---
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type MessageSender = 'customer' | 'admin' | 'ai_bot';

export interface TicketMessage {
  sender: MessageSender;
  content: string;
  timestamp: string;
}

export interface SupportTicket {
  _id: string;
  ticketId: string;
  user: string | User;
  order?: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  messages: TicketMessage[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Analytics ---
export interface AnalyticsOverview {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  newCustomers: number;
  pendingOrders: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}
