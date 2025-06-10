
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Percent } from "lucide-react";

export default function TaxSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Tax Settings</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <Percent className="mr-3 h-6 w-6 text-primary" />
            Tax Settings
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure tax rates, rules, and how taxes are applied to sales.
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
