import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Search, Trash2, CreditCard, UserPlus, PackageSearch, Filter, ShoppingBasket, Percent } from "lucide-react";
import Image from "next/image";
import type { Product, CartItem } from "@/types";

const mockProducts: Product[] = [
  { id: "1", name: "Espresso", sku: "COF001", price: 3.00, stockQuantity: 100, category: "Drinks", isVisibleOnPOS: true, imageUrl: "https://placehold.co/80x80.png" },
  { id: "2", name: "Latte", sku: "COF002", price: 4.50, stockQuantity: 80, category: "Drinks", isVisibleOnPOS: true, imageUrl: "https://placehold.co/80x80.png" },
  { id: "3", name: "Croissant", sku: "PST001", price: 2.50, stockQuantity: 50, category: "Pastries", isVisibleOnPOS: true, imageUrl: "https://placehold.co/80x80.png" },
  { id: "4", name: "Muffin", sku: "PST002", price: 2.75, stockQuantity: 40, category: "Pastries", isVisibleOnPOS: true, imageUrl: "https://placehold.co/80x80.png" },
  { id: "5", name: "Sandwich", sku: "SND001", price: 6.00, stockQuantity: 30, category: "Food", isVisibleOnPOS: true, imageUrl: "https://placehold.co/80x80.png" },
];

const mockCategories = ["All", "Drinks", "Pastries", "Food", "Merchandise"];

// This would be a client component in a real app
export default function SalesPage() {
  // Mock cart state
  const cartItems: CartItem[] = [
    { productId: "1", name: "Espresso", quantity: 2, price: 3.00, totalPrice: 6.00 },
    { productId: "3", name: "Croissant", quantity: 1, price: 2.50, totalPrice: 2.50 },
  ];
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] max-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))]"> {/* Adjust for header and page padding */}
      {/* Product Selection Area */}
      <div className="flex-grow-[2] p-4 flex flex-col border-r border-border overflow-hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search products or scan barcode..." className="pl-10 h-12 text-lg" />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {mockCategories.map(category => (
              <Button key={category} variant={category === "All" ? "default" : "outline"} size="sm" className="shrink-0 text-text-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent hover:text-accent-foreground">
                {category}
              </Button>
            ))}
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-text-black"><Filter className="h-5 w-5"/></Button>
          </div>
        </div>
        <ScrollArea className="flex-1 -mx-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
            {mockProducts.map(product => (
              <Card key={product.id} className="cursor-pointer hover:shadow-xl transition-shadow aspect-square flex flex-col items-center justify-center p-2 text-center shadow-md">
                <Image src={product.imageUrl!} alt={product.name} width={60} height={60} className="rounded-md mb-2" data-ai-hint="product item" />
                <p className="text-sm font-medium text-text-black leading-tight">{product.name}</p>
                <p className="text-xs text-primary font-semibold">${product.price.toFixed(2)}</p>
              </Card>
            ))}
             <Card className="cursor-pointer hover:shadow-xl transition-shadow aspect-square flex flex-col items-center justify-center p-2 text-center border-dashed border-2 border-muted-foreground/50 hover:border-primary">
                <PackageSearch className="h-10 w-10 text-muted-foreground/70 mb-2"/>
                <p className="text-sm font-medium text-muted-foreground">Custom Item</p>
              </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Cart and Checkout Area */}
      <div className="flex-grow-[1] p-4 flex flex-col bg-card shadow-lg overflow-hidden w-full max-w-md md:max-w-sm lg:max-w-md xl:max-w-lg">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-2xl font-headline flex items-center justify-between text-text-black">
            <div className="flex items-center">
              <ShoppingBasket className="mr-2 h-6 w-6 text-primary"/> Current Order
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-5 w-5"/></Button>
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1 -mx-4">
          <div className="px-4 divide-y divide-border">
            {cartItems.map(item => (
              <div key={item.productId} className="py-3 flex items-center">
                <Image src={mockProducts.find(p => p.id === item.productId)?.imageUrl || "https://placehold.co/40x40.png"} alt={item.name} width={40} height={40} className="rounded-md mr-3" data-ai-hint="cart item" />
                <div className="flex-grow">
                  <p className="font-medium text-text-black">{item.name}</p>
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} x {item.quantity}</p>
                </div>
                <p className="font-semibold text-text-black">${item.totalPrice.toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
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
            <span className="text-muted-foreground">Tax (8%)</span>
            <span className="font-medium text-text-black">${tax.toFixed(2)}</span>
          </div>
           <div className="flex justify-between items-center">
            <Button variant="link" className="p-0 h-auto text-primary text-xs"><Percent className="inline h-3 w-3 mr-1"/>Add Discount</Button>
            <span className="font-medium text-text-black">-$0.00</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span className="text-text-black">Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-14 text-sm text-text-black hover:bg-accent hover:text-accent-foreground">
            <UserPlus className="mr-2 h-5 w-5" /> Assign Customer
          </Button>
          <Button className="h-14 text-sm bg-primary hover:bg-primary/90 text-primary-foreground col-span-2 md:col-span-1">
            <CreditCard className="mr-2 h-5 w-5" /> Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
