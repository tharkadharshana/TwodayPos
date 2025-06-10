
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";

export default function ProductSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Product Settings</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <ShoppingBag className="mr-3 h-6 w-6 text-primary" />
            Product Settings
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage global product settings like categories, variants, and modifiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This feature is currently under development and will be available soon.
            Thank you for your patience!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
