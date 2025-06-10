
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { addProduct, addCustomer, addTransaction, getStoreDetails } from "@/lib/firestoreUtils";
import type { Product, Customer, TransactionItem, Store } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DatabaseZap } from "lucide-react";
import { Timestamp } from "firebase/firestore";

const dummyProductsRaw: Omit<Product, "id" | "storeId" | "createdAt" | "lastUpdatedAt" | "salesVelocity" | "historicalSalesData" | "supplierLeadTimeDays">[] = [
  { name: "Espresso Supreme Beans", sku: "COF001", price: 18.99, stockQuantity: 150, category: "Coffee", isVisibleOnPOS: true, lowStockThreshold: 25, description: "Dark roast, full-bodied espresso beans.", supplier: "Beans Inc.", imageUrl: "https://placehold.co/100x100.png" },
  { name: "Organic Milk (Gallon)", sku: "DRY001", price: 5.49, stockQuantity: 40, category: "Dairy", isVisibleOnPOS: true, lowStockThreshold: 10, description: "Fresh organic whole milk.", supplier: "Farm Fresh Dairy", imageUrl: "https://placehold.co/100x100.png" },
  { name: "Artisan Sourdough Loaf", sku: "BKY001", price: 7.25, stockQuantity: 30, category: "Bakery", isVisibleOnPOS: true, lowStockThreshold: 5, description: "Handcrafted sourdough bread.", supplier: "Local Bakery Co.", imageUrl: "https://placehold.co/100x100.png" },
  { name: "Butter Croissants (Box of 4)", sku: "PST001", price: 12.00, stockQuantity: 25, category: "Pastries", isVisibleOnPOS: true, lowStockThreshold: 5, description: "Flaky butter croissants.", supplier: "Parisian Pastries Ltd.", imageUrl: "https://placehold.co/100x100.png" },
  { name: "Cold Brew Concentrate", sku: "COF002", price: 15.50, stockQuantity: 60, category: "Coffee", isVisibleOnPOS: true, lowStockThreshold: 10, description: "Rich cold brew coffee concentrate.", supplier: "Beans Inc.", imageUrl: "https://placehold.co/100x100.png" },
  { name: "Reusable Coffee Tumbler", sku: "MER001", price: 22.00, stockQuantity: 75, category: "Merchandise", isVisibleOnPOS: true, lowStockThreshold: 10, description: "Insulated stainless steel tumbler.", supplier: "Eco Wares", imageUrl: "https://placehold.co/100x100.png" },
  { name: "Chocolate Chip Cookies (Dozen)", sku: "PST002", price: 10.00, stockQuantity: 40, category: "Pastries", isVisibleOnPOS: false, lowStockThreshold: 8, description: "Classic chocolate chip cookies.", supplier: "Grandma's Recipes", imageUrl: "https://placehold.co/100x100.png" },
];

const dummyCustomersRaw: Omit<Customer, "id" | "storeId" | "createdAt" | "lastUpdatedAt" | "totalSpent" | "loyaltyPoints" | "lastPurchaseAt">[] = [
  { name: "Alice Smith", email: "alice.smith@example.com", phone: "555-0101", address: { street: "123 Oak St", city: "Anytown", state: "CA", zip: "90210", country: "USA"} },
  { name: "Bob Johnson", email: "bob.johnson@example.com", phone: "555-0102" },
  { name: "Carol Williams", email: "carol.williams@example.com", phone: "555-0103", notes: "Prefers oat milk." },
  { name: "David Brown", email: "david.brown@example.com", phone: "555-0104" },
];

