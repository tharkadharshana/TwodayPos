import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflineModeSettingsPage() {
  // This page is effectively replaced by offline-sync. Redirect or provide info.
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Offline Mode (Legacy)</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <WifiOff className="mr-3 h-6 w-6 text-primary" />
            Offline Mode
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Settings for offline capabilities have been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Offline and data synchronization settings are now managed under the new "Offline & Sync" section.
          </p>
          <Button asChild>
            <Link href="/settings/offline-sync">
              Go to Offline & Sync Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
