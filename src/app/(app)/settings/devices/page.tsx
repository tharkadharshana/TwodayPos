
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HardDrive } from "lucide-react";

export default function DevicesSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Devices</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <HardDrive className="mr-3 h-6 w-6 text-primary" />
            Devices
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage connected POS devices, printers, and payment terminals.
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
