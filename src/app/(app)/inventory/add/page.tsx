
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Loader2, PackagePlus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { addProduct } from "@/lib/firestoreUtils";
import { useToast } from "@/hooks/use-toast";

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

export default function AddProductPage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const router = useRouter();
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

  const onSubmit = async (data: ProductFormValues) => {
    if (!userDoc?.storeId) {
      toast({ title: "Error", description: "Store ID not found. Cannot add product.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const productData = {
        ...data,
        // Ensure numbers are correctly formatted if they come as strings from form
        price: Number(data.price),
        stockQuantity: Number(data.stockQuantity),
        lowStockThreshold: data.lowStockThreshold ? Number(data.lowStockThreshold) : undefined,
      };
      await addProduct(userDoc.storeId, productData);
      toast({ title: "Success", description: "Product added successfully." });
      router.push("/inventory"); 
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({ title: "Error", description: `Failed to add product: ${error.message}`, variant: "destructive" });
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="text-foreground hover:bg-accent hover:text-accent-foreground">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-headline tracking-tight text-foreground">
          Add New Product
        </h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-foreground flex items-center">
                <PackagePlus className="mr-2 h-6 w-6 text-primary" />
                Product Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">Fill in the details for the new product.</CardDescription>
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
              <Button type="submit" disabled={isSaving || !userDoc?.storeId}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Product
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
