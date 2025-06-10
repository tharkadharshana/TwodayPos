"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertCircle, Save, Wifi, WifiOff, Settings2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function OfflineSyncSettingsPage() {
  const { toast } = useToast();
  const [isOfflineFriendly, setIsOfflineFriendly] = React.useState(true); // Default to true as Firestore has it
  const [isStrictSync, setIsStrictSync] = React.useState(false);

  const handleSaveChanges = () => {
    // In a real implementation, these values would be saved to user/store preferences
    // and would trigger changes in application behavior.
    toast({
      title: "Settings Saved (Simulated)",
      description: "Offline & Sync preferences have been noted. Full functionality for these settings requires further implementation.",
    });
    console.log("Offline Friendly Mode:", isOfflineFriendly);
    console.log("Strict Sync Enforcement:", isStrictSync);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Offline & Sync Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <Settings2 className="mr-3 h-6 w-6 text-primary" />
            Connectivity Preferences
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure how the application behaves with and without internet connectivity.
            Note: Full implementation of these settings is a significant task.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="offline-friendly-mode" className="text-lg font-semibold text-foreground flex items-center">
                  <Wifi className="mr-2 h-5 w-5 text-primary" /> Offline Friendly Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Leverages Firestore&apos;s built-in offline capabilities. Data is cached locally (persists across sessions)
                  and automatically syncs with the cloud when online. This is generally recommended.
                </p>
              </div>
              <Switch
                id="offline-friendly-mode"
                checked={isOfflineFriendly}
                onCheckedChange={setIsOfflineFriendly}
                aria-label="Toggle Offline Friendly Mode"
              />
            </div>
             <Alert variant="default" className="bg-background">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-medium">How this currently works:</AlertTitle>
              <AlertDescription className="text-xs">
                PerfectPOS already uses Firestore&apos;s robust offline persistence. Data you save is available offline and syncs automatically when you reconnect. The &quot;Sync Status&quot; icon in the sidebar indicates your connection.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                <Label htmlFor="strict-sync-mode" className="text-lg font-semibold text-foreground flex items-center">
                  <WifiOff className="mr-2 h-5 w-5 text-destructive" /> Strict Sync Enforcement (Experimental)
                </Label>
                <p className="text-sm text-muted-foreground">
                  If enabled, the application will wait for operations (like adding items or finalizing sales)
                  to confirm successful sync with the cloud before proceeding. This can make the app feel slower.
                </p>
              </div>
              <Switch
                id="strict-sync-mode"
                checked={isStrictSync}
                onCheckedChange={setIsStrictSync}
                aria-label="Toggle Strict Sync Enforcement Mode"
              />
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-medium">Caution: Feature Under Development</AlertTitle>
              <AlertDescription className="text-xs">
                Enabling strict sync enforcement is not fully implemented and may significantly change application behavior or lead to perceived slowness.
                It overrides Firestore&apos;s default optimistic updates.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save Preferences (UI Only)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
