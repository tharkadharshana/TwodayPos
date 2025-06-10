
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  Timestamp,
  serverTimestamp,
  writeBatch,
  orderBy,
  limit,
  runTransaction
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product, Customer, Transaction, Store, UserDocument, TransactionItem, Service, CartItem, UserRole } from "@/types";

// --- User and Store Management ---

export const createInitialStoreForUser = async (
  userId: string,
  email: string,
  displayNameInput?: string
): Promise<{ storeId: string; userDocId: string }> => {
  const batch = writeBatch(db);

  const storeRef = doc(collection(db, "stores"));
  const storeId = storeRef.id;

  const storeNameBase = displayNameInput || email.split("@")[0] || `User_${userId.substring(0,5)}`;

  const newStore: Store = {
    id: storeId,
    name: `${storeNameBase}'s Store`,
    ownerId: userId,
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    contactEmail: email,
    contactPhone: "",
    slogan: "",
    logoUrl: "",
    websiteUrl: "",
    taxRate: 0.08,
    currency: "USD",
    subscriptionPlan: "free",
    showAddressOnReceipt: true,
    enableOnlineOrderingLink: false,
    receiptSettings: {
      headerMessage: "Thank you for your purchase!",
      footerMessage: "Come back soon!",
      showStoreName: true,
      showStoreAddress: true,
      showStorePhone: false,
      showCashierName: true,
      showTransactionTime: true,
      showLoyaltyPoints: false,
      smsDefaultMessage: "Your receipt from {StoreName}: {ReceiptLink}",
      emailSubject: "Your Receipt from {StoreName} (Order #{OrderNumber})",
      emailBodyPrefix: "Thank you for your order! You can view your receipt here: {ReceiptLink}",
    },
    dataHandlingMode: 'offlineFriendly', // Default data handling mode
    createdAt: serverTimestamp() as Timestamp,
    lastUpdatedAt: serverTimestamp() as Timestamp,
    isActive: true,
  };
  batch.set(storeRef, newStore);

  const userRef = doc(db, "users", userId);
  const newUserDoc: UserDocument = {
    uid: userId,
    email: email,
    displayName: displayNameInput || email.split("@")[0] || "New User",
    role: "admin", // New users are admins of their own store
    storeId: storeId,
    avatarUrl: "",
    createdAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp,
    isActive: true,
  };
  batch.set(userRef, newUserDoc);

  await batch.commit();

  return { storeId: storeId, userDocId: userId };
};

interface AdminCreateUserParams {
  uid: string;
  storeId: string;
  email: string;
  displayName: string;
  role: Exclude<UserRole, 'admin'>;
}

export const adminCreateUserInFirestore = async ({
  uid,
  storeId,
  email,
  displayName,
  role,
}: AdminCreateUserParams): Promise<void> => {
  if (!uid || !storeId || !email || !displayName || !role) {
    throw new Error("Missing required parameters to create user document in Firestore.");
  }
  const userRef = doc(db, "users", uid);
  const newUserDocData: UserDocument = {
    uid,
    email,
    displayName,
    role,
    storeId,
    createdAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp, 
    isActive: true, 
    avatarUrl: "", 
  };
  await setDoc(userRef, newUserDocData);
};


export const getUserDocument = async (userId: string): Promise<UserDocument | null> => {
  if (!userId) {
    console.warn("getUserDocument called without a userId.");
    return null;
  }
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      uid: userSnap.id,
      email: data.email || "", 
      displayName: data.displayName || "",
      role: data.role || "cashier",
      storeId: data.storeId || null,
      createdAt: data.createdAt, 
      lastLoginAt: data.lastLoginAt || serverTimestamp() as Timestamp, 
      isActive: data.isActive === undefined ? true : data.isActive,
      avatarUrl: data.avatarUrl || "",
    } as UserDocument;
  }
  console.warn(`User document not found for UID: ${userId} in getUserDocument.`);
  return null;
};

