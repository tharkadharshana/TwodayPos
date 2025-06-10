
import {
  doc,
  setDoc,
  addDoc,
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
    role: "admin",
    storeId: storeRef.id,
    createdAt: serverTimestamp() as Timestamp,
    lastLoginAt: serverTimestamp() as Timestamp,
    isActive: true,
  };
  await setDoc(userRef, newUserDoc);

  return { storeId: storeRef.id, userDocId: userRef.id };
};

export const getUserDocument = async (userId: string): Promise<UserDocument | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { uid: userSnap.id, ...userSnap.data() } as UserDocument;
  }
  return null;
};

export const getStoreDetails = async (storeId: string): Promise<Store | null> => {
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
        taxRate: data.taxRate ?? 0.0, // Default to 0 if not set
        currency: data.currency ?? "USD", // Default to USD
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
  const storeRef = doc(db, "stores", storeId);
  // Ensure serverTimestamp is used for lastUpdatedAt
  const updateData = { ...data, lastUpdatedAt: serverTimestamp() };
  await updateDoc(storeRef, updateData);
};


// --- Product Management ---

export const addProduct = async (storeId: string, productData: Omit<Product, "id" | "storeId" | "createdAt" | "lastUpdatedAt">): Promise<string> => {
  const productsCollection = collection(db, "products");
  const newProductRef = doc(productsCollection); // Auto-generate ID locally
  await setDoc(newProductRef, {
    ...productData,
    id: newProductRef.id, // Store the ID within the document
    storeId,
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
  });
  return newProductRef.id;
};

export const getProductsByStoreId = async (storeId: string): Promise<Product[]> => {
  const productsCollection = collection(db, "products");
  const q = query(productsCollection, where("storeId", "==", storeId), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const updateProduct = async (productId: string, data: Partial<Product>): Promise<void> => {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, {
    ...data,
    lastUpdatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const productRef = doc(db, "products", productId);
  await deleteDoc(productRef);
};


// --- Customer Management ---

export const addCustomer = async (storeId: string, customerData: Omit<Customer, "id" | "storeId" | "createdAt" | "totalSpent" | "loyaltyPoints">): Promise<string> => {
  const customersCollection = collection(db, "customers");
  const newCustomerRef = doc(customersCollection); // Auto-generate ID locally
  await setDoc(newCustomerRef, {
    ...customerData,
    id: newCustomerRef.id, // Store the ID within the document
    storeId,
    totalSpent: 0,
    loyaltyPoints: 0,
    createdAt: serverTimestamp() as Timestamp,
    // lastPurchaseAt can be updated separately
  });
  return newCustomerRef.id;
};

export const getCustomersByStoreId = async (storeId: string): Promise<Customer[]> => {
  const customersCollection = collection(db, "customers");
  const q = query(customersCollection, where("storeId", "==", storeId), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

export const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<void> => {
  const customerRef = doc(db, "customers", customerId);
  await updateDoc(customerRef, {
    ...data,
    // lastUpdatedAt: serverTimestamp(), // If Customer type has lastUpdatedAt, add it
  });
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
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
  const transactionsCollection = collection(db, "transactions");
  const newTransactionRef = doc(transactionsCollection); // Auto-generate ID for the new transaction

  try {
    await runTransaction(db, async (firestoreTransaction) => {
      // 1. Create the transaction document
      const transactionData: Omit<Transaction, "id"> = {
        storeId,
        transactionDisplayId: newTransactionRef.id.substring(0, 8).toUpperCase(), // Example display ID
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
      };
      firestoreTransaction.set(newTransactionRef, transactionData);

      // 2. Update stock quantities for each product in the cart
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await firestoreTransaction.get(productRef); // Use transaction.get

        if (!productSnap.exists()) {
          throw new Error(`Product with ID ${item.productId} (${item.name}) not found.`);
        }

        const currentStock = productSnap.data().stockQuantity as number;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}.`);
        }
        firestoreTransaction.update(productRef, { stockQuantity: newStock, lastUpdatedAt: serverTimestamp() });
      }

      // 3. (Optional) Update customer's totalSpent and lastPurchaseAt
      if (customerId) {
        const customerRef = doc(db, "customers", customerId);
        // It's often better to do aggregations like totalSpent via Cloud Functions for robustness,
        // but for simplicity, we can do a basic update here.
        // For a more robust solution, consider incrementing.
        const customerSnap = await firestoreTransaction.get(customerRef);
        if (customerSnap.exists()) {
            const currentTotalSpent = customerSnap.data().totalSpent || 0;
            firestoreTransaction.update(customerRef, {
                 totalSpent: currentTotalSpent + totalAmount,
                 lastPurchaseAt: serverTimestamp()
            });
        }
      }
    });
    return newTransactionRef.id;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error; // Re-throw the error to be caught by the caller
  }
};


export const getTransactionsByStoreId = async (storeId: string, count: number = 50): Promise<Transaction[]> => {
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

// Add other utility functions as needed (e.g., for refunds, daily reports, etc.)
