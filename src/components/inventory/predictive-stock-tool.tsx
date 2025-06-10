"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { predictStockOuts, type PredictStockOutsInput, type PredictStockOutsOutput } from "@/ai/flows/predict-stock-outs";
import { getSmartReorderSuggestions, type SmartReorderSuggestionsInput, type SmartReorderSuggestionsOutput } from "@/ai/flows/smart-reorder-suggestions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2 } from "lucide-react";

// Mock product data for selection
const mockProductsForAI = [
  { id: "1", name: "Espresso Beans", currentStock: 120, salesVelocity: 10, supplierLeadTimeDays: 3, historicalSalesData: JSON.stringify({"Mon":10, "Tue":12, "Wed":8}) },
  { id: "2", name: "Organic Milk", currentStock: 8, salesVelocity: 2, supplierLeadTimeDays: 1, historicalSalesData: JSON.stringify({"Mon":2, "Tue":3, "Wed":1}) },
  { id: "3", name: "Croissants (Box of 6)", currentStock: 0, salesVelocity: 5, supplierLeadTimeDays: 2, historicalSalesData: JSON.stringify({"Mon":5, "Tue":6, "Wed":4}) },
];

const stockOutFormSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  // Fields will be auto-filled based on productId selection
});

const reorderFormSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  timeFrame: z.enum(['daily', 'weekly', 'monthly']),
  // Other fields auto-filled
});


