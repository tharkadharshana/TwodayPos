import {
  db,
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
  limit
} from "./firebase"; // Assuming db is exported from firebase.ts
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
    taxRate: 0.0, // Default tax rate
    currency: "USD", // Default currency
    createdAt: serverTimestamp() as Timestamp,
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
    return { id: storeSnap.id, ...storeSnap.data() } as Store;
  }
  return null;
};

export const updateStoreDetails = async (storeId: string, data: Partial<Store>): Promise<void> => {
  const storeRef = doc(db, "stores", storeId);
  await updateDoc(storeRef, {
    ...data,
    lastUpdatedAt: serverTimestamp(), // Assuming Store type has lastUpdatedAt
  });
};


// --- Product Management ---

export const addProduct = async (storeId: string, productData: Omit<Product, "id" | "storeId" | "createdAt" | "lastUpdatedAt">): Promise<string> => {
  const productsCollection = collection(db, "products");
  const newProductRef = await addDoc(productsCollection, {
    ...productData,
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
  const newCustomerRef = await addDoc(customersCollection, {
    ...customerData,
    storeId,
    totalSpent: 0,
    loyaltyPoints: 0,
    createdAt: serverTimestamp(),
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
    // lastUpdatedAt: serverTimestamp(), // If Customer type has lastUpdatedAt
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
  const batch = writeBatch(db);
  const transactionsCollection = collection(db, "transactions");
  const newTransactionRef = doc(transactionsCollection); // Auto-generate ID

  const transactionData: Omit<Transaction, "id"> = {
    storeId,
    timestamp: serverTimestamp() as Timestamp,
    cashierId,
    cashierName: cashierName || "N/A",
    items: cartItems,
    subtotal,
    taxAmount,
    totalAmount,
    discountAmount: 0, // Assuming no discount for now
    paymentMethod,
    paymentStatus: "completed",
    ...(customerId && { customerId }),
    ...(customerName && { customerName }),
  };

  batch.set(newTransactionRef, transactionData);

  // Update stock quantities for each product in the cart
  for (const item of cartItems) {
    const productRef = doc(db, "products", item.productId);
    const productSnap = await getDoc(productRef); // Fetch current stock
    if (productSnap.exists()) {
      const currentStock = productSnap.data().stockQuantity as number;
      const newStock = currentStock - item.quantity;
      if (newStock < 0) {
        // This should ideally be checked before committing, or handled by security rules/Cloud Function
        console.warn(`Product ${item.name} stock will go negative. Proceeding, but this needs robust handling.`);
      }
      batch.update(productRef, { stockQuantity: newStock, lastUpdatedAt: serverTimestamp() });
    } else {
      console.error(`Product with ID ${item.productId} not found during transaction.`);
      // Handle this error appropriately - maybe fail the transaction
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
  }

  await batch.commit();
  return newTransactionRef.id;
};


export const getTransactionsByStoreId = async (storeId: string, count: number = 20): Promise<Transaction[]> => {
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
