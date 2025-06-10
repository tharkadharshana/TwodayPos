import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, Save, UploadCloud, MessageSquare, Mail, Settings2 } from "lucide-react";
import Image from "next/image";

// This would be a client component in a real app
export default function ReceiptSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-text-black">Digital Receipt Settings</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Settings Form Column */}
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-text-black">Receipt Customization</CardTitle>
              <CardDescription className="text-muted-foreground">Personalize the appearance and content of your digital receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-text-black">Receipt Logo</Label>
                <div className="flex items-center gap-4">
                  <Image src="https://placehold.co/100x100.png" alt="Receipt Logo" width={60} height={60} className="rounded-md border p-1 bg-white" data-ai-hint="company logo" />
                  <Button variant="outline" className="text-text-black hover:bg-accent hover:text-accent-foreground">
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload New Logo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Max file size 2MB. Recommended: PNG with transparent background.</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="receiptHeader" className="text-text-black">Header Message (Optional)</Label>
                <Input id="receiptHeader" placeholder="e.g., Thank you for your purchase!" className="text-text-black" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptFooter" className="text-text-black">Footer Message (Optional)</Label>
                <Textarea id="receiptFooter" placeholder="e.g., Follow us on social media! Return policy details." className="text-text-black" rows={3}/>
              </div>
              
              <Separator />

              <h3 className="text-lg font-semibold text-text-black">Information to Display</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="showStoreName" defaultChecked />
                  <Label htmlFor="showStoreName" className="text-sm font-normal text-text-black">Store Name</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="showStoreAddress" defaultChecked />
                  <Label htmlFor="showStoreAddress" className="text-sm font-normal text-text-black">Store Address</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="showStorePhone" />
                  <Label htmlFor="showStorePhone" className="text-sm font-normal text-text-black">Store Phone</Label>
                </div>
                 <div className="flex items-center space-x-2">
                  <Checkbox id="showCashierName" />
                  <Label htmlFor="showCashierName" className="text-sm font-normal text-text-black">Cashier Name</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="showTransactionTime" defaultChecked />
                  <Label htmlFor="showTransactionTime" className="text-sm font-normal text-text-black">Transaction Time</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="showLoyaltyPoints" />
                  <Label htmlFor="showLoyaltyPoints" className="text-sm font-normal text-text-black">Loyalty Points Earned/Balance</Label>
                </div>
              </div>

              <Separator />
               <h3 className="text-lg font-semibold text-text-black">Delivery Channels</h3>
                <CardDescription className="text-muted-foreground -mt-2 mb-2">Configure default messaging for SMS and Email receipts.</CardDescription>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="smsDefaultMessage" className="text-text-black flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-primary"/>Default SMS Message</Label>
                        <Textarea id="smsDefaultMessage" defaultValue="Your receipt from {StoreName}: {ReceiptLink}" className="text-text-black" rows={2}/>
                        <p className="text-xs text-muted-foreground">Use placeholders like {"{StoreName}"}, {"{ReceiptLink}"}, {"{OrderNumber}"}.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="emailSubject" className="text-text-black flex items-center"><Mail className="w-4 h-4 mr-2 text-primary"/>Default Email Subject</Label>
                        <Input id="emailSubject" defaultValue="Your Receipt from {StoreName} (Order #{OrderNumber})" className="text-text-black"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="emailBody" className="text-text-black flex items-center"><Mail className="w-4 h-4 mr-2 text-primary"/>Default Email Body Prefix</Label>
                        <Textarea id="emailBody" defaultValue="Thank you for your order! You can view your receipt here: {ReceiptLink}" className="text-text-black" rows={3}/>
                         <p className="text-xs text-muted-foreground">The actual receipt details will be appended after this text.</p>
                    </div>
                </div>


              <div className="flex justify-end pt-4">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="mr-2 h-4 w-4" /> Save Receipt Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Receipt Preview Column */}
        <div className="md:col-span-1">
          <Card className="shadow-lg sticky top-24"> {/* Sticky for preview */}
            <CardHeader>
              <CardTitle className="text-xl font-headline text-text-black flex items-center"><Eye className="mr-2 h-5 w-5 text-primary"/>Receipt Preview</CardTitle>
              <CardDescription className="text-muted-foreground">This is an approximate preview of your digital receipt.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white shadow-inner max-h-[600px] overflow-y-auto">
                <div className="text-center mb-4">
                  <Image src="https://placehold.co/80x80.png" alt="Preview Logo" width={60} height={60} className="mx-auto rounded-md mb-2" data-ai-hint="company logo"/>
                  <h2 className="text-lg font-semibold text-gray-800">PerfectPOS Demo Store</h2>
                  <p className="text-xs text-gray-500">Thank you for your purchase!</p>
                </div>
                <div className="text-xs text-gray-700 space-y-1 mb-3">
                  <p>123 Main Street, Anytown, USA 12345</p>
                  <p>Order #123456</p>
                  <p>Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                  <p>Cashier: Jane Doe</p>
                </div>
                <Separator className="my-2"/>
                <div className="space-y-1 text-xs text-gray-800">
                  <div className="flex justify-between"><span>Espresso (2)</span><span>$6.00</span></div>
                  <div className="flex justify-between"><span>Croissant (1)</span><span>$2.50</span></div>
                </div>
                <Separator className="my-2"/>
                <div className="space-y-1 text-xs text-gray-800">
                  <div className="flex justify-between"><span>Subtotal</span><span>$8.50</span></div>
                  <div className="flex justify-between"><span>Tax (8%)</span><span>$0.68</span></div>
                  <div className="flex justify-between font-semibold text-sm"><span>Total</span><span>$9.18</span></div>
                </div>
                <Separator className="my-2"/>
                 <div className="text-center text-xs text-gray-500 mt-3">
                  <p>Follow us on social media! Return policy details.</p>
                </div>
              </div>
            </CardContent>
             <CardFooter>
                <Button variant="outline" className="w-full text-text-black hover:bg-accent hover:text-accent-foreground">
                  <Settings2 className="mr-2 h-4 w-4" /> Send Test Receipt
                </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
