"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, Trash2, CreditCard, UserPlus, PackageSearch, Filter, ShoppingBasket, Percent, Loader2 } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { getProductsByStoreId, getCustomersByStoreId, addTransaction, getStoreDetails } from "@/lib/firestoreUtils";
import type { Product, CartItem, Customer, TransactionItem, Store } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";


const mockCategories = ["All", "Drinks", "Pastries", "Food", "Merchandise"]; // Keep for UI, filtering can be client-side for now

export default function SalesPage() {
  const { user, userDoc } = useUser();
  const { toast } = useToast();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [storeDetails, setStoreDetails] = React.useState<Store | null>(null);

  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  React.useEffect(() => {
    if (userDoc?.storeId) {
      const fetchInitialData = async () => {
        setIsLoadingProducts(true);
        try {
          const [fetchedProducts, fetchedCustomers, fetchedStoreDetails] = await Promise.all([
            getProductsByStoreId(userDoc.storeId),
            getCustomersByStoreId(userDoc.storeId),
            getStoreDetails(userDoc.storeId)
          ]);
          setProducts(fetchedProducts.filter(p => p.isVisibleOnPOS && p.stockQuantity > 0)); // Only show visible & in-stock items
          setCustomers(fetchedCustomers);
          setStoreDetails(fetchedStoreDetails);
        } catch (error) {
          console.error("Error fetching sales page data:", error);
          toast({ title: "Error", description: "Could not load products or customers.", variant: "destructive" });
        }
        setIsLoadingProducts(false);
      };
      fetchInitialData();
    }
  }, [userDoc?.storeId, toast]);

  const taxRate = storeDetails?.taxRate || 0.0; // Default to 0 if not set

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stockQuantity) {
            return prevItems.map(item =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.price } : item
            );
        } else {
            toast({ title: "Stock Limit", description: `Cannot add more ${product.name}. Max stock reached.`, variant: "default" });
            return prevItems;
        }
      }
      return [...prevItems, { productId: product.id, name: product.name, sku: product.sku, quantity: 1, price: product.price, totalPrice: product.price, imageUrl: product.imageUrl }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > product.stockQuantity) {
        toast({ title: "Stock Limit", description: `Cannot set quantity for ${product.name} above stock level (${product.stockQuantity}).`, variant: "default" });
        setCartItems(prevItems =>
            prevItems.map(item =>
            item.productId === productId ? { ...item, quantity: product.stockQuantity, totalPrice: product.stockQuantity * item.price } : item
            )
        );
        return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.price } : item
      )
    );
  };
  
  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomerId(undefined);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => selectedCategory === "All" || p.category === selectedCategory)
    .filter(p => p.isVisibleOnPOS && p.stockQuantity > 0);


  const handleCheckout = async () => {
    if (!userDoc || !user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Empty Cart", description: "Please add items to your cart before checkout.", variant: "default" });
      return;
    }

    setIsCheckingOut(true);
    try {
      const transactionItems: TransactionItem[] = cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.totalPrice,
      }));
      
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

      await addTransaction(
        userDoc.storeId,
        user.uid,
        userDoc.displayName,
        transactionItems,
        subtotal,
        tax,
        total,
        "card", // Placeholder payment method
        selectedCustomerId,
        selectedCustomer?.name
      );
      toast({ title: "Checkout Successful", description: "Transaction completed." });
      clearCart();
      // Optionally, refresh products to reflect new stock counts
      const refreshedProducts = await getProductsByStoreId(userDoc.storeId);
      setProducts(refreshedProducts.filter(p => p.isVisibleOnPOS && p.stockQuantity > 0));

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({ title: "Checkout Failed", description: error.message || "Could not complete the transaction.", variant: "destructive" });
    }
    setIsCheckingOut(false);
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] max-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))]">
      {/* Product Selection Area */}
      <div className="flex-grow-[2] p-4 flex flex-col border-r border-border overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search products or scan barcode..." 
              className="pl-10 h-12 text-lg" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {mockCategories.map(category => (
              <Button 
                key={category} 
                variant={selectedCategory === category ? "default" : "outline"} 
                size="sm" 
                className="shrink-0 text-text-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-text-black"><Filter className="h-5 w-5"/></Button>
          </div>
        </div>
        <ScrollArea className="flex-1 -mx-4">
          {isLoadingProducts ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
             <div className="flex justify-center items-center h-full text-muted-foreground">
                No products found matching your criteria or inventory is empty.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-xl transition-shadow aspect-square flex flex-col items-center justify-center p-2 text-center shadow-md"
                  onClick={() => addToCart(product)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && addToCart(product)}
                  aria-label={`Add ${product.name} to cart`}
                >
                  <Image 
                    src={product.imageUrl || "https://placehold.co/80x80.png"} 
                    alt={product.name} 
                    width={60} 
                    height={60} 
                    className="rounded-md mb-2 object-cover" 
                    data-ai-hint="product item"
                  />
                  <p className="text-sm font-medium text-text-black leading-tight line-clamp-2">{product.name}</p>
                  <p className="text-xs text-primary font-semibold">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.stockQuantity}</p>
                </Card>
              ))}
              <Card className="cursor-not-allowed opacity-50 aspect-square flex flex-col items-center justify-center p-2 text-center border-dashed border-2 border-muted-foreground/50">
                  <PackageSearch className="h-10 w-10 text-muted-foreground/70 mb-2"/>
                  <p className="text-sm font-medium text-muted-foreground">Custom Item (Soon)</p>
              </Card>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Cart and Checkout Area */}
      <div className="flex-grow-[1] p-4 flex flex-col bg-card shadow-lg overflow-hidden w-full max-w-md md:max-w-sm lg:max-w-md xl:max-w-lg">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-2xl font-headline flex items-center justify-between text-text-black">
            <div className="flex items-center">
              <ShoppingBasket className="mr-2 h-6 w-6 text-primary"/> Current Order
            </div>
            {cartItems.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-5 w-5"/></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove all items from the current order?
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearCart} className="bg-destructive hover:bg-destructive/90">Clear Cart</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 -mx-4">
          <div className="px-4 divide-y divide-border">
            {cartItems.map(item => (
              <div key={item.productId} className="py-3 flex items-center">
                <Image src={item.imageUrl || "https://placehold.co/40x40.png"} alt={item.name} width={40} height={40} className="rounded-md mr-3 object-cover" data-ai-hint="cart item" />
                <div className="flex-grow">
                  <p className="font-medium text-text-black line-clamp-1">{item.name}</p>
                  <div className="flex items-center mt-1">
                     <Input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        min="0"
                        className="h-7 w-16 text-xs text-center p-1"
                        aria-label={`Quantity for ${item.name}`}
                     />
                     <span className="text-xs text-muted-foreground ml-1">x ${item.price.toFixed(2)}</span>
                  </div>
                </div>
                <p className="font-semibold text-text-black w-20 text-right">${item.totalPrice.toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.productId)} aria-label={`Remove ${item.name} from cart`}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            ))}
            {cartItems.length === 0 && <p className="text-center text-muted-foreground py-10">Your cart is empty.</p>}
          </div>
        </ScrollArea>
        <Separator className="my-4" />
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-text-black">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({ (taxRate * 100).toFixed(0) }%)</span>
            <span className="font-medium text-text-black">${tax.toFixed(2)}</span>
          </div>
           <div className="flex justify-between items-center">
            <Button variant="link" className="p-0 h-auto text-primary text-xs cursor-not-allowed"><Percent className="inline h-3 w-3 mr-1"/>Add Discount (Soon)</Button>
            <span className="font-medium text-text-black">-$0.00</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-text-black">Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="customer-select" className="text-xs text-muted-foreground">Assign Customer (Optional)</Label>
            <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                <SelectTrigger id="customer-select" className="h-14">
                    <UserPlus className="mr-2 h-5 w-5 text-muted-foreground" />
                    <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <Button 
            className="h-14 text-sm bg-primary hover:bg-primary/90 text-primary-foreground col-span-2"
            onClick={handleCheckout}
            disabled={isCheckingOut || cartItems.length === 0}
          >
            {isCheckingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
             Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
