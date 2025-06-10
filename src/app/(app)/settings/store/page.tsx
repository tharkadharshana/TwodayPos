import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Globe, Phone, MapPin, Save, UploadCloud } from "lucide-react";
import Image from "next/image";

// This would be a client component in a real app to handle form state
export default function StoreSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-text-black">Store Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-text-black">Store Details</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your store&apos;s basic information, branding, and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-text-black">Store Name</Label>
              <Input id="storeName" defaultValue="PerfectPOS Demo Store" className="text-text-black" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeSlogan" className="text-text-black">Slogan/Tagline (Optional)</Label>
              <Input id="storeSlogan" placeholder="e.g., Your favorite neighborhood spot" className="text-text-black" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-text-black">Store Logo</Label>
            <div className="flex items-center gap-4">
              <Image src="https://placehold.co/100x100.png" alt="Store Logo" width={80} height={80} className="rounded-lg border p-1" data-ai-hint="store logo" />
              <Button variant="outline" className="text-text-black hover:bg-accent hover:text-accent-foreground">
                <UploadCloud className="mr-2 h-4 w-4" /> Change Logo
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">Recommended size: 200x200px, PNG or JPG.</p>
          </div>

          <Separator />

          <h3 className="text-lg font-semibold text-text-black">Contact Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="storePhone" className="text-text-black">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="storePhone" type="tel" placeholder="e.g., (555) 123-4567" className="pl-10 text-text-black" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeEmail" className="text-text-black">Public Email</Label>
               <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="storeEmail" type="email" placeholder="e.g., contact@yourstore.com" className="pl-10 text-text-black" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="storeAddress" className="text-text-black">Store Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea id="storeAddress" placeholder="123 Main Street, Anytown, USA 12345" className="pl-10 text-text-black" rows={3} />
            </div>
          </div>
          
          <Separator />

          <h3 className="text-lg font-semibold text-text-black">Additional Settings</h3>
           <div className="flex items-center space-x-2">
            <Checkbox id="showAddressOnReceipt" />
            <Label htmlFor="showAddressOnReceipt" className="text-sm font-normal text-text-black">
              Show store address on digital receipts
            </Label>
          </div>
           <div className="flex items-center space-x-2">
            <Checkbox id="enableOnlineOrderingLink" />
            <Label htmlFor="enableOnlineOrderingLink" className="text-sm font-normal text-text-black">
              Display online ordering link (if applicable)
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="text-text-black">Website URL (Optional)</Label>
            <Input id="websiteUrl" placeholder="https://www.yourstore.com" className="text-text-black" />
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
