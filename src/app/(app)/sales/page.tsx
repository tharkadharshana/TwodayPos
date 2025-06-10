
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search, Trash2, CreditCard, UserPlus, PackageSearch, Filter, ShoppingBasket, Percent, Loader2, MinusCircle, Wallet, Mail, MessageSquare } from "lucide-react";
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

const mockCategories = ["All", "Drinks", "Pastries", "Food", "Merchandise"];
const HARDCODED_PROMO_CODES: Record<string, {type: 'fixed' | 'percentage', value: number}> = {
  "SAVE5": { type: 'fixed', value: 5 },
  "TENOFF": { type: 'percentage', value: 0.10 }
};


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
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);

  // Terminal State
  const [currentStep, setCurrentStep] = React.useState<'order' | 'payment' | 'receipt'>('order');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'cash' | 'card' | null>(null);
  const [amountTendered, setAmountTendered] = React.useState<string>("");
  const [promoCodeInput, setPromoCodeInput] = React.useState<string>("");
  const [appliedPromoCode, setAppliedPromoCode] = React.useState<string | null>(null);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = React.useState<number>(0);
  const [receiptRecipient, setReceiptRecipient] = React.useState<string>("");


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
          setProducts(fetchedProducts.filter(p => p.isVisibleOnPOS && p.stockQuantity > 0)); 
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

  const taxRate = storeDetails?.taxRate || 0.0;

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
      return [...prevItems, { productId: product.id, name: product.name, sku: product.sku, quantity: 1, price: product.price, totalPrice: product.price, imageUrl: product.imageUrl, stockQuantity: product.stockQuantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, change: number) => {
    setCartItems(prevItems =>
      prevItems
        .map(item => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) return null; // Mark for removal
            if (newQuantity > item.stockQuantity) {
              toast({ title: "Stock Limit", description: `Max stock for ${item.name} is ${item.stockQuantity}.`, variant: "default" });
              return { ...item, quantity: item.stockQuantity, totalPrice: item.stockQuantity * item.price };
            }
            return { ...item, quantity: newQuantity, totalPrice: newQuantity * item.price };
          }
          return item;
        })
        .filter(Boolean) as CartItem[] // Remove null items
    );
  };
   const setExactQuantity = (productId: string, newQuantity: number) => {
    const productInCart = cartItems.find(item => item.productId === productId);
    if (!productInCart) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > productInCart.stockQuantity) {
        toast({ title: "Stock Limit", description: `Cannot set quantity for ${productInCart.name} above stock level (${productInCart.stockQuantity}).`, variant: "default" });
        setCartItems(prevItems =>
            prevItems.map(item =>
            item.productId === productId ? { ...item, quantity: productInCart.stockQuantity, totalPrice: productInCart.stockQuantity * item.price } : item
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
  
  const resetTerminalState = () => {
    setCartItems([]);
    setSelectedCustomerId(undefined);
    setCurrentStep('order');
    setSelectedPaymentMethod(null);
    setAmountTendered("");
    setPromoCodeInput("");
    setAppliedPromoCode(null);
    setAppliedDiscountAmount(0);
    setReceiptRecipient("");
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const calculateDiscount = (currentSubtotal: number, promo: string | null): number => {
    if (!promo) return 0;
    const promoDetails = HARDCODED_PROMO_CODES[promo.toUpperCase()];
    if (!promoDetails) return 0;

    let discount = 0;
    if (promoDetails.type === 'fixed') {
      discount = promoDetails.value;
    } else if (promoDetails.type === 'percentage') {
      discount = currentSubtotal * promoDetails.value;
    }
    return Math.min(discount, currentSubtotal); // Discount cannot exceed subtotal
  };

  const actualDiscountApplied = calculateDiscount(subtotal, appliedPromoCode);
  const subtotalAfterDiscount = subtotal - actualDiscountApplied;
  const tax = subtotalAfterDiscount * taxRate;
  const total = subtotalAfterDiscount + tax;
  const changeDue = selectedPaymentMethod === 'cash' ? Math.max(0, parseFloat(amountTendered || "0") - total) : 0;


  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())))
    .filter(p => selectedCategory === "All" || p.category === selectedCategory)
    .filter(p => p.isVisibleOnPOS && p.stockQuantity > 0);

  const handleApplyPromoCode = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
        toast({ title: "No Code", description: "Please enter a promo code.", variant: "default"});
        return;
    }
    const promoDetails = HARDCODED_PROMO_CODES[code];
    if (promoDetails) {
        const calculatedDisc = calculateDiscount(subtotal, code);
        setAppliedPromoCode(code);
        setAppliedDiscountAmount(calculatedDisc); // This will trigger re-calculation of total
        toast({ title: "Promo Applied!", description: `Code "${code}" applied.`});
        setPromoCodeInput("");
    } else {
        toast({ title: "Invalid Code", description: `Promo code "${code}" is not valid.`, variant: "destructive"});
        setAppliedPromoCode(null);
        setAppliedDiscountAmount(0);
    }
  };

  const handlePaymentMethodSelect = (method: 'cash' | 'card') => {
    setSelectedPaymentMethod(method);
    setCurrentStep('payment');
    setAmountTendered(""); // Reset tendered amount
  };

  const handleProcessPayment = async () => {
    if (cartItems.length === 0) {
      toast({ title: "Empty Cart", description: "Add items to cart first.", variant: "default" });
      return;
    }
    if (!selectedPaymentMethod) {
      toast({ title: "No Payment Method", description: "Please select a payment method.", variant: "default" });
      return;
    }
    if (selectedPaymentMethod === 'cash' && parseFloat(amountTendered || "0") < total) {
        toast({ title: "Insufficient Cash", description: "Amount tendered is less than total.", variant: "destructive" });
        return;
    }

    setIsProcessingPayment(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setIsProcessingPayment(false);
    setCurrentStep('receipt');
    toast({ title: "Payment Processed", description: "Ready for receipt." });
  };
  
  const handleFinalizeSale = async () => {
    if (!userDoc || !user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsProcessingPayment(true);
    try {
      const transactionItems: TransactionItem[] = cartItems.map(item => ({
        itemId: item.productId,
        itemType: item.itemType || 'product',
        name: item.name,
        sku: item.sku || "",
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
        subtotal, // Original subtotal before discount
        tax,
        total,
        selectedPaymentMethod || "other", 
        selectedCustomerId,
        selectedCustomer?.name,
        // TODO: Pass discount details to addTransaction if needed for records
      );
      toast({ title: "Sale Finalized!", description: "Transaction saved." });
      resetTerminalState(); // Clears cart and resets everything
      
      // Refresh product list (especially stock quantities)
      const refreshedProducts = await getProductsByStoreId(userDoc.storeId);
      setProducts(refreshedProducts.filter(p => p.isVisibleOnPOS && p.stockQuantity > 0));

    } catch (error: any) {
      console.error("Finalize sale error:", error);
      toast({ title: "Sale Error", description: error.message || "Could not complete the transaction.", variant: "destructive" });
    }
    setIsProcessingPayment(false);
  };
  
  const quickTenderAmounts = [10, 20, 50, 100];


  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] max-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] overflow-hidden">
      {/* Left Panel: Product Selection */}
      <div className="flex-grow-[2] p-4 flex flex-col border-r border-border overflow-hidden basis-2/5">
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
                size="lg" 
                className="shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent hover:text-accent-foreground px-6 py-3 text-base"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground"><Filter className="h-6 w-6"/></Button>
          </div>
        </div>
        <ScrollArea className="flex-1 -mx-4">
          {isLoadingProducts ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
             <div className="flex justify-center items-center h-full text-muted-foreground p-10 text-center">
                No products found matching your criteria or inventory is empty.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-xl transition-shadow aspect-square flex flex-col items-center justify-center p-2 text-center shadow-md bg-card text-card-foreground"
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
                  <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{product.name}</p>
                  <p className="text-xs text-primary font-semibold">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.stockQuantity}</p>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Center Panel: Active Cart & Transaction Summary */}
      <div className="flex-grow-[2] p-4 flex flex-col border-r border-border bg-muted/20 dark:bg-muted/10 overflow-hidden basis-2/5">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-2xl font-headline flex items-center justify-between text-foreground">
            <div className="flex items-center">
              <ShoppingBasket className="mr-2 h-6 w-6 text-primary"/> Current Order
            </div>
            {cartItems.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-5 w-5"/></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader> <AlertDialogTitle>Clear Cart?</AlertDialogTitle> <AlertDialogDescription> Are you sure you want to remove all items from the current order? </AlertDialogDescription> </AlertDialogHeader>
                        <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={resetTerminalState} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Clear Cart</AlertDialogAction> </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 -mx-4">
          <div className="px-4 divide-y divide-border">
            {cartItems.map(item => (
              <div key={item.productId} className="py-3 flex items-center gap-3">
                <Image src={item.imageUrl || "https://placehold.co/40x40.png"} alt={item.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint="cart item" />
                <div className="flex-grow">
                  <p className="font-medium text-foreground line-clamp-1">{item.name}</p>
                  <div className="flex items-center mt-1 gap-1">
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, -1)}><MinusCircle className="h-4 w-4"/></Button>
                     <Input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setExactQuantity(item.productId, parseInt(e.target.value) || 0)}
                        min="0"
                        className="h-7 w-12 text-sm text-center p-1"
                        aria-label={`Quantity for ${item.name}`}
                     />
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, 1)}><PlusCircle className="h-4 w-4"/></Button>
                     <span className="text-xs text-muted-foreground ml-1">x ${item.price.toFixed(2)}</span>
                  </div>
                </div>
                <p className="font-semibold text-foreground w-20 text-right">${item.totalPrice.toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.productId)} aria-label={`Remove ${item.name} from cart`}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
              </div>
            ))}
            {cartItems.length === 0 && <p className="text-center text-muted-foreground py-10">Your cart is empty. Add items to get started!</p>}
          </div>
        </ScrollArea>
        
        {/* Discount & Customer Section */}
        <div className="pt-4 mt-auto">
            <div className="flex items-end gap-2 mb-3">
                <div className="flex-grow">
                    <Label htmlFor="promo-code" className="text-xs text-muted-foreground">Promo Code</Label>
                    <Input id="promo-code" placeholder="Enter code" className="h-10" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value)} />
                </div>
                <Button onClick={handleApplyPromoCode} className="h-10 shrink-0" disabled={!promoCodeInput}>Apply Promo</Button>
            </div>
            <div>
                <Label htmlFor="customer-select" className="text-xs text-muted-foreground">Assign Customer (Optional)</Label>
                <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                    <SelectTrigger id="customer-select" className="h-10">
                        <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
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
            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscountAmount > 0 && (
                    <div className="flex justify-between text-destructive">
                        <span className="text-destructive">Discount ({appliedPromoCode})</span>
                        <span className="font-medium text-destructive">-${actualDiscountApplied.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({ (taxRate * 100).toFixed(0) }%)</span>
                    <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-2xl font-bold pt-1">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Right Panel: Payment & Actions */}
      <div className="flex-grow-[1] p-6 flex flex-col bg-card shadow-lg overflow-y-auto basis-1/5 min-w-[300px] md:min-w-[360px]">
        {currentStep === 'order' && (
            <>
                <h2 className="text-xl font-semibold mb-6 text-center text-foreground">Select Payment Method</h2>
                <div className="grid grid-cols-1 gap-4 flex-grow content-center">
                    <Button onClick={() => handlePaymentMethodSelect('cash')} className="h-20 text-xl bg-accent-orange hover:bg-accent-orange/90 text-white">
                        <Wallet className="mr-3 h-8 w-8"/>Cash
                    </Button>
                    <Button onClick={() => handlePaymentMethodSelect('card')} className="h-20 text-xl bg-accent-cyan hover:bg-accent-cyan/90 text-white">
                        <CreditCard className="mr-3 h-8 w-8"/>Card
                    </Button>
                </div>
                <Button variant="outline" className="mt-auto h-12 text-muted-foreground" disabled>Split Payment (Soon)</Button>
            </>
        )}

        {currentStep === 'payment' && selectedPaymentMethod === 'cash' && (
            <>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('order')} className="mb-4 self-start text-muted-foreground">&larr; Back to Payment Methods</Button>
                <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Cash Payment</h2>
                <Label htmlFor="amount-tendered" className="text-muted-foreground">Amount Tendered</Label>
                <Input 
                    id="amount-tendered" 
                    type="number" 
                    placeholder="0.00" 
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="h-16 text-3xl text-right mb-3" 
                />
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {quickTenderAmounts.map(amount => (
                        <Button key={amount} variant="outline" className="h-12 text-base" onClick={() => setAmountTendered(amount.toString())}>${amount}</Button>
                    ))}
                    <Button variant="outline" className="h-12 text-base" onClick={() => setAmountTendered(total.toFixed(2))}>Exact Amount</Button>
                </div>
                <div className="text-right text-2xl font-bold my-4 p-3 bg-muted rounded-md">
                    <span className="text-muted-foreground">Change Due: </span>
                    <span className="text-accent-yellow">${changeDue.toFixed(2)}</span>
                </div>
                <Button onClick={handleProcessPayment} className="w-full h-16 text-xl mt-auto" disabled={isProcessingPayment || parseFloat(amountTendered || "0") < total}>
                    {isProcessingPayment ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Process Cash"}
                </Button>
            </>
        )}

        {currentStep === 'payment' && selectedPaymentMethod === 'card' && (
            <>
                 <Button variant="ghost" size="sm" onClick={() => setCurrentStep('order')} className="mb-4 self-start text-muted-foreground">&larr; Back to Payment Methods</Button>
                <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Card Payment</h2>
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                    <CreditCard className="h-24 w-24 text-primary mb-4"/>
                    <p className="text-muted-foreground mb-2">Please use card terminal to complete payment.</p>
                    <p className="text-2xl font-bold text-foreground">Total: ${total.toFixed(2)}</p>
                </div>
                <Button onClick={handleProcessPayment} className="w-full h-16 text-xl mt-auto" disabled={isProcessingPayment}>
                    {isProcessingPayment ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Process Card"}
                </Button>
            </>
        )}
        
        {currentStep === 'receipt' && (
            <>
                <h2 className="text-xl font-semibold mb-6 text-center text-foreground">Digital Receipt</h2>
                <div className="space-y-4 mb-6">
                    <div>
                        <Label htmlFor="receipt-recipient" className="text-muted-foreground">Phone or Email</Label>
                        <Input 
                            id="receipt-recipient" 
                            placeholder="Enter customer's phone or email" 
                            value={receiptRecipient}
                            onChange={(e) => setReceiptRecipient(e.target.value)}
                            className="h-12 text-lg" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12" disabled> {/* UI Only for now */}
                            <MessageSquare className="mr-2"/> Send SMS
                        </Button>
                        <Button variant="outline" className="h-12" disabled> {/* UI Only for now */}
                            <Mail className="mr-2"/> Send Email
                        </Button>
                    </div>
                </div>
                 <p className="text-center text-muted-foreground my-4 text-sm">Or</p>
                <Button variant="secondary" onClick={handleFinalizeSale} className="w-full h-12 text-base mb-3" disabled={isProcessingPayment}>
                    No Receipt & Finalize
                </Button>
                <Button onClick={handleFinalizeSale} className="w-full h-16 text-xl mt-auto" disabled={isProcessingPayment}>
                    {isProcessingPayment ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Finalize Sale"}
                </Button>
            </>
        )}

      </div>
    </div>
  );
}

