"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Globe, Phone, MapPin, Save, UploadCloud, Percent, Loader2 } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import { getStoreDetails, updateStoreDetails } from "@/lib/firestoreUtils";
import type { Store } from "@/types";
import { useToast } from "@/hooks/use-toast";

const storeSettingsSchema = z.object({
  name: z.string().min(1, "Store name is required."),
  slogan: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email address.").optional().or(z.literal("")),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  taxRate: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0, "Tax rate cannot be negative.").max(1, "Tax rate must be between 0 and 1 (e.g., 0.08 for 8%).")
  ).optional(),
  currency: z.string().length(3, "Currency code must be 3 letters (e.g., USD).").optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  showAddressOnReceipt: z.boolean().optional(),
  enableOnlineOrderingLink: z.boolean().optional(),
});

type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>;

export default function StoreSettingsPage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const [store, setStore] = React.useState<Store | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: "",
      slogan: "",
      logoUrl: "",
      contactPhone: "",
      contactEmail: "",
      address: { street: "", city: "", state: "", zip: "", country: "" },
      taxRate: 0.0,
      currency: "USD",
      websiteUrl: "",
      showAddressOnReceipt: false,
      enableOnlineOrderingLink: false,
    },
  });

  React.useEffect(() => {
    if (userDoc?.storeId) {
      setIsLoading(true);
      getStoreDetails(userDoc.storeId)
        .then((data) => {
          if (data) {
            setStore(data);
            form.reset({
              name: data.name || "",
              slogan: data.slogan || "",
              logoUrl: data.logoUrl || "",
              contactPhone: data.contactPhone || "",
              contactEmail: data.contactEmail || "",
              address: data.address || { street: "", city: "", state: "", zip: "", country: "" },
              taxRate: data.taxRate || 0.0,
              currency: data.currency || "USD",
              websiteUrl: data.websiteUrl || "",
              showAddressOnReceipt: data.showAddressOnReceipt || false,
              enableOnlineOrderingLink: data.enableOnlineOrderingLink || false,
            });
          } else {
             toast({ title: "Error", description: "Store details not found.", variant: "destructive" });
          }
        })
        .catch(error => {
          console.error("Error fetching store details:", error);
          toast({ title: "Error", description: "Could not load store details.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    }
  }, [userDoc?.storeId, form, toast]);

  const onSubmit = async (data: StoreSettingsFormValues) => {
    if (!userDoc?.storeId) {
      toast({ title: "Error", description: "Store ID not found.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await updateStoreDetails(userDoc.storeId, data);
      toast({ title: "Success", description: "Store settings updated successfully." });
      // Optionally re-fetch store details to confirm update though form.reset might be enough
      const updatedStore = await getStoreDetails(userDoc.storeId);
      if (updatedStore) setStore(updatedStore);
    } catch (error) {
      console.error("Error updating store details:", error);
      toast({ title: "Error", description: "Failed to update store settings.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!store && !isLoading) {
    return <div className="text-center py-10 text-muted-foreground">Store details could not be loaded.</div>;
  }


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-text-black">Store Settings</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-text-black">Store Details</CardTitle>
              <CardDescription className="text-muted-foreground">Manage your store&apos;s basic information, branding, and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-black">Store Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="text-text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slogan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-black">Slogan/Tagline (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Your favorite neighborhood spot" {...field} className="text-text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-black">Store Logo URL</FormLabel>
                    <div className="flex items-center gap-4">
                      <Image 
                        src={field.value || "https://placehold.co/100x100.png"} 
                        alt="Store Logo" 
                        width={80} 
                        height={80} 
                        className="rounded-lg border p-1 bg-white object-cover" 
                        data-ai-hint="store logo"
                        onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100.png")}
                      />
                      <div className="flex-grow">
                        <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} className="text-text-black" />
                        </FormControl>
                         <FormDescription className="text-xs mt-1">
                            Enter the full URL of your store logo. Actual upload coming soon.
                        </FormDescription>
                      </div>
                      <Button type="button" variant="outline" className="text-text-black hover:bg-accent hover:text-accent-foreground cursor-not-allowed" disabled>
                        <UploadCloud className="mr-2 h-4 w-4" /> Change Logo
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              

              <Separator />

              <h3 className="text-lg font-semibold text-text-black">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-black">Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="tel" placeholder="e.g., (555) 123-4567" {...field} className="pl-10 text-text-black" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-text-black">Public Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="email" placeholder="e.g., contact@yourstore.com" {...field} className="pl-10 text-text-black" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-text-black">Street Address</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Textarea placeholder="123 Main Street" {...field} className="pl-10 text-text-black" rows={1} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="address.city" render={({ field }) => (
                        <FormItem><FormLabel className="text-text-black">City</FormLabel><FormControl><Input {...field} className="text-text-black"/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="address.state" render={({ field }) => (
                        <FormItem><FormLabel className="text-text-black">State/Province</FormLabel><FormControl><Input {...field} className="text-text-black"/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="address.zip" render={({ field }) => (
                        <FormItem><FormLabel className="text-text-black">ZIP/Postal Code</FormLabel><FormControl><Input {...field} className="text-text-black"/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="address.country" render={({ field }) => (
                    <FormItem><FormLabel className="text-text-black">Country</FormLabel><FormControl><Input {...field} className="text-text-black"/></FormControl><FormMessage /></FormItem>
                )}/>
              
              <Separator />

              <h3 className="text-lg font-semibold text-text-black">Financial Settings</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-text-black">Default Tax Rate</FormLabel>
                        <FormControl>
                            <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" step="0.001" placeholder="e.g., 0.08 for 8%" {...field} 
                                   onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                   className="pl-10 text-text-black" />
                            </div>
                        </FormControl>
                        <FormDescription>Enter as a decimal (e.g., 0.08 for 8%).</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-text-black">Currency Code</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., USD" {...field} className="text-text-black" />
                        </FormControl>
                        <FormDescription>3-letter ISO currency code.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>


              <Separator />
              <h3 className="text-lg font-semibold text-text-black">Additional Settings</h3>
              <FormField
                control={form.control}
                name="showAddressOnReceipt"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-text-black">
                        Show store address on digital receipts
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="enableOnlineOrderingLink"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-text-black">
                        Display online ordering link (if applicable)
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-black">Website URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.yourstore.com" {...field} className="text-text-black" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving || isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
