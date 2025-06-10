
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
import { ArrowLeft, Save, Loader2, ConciergeBell } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { addService } from "@/lib/firestoreUtils";
import { useToast } from "@/hooks/use-toast";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required."),
  price: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().positive("Price must be a positive number.")
  ),
  category: z.string().min(1, "Category is required."),
  description: z.string().optional(),
  durationMinutes: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : parseInt(String(val), 10)),
    z.number().int().min(0, "Duration cannot be negative.").optional()
  ),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  isVisibleOnPOS: z.boolean().default(true),
  isBookable: z.boolean().default(false),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function AddServicePage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      price: 0,
      category: "",
      description: "",
      durationMinutes: undefined,
      imageUrl: "",
      isVisibleOnPOS: true,
      isBookable: false,
    },
  });

  const onSubmit = async (data: ServiceFormValues) => {
    if (!userDoc?.storeId) {
      toast({ title: "Error", description: "Store ID not found. Cannot add service.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const serviceData = {
        ...data,
        price: Number(data.price),
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : undefined,
      };
      await addService(userDoc.storeId, serviceData);
      toast({ title: "Success", description: "Service added successfully." });
      router.push("/services"); 
    } catch (error: any) {
      console.error("Error adding service:", error);
      toast({ title: "Error", description: `Failed to add service: ${error.message}`, variant: "destructive" });
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="text-foreground hover:bg-accent hover:text-accent-foreground">
          <Link href="/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-headline tracking-tight text-foreground">
          Add New Service
        </h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-foreground flex items-center">
                <ConciergeBell className="mr-2 h-6 w-6 text-primary" />
                Service Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">Fill in the details for the new service.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Service Name</FormLabel>
                    <FormControl><Input {...field} className="text-foreground" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Duration (Minutes, Optional)</FormLabel>
                      <FormControl><Input type="number" step="1" {...field} value={field.value ?? ""} className="text-foreground" /></FormControl>
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
                    <FormControl><Input {...field} placeholder="e.g., Haircut, Consultation, Repair" className="text-foreground" /></FormControl>
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
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Image URL (Optional)</FormLabel>
                    <FormControl><Input type="url" {...field} placeholder="https://example.com/service-image.png" className="text-foreground" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
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
                            If checked, this service can be directly added to sales.
                        </FormDescription>
                        </div>
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="isBookable"
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
                            Bookable (for future)
                        </FormLabel>
                        <FormDescription>
                            If checked, this service can be booked for appointments.
                        </FormDescription>
                        </div>
                    </FormItem>
                    )}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving || !userDoc?.storeId}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Service
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
