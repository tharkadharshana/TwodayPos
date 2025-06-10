
import type { Timestamp } from "firebase/firestore";

export type Product = {
  id: string; // Firestore document ID
  storeId: string;
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
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp;
  // For AI features, these might be populated or derived
  salesVelocity?: number; 
  historicalSalesData?: Record<string, number>; 
  supplierLeadTimeDays?: number;
};

export type Service = {
  id: string; // Firestore document ID
  storeId: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes?: number; // e.g., 30, 60, 90
  category: string;
  isVisibleOnPOS: boolean; // Can it be added to a sale directly?
  isBookable?: boolean; // For future appointment/booking system integration
  imageUrl?: string; // Optional image for the service
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp;
};

export type Customer = {
  id: string; // Firestore document ID
  storeId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: Timestamp;
  lastPurchaseAt?: Timestamp;
  lastUpdatedAt: Timestamp; 
  notes?: string;
  birthday?: string;
};

export type CartItem = {
  productId: string; // Could be product or service ID in future
  itemType?: 'product' | 'service'; // To distinguish
  name: string; 
  sku?: string; // Products have SKUs, services might not
  quantity: number;
  price: number; 
  totalPrice: number; 
  imageUrl?: string; 
  stockQuantity?: number; // Relevant for products
  durationMinutes?: number; // Relevant for services
};

export type TransactionItem = {
  itemId: string; // Product or Service ID
  itemType: 'product' | 'service';
  name: string; 
  sku?: string; 
  quantity: number;
  unitPrice: number; 
  totalPrice: number; 
};

export type Transaction = {
  id: string; // Firestore document ID
  storeId: string;
  transactionDisplayId?: string; 
  timestamp: Timestamp;
  cashierId: string; // User UID
  cashierName?: string; 
  customerId?: string;
  customerName?: string; 
  items: TransactionItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'other' | string; 
  paymentStatus: 'completed' | 'pending' | 'refunded' | 'partially_refunded' | 'pending_sync';
  digitalReceiptSent?: boolean;
  receiptChannel?: 'whatsapp' | 'sms' | 'email' | null;
  receiptRecipient?: string | null;
  offlineProcessed?: boolean;
  syncedAt?: Timestamp;
  notes?: string;
  originalTransactionId?: string; 
  refundReason?: string;
  lastUpdatedAt: Timestamp;
};

export type Store = {
  id: string; 
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  taxRate: number; 
  currency: string; 
  ownerId: string; 
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp; 
  isActive: boolean;
  subscriptionPlan?: string;
  slogan?: string;
  logoUrl?: string;
  websiteUrl?: string;
  showAddressOnReceipt?: boolean;
  enableOnlineOrderingLink?: boolean;
  receiptSettings?: {
    headerMessage?: string;
    footerMessage?: string;
    showStoreName?: boolean;
    showStoreAddress?: boolean; 
    showStorePhone?: boolean;
    showCashierName?: boolean;
    showTransactionTime?: boolean;
    showLoyaltyPoints?: boolean;
    smsDefaultMessage?: string;
    emailSubject?: string;
    emailBodyPrefix?: string;
  };
};

export type UserDocument = {
  uid: string; 
  email: string;
  displayName?: string;
  role: 'admin' | 'manager' | 'cashier';
  storeId: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  isActive: boolean;
  avatarUrl?: string; 
};


// For AI Features
export type StockPrediction = {
  productId: string;
  productName: string;
  predictedStockOutDate: string; 
  confidence?: number; 
  reasoning: string;
};

export type ReorderSuggestion = {
  productId: string;
  productName: string;
  suggestedReorderQuantity: number;
  currentStock: number;
  lowStockAlert: boolean;
  reasoning: string;
  nextExpectedOrderDate?: string; 
};

// For Dashboard Page
export type SalesKPIs = {
  totalSales: number;
  totalTransactions: number;
  averageSaleValue: number;
};

export type SalesTrendDataPoint = {
  date: string; 
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
