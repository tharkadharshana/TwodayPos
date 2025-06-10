
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, FileDown, BotMessageSquare, DownloadCloud, UploadCloud, Edit2, History, Trash2, EyeOff, Eye, Loader2 } from "lucide-react"; // Added Trash2, Edit2, History, EyeOff, Eye, Loader2
import type { Product } from "@/types";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { getProductsByStoreId, deleteProduct } from "@/lib/firestoreUtils";
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

function getStockBadgeClasses(quantity: number, lowStockThreshold?: number): string {
  if (quantity === 0) return "bg-destructive text-destructive-foreground";
  if (lowStockThreshold && quantity < lowStockThreshold) return "bg-yellow-500 text-yellow-950 dark:bg-yellow-600 dark:text-yellow-50";
  return "bg-emerald-600 text-white dark:bg-emerald-700 dark:text-emerald-50";
}

function getStockBadgeText(quantity: number, lowStockThreshold?: number): string {
  if (quantity === 0) return "Out of Stock";
  if (lowStockThreshold && quantity < lowStockThreshold) return "Low Stock";
  return "In Stock";
}

const escapeCSVField = (field: any): string => {
  if (field === null || field === undefined) {
    return "";
  }
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const convertToCSV = (data: Product[], headers: string[], isTemplate: boolean = false): string => {
  const headerRow = headers.join(',');
  if (isTemplate) {
    return headerRow;
  }

  const rows = data.map(product => {
    return headers.map(header => {
      let value: any;
      switch (header) {
        case 'tags':
          value = product.tags ? product.tags.join('|') : '';
          break;
        case 'historicalSalesData':
          value = product.historicalSalesData ? JSON.stringify(product.historicalSalesData) : '';
          break;
        case 'createdAt':
        case 'lastUpdatedAt':
          value = (product as any)[header]?.toDate ? (product as any)[header].toDate().toISOString() : (product as any)[header];
          break;
        default:
          value = (product as any)[header];
      }
      return escapeCSVField(value);
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
};

const downloadCSV = (csvString: string, filename: string) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};


export default function InventoryPage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  const csvHeaders = [
    "id", "name", "sku", "barcode", "price", "stockQuantity", "category", 
    "imageUrl", "isVisibleOnPOS", "lowStockThreshold", "description", 
    "supplier", "tags", "salesVelocity", "historicalSalesData", "supplierLeadTimeDays",
    "createdAt", "lastUpdatedAt"
  ];
  const templateHeaders = [
    "name", "sku", "barcode", "price", "stockQuantity", "category", 
    "imageUrl", "isVisibleOnPOS", "lowStockThreshold", "description", 
    "supplier", "tags", "salesVelocity", "historicalSalesData", "supplierLeadTimeDays"
  ];

  const fetchProducts = React.useCallback(async () => {
    if (userDoc?.storeId) {
      setIsLoading(true);
      try {
        const fetchedProducts = await getProductsByStoreId(userDoc.storeId);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({ title: "Error", description: "Could not load products.", variant: "destructive" });
      }
      setIsLoading(false);
    }
  }, [userDoc?.storeId, toast]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (productId: string) => {
    setIsDeleting(productId);
    try {
      await deleteProduct(productId);
      toast({ title: "Success", description: "Product deleted successfully." });
      fetchProducts(); 
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({ title: "Error", description: `Failed to delete product: ${error.message}`, variant: "destructive" });
    }
    setIsDeleting(null);
  };

  const handleExportAll = () => {
    if (products.length === 0) {
      toast({ title: "No Products", description: "There are no products to export.", variant: "default" });
      return;
    }
    const csvString = convertToCSV(products, csvHeaders);
    downloadCSV(csvString, "all_products.csv");
    toast({ title: "Export Successful", description: "All products exported to all_products.csv" });
  };

  const handleExportTemplate = () => {
    const csvString = convertToCSV([], templateHeaders, true); 
    downloadCSV(csvString, "product_import_template.csv");
    toast({ title: "Template Downloaded", description: "Product import template (product_import_template.csv) downloaded." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Selected",
        description: `${file.name} ready for import. Product import processing not yet implemented.`,
      });
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // TODO: Implement CSV parsing and data import logic here for products
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv"
        onChange={handleFileChange}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-foreground">Inventory Management</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="text-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleImportClick}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                <DownloadCloud className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
              <DropdownMenuItem onClick={handleExportAll}>
                <FileDown className="mr-2 h-4 w-4" /> Export All Products
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FileDown className="mr-2 h-4 w-4" /> Export Selected (Soon)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportTemplate}>
                <FileDown className="mr-2 h-4 w-4" /> Export CSV Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/inventory/predictive">
            <Button>
              <BotMessageSquare className="mr-2 h-4 w-4" /> AI Predictions
            </Button>
          </Link>
          <Link href="/inventory/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground">Products List</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your products, stock levels, and details.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search products by name, SKU, category..." 
                className="pl-10 w-full md:w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
                {searchTerm ? "No products match your search." : "No products found. Add your first product!"}
            </div>
          ) : (
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
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden md:table-cell">
                      <Image
                        src={product.imageUrl || "https://placehold.co/40x40.png"}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                        data-ai-hint="product item"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{product.category}</TableCell>
                    <TableCell className="text-right text-foreground">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-foreground">{product.stockQuantity}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={getStockBadgeClasses(product.stockQuantity, product.lowStockThreshold)}>
                        {getStockBadgeText(product.stockQuantity, product.lowStockThreshold)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" disabled={isDeleting === product.id}>
                            {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                          <DropdownMenuItem disabled> {/* TODO: Implement Edit Product Page */}
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled> {/* TODO: Implement Adjust Stock */}
                            <History className="mr-2 h-4 w-4" /> Adjust Stock 
                          </DropdownMenuItem>
                           <DropdownMenuItem disabled> {/* TODO: Implement View Product History */}
                             <Eye className="mr-2 h-4 w-4" /> View History
                           </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()} 
                                className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the product "{product.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  {isDeleting === product.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    
