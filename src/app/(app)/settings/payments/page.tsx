
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PaymentGatewaysPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Payment Gateways</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <CreditCard className="mr-3 h-6 w-6 text-primary" />
            Payment Gateways
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect and manage your payment processors and hardware.
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