export const getStoreDetails = async (storeId: string | null): Promise<Store | null> => {
  if (!storeId) {
    console.warn("getStoreDetails called with a null or undefined storeId.");
    return null;
  }
  const storeRef = doc(db, "stores", storeId);
  const storeSnap = await getDoc(storeRef);
  if (storeSnap.exists()) {
    const data = storeSnap.data();
    return {
        id: storeSnap.id,
        name: data.name || "Unnamed Store",
        address: data.address || { street: "", city: "", state: "", zip: "", country: "" },
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
        taxRate: data.taxRate ?? 0.0,
        currency: data.currency ?? "USD",
        ownerId: data.ownerId, 
        createdAt: data.createdAt, 
        lastUpdatedAt: data.lastUpdatedAt, 
        isActive: data.isActive ?? true,
        slogan: data.slogan || "",
        logoUrl: data.logoUrl || "",
        websiteUrl: data.websiteUrl || "",
        subscriptionPlan: data.subscriptionPlan || "free",
        showAddressOnReceipt: data.showAddressOnReceipt ?? true,
        enableOnlineOrderingLink: data.enableOnlineOrderingLink ?? false,
        receiptSettings: data.receiptSettings || {
            headerMessage: "Thank you for your purchase!",
            footerMessage: "Come back soon!",
            showStoreName: true,
            showStoreAddress: true,
            showStorePhone: false,
            showCashierName: true,
            showTransactionTime: true,
            showLoyaltyPoints: false,
            smsDefaultMessage: "Your receipt from {StoreName}: {ReceiptLink}",
            emailSubject: "Your Receipt from {StoreName} (Order #{OrderNumber})",
            emailBodyPrefix: "Thank you for your order! You can view your receipt here: {ReceiptLink}",
        },
        dataHandlingMode: data.dataHandlingMode || 'offlineFriendly',
      } as Store;
  }
  return null;
};

export const updateStoreDetails = async (storeId: string, data: Partial<Store>): Promise<void> => {
  if (!storeId) {
    throw new Error("updateStoreDetails called without a storeId.");
  }
  const storeRef = doc(db, "stores", storeId);
  const updateData = { ...data, lastUpdatedAt: serverTimestamp() };
  await updateDoc(storeRef, updateData);
};

export const getUsersByStoreId = async (storeId: string): Promise<UserDocument[]> => {
  if (!storeId) {
    console.warn("getUsersByStoreId called without a storeId. Returning empty array.");
    return [];
  }
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("storeId", "==", storeId), orderBy("displayName"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as UserDocument));
};

export const updateUserRole = async (userId: string, newRole: UserRole): Promise<void> => {
  if (!userId) {
    throw new Error("updateUserRole called without a userId.");
  }
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    role: newRole,
    lastUpdatedAt: serverTimestamp(),
  });
};

export const updateUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
  if (!userId) {
    throw new Error("updateUserStatus called without a userId.");
  }
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    isActive: isActive,
    lastUpdatedAt: serverTimestamp(),
  });
};


// --- Product Management ---

export const addProduct = async (storeId: string, productData: Omit<Product, "id" | "storeId" | "createdAt" | "lastUpdatedAt">): Promise<string> => {
  if (!storeId) {
    throw new Error("addProduct called without a storeId.");
  }
  const productsCollection = collection(db, "products");
  const newProductRef = doc(productsCollection);
  const fullProductData: Product = {
    id: newProductRef.id,
    storeId,
    name: productData.name,
    sku: productData.sku,
    barcode: productData.barcode || "",
    price: productData.price,
    stockQuantity: productData.stockQuantity,
    category: productData.category,
    imageUrl: productData.imageUrl || "",
    isVisibleOnPOS: productData.isVisibleOnPOS === undefined ? true : productData.isVisibleOnPOS,
    lowStockThreshold: productData.lowStockThreshold || 0,
    description: productData.description || "",
    supplier: productData.supplier || "",
    tags: productData.tags || [],
    salesVelocity: productData.salesVelocity ?? 0,
    historicalSalesData: productData.historicalSalesData ?? {},
    supplierLeadTimeDays: productData.supplierLeadTimeDays ?? 0,
    createdAt: serverTimestamp() as Timestamp,
    lastUpdatedAt: serverTimestamp() as Timestamp,
  };
  await setDoc(newProductRef, fullProductData);
  return newProductRef.id;
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  if (!productId) {
    console.warn("getProductById called without a productId.");
    return null;
  }
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);
  if (productSnap.exists()) {
    return { id: productSnap.id, ...productSnap.data() } as Product;
  }
  return null;
};

export const getProductsByStoreId = async (storeId: string | null): Promise<Product[]> => {
  if (!storeId) {
    // For very large catalogs (e.g., 50k+ items), fetching all products is not recommended.
    // Consider implementing pagination (limit, startAfter) or fetching by category.
    // Or, encourage users to use search first.
    console.warn("getProductsByStoreId called with a null or undefined storeId. Returning empty array.");
    return [];
  }
  const productsCollection = collection(db, "products");
  // For large datasets, add pagination or more specific initial queries here.
  const q = query(productsCollection, where("storeId", "==", storeId), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Product));
};