export function PredictiveStockTool() {
  const { toast } = useToast();
  const [stockOutLoading, setStockOutLoading] = React.useState(false);
  const [reorderLoading, setReorderLoading] = React.useState(false);
  const [stockOutResult, setStockOutResult] = React.useState<PredictStockOutsOutput | null>(null);
  const [reorderResult, setReorderResult] = React.useState<SmartReorderSuggestionsOutput | null>(null);

  const [selectedProductForStockOut, setSelectedProductForStockOut] = React.useState<typeof mockProductsForAI[0] | null>(null);
  const [selectedProductForReorder, setSelectedProductForReorder] = React.useState<typeof mockProductsForAI[0] | null>(null);

  const stockOutForm = useForm<z.infer<typeof stockOutFormSchema>>({
    resolver: zodResolver(stockOutFormSchema),
    defaultValues: { productId: "" },
  });

  const reorderForm = useForm<z.infer<typeof reorderFormSchema>>({
    resolver: zodResolver(reorderFormSchema),
    defaultValues: { productId: "", timeFrame: "daily" },
  });

  const handleStockOutProductChange = (productId: string) => {
    stockOutForm.setValue("productId", productId);
    const product = mockProductsForAI.find(p => p.id === productId);
    setSelectedProductForStockOut(product || null);
  };
  
  const handleReorderProductChange = (productId: string) => {
    reorderForm.setValue("productId", productId);
    const product = mockProductsForAI.find(p => p.id === productId);
    setSelectedProductForReorder(product || null);
  };


  async function onStockOutSubmit() {
    if (!selectedProductForStockOut) {
      toast({ title: "Error", description: "Please select a product.", variant: "destructive" });
      return;
    }
    setStockOutLoading(true);
    setStockOutResult(null);
    try {
      const input: PredictStockOutsInput = {
        productName: selectedProductForStockOut.name,
        salesVelocity: selectedProductForStockOut.salesVelocity,
        currentStock: selectedProductForStockOut.currentStock,
        historicalTrends: "Standard sales with slight weekend peaks.", // Mocked
        supplierLeadTime: selectedProductForStockOut.supplierLeadTimeDays,
      };
      const result = await predictStockOuts(input);
      setStockOutResult(result);
      toast({ title: "Prediction Complete", description: `Stock-out predicted for ${selectedProductForStockOut.name}.` });
    } catch (error) {
      console.error("Stock-out prediction error:", error);
      toast({ title: "Error", description: "Failed to predict stock-out.", variant: "destructive" });
    }
    setStockOutLoading(false);
  }

  async function onReorderSubmit(data: z.infer<typeof reorderFormSchema>) {
    if (!selectedProductForReorder) {
      toast({ title: "Error", description: "Please select a product.", variant: "destructive" });
      return;
    }
    setReorderLoading(true);
    setReorderResult(null);
    try {
      const input: SmartReorderSuggestionsInput = {
        productId: selectedProductForReorder.id,
        productName: selectedProductForReorder.name,
        currentStock: selectedProductForReorder.currentStock,
        salesVelocity: selectedProductForReorder.salesVelocity, // Assuming this is daily for now, adjust if necessary
        historicalSalesData: selectedProductForReorder.historicalSalesData,
        timeFrame: data.timeFrame,
        supplierLeadTimeDays: selectedProductForReorder.supplierLeadTimeDays,
      };
      const result = await getSmartReorderSuggestions(input);
      setReorderResult(result);
      toast({ title: "Suggestion Ready", description: `Reorder suggestion generated for ${selectedProductForReorder.name}.` });
    } catch (error) {
      console.error("Reorder suggestion error:", error);
      toast({ title: "Error", description: "Failed to get reorder suggestion.", variant: "destructive" });
    }
    setReorderLoading(false);
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-text-black">Predict Stock-Outs</CardTitle>
          <CardDescription className="text-muted-foreground">Select a product to predict when it might run out of stock.</CardDescription>
        </CardHeader>
        <Form {...stockOutForm}>
          <form onSubmit={stockOutForm.handleSubmit(onStockOutSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={stockOutForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-black">Product</FormLabel>
                    <Select onValueChange={handleStockOutProductChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockProductsForAI.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedProductForStockOut && (
                <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
                  <p><strong className="text-text-black">Current Stock:</strong> {selectedProductForStockOut.currentStock}</p>
                  <p><strong className="text-text-black">Sales Velocity (daily):</strong> {selectedProductForStockOut.salesVelocity}</p>
                  <p><strong className="text-text-black">Lead Time:</strong> {selectedProductForStockOut.supplierLeadTimeDays} days</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={stockOutLoading || !selectedProductForStockOut} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {stockOutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Wand2 className="mr-2 h-4 w-4" /> Predict Stock-Out
              </Button>
            </CardFooter>
          </form>
        </Form>
        {stockOutResult && (
          <CardContent className="mt-4 border-t pt-4">
            <h4 className="font-semibold text-text-black mb-2">Prediction Result:</h4>
            <p className="text-sm text-text-black"><strong>Stock-Out Prediction:</strong> {stockOutResult.stockOutPrediction}</p>
            <p className="text-sm text-text-black mt-1"><strong>Reorder Suggestion:</strong> {stockOutResult.reorderSuggestion}</p>
          </CardContent>
        )}
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-text-black">Smart Reorder Suggestions</CardTitle>
          <CardDescription className="text-muted-foreground">Get AI-powered suggestions for reordering products.</CardDescription>
        </CardHeader>
        <Form {...reorderForm}>
          <form onSubmit={reorderForm.handleSubmit(onReorderSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={reorderForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-black">Product</FormLabel>
                    <Select onValueChange={handleReorderProductChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockProductsForAI.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={reorderForm.control}
                name="timeFrame"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-black">Sales Velocity Time Frame</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time frame" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {selectedProductForReorder && (
                <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
                  <p><strong className="text-text-black">Current Stock:</strong> {selectedProductForReorder.currentStock}</p>
                  <p><strong className="text-text-black">Sales Velocity (current unit):</strong> {selectedProductForReorder.salesVelocity}</p>
                  <p><strong className="text-text-black">Lead Time:</strong> {selectedProductForReorder.supplierLeadTimeDays} days</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={reorderLoading || !selectedProductForReorder} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {reorderLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Wand2 className="mr-2 h-4 w-4" /> Get Reorder Suggestion
              </Button>
            </CardFooter>
          </form>
        </Form>
        {reorderResult && (
          <CardContent className="mt-4 border-t pt-4">
            <h4 className="font-semibold text-text-black mb-2">Suggestion Result:</h4>
            <p className="text-sm text-text-black"><strong>Suggested Reorder Quantity:</strong> {reorderResult.reorderQuantity}</p>
            <p className="text-sm text-text-black mt-1"><strong>Low Stock Alert:</strong> {reorderResult.lowStockAlert ? "Yes" : "No"}</p>
            <p className="text-sm text-text-black mt-1"><strong>Reasoning:</strong> {reorderResult.reasoning}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
