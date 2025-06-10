export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl?: string;
  isVisibleOnPOS: boolean;
  lowStockThreshold?: number;
  description?: string;
  supplier?: string;
  tags?: string[];
  lastSold?: string; 
  salesVelocity?: number; // units per day
  historicalSalesData?: Record<string, number>; // e.g. {"2023-01-01": 10}
  supplierLeadTimeDays?: number; // days
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalSpent: number;
  loyaltyPoints: number;
  birthday?: string; // YYYY-MM-DD
  notes?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number; // price per unit at the time of adding to cart
  totalPrice: number;
};

export type Transaction = {
  id: string;
  timestamp: string; // ISO 8601
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'custom' | string; // Allow custom payment methods
  customerId?: string;
  cashierId: string;
  storeId: string;
  status: 'completed' | 'refunded' | 'partially_refunded' | 'pending_sync';
  receiptSentTo?: {
    email?: string;
    sms?: string;
    whatsapp?: string;
    telegram?: string;
  };
  notes?: string;
  originalTransactionId?: string; // For refunds
  refundReason?: string;
};

export type StockPrediction = {
  productId: string;
  productName: string;
  predictedStockOutDate: string; // ISO 8601 or descriptive text
  confidence?: number; // 0-1
  reasoning: string;
};

export type ReorderSuggestion = {
  productId: string;
  productName: string;
  suggestedReorderQuantity: number;
  currentStock: number;
  lowStockAlert: boolean;
  reasoning: string;
  nextExpectedOrderDate?: string; // ISO 8601
};

export type UserRole = "Admin" | "Manager" | "Cashier";

export type UserProfile = {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: UserRole;
  avatarUrl?: string;
  storeIds?: string[]; // if multi-store
};

export type SalesKPIs = {
  totalSales: number;
  totalTransactions: number;
  averageSaleValue: number;
};

export type SalesTrendDataPoint = {
  date: string; // or number (timestamp)
  sales: number;
};

export type TopSellingProduct = {
  productId: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
};

export type PaymentMethodDistribution = {
  method: string;
  count: number;
  amount: number;
};
