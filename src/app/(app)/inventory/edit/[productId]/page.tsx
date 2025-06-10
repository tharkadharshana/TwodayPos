
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Loader2, PackageSearch, PackageOpen } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getProductById, updateProduct } from "@/lib/firestoreUtils";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  sku: z.string().min(1, "SKU is required."),
  price: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive("Price must be a positive number.")
  ),
  stockQuantity: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int().min(0, "Stock quantity cannot be negative.")
  ),
  category: z.string().min(1, "Category is required."),
  description: z.string().optional(),
  lowStockThreshold: z.preprocess(
    (val) => (val === "" ? undefined : parseInt(String(val), 10)),
    z.number().int().min(0, "Low stock threshold cannot be negative.").optional()
  ),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  supplier: z.string().optional(),
  barcode: z.string().optional(),
  isVisibleOnPOS: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function EditProductPage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [isLoadingProduct, setIsLoadingProduct] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      stockQuantity: 0,
      category: "",
      description: "",
      lowStockThreshold: undefined,
      imageUrl: "",
      supplier: "",
      barcode: "",
      isVisibleOnPOS: true,
    },
  });

  React.useEffect(() => {
    if (productId) {
      setIsLoadingProduct(true);
      getProductById(productId)
        .then((product) => {
          if (product) {
            form.reset({
              name: product.name,
              sku: product.sku,
              price: product.price,
              stockQuantity: product.stockQuantity,
              category: product.category,
              description: product.description || "",
              lowStockThreshold: product.lowStockThreshold === undefined || product.lowStockThreshold === null ? undefined : product.lowStockThreshold,
              imageUrl: product.imageUrl || "",
              supplier: product.supplier || "",
              barcode: product.barcode || "",
              isVisibleOnPOS: product.isVisibleOnPOS,
            });
          } else {
            toast({ title: "Error", description: "Product not found.", variant: "destructive" });
            router.push("/inventory");
          }
        })
        .catch((error) => {
          console.error("Error fetching product:", error);
          toast({ title: "Error", description: "Failed to load product details.", variant: "destructive" });
          router.push("/inventory");
        })
        .finally(() => setIsLoadingProduct(false));
    }
  }, [productId, form, router, toast]);

  const onSubmit = async (data: ProductFormValues) => {
    if (!userDoc?.storeId) {
      toast({ title: "Error", description: "Store ID not found. Cannot update product.", variant: "destructive" });
      return;
    }
    if (!productId) {
      toast({ title: "Error", description: "Product ID missing. Cannot update.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const productDataToUpdate: Partial<Product> = {
        ...data,
        price: Number(data.price),
        stockQuantity: Number(data.stockQuantity),
        lowStockThreshold: data.lowStockThreshold ? Number(data.lowStockThreshold) : undefined,
      };
      await updateProduct(productId, productDataToUpdate);
      toast({ title: "Success", description: "Product updated successfully." });
      router.push("/inventory"); 
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({ title: "Error", description: `Failed to update product: ${error.message}`, variant: "destructive" });
    }
    setIsSaving(false);
  };

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="text-foreground hover:bg-accent hover:text-accent-foreground">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-headline tracking-tight text-foreground">
          Edit Product
        </h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-foreground flex items-center">
                <PackageOpen className="mr-2 h-6 w-6 text-primary" />
                Product Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">Modify the details for this product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Product Name</FormLabel>
                      <FormControl><Input {...field} className="text-foreground" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">SKU (Stock Keeping Unit)</FormLabel>
                      <FormControl><Input {...field} className="text-foreground" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Price</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} className="text-foreground" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Stock Quantity</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} className="text-foreground" /></FormControl>
                      <FormDescription>For stock adjustments (receiving, counting), use the "Adjust Stock" feature on the inventory list.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Category</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Coffee, Pastries, Merchandise" className="text-foreground" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Description (Optional)</FormLabel>
                    <FormControl><Textarea {...field} className="text-foreground" rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Low Stock Threshold (Optional)</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} value={field.value ?? ""} className="text-foreground" /></FormControl>
                      <FormDescription>Notify when stock drops to this level.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Image URL (Optional)</FormLabel>
                      <FormControl><Input type="url" {...field} placeholder="https://example.com/image.png" className="text-foreground" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Supplier (Optional)</FormLabel>
                      <FormControl><Input {...field} className="text-foreground" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Barcode/UPC (Optional)</FormLabel>
                      <FormControl><Input {...field} className="text-foreground" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isVisibleOnPOS"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-foreground">
                        Visible on POS
                      </FormLabel>
                      <FormDescription>
                        If checked, this product will appear in the sales interface.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving || isLoadingProduct || !userDoc?.storeId}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