export default function PopulateDataPage() {
  const { user, userDoc, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [isPopulating, setIsPopulating] = React.useState(false);
  const [storeDetails, setStoreDetails] = React.useState<Store | null>(null);

  React.useEffect(() => {
    if (userDoc?.storeId) {
      getStoreDetails(userDoc.storeId).then(setStoreDetails);
    }
  }, [userDoc?.storeId]);

  const handlePopulateData = async () => {
    if (!user || !userDoc?.storeId || !storeDetails) {
      toast({ title: "Error", description: "User or store information not available. Please log in again.", variant: "destructive" });
      return;
    }
    setIsPopulating(true);
    toast({ title: "Starting Data Population", description: "Please wait..." });

    const { storeId } = userDoc;
    const cashierId = user.uid;
    const cashierName = userDoc.displayName;
    const taxRate = storeDetails.taxRate || 0.0;

    const populatedProductIds: string[] = [];
    const populatedCustomerIds: string[] = [];

    try {
      // Populate Products
      for (const product of dummyProductsRaw) {
        try {
          const newProductId = await addProduct(storeId, product);
          populatedProductIds.push(newProductId);
          toast({ title: "Product Added", description: `${product.name}` });
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        } catch (e: any) {
          console.error("Failed to add product:", product.name, e);
          toast({ title: "Product Add Error", description: `Failed: ${product.name} - ${e.message}`, variant: "destructive" });
        }
      }

      // Populate Customers
      for (const customer of dummyCustomersRaw) {
         try {
            const newCustomerId = await addCustomer(storeId, customer);
            populatedCustomerIds.push(newCustomerId);
            toast({ title: "Customer Added", description: `${customer.name}` });
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        } catch (e: any)
        {
            console.error("Failed to add customer:", customer.name, e);
            toast({ title: "Customer Add Error", description: `Failed: ${customer.name} - ${e.message}`, variant: "destructive" });
        }
      }

      // Create Sample Transactions
      if (populatedProductIds.length > 1) {
        const transaction1Items: TransactionItem[] = [
          { productId: populatedProductIds[0], name: dummyProductsRaw[0].name, sku: dummyProductsRaw[0].sku, quantity: 2, unitPrice: dummyProductsRaw[0].price, totalPrice: dummyProductsRaw[0].price * 2 },
          { productId: populatedProductIds[1], name: dummyProductsRaw[1].name, sku: dummyProductsRaw[1].sku, quantity: 1, unitPrice: dummyProductsRaw[1].price, totalPrice: dummyProductsRaw[1].price * 1 },
        ];
        let subtotal1 = transaction1Items.reduce((sum, item) => sum + item.totalPrice, 0);
        let tax1 = subtotal1 * taxRate;
        let total1 = subtotal1 + tax1;

        try {
            await addTransaction(storeId, cashierId, cashierName, transaction1Items, subtotal1, tax1, total1, "card", populatedCustomerIds[0], dummyCustomersRaw[0]?.name);
            toast({ title: "Transaction 1 Added" });
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e: any) {
             console.error("Failed to add transaction 1:", e);
            toast({ title: "Transaction 1 Error", description: e.message, variant: "destructive" });
        }


        if (populatedProductIds.length > 2 && populatedCustomerIds.length > 1) {
            const transaction2Items: TransactionItem[] = [
            { productId: populatedProductIds[2], name: dummyProductsRaw[2].name, sku: dummyProductsRaw[2].sku, quantity: 1, unitPrice: dummyProductsRaw[2].price, totalPrice: dummyProductsRaw[2].price * 1 },
            ];
            let subtotal2 = transaction2Items.reduce((sum, item) => sum + item.totalPrice, 0);
            let tax2 = subtotal2 * taxRate;
            let total2 = subtotal2 + tax2;
            try {
                await addTransaction(storeId, cashierId, cashierName, transaction2Items, subtotal2, tax2, total2, "cash", populatedCustomerIds[1], dummyCustomersRaw[1]?.name);
                toast({ title: "Transaction 2 Added" });
            } catch (e: any) {
                console.error("Failed to add transaction 2:", e);
                toast({ title: "Transaction 2 Error", description: e.message, variant: "destructive" });
            }
        }
      }

      toast({ title: "Data Population Complete!", variant: "default" });
    } catch (error: any) {
      console.error("Data population error:", error);
      toast({ title: "Population Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPopulating(false);
    }
  };

  if (userLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 items-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-text-black flex items-center">
            <DatabaseZap className="mr-2 h-6 w-6 text-primary" />
            Populate Dummy Data
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Click the button below to add sample products, customers, and transactions to your store
            (Store ID: {userDoc?.storeId || "Loading..."}). This is useful for testing and development.
            This action will add new data and will not overwrite existing data unless SKUs conflict (which this script avoids for products).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handlePopulateData}
            disabled={isPopulating || !userDoc?.storeId || !storeDetails}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPopulating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <DatabaseZap className="mr-2 h-5 w-5" />
            )}
            Populate My Store with Dummy Data
          </Button>
          {isPopulating && <p className="text-sm text-muted-foreground text-center mt-2">Populating data, please wait. Check toast notifications for progress...</p>}
          {!userDoc?.storeId && !userLoading && <p className="text-sm text-destructive text-center mt-2">Store ID not found. Cannot populate data.</p>}
           {!storeDetails && userDoc?.storeId && <p className="text-sm text-muted-foreground text-center mt-2">Loading store details to get tax rate...</p>}
        </CardContent>
      </Card>
    </div>
  );
}
