
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Search, Trash2, CreditCard, UserPlus, PackageSearch, Filter, ShoppingBasket, Percent, Loader2, MinusCircle, Wallet, Mail, MessageSquare, XCircle, UserCheck, UserX, ConciergeBell, CheckCircle, Undo2, Tag } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { getProductsByStoreId, getServicesByStoreId, getCustomersByStoreId, addTransaction, getStoreDetails, addCustomer as addCustomerFirestore } from "@/lib/firestoreUtils";
import type { Product, Service, CartItem, Customer, TransactionItem, Store } from "@/types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";


const mockCategories = ["All", "Favorites", "Drinks", "Pastries", "Food", "Merchandise", "Services"]; 

type CatalogDisplayItem = (Product | Service) & { itemType: 'product' | 'service' };

const HARDCODED_PROMO_CODES: Record<string, {type: 'fixed' | 'percentage', value: number, description?: string}> = {
  "SAVE5": { type: 'fixed', value: 5, description: "$5 Off" },
  "TENOFF": { type: 'percentage', value: 0.10, description: "10% Off" }
};

type LastCartAction = 
  | { type: 'add_new_item'; itemId: string; itemType: 'product' | 'service' }
  | { type: 'increment_existing_item'; itemId: string; itemType: 'product' | 'service' }
  | null;

const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const basicPhoneRegex = /^\+?[1-9]\d{1,14}$/; 

const newCustomerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")), // Basic validation for UI, more strict on server if needed
  notes: z.string().optional(),
});
type NewCustomerFormValues = z.infer<typeof newCustomerFormSchema>;