export const updateProduct = async (productId: string, data: Partial<Product>): Promise<void> => {
  if (!productId) {
    throw new Error("updateProduct called without a productId.");
  }
  const productRef = doc(db, "products", productId);
  const { id, storeId, createdAt, ...updateDataSafe } = data; 
  await updateDoc(productRef, {
    ...updateDataSafe,
    lastUpdatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  if (!productId) {
    throw new Error("deleteProduct called without a productId.");
  }
  const productRef = doc(db, "products", productId);
  await deleteDoc(productRef);
};

// --- Service Management ---

export const addService = async (storeId: string, serviceData: Omit<Service, "id" | "storeId" | "createdAt" | "lastUpdatedAt">): Promise<string> => {
  if (!storeId) {
    throw new Error("addService called without a storeId.");
  }
  const servicesCollection = collection(db, "services");
  const newServiceRef = doc(servicesCollection);
  const fullServiceData: Service = {
    id: newServiceRef.id,
    storeId,
    name: serviceData.name,
    description: serviceData.description || "",
    price: serviceData.price,
    durationMinutes: serviceData.durationMinutes || undefined,
    category: serviceData.category,
    isVisibleOnPOS: serviceData.isVisibleOnPOS === undefined ? true : serviceData.isVisibleOnPOS,
    isBookable: serviceData.isBookable === undefined ? false : serviceData.isBookable,
    imageUrl: serviceData.imageUrl || "",
    createdAt: serverTimestamp() as Timestamp,
    lastUpdatedAt: serverTimestamp() as Timestamp,
  };
  await setDoc(newServiceRef, fullServiceData);
  return newServiceRef.id;
};

export const getServicesByStoreId = async (storeId: string | null): Promise<Service[]> => {
  if (!storeId) {
     // For large service lists, consider pagination or more specific initial queries.
    console.warn("getServicesByStoreId called with a null or undefined storeId. Returning empty array.");
    return [];
  }
  const servicesCollection = collection(db, "services");
  const q = query(servicesCollection, where("storeId", "==", storeId), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Service));
};

export const updateService = async (serviceId: string, data: Partial<Service>): Promise<void> => {
  if (!serviceId) {
    throw new Error("updateService called without a serviceId.");
  }
  const serviceRef = doc(db, "services", serviceId);
  const { id, storeId, createdAt, ...updateDataSafe } = data;
  await updateDoc(serviceRef, {
    ...updateDataSafe,
    lastUpdatedAt: serverTimestamp(),
  });
};

export const deleteService = async (serviceId: string): Promise<void> => {
  if (!serviceId) {
    throw new Error("deleteService called without a serviceId.");
  }
  const serviceRef = doc(db, "services", serviceId);
  await deleteDoc(serviceRef);
};


// --- Customer Management ---

export const addCustomer = async (storeId: string, customerData: Omit<Customer, "id" | "storeId" | "createdAt" | "lastUpdatedAt" | "totalSpent" | "loyaltyPoints" | "lastPurchaseAt">): Promise<string> => {
  if (!storeId) {
    throw new Error("addCustomer called without a storeId.");
  }
  const customersCollection = collection(db, "customers");
  const newCustomerRef = doc(customersCollection);
  const fullCustomerData: Customer = {
    id: newCustomerRef.id,
    storeId,
    name: customerData.name,
    phone: customerData.phone || "",
    email: customerData.email || "",
    address: customerData.address || { street: "", city: "", state: "", zip: "", country: "" },
    loyaltyPoints: 0,
    totalSpent: 0,
    notes: customerData.notes || "",
    birthday: customerData.birthday || "",
    createdAt: serverTimestamp() as Timestamp,
    lastUpdatedAt: serverTimestamp() as Timestamp,
    lastPurchaseAt: undefined, 
  };
  await setDoc(newCustomerRef, fullCustomerData);
  return newCustomerRef.id;
};

export const getCustomersByStoreId = async (storeId: string | null): Promise<Customer[]> => {
  if (!storeId) {
    console.warn("getCustomersByStoreId called with a null or undefined storeId. Returning empty array.");
    return [];
  }
  const customersCollection = collection(db, "customers");
  const q = query(customersCollection, where("storeId", "==", storeId), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Customer));
};

