
import {
  doc,
  setDoc,
  // addDoc, // Not used directly in this file for top-level collection adds, setDoc with explicit ID is preferred
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
import { db } from "./firebase"; // Import the initialized db instance
import type { Product, Customer, Transaction, Store, UserDocument, TransactionItem } from "@/types";

// --- User and Store Management ---

export const createInitialStoreForUser = async (
  userId: string,
  email: string,
  displayName?: string
): Promise<{ storeId: string; userDocId: string }> => {
  const storeRef = doc(collection(db, "stores"));
  const newStore: Store = {
    id: storeRef.id,
    name: displayName ? `${displayName}'s Store` : "My New Store",
    ownerId: userId,
    taxRate: 0.08, // Default tax rate (e.g., 8%)
    currency: "USD", // Default currency
    createdAt: serverTimestamp() as Timestamp,
    lastUpdatedAt: serverTimestamp() as Timestamp,
    isActive: true,
  };
  await setDoc(storeRef, newStore);

  const userRef = doc(db, "users", userId);
  const newUserDoc: UserDocument = {
    uid: userId,
    email: email,
    displayName: displayName || email.split("@")[0],
    role: "admin", // Default role for new store owner
    storeId: storeRef.id, // Link user to the newly created store
    createdAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp,
    isActive: true,
  };
  await setDoc(userRef, newUserDoc);

  return { storeId: storeRef.id, userDocId: userRef.id };
};

export const getUserDocument = async (userId: string): Promise<UserDocument | null> => {
  if (!userId) return null;
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { uid: userSnap.id, ...userSnap.data() } as UserDocument;
  }
  return null;
};

export const getStoreDetails = async (storeId: string): Promise<Store | null> => {
  if (!storeId) {
    console.warn("getStoreDetails called without a storeId.");
    return null;
  }
  const storeRef = doc(db, "stores", storeId);
  const storeSnap = await getDoc(storeRef);
  if (storeSnap.exists()) {
    const data = storeSnap.data();
    return {
        id: storeSnap.id,
        name: data.name,
        address: data.address,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        taxRate: data.taxRate ?? 0.0,
        currency: data.currency ?? "USD",
        ownerId: data.ownerId,
        createdAt: data.createdAt,
        lastUpdatedAt: data.lastUpdatedAt,
        isActive: data.isActive,
        slogan: data.slogan,
        logoUrl: data.logoUrl,
        websiteUrl: data.websiteUrl,
        showAddressOnReceipt: data.showAddressOnReceipt ?? false,
        enableOnlineOrderingLink: data.enableOnlineOrderingLink ?? false,
        receiptSettings: data.receiptSettings,
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


// --- Product Management ---

export const addProduct = async (storeId: string, productData: Omit<Product, "id" | "storeId" | "createdAt" | "lastUpdatedAt">): Promise<string> => {
  if (!storeId) {
    throw new Error("addProduct called without a storeId.");
  }
  const productsCollection = collection(db, "products");
  const newProductRef = doc(productsCollection);
  const fullProductData: Product = {
    ...productData,
    id: newProductRef.id,
    storeId,
    createdAt: serverTimestamp() as Timestamp,
    lastUpdatedAt: serverTimestamp() as Timestamp,
  };
  await setDoc(newProductRef, fullProductData);
  return newProductRef.id;
};

export const getProductsByStoreId = async (storeId: string | undefined): Promise<Product[]> => {
  if (!storeId) {
    console.warn("getProductsByStoreId called without a storeId. Returning empty array.");
    return [];
  }
  const productsCollection = collection(db, "products");
  const q = query(productsCollection, where("storeId", "==", storeId), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const updateProduct = async (productId: string, data: Partial<Product>): Promise<void> => {
  if (!productId) {
    throw new Error("updateProduct called without a productId.");
  }
  const productRef = doc(db, "products", productId);
  // Ensure storeId is not accidentally changed if it's part of `data`
  const { storeId, ...updateDataSafe } = data; 
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


// --- Customer Management ---

export const addCustomer = async (storeId: string, customerData: Omit<Customer, "id" | "storeId" | "createdAt" | "lastUpdatedAt" | "totalSpent" | "loyaltyPoints">): Promise<string> => {
  if (!storeId) {
    throw new Error("addCustomer called without a storeId.");
  }
  const customersCollection = collection(db, "customers");
  const newCustomerRef = doc(customersCollection);
  const fullCustomerData: Customer = {
    ...customerData,
    id: newCustomerRef.id,
    storeId,
    totalSpent: 0,
    loyaltyPoints: 0,
    createdAt: serverTimestamp() as Timestamp,
    lastUpdatedAt: serverTimestamp() as Timestamp,
  };
  await setDoc(newCustomerRef, fullCustomerData);
  return newCustomerRef.id;
};

export const getCustomersByStoreId = async (storeId: string | undefined): Promise<Customer[]> => {
  if (!storeId) {
    console.warn("getCustomersByStoreId called without a storeId. Returning empty array.");
    return [];
  }
  const customersCollection = collection(db, "customers");
  const q = query(customersCollection, where("storeId", "==", storeId), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

export const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<void> => {
  if (!customerId) {
    throw new Error("updateCustomer called without a customerId.");
  }
  const customerRef = doc(db, "customers", customerId);
   // Ensure storeId is not accidentally changed if it's part of `data`
  const { storeId, ...updateDataSafe } = data;
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
  storeId: string,
  cashierId: string,
  cashierName: string | undefined,
  cartItems: TransactionItem[],
  subtotal: number,
  taxAmount: number,
  totalAmount: number,
  paymentMethod: string,
  customerId?: string,
  customerName?: string
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

  try {
    await runTransaction(db, async (firestoreTransaction) => {
      const transactionData: Omit<Transaction, "id"> = {
        storeId,
        transactionDisplayId: newTransactionRef.id.substring(0, 8).toUpperCase(),
        timestamp: serverTimestamp() as Timestamp,
        cashierId,
        cashierName: cashierName || "N/A",
        items: cartItems,
        subtotal,
        discountAmount: 0, 
        taxAmount,
        totalAmount,
        paymentMethod,
        paymentStatus: "completed",
        ...(customerId && { customerId }),
        ...(customerName && { customerName }),
        lastUpdatedAt: serverTimestamp() as Timestamp,
      };
      firestoreTransaction.set(newTransactionRef, transactionData);

      for (const item of cartItems) {
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

      if (customerId) {
        const customerRef = doc(db, "customers", customerId);
        const customerSnap = await firestoreTransaction.get(customerRef);
        if (customerSnap.exists()) {
            const currentTotalSpent = customerSnap.data().totalSpent || 0;
            const currentLoyaltyPoints = customerSnap.data().loyaltyPoints || 0;
            // Basic loyalty: 1 point per dollar spent (configurable)
            const pointsEarned = Math.floor(totalAmount); 
            firestoreTransaction.update(customerRef, {
                 totalSpent: currentTotalSpent + totalAmount,
                 loyaltyPoints: currentLoyaltyPoints + pointsEarned,
                 lastPurchaseAt: serverTimestamp(),
                 lastUpdatedAt: serverTimestamp()
            });
        }
      }
    });
    return newTransactionRef.id;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
};


export const getTransactionsByStoreId = async (storeId: string | undefined, count: number = 50): Promise<Transaction[]> => {
  if (!storeId) {
    console.warn("getTransactionsByStoreId called without a storeId. Returning empty array.");
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
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};
