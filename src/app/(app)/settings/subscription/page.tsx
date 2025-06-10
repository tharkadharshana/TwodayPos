
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function SubscriptionSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Subscription</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <Star className="mr-3 h-6 w-6 text-primary" />
            Subscription
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your PerfectPOS subscription plan and billing details.
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
