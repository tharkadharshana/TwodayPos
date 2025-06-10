
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertCircle, Save, Wifi, WifiOff, Settings2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { updateStoreDetails } from "@/lib/firestoreUtils";
import type { Store } from "@/types";

export default function OfflineSyncSettingsPage() {
  const { toast } = useToast();
  const { user, userDoc, storeDetails, refreshStoreDetails, loading: userContextLoading } = useUser();
  
  const [dataHandlingMode, setDataHandlingMode] = React.useState<Store['dataHandlingMode']>('offlineFriendly');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (storeDetails?.dataHandlingMode) {
      setDataHandlingMode(storeDetails.dataHandlingMode);
    } else if (!userContextLoading && storeDetails === null && userDoc?.storeId) {
      // If storeDetails explicitly null after loading, means an error fetching it or store doesn't exist.
      // We might want to handle this case, but for now, keep default or disable form.
      // Defaulting to 'offlineFriendly' if not set.
      setDataHandlingMode('offlineFriendly');
    }
  }, [storeDetails, userContextLoading, userDoc?.storeId]);

  const handleModeChange = (newMode: Store['dataHandlingMode']) => {
    setDataHandlingMode(newMode);
  };

  const handleSaveChanges = async () => {
    if (!userDoc?.storeId) {
      toast({ title: "Error", description: "Store ID not found. Cannot save settings.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await updateStoreDetails(userDoc.storeId, { dataHandlingMode });
      await refreshStoreDetails(); // Refresh context
      toast({
        title: "Settings Saved",
        description: `Data handling mode set to: ${dataHandlingMode === 'offlineFriendly' ? 'Offline Friendly' : 'Cloud Only (Strict Sync)'}.`,
      });
    } catch (error: any) {
      console.error("Error saving data handling mode:", error);
      toast({ title: "Save Error", description: error.message || "Could not save settings.", variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  if (userContextLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-foreground">Offline & Sync Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground flex items-center">
            <Settings2 className="mr-3 h-6 w-6 text-primary" />
            Data Handling Preferences
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Configure how the application handles data with and without internet connectivity.
            Changes may require an app refresh to take full effect in all areas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className={`space-y-4 p-4 border rounded-lg transition-all ${dataHandlingMode === 'offlineFriendly' ? 'border-primary ring-2 ring-primary bg-primary/5' : 'bg-muted/30 hover:bg-muted/50'}`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="offline-friendly-mode" className="text-lg font-semibold text-foreground flex items-center cursor-pointer" onClick={() => handleModeChange('offlineFriendly')}>
                  <Wifi className="mr-2 h-5 w-5 text-primary" /> Offline Friendly (Recommended)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Leverages Firestore&apos;s built-in offline capabilities. Data is cached locally and syncs automatically
                  when online. This provides a seamless experience even with intermittent connectivity.
                </p>
              </div>
              <Switch
                id="offline-friendly-mode"
                checked={dataHandlingMode === 'offlineFriendly'}
                onCheckedChange={() => handleModeChange('offlineFriendly')}
                aria-label="Toggle Offline Friendly Mode"
              />
            </div>
             <Alert variant="default" className="bg-background">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-medium">How this works:</AlertTitle>
              <AlertDescription className="text-xs">
                PerfectPOS uses Firestore&apos;s robust offline persistence. Data you save is available offline and syncs automatically when you reconnect. The &quot;Sync Status&quot; icon in the sidebar indicates your connection. This is the default and generally recommended mode for best performance and reliability.
              </AlertDescription>
            </Alert>
          </div>

          <div className={`space-y-4 p-4 border rounded-lg transition-all ${dataHandlingMode === 'cloudOnlyStrict' ? 'border-destructive ring-2 ring-destructive bg-destructive/5' : 'bg-muted/30 hover:bg-muted/50'}`}>
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                <Label htmlFor="strict-sync-mode" className="text-lg font-semibold text-foreground flex items-center cursor-pointer" onClick={() => handleModeChange('cloudOnlyStrict')}>
                  <WifiOff className="mr-2 h-5 w-5 text-destructive" /> Cloud Only (Strict Sync)
                </Label>
                <p className="text-sm text-muted-foreground">
                  The application will wait for critical operations (like adding items or finalizing sales)
                  to confirm successful sync with the cloud before proceeding. This ensures data consistency but can make the app feel slower.
                </p>
              </div>
              <Switch
                id="strict-sync-mode"
                checked={dataHandlingMode === 'cloudOnlyStrict'}
                onCheckedChange={() => handleModeChange('cloudOnlyStrict')}
                aria-label="Toggle Strict Sync Enforcement Mode"
              />
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-medium">Important Considerations:</AlertTitle>
              <AlertDescription className="text-xs">
                Enabling strict sync will make the app wait for server confirmation for key actions. This can lead to a slower user experience, especially on unstable connections. Full implementation of UI blocking for *all* operations in this mode is complex; currently, it primarily affects adding new products as a demonstration.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveChanges} disabled={isSaving || userContextLoading || !userDoc?.storeId}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> Save Preferences
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
