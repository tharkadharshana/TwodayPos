import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, FileDown, FileUp, BotMessageSquare } from "lucide-react";
import type { Product } from "@/types";
import Image from "next/image";

const mockProducts: Product[] = [
  { id: "1", name: "Espresso Beans", sku: "EB001", price: 15.99, stockQuantity: 120, category: "Coffee", isVisibleOnPOS: true, lowStockThreshold: 20, imageUrl: "https://placehold.co/40x40.png", salesVelocity: 10, supplierLeadTimeDays: 3 },
  { id: "2", name: "Organic Milk", sku: "MK002", price: 3.49, stockQuantity: 8, category: "Dairy", isVisibleOnPOS: true, lowStockThreshold: 10, imageUrl: "https://placehold.co/40x40.png", salesVelocity: 2, supplierLeadTimeDays: 1 },
  { id: "3", name: "Croissants (Box of 6)", sku: "PS003", price: 8.99, stockQuantity: 0, category: "Pastries", isVisibleOnPOS: true, lowStockThreshold: 5, imageUrl: "https://placehold.co/40x40.png", salesVelocity: 5, supplierLeadTimeDays: 2 },
  { id: "4", name: "Artisan Bread", sku: "BR004", price: 5.20, stockQuantity: 35, category: "Bakery", isVisibleOnPOS: false, lowStockThreshold: 10, imageUrl: "https://placehold.co/40x40.png", salesVelocity: 3, supplierLeadTimeDays: 1 },
];

function getStockBadgeVariant(quantity: number, lowStockThreshold?: number): "default" | "secondary" | "destructive" | "outline" {
  if (quantity === 0) return "destructive";
  if (lowStockThreshold && quantity < lowStockThreshold) return "secondary"; // Using secondary for "low stock" (yellow-ish in some themes)
  return "default"; // "In Stock" (usually primary or green)
}

function getStockBadgeText(quantity: number, lowStockThreshold?: number): string {
  if (quantity === 0) return "Out of Stock";
  if (lowStockThreshold && quantity < lowStockThreshold) return "Low Stock";
  return "In Stock";
}


export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-text-black">Inventory Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-text-black hover:bg-accent hover:text-accent-foreground">
            <FileUp className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button variant="outline" className="text-text-black hover:bg-accent hover:text-accent-foreground">
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Link href="/inventory/predictive">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <BotMessageSquare className="mr-2 h-4 w-4" /> AI Predictions
            </Button>
          </Link>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-text-black">Products List</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your products, stock levels, and details.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-10 w-full md:w-1/3" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden md:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden md:table-cell">
                    <Image
                      src={product.imageUrl || "https://placehold.co/40x40.png"}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md"
                      data-ai-hint="product image"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-text-black">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="text-right text-text-black">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-text-black">{product.stockQuantity}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={getStockBadgeVariant(product.stockQuantity, product.lowStockThreshold)}
                           className={
                            product.stockQuantity === 0 ? 'bg-destructive text-destructive-foreground' : 
                            (product.lowStockThreshold && product.stockQuantity < product.lowStockThreshold) ? 'bg-yellow-400 text-yellow-900' : 
                            'bg-green-500 text-white'
                           }>
                      {getStockBadgeText(product.stockQuantity, product.lowStockThreshold)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-text-black">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                        <DropdownMenuItem>Edit Product</DropdownMenuItem>
                        <DropdownMenuItem>Adjust Stock</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
