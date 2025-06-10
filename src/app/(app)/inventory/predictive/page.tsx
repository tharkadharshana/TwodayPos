import { PredictiveStockTool } from "@/components/inventory/predictive-stock-tool";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PredictiveInventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="text-text-black hover:bg-accent hover:text-accent-foreground">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-headline tracking-tight text-text-black">
          AI Predictive Inventory
        </h1>
      </div>
      <p className="text-muted-foreground">
        Leverage AI to monitor product sales, predict stock depletion, and receive smart reorder suggestions.
      </p>
      <PredictiveStockTool />
    </div>
  );
}