export default function SalesPage() {
  const { user, userDoc } = useUser();
  const { toast } = useToast();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [services, setServices] = React.useState<Service[]>([]);
  const [catalogItems, setCatalogItems] = React.useState<CatalogDisplayItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [storeDetails, setStoreDetails] = React.useState<Store | null>(null);

  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
  const [selectedCustomerName, setSelectedCustomerName] = React.useState<string | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const [isLoadingCatalog, setIsLoadingCatalog] = React.useState(true);
  const [isProcessingOrSending, setIsProcessingOrSending] = React.useState(false);


  // Terminal State
  const [currentStep, setCurrentStep] = React.useState<'order' | 'payment' | 'receipt'>('order');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'cash' | 'card' | null>(null);
  const [amountTendered, setAmountTendered] = React.useState<string>("");
  const [promoCodeInput, setPromoCodeInput] = React.useState<string>("");
  const [appliedPromoCode, setAppliedPromoCode] = React.useState<string | null>(null);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = React.useState<number>(0);
  const [receiptRecipient, setReceiptRecipient] = React.useState<string>("");
  const [lastCartAction, setLastCartAction] = React.useState<LastCartAction>(null);
  const [receiptSent, setReceiptSent] = React.useState(false);


  // Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false);
  const [customerModalView, setCustomerModalView] = React.useState<'search' | 'add'>('search');
  const [customerSearchTerm, setCustomerSearchTerm] = React.useState("");
  const [isAddingCustomer, setIsAddingCustomer] = React.useState(false);

  const newCustomerForm = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });


  React.useEffect(() => {
    if (userDoc?.storeId) {
      const fetchInitialData = async () => {
        setIsLoadingCatalog(true);
        try {
          const [fetchedProducts, fetchedServices, fetchedCustomers, fetchedStoreDetails] = await Promise.all([
            getProductsByStoreId(userDoc.storeId),
            getServicesByStoreId(userDoc.storeId),
            getCustomersByStoreId(userDoc.storeId),
            getStoreDetails(userDoc.storeId)
          ]);

          setProducts(fetchedProducts);
          setServices(fetchedServices);
          
          const activeProducts: CatalogDisplayItem[] = fetchedProducts
            .filter(p => p.isVisibleOnPOS) 
            .map(p => ({ ...p, itemType: 'product' as const }));
          
          const activeServices: CatalogDisplayItem[] = fetchedServices
            .filter(s => s.isVisibleOnPOS)
            .map(s => ({ ...s, itemType: 'service' as const }));

          setCatalogItems([...activeProducts, ...activeServices].sort((a,b) => a.name.localeCompare(b.name)));
          
          setCustomers(fetchedCustomers);
          setStoreDetails(fetchedStoreDetails);

        } catch (error) {
          console.error("Error fetching sales page data:", error);
          toast({ title: "Error", description: "Could not load products, services or customers.", variant: "destructive" });
        }
        setIsLoadingCatalog(false);
      };
      fetchInitialData();
    }
  }, [userDoc?.storeId, toast]);

  const taxRate = storeDetails?.taxRate || 0.0;

  const addToCart = (item: CatalogDisplayItem) => {
    if (item.itemType === 'product' && item.stockQuantity <= 0) {
      toast({ title: "Out of Stock", description: `${item.name} is currently out of stock.`, variant: "default" });
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.productId === item.id && cartItem.itemType === item.itemType);
      if (existingItem) {
        if (item.itemType === 'product' && existingItem.quantity >= (item as Product).stockQuantity) {
            toast({ title: "Stock Limit", description: `Cannot add more ${item.name}. Max stock reached.`, variant: "default" });
            return prevItems;
        }
        setLastCartAction({ type: 'increment_existing_item', itemId: item.id, itemType: item.itemType });
        return prevItems.map(cartItem =>
        cartItem.productId === item.id && cartItem.itemType === item.itemType 
            ? { ...cartItem, quantity: cartItem.quantity + 1, totalPrice: (cartItem.quantity + 1) * cartItem.price } 
            : cartItem
        );
      }
      setLastCartAction({ type: 'add_new_item', itemId: item.id, itemType: item.itemType });
      return [...prevItems, { 
        productId: item.id, 
        name: item.name, 
        sku: (item as Product).sku || undefined, 
        quantity: 1, 
        price: item.price, 
        totalPrice: item.price, 
        imageUrl: item.imageUrl, 
        stockQuantity: (item as Product).stockQuantity, 
        itemType: item.itemType,
        durationMinutes: (item as Service).durationMinutes 
      }];
    });
  };

  const removeFromCart = (productId: string, itemType: 'product' | 'service') => {
    setCartItems(prevItems => prevItems.filter(item => !(item.productId === productId && item.itemType === itemType)));
    setLastCartAction(null); 
  };

  const updateQuantity = (productId: string, itemType: 'product' | 'service', change: number) => {
    setCartItems(prevItems =>
      prevItems
        .map(item => {
          if (item.productId === productId && item.itemType === itemType) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) return null; 
            if (item.itemType === 'product' && item.stockQuantity !== undefined && newQuantity > item.stockQuantity) {
              toast({ title: "Stock Limit", description: `Max stock for ${item.name} is ${item.stockQuantity}.`, variant: "default" });
              return { ...item, quantity: item.stockQuantity, totalPrice: item.stockQuantity * item.price };
            }
            if (change > 0) {
                 setLastCartAction({ type: 'increment_existing_item', itemId: productId, itemType: itemType });
            } else {
                 setLastCartAction(null); 
            }
            return { ...item, quantity: newQuantity, totalPrice: newQuantity * item.price };
          }
          return item;
        })
        .filter(Boolean) as CartItem[] 
    );
  };

   const setExactQuantity = (productId: string, itemType: 'product' | 'service', newQuantity: number) => {
    const productInCart = cartItems.find(item => item.productId === productId && item.itemType === itemType);
    if (!productInCart) return;

    if (newQuantity <= 0) {
      removeFromCart(productId, itemType);
      return;
    }
    if (productInCart.itemType === 'product' && productInCart.stockQuantity !== undefined && newQuantity > productInCart.stockQuantity) {
        toast({ title: "Stock Limit", description: `Cannot set quantity for ${productInCart.name} above stock level (${productInCart.stockQuantity}).`, variant: "default" });
        setCartItems(prevItems =>
            prevItems.map(item =>
            (item.productId === productId && item.itemType === itemType) ? { ...item, quantity: productInCart.stockQuantity!, totalPrice: productInCart.stockQuantity! * item.price } : item
            )
        );
        return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        (item.productId === productId && item.itemType === itemType) ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.price } : item
      )
    );
    setLastCartAction(null); 
  };

  const handleUndoLastCartAction = () => {
    if (!lastCartAction) return;

    const { type, itemId, itemType } = lastCartAction;

    if (type === 'add_new_item') {
      removeFromCart(itemId, itemType);
    } else if (type === 'increment_existing_item') {
      const itemInCart = cartItems.find(ci => ci.productId === itemId && ci.itemType === itemType);
      if (itemInCart && itemInCart.quantity > 1) {
        updateQuantity(itemId, itemType, -1);
      } else if (itemInCart && itemInCart.quantity === 1) {
        removeFromCart(itemId, itemType);
      }
    }
    setLastCartAction(null); 
  };
  
  const resetTerminalState = (clearCustomer: boolean = true, clearLastAction: boolean = true) => {
    setCartItems([]);
    if (clearCustomer) {
      setSelectedCustomerId(undefined);
      setSelectedCustomerName(undefined);
    }
    setCurrentStep('order');
    setSelectedPaymentMethod(null);
    setAmountTendered("");
    setPromoCodeInput("");
    setAppliedPromoCode(null);
    setReceiptRecipient("");
    setReceiptSent(false);
    if (clearLastAction) {
        setLastCartAction(null);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  
  const calculateDiscount = (currentSubtotal: number, promoKey: string | null): number => {
    if (!promoKey) return 0;
    const promoDetails = HARDCODED_PROMO_CODES[promoKey.toUpperCase()];
    if (!promoDetails) return 0;

    let discount = 0;
    if (promoDetails.type === 'fixed') {
      discount = promoDetails.value;
    } else if (promoDetails.type === 'percentage') {
      discount = currentSubtotal * promoDetails.value;
    }
    return Math.min(discount, currentSubtotal); // Discount cannot exceed subtotal
  };

  React.useEffect(() => {
    setAppliedDiscountAmount(calculateDiscount(subtotal, appliedPromoCode));
  }, [subtotal, appliedPromoCode]);


  const subtotalAfterDiscount = subtotal - appliedDiscountAmount;
  const tax = subtotalAfterDiscount * taxRate;
  const total = subtotalAfterDiscount + tax;
  const changeDue = selectedPaymentMethod === 'cash' ? Math.max(0, parseFloat(amountTendered || "0") - total) : 0;

  let displayedCatalogItems = catalogItems;
  if (selectedCategory === "Favorites") {
    const favoriteCount = Math.min(4, catalogItems.length);
    displayedCatalogItems = catalogItems.slice(0, favoriteCount);
  } else if (selectedCategory !== "All") {
    displayedCatalogItems = catalogItems.filter(item => item.category === selectedCategory);
  }

  const filteredCatalogItems = displayedCatalogItems
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ((item as Product).sku && (item as Product).sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );


  const handleApplyOrRemovePromoCode = () => {
    if (appliedPromoCode && promoCodeInput === "") { // Condition to remove
        setAppliedPromoCode(null);
        toast({ title: "Promo Removed", description: "Discount has been removed from the order."});
        return;
    }

    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
        toast({ title: "No Code", description: "Please enter a promo code.", variant: "default"});
        return;
    }
    const promoDetails = HARDCODED_PROMO_CODES[code];
    if (promoDetails) {
        setAppliedPromoCode(code); 
        toast({ title: "Promo Applied!", description: `Code "${code}" (${promoDetails.description || ''}) applied.`});
        setPromoCodeInput("");
    } else {
        toast({ title: "Invalid Code", description: `Promo code "${code}" is not valid.`, variant: "destructive"});
    }
  };

  const handlePaymentMethodSelect = (method: 'cash' | 'card') => {
    setSelectedPaymentMethod(method);
    setCurrentStep('payment');
    setAmountTendered(""); 
    setReceiptSent(false);
    
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (customer) {
        setReceiptRecipient(customer.email || customer.phone || "");
    } else {
        setReceiptRecipient("");
    }
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

    setIsProcessingOrSending(true);
    await new Promise(resolve => setTimeout(resolve, selectedPaymentMethod === 'cash' ? 1000 : 2000)); 
    setIsProcessingOrSending(false);
    setCurrentStep('receipt');
    toast({ title: "Payment Processed", description: "Ready for receipt." });
  };
  
  const handleSimulatedSendReceipt = async (channel: 'SMS' | 'Email') => {
    setIsProcessingOrSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setIsProcessingOrSending(false);
    setReceiptSent(true);
    toast({
      title: "Receipt Sent (Simulated)",
      description: `Digital receipt sent via ${channel} to ${receiptRecipient}.`,
    });
  };

  const handleNoReceipt = () => {
    setReceiptSent(true); 
    toast({
      title: "No Receipt",
      description: "Customer opted out of a digital receipt.",
      variant: "default"
    });
  }

  const handleFinalizeSale = async () => {
    if (!userDoc || !user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    setIsProcessingOrSending(true);
    try {
      const customerForTx = customers.find(c => c.id === selectedCustomerId);

      await addTransaction(
        userDoc.storeId,
        user.uid,
        userDoc.displayName,
        cartItems, 
        subtotal,
        tax, 
        total,
        selectedPaymentMethod || "other", 
        selectedCustomerId,
        customerForTx?.name,
        appliedDiscountAmount, 
        appliedPromoCode
      );
      toast({ title: "Sale Finalized!", description: "Transaction saved." });
      resetTerminalState(true, true); 
      
        const [refreshedProducts, refreshedServices] = await Promise.all([
            getProductsByStoreId(userDoc.storeId),
            getServicesByStoreId(userDoc.storeId),
        ]);
        setProducts(refreshedProducts);
        setServices(refreshedServices);
        const activeProducts: CatalogDisplayItem[] = refreshedProducts
            .filter(p => p.isVisibleOnPOS)
            .map(p => ({ ...p, itemType: 'product' as const }));
        const activeServices: CatalogDisplayItem[] = refreshedServices
            .filter(s => s.isVisibleOnPOS)
            .map(s => ({ ...s, itemType: 'service' as const }));
        setCatalogItems([...activeProducts, ...activeServices].sort((a,b) => a.name.localeCompare(b.name)));


    } catch (error: any) {
      console.error("Finalize sale error:", error);
      toast({ title: "Sale Error", description: error.message || "Could not complete the transaction.", variant: "destructive" });
    }
    setIsProcessingOrSending(false);
  };
  
  const quickTenderAmounts = [10, 20, 50, 100];

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerName(customer.name);
    setReceiptRecipient(customer.email || customer.phone || ""); 
    setIsCustomerModalOpen(false);
    setCustomerSearchTerm("");
    setCustomerModalView('search'); // Reset to search view
    newCustomerForm.reset(); // Clear new customer form
    toast({ title: "Customer Assigned", description: `${customer.name} assigned to this transaction.`});
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(undefined);
    setSelectedCustomerName(undefined);
    setReceiptRecipient(""); 
    toast({ title: "Customer Cleared", description: "Customer unassigned from transaction."});
  };

  const filteredCustomersForModal = customers.filter(customer => {
    const search = customerSearchTerm.toLowerCase();
    return (
        customer.name.toLowerCase().includes(search) ||
        (customer.email && customer.email.toLowerCase().includes(search)) ||
        (customer.phone && customer.phone.includes(search))
    );
  });

  const isItemInCart = (itemId: string, itemType: 'product' | 'service') => {
    return cartItems.some(cartItem => cartItem.productId === itemId && cartItem.itemType === itemType);
  }

  const promoButtonText = appliedPromoCode && promoCodeInput === "" ? "Remove Promo" : "Apply Promo";
  const promoButtonDisabled = (promoButtonText === "Apply Promo" && (!promoCodeInput || subtotal === 0)) || (promoButtonText === "Remove Promo" && !appliedPromoCode);
  
  const isReceiptRecipientValidEmail = basicEmailRegex.test(receiptRecipient);
  const isReceiptRecipientValidPhone = basicPhoneRegex.test(receiptRecipient);

  const handleOpenCustomerModal = () => {
    setCustomerModalView('search'); // Always start in search view
    newCustomerForm.reset();
    setIsCustomerModalOpen(true);
  }

  const onSubmitNewCustomer = async (data: NewCustomerFormValues) => {
    if (!userDoc?.storeId) {
        toast({ title: "Error", description: "Store ID not found. Cannot add customer.", variant: "destructive" });
        return;
    }
    setIsAddingCustomer(true);
    try {
        const newCustomerId = await addCustomerFirestore(userDoc.storeId, {
            name: data.name,
            email: data.email,
            phone: data.phone,
            notes: data.notes,
        });
        const newCustomer: Customer = {
            id: newCustomerId,
            storeId: userDoc.storeId,
            name: data.name,
            email: data.email || "",
            phone: data.phone || "",
            notes: data.notes || "",
            totalSpent: 0,
            loyaltyPoints: 0,
            createdAt: new Date() as any, // Temporary, will be Firestore Timestamp
            lastUpdatedAt: new Date() as any, // Temporary
        };
        setCustomers(prev => [...prev, newCustomer].sort((a,b) => a.name.localeCompare(b.name)));
        handleSelectCustomer(newCustomer); // Assign new customer and close modal
        toast({ title: "Customer Added", description: `${data.name} has been added and assigned.` });
    } catch (error: any) {
        console.error("Error adding new customer:", error);
        toast({ title: "Add Customer Failed", description: error.message, variant: "destructive" });
    }
    setIsAddingCustomer(false);
  };


  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] max-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] overflow-hidden">
      {/* Left Panel: Product Selection */}
      <div className="flex-grow-[2] p-4 flex flex-col border-r border-border overflow-hidden basis-2/5">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search products, services, or scan barcode..." 
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
          {isLoadingCatalog ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredCatalogItems.length === 0 ? (
             <div className="flex justify-center items-center h-full text-muted-foreground p-10 text-center">
                No items found matching your criteria or inventory/services are empty.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
              {filteredCatalogItems.map(item => {
                const itemIsInCart = isItemInCart(item.id, item.itemType);
                const isOutOfStock = item.itemType === 'product' && item.stockQuantity <= 0;
                return (
                <Card 
                  key={`${item.id}-${item.itemType}`} 
                  className={`cursor-pointer hover:shadow-xl transition-shadow aspect-square flex flex-col items-center justify-center p-2 text-center shadow-md bg-card text-card-foreground relative ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''} ${itemIsInCart ? 'border-2 border-primary' : ''}`}
                  onClick={() => !isOutOfStock && addToCart(item)}
                  role="button"
                  tabIndex={isOutOfStock ? -1 : 0}
                  onKeyDown={(e) => !isOutOfStock && e.key === 'Enter' && addToCart(item)}
                  aria-label={`Add ${item.name} to cart`}
                  aria-disabled={isOutOfStock}
                >
                  {itemIsInCart && <Badge variant="default" className="absolute top-1 right-1 text-xs px-1.5 py-0.5 z-10 bg-primary/80 text-primary-foreground">In Cart</Badge>}
                  {isOutOfStock && <Badge variant="destructive" className="absolute top-1 left-1 text-xs px-1.5 py-0.5 z-10">Out of Stock</Badge>}
                  
                  {item.imageUrl ? (
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      width={60} 
                      height={60} 
                      className="rounded-md mb-2 object-cover" 
                      data-ai-hint={item.itemType === 'service' ? "service icon" : "product item"}
                    />
                  ) : item.itemType === 'service' ? (
                     <ConciergeBell className="h-10 w-10 text-primary mb-2" />
                  ) : (
                    <PackageSearch className="h-10 w-10 text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{item.name}</p>
                  <p className="text-xs text-primary font-semibold">${item.price.toFixed(2)}</p>
                  {item.itemType === 'product' && <p className="text-xs text-muted-foreground">Stock: {(item as Product).stockQuantity}</p>}
                   {item.itemType === 'service' && (item as Service).durationMinutes && <p className="text-xs text-muted-foreground">{(item as Service).durationMinutes} min</p>}
                </Card>
              )})}
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
            <div className="flex items-center gap-1">
                 {lastCartAction && (
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleUndoLastCartAction} className="text-muted-foreground hover:text-foreground" disabled={isProcessingOrSending}>
                                    <Undo2 className="h-5 w-5"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
                                <p>Undo Last Action</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {cartItems.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" disabled={isProcessingOrSending}><Trash2 className="h-5 w-5"/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader> <AlertDialogTitle>Clear Cart?</AlertDialogTitle> <AlertDialogDescription> Are you sure you want to remove all items and any applied promo code from the current order? The assigned customer (if any) will remain. </AlertDialogDescription> </AlertDialogHeader>
                            <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={() => resetTerminalState(false, true)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Clear Cart</AlertDialogAction> </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 -mx-4">
          <div className="px-4 divide-y divide-border">
            {cartItems.map(item => (
              <div key={`${item.productId}-${item.itemType}`} className="py-3 flex items-center gap-3">
                {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint="cart item" />
                ) : item.itemType === 'service' ? (
                    <ConciergeBell className="h-8 w-8 text-primary rounded-md" />
                ) : (
                    <PackageSearch className="h-8 w-8 text-muted-foreground rounded-md" />
                )}
                <div className="flex-grow">
                  <p className="font-medium text-foreground line-clamp-1">{item.name}</p>
                  <div className="flex items-center mt-1 gap-1">
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.itemType!, -1)} disabled={isProcessingOrSending}><MinusCircle className="h-4 w-4"/></Button>
                     <Input 
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setExactQuantity(item.productId, item.itemType!, parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        min="0"
                        className="h-7 w-12 text-sm text-center p-1"
                        aria-label={`Quantity for ${item.name}`}
                        disabled={isProcessingOrSending}
                     />
                     <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.itemType!, 1)} disabled={isProcessingOrSending}><PlusCircle className="h-4 w-4"/></Button>
                     <span className="text-xs text-muted-foreground ml-1">x ${item.price.toFixed(2)}</span>
                  </div>
                </div>
                <p className="font-semibold text-foreground w-20 text-right">${item.totalPrice.toFixed(2)}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-1 text-muted-foreground hover:text-destructive" aria-label={`Remove ${item.name} from cart`} disabled={isProcessingOrSending}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove "{item.name}" from the cart?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeFromCart(item.productId, item.itemType!)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                    <Input id="promo-code" placeholder="Enter code" className="h-10" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value)} disabled={isProcessingOrSending || currentStep !== 'order'}/>
                </div>
                <Button 
                  variant="outline" 
                  className="h-10 shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => toast({ title: "Coming Soon!", description: "Manual discount functionality will be added here."})}
                  disabled={isProcessingOrSending || currentStep !== 'order' || cartItems.length === 0}
                >
                  <Tag className="mr-2 h-4 w-4" /> Add Discount
                </Button>
                <Button onClick={handleApplyOrRemovePromoCode} className="h-10 shrink-0" disabled={promoButtonDisabled || isProcessingOrSending || currentStep !== 'order'}>
                  {promoButtonText}
                </Button>
            </div>
            
            <div className="mb-2">
                <Label className="text-xs text-muted-foreground">Customer</Label>
                {selectedCustomerId && selectedCustomerName ? (
                    <div className="flex items-center justify-between p-2 border rounded-md bg-background h-10">
                        <Button variant="link" className="p-0 h-auto text-sm font-medium text-foreground flex items-center hover:no-underline" onClick={handleOpenCustomerModal} disabled={isProcessingOrSending || currentStep !== 'order'}>
                            <UserCheck className="mr-2 h-4 w-4 text-primary"/>{selectedCustomerName}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleClearCustomer} className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={isProcessingOrSending || currentStep !== 'order'}>
                            <UserX className="h-4 w-4" />
                            <span className="sr-only">Clear customer</span>
                        </Button>
                    </div>
                ) : (
                    <Button variant="outline" className="w-full h-10 justify-start" onClick={handleOpenCustomerModal} disabled={isProcessingOrSending || currentStep !== 'order'}>
                        <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                        Assign Customer
                    </Button>
                )}
            </div>
            
            <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{customerModalView === 'search' ? 'Assign Customer' : 'Add New Customer'}</DialogTitle>
                        <DialogDescription>
                            {customerModalView === 'search' ? 'Search for an existing customer or add a new one.' : 'Enter details for the new customer.'}
                        </DialogDescription>
                    </DialogHeader>

                    {customerModalView === 'search' && (
                        <>
                            <div className="relative mt-2 mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by name, email, phone..." 
                                    className="pl-10"
                                    value={customerSearchTerm}
                                    onChange={(e) => setCustomerSearchTerm(e.target.value)} 
                                />
                            </div>
                            <ScrollArea className="h-[200px] border rounded-md">
                                {filteredCustomersForModal.length > 0 ? (
                                    filteredCustomersForModal.map(customer => (
                                        <div key={customer.id} 
                                             className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                                             onClick={() => handleSelectCustomer(customer)}>
                                            <p className="font-medium text-sm text-foreground">{customer.name}</p>
                                            <p className="text-xs text-muted-foreground">{customer.email || customer.phone || "No contact info"}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-sm text-muted-foreground">
                                        {customerSearchTerm ? "No customers match your search." : "No customers found."}
                                    </p>
                                )}
                            </ScrollArea>
                            <DialogFooter className="sm:justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setCustomerModalView('add')}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Add New Customer
                                </Button>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                            </DialogFooter>
                        </>
                    )}

                    {customerModalView === 'add' && (
                        <Form {...newCustomerForm}>
                            <form onSubmit={newCustomerForm.handleSubmit(onSubmitNewCustomer)} className="space-y-4 pt-2">
                                <FormField control={newCustomerForm.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl><Input placeholder="Customer's full name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={newCustomerForm.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (Optional)</FormLabel>
                                        <FormControl><Input type="email" placeholder="customer@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={newCustomerForm.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone (Optional)</FormLabel>
                                        <FormControl><Input type="tel" placeholder="+15551234567" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={newCustomerForm.control} name="notes" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl><Textarea placeholder="Any relevant notes about the customer..." {...field} rows={2}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <DialogFooter className="sm:justify-between pt-4">
                                     <Button type="button" variant="outline" onClick={() => { setCustomerModalView('search'); newCustomerForm.reset();}}>
                                        Back to Search
                                    </Button>
                                    <Button type="submit" disabled={isAddingCustomer}>
                                        {isAddingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save & Assign Customer
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscountAmount > 0 && appliedPromoCode && (
                    <div className="flex justify-between text-destructive">
                        <span className="text-destructive">Discount ({HARDCODED_PROMO_CODES[appliedPromoCode.toUpperCase()]?.description || appliedPromoCode})</span>
                        <span className="font-medium text-destructive">-${appliedDiscountAmount.toFixed(2)}</span>
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
                <div className="grid grid-cols-1 gap-4 flex-grow content-start">
                    <Button onClick={() => handlePaymentMethodSelect('cash')} className="h-20 text-xl bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600" disabled={cartItems.length === 0 || isProcessingOrSending}>
                        <Wallet className="mr-3 h-8 w-8"/>Cash
                    </Button>
                    <Button onClick={() => handlePaymentMethodSelect('card')} className="h-20 text-xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600" disabled={cartItems.length === 0 || isProcessingOrSending}>
                        <CreditCard className="mr-3 h-8 w-8"/>Card
                    </Button>
                    <Button variant="outline" className="h-16 text-muted-foreground" disabled={cartItems.length === 0 || isProcessingOrSending}>Split Payment (Soon)</Button>
                    <Button variant="outline" className="h-16 text-muted-foreground" disabled={cartItems.length === 0 || isProcessingOrSending}>Other Methods (Soon)</Button>
                </div>
            </>
        )}

        {currentStep === 'payment' && selectedPaymentMethod === 'cash' && (
            <>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('order')} className="mb-4 self-start text-muted-foreground" disabled={isProcessingOrSending}>&larr; Back to Payment Methods</Button>
                <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Cash Payment</h2>
                <Label htmlFor="amount-tendered" className="text-muted-foreground">Amount Tendered</Label>
                <Input 
                    id="amount-tendered" 
                    type="number" 
                    placeholder="0.00" 
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="h-16 text-3xl text-right mb-1" 
                    disabled={isProcessingOrSending}
                />
                 {parseFloat(amountTendered || "0") < total && amountTendered !== "" && (
                    <p className="text-xs text-destructive text-right mb-2">Amount tendered is less than total.</p>
                )}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {quickTenderAmounts.map(amount => (
                        <Button key={amount} variant="outline" className="h-12 text-base" onClick={() => setAmountTendered(amount.toString())} disabled={isProcessingOrSending}>${amount}</Button>
                    ))}
                    <Button variant="outline" className="h-12 text-base" onClick={() => setAmountTendered(total.toFixed(2))} disabled={isProcessingOrSending}>Exact Amount</Button>
                     <Button variant="outline" className="h-12 text-base col-span-2" onClick={() => setAmountTendered("")} disabled={isProcessingOrSending}>Clear</Button>
                </div>
                <div className="text-right text-2xl font-bold my-4 p-3 bg-muted rounded-md">
                    <span className="text-muted-foreground">Change Due: </span>
                    <span className="text-green-600 dark:text-green-500">${changeDue.toFixed(2)}</span>
                </div>
                <Button 
                    onClick={handleProcessPayment} 
                    className="w-full h-16 text-xl mt-auto bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600" 
                    disabled={isProcessingOrSending || parseFloat(amountTendered || "0") < total || amountTendered === ""}
                >
                    {isProcessingOrSending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Process Cash"}
                </Button>
            </>
        )}

        {currentStep === 'payment' && selectedPaymentMethod === 'card' && (
            <>
                 <Button variant="ghost" size="sm" onClick={() => setCurrentStep('order')} className="mb-4 self-start text-muted-foreground" disabled={isProcessingOrSending}>&larr; Back to Payment Methods</Button>
                <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Card Payment</h2>
                <div className="flex flex-col items-center justify-center flex-grow text-center">
                    <CreditCard className="h-24 w-24 text-primary mb-4"/>
                    <p className="text-muted-foreground mb-2">Please use card terminal to complete payment.</p>
                    <p className="text-2xl font-bold text-foreground">Total: ${total.toFixed(2)}</p>
                </div>
                <Button 
                    onClick={handleProcessPayment} 
                    className="w-full h-16 text-xl mt-auto bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600" 
                    disabled={isProcessingOrSending}
                >
                    {isProcessingOrSending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Process Card"}
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
                            disabled={isProcessingOrSending || receiptSent}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-12" onClick={() => handleSimulatedSendReceipt('SMS')} disabled={isProcessingOrSending || receiptSent || !isReceiptRecipientValidPhone || !receiptRecipient}> 
                           {isProcessingOrSending && selectedPaymentMethod === 'cash' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageSquare className="mr-2"/>} Send SMS
                        </Button>
                        <Button variant="outline" className="h-12" onClick={() => handleSimulatedSendReceipt('Email')} disabled={isProcessingOrSending || receiptSent || !isReceiptRecipientValidEmail || !receiptRecipient}> 
                            {isProcessingOrSending && selectedPaymentMethod === 'card' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2"/>} Send Email
                        </Button>
                    </div>
                </div>
                <Button variant="secondary" onClick={handleNoReceipt} className="w-full h-12 text-base mb-3" disabled={isProcessingOrSending || receiptSent}>
                    No Receipt
                </Button>
                <Button onClick={handleFinalizeSale} className="w-full h-16 text-xl mt-auto" disabled={isProcessingOrSending || !receiptSent}>
                    {isProcessingOrSending ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Finalize Sale"}
                </Button>
            </>
        )}
      </div>
    </div>
  );
}