export const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<void> => {
  if (!customerId) {
    throw new Error("updateCustomer called without a customerId.");
  }
  const customerRef = doc(db, "customers", customerId);
  const { storeId, ...updateDataSafe } = data; // Ensure storeId is not part of updateData if it's present
  await updateDoc(customerRef, {
    ...updateDataSafe,
    lastUpdatedAt: serverTimestamp(),
  });
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  if (!customerId) {
    throw new Error("deleteCustomer called without a customerId.");
  }
  const customerRef = doc(db, "customers", customerId);
  await deleteDoc(customerRef);
};


// --- Transaction Management ---
export const addTransaction = async (
  storeId: string | null,
  cashierId: string,
  cashierName: string | undefined,
  cartItems: CartItem[],
  subtotal: number,
  taxAmount: number,
  totalAmount: number,
  paymentMethod: string,
  terminalId?: string, 
  customerId?: string,
  customerName?: string,
  discountAmountVal?: number, 
  promoCodeVal?: string | null 
): Promise<string> => {
  if (!storeId) {
    throw new Error("addTransaction called without a storeId.");
  }
  if (!cashierId) {
    throw new Error("addTransaction called without a cashierId.");
  }
  if (cartItems.length === 0) {
    throw new Error("addTransaction called with an empty cart.");
  }

  const newTransactionRef = doc(collection(db, "transactions"));

  return runTransaction(db, async (firestoreTransaction) => {
    const transactionItems: TransactionItem[] = cartItems.map(item => ({
      itemId: item.productId,
      itemType: item.itemType || 'product',
      name: item.name,
      sku: item.sku || "", 
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.totalPrice,
    }));

    const transactionData: Transaction = {
      id: newTransactionRef.id,
      storeId,
      transactionDisplayId: newTransactionRef.id.substring(0, 8).toUpperCase(),
      terminalId: terminalId || undefined, 
      timestamp: serverTimestamp() as Timestamp,
      cashierId,
      cashierName: cashierName || "N/A",
      items: transactionItems,
      subtotal,
      discountAmount: discountAmountVal || 0,
      promoCode: promoCodeVal || null,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: "completed",
      customerId: customerId || "",
      customerName: customerName || "",
      digitalReceiptSent: false,
      receiptChannel: null,
      receiptRecipient: null,
      offlineProcessed: (typeof navigator !== 'undefined' && !navigator.onLine),
      syncedAt: (typeof navigator !== 'undefined' && navigator.onLine) ? serverTimestamp() as Timestamp : null,
      notes: "",
      originalTransactionId: "",
      refundReason: "",
      lastUpdatedAt: serverTimestamp() as Timestamp,
    };
    firestoreTransaction.set(newTransactionRef, transactionData);

    for (const item of cartItems) {
      if (item.itemType === 'product' || !item.itemType) { 
        const productRef = doc(db, "products", item.productId);
        const productSnap = await firestoreTransaction.get(productRef);
        if (!productSnap.exists()) {
          throw new Error(`Product with ID ${item.productId} (${item.name}) not found during transaction.`);
        }
        const currentStock = productSnap.data().stockQuantity as number;
        const newStock = currentStock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}.`);
        }
        firestoreTransaction.update(productRef, { stockQuantity: newStock, lastUpdatedAt: serverTimestamp() });
      }
    }

    if (customerId) {
      const customerRef = doc(db, "customers", customerId);
      const customerSnap = await firestoreTransaction.get(customerRef);
      if (customerSnap.exists()) {
          const currentTotalSpent = customerSnap.data().totalSpent || 0;
          const currentLoyaltyPoints = customerSnap.data().loyaltyPoints || 0;
          const pointsEarned = Math.floor(totalAmount); 
          firestoreTransaction.update(customerRef, {
               totalSpent: currentTotalSpent + totalAmount,
               loyaltyPoints: currentLoyaltyPoints + pointsEarned,
               lastPurchaseAt: serverTimestamp() as Timestamp,
               lastUpdatedAt: serverTimestamp() as Timestamp
          });
      }
    }
    return newTransactionRef.id;
  });
};


export const getTransactionsByStoreId = async (storeId: string | null, count: number = 50): Promise<Transaction[]> => {
  if (!storeId) {
    console.warn("getTransactionsByStoreId called with a null or undefined storeId. Returning empty array.");
    return [];
  }
  const transactionsCollection = collection(db, "transactions");
  const q = query(
    transactionsCollection,
    where("storeId", "==", storeId),
    orderBy("timestamp", "desc"),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Transaction));
};
    

    