
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MoreHorizontal, Search, FileText, RotateCcw, FileDown, Loader2, WifiOff, Send, HelpCircle, ReceiptText } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getTransactionsByStoreId } from "@/lib/firestoreUtils";
import type { Transaction, TransactionItem } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

function getStatusBadgeClasses(status: Transaction['paymentStatus']): string {
  switch (status) {
    case 'completed': return 'bg-emerald-600 text-white dark:bg-emerald-700 dark:text-emerald-50';
    case 'refunded': return 'bg-destructive text-destructive-foreground';
    case 'partially_refunded': return 'bg-yellow-500 text-yellow-950 dark:bg-yellow-600 dark:text-yellow-50';
    case 'pending_sync': return 'bg-sky-600 text-white dark:bg-sky-700 dark:text-sky-100';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function TransactionsPage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

  const fetchTransactions = React.useCallback(async () => {
    if (userDoc?.storeId) {
      setIsLoading(true);
      setFetchError(null);
      try {
        const fetchedTransactions = await getTransactionsByStoreId(userDoc.storeId);
        setTransactions(fetchedTransactions);
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        if (error instanceof FirebaseError && (error.code === 'unavailable' || error.message.toLowerCase().includes("offline") || error.message.toLowerCase().includes("network error"))) {
          setFetchError("You appear to be offline. Transaction data could not be loaded from the server. Previously loaded data might be shown if available, or the list might be empty.");
          toast({ 
            title: "Offline Mode", 
            description: "Cannot fetch latest transactions. Displaying cached data if available.", 
            variant: "default",
            duration: 5000
          });
        } else {
          setFetchError("An error occurred while fetching transactions. Please try again.");
          toast({ title: "Error", description: "Could not load transactions.", variant: "destructive" });
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [userDoc?.storeId, toast]);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  const handleResendReceipt = () => {
    if (!selectedTransaction || !selectedTransaction.receiptRecipient) {
        toast({ title: "Cannot Resend", description: "No recipient information available for this transaction.", variant: "default" });
        return;
    }
    toast({ title: "Resend Receipt (Simulated)", description: `Receipt resent to ${selectedTransaction.receiptRecipient} via ${selectedTransaction.receiptChannel || "original channel"}.` });
  };

  const handleStartRefund = () => {
     if (!selectedTransaction) return;
    toast({ title: "Start Refund (Coming Soon)", description: `Refund process for transaction ${selectedTransaction.transactionDisplayId || selectedTransaction.id.substring(0,6)} will be implemented here.` });
  };


  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.transactionDisplayId?.toLowerCase().includes(searchLower) ||
      transaction.customerName?.toLowerCase().includes(searchLower) ||
      transaction.cashierName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-foreground">Transaction History</h1>
        <Button variant="outline" className="text-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => toast({title: "Coming Soon!", description:"CSV export will be available here."})}>
          <FileDown className="mr-2 h-4 w-4" /> Export Data (Soon)
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground">All Transactions</CardTitle>
          <CardDescription className="text-muted-foreground">View detailed historical transaction data.</CardDescription>
          <div className="flex flex-col md:flex-row gap-2 mt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by ID, customer, cashier..." 
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : fetchError ? (
            <Alert variant={fetchError.toLowerCase().includes("offline") ? "default" : "destructive"} className="my-4">
                <WifiOff className="h-5 w-5" />
                <AlertTitle>{fetchError.toLowerCase().includes("offline") ? "Offline Notice" : "Loading Error"}</AlertTitle>
                <AlertDescription>
                    {fetchError}
                     {fetchError.toLowerCase().includes("offline") && transactions.length > 0 && " Displaying previously loaded data."}
                     {!fetchError.toLowerCase().includes("offline") && " Please check your internet connection or try again later."}
                </AlertDescription>
                <Button onClick={fetchTransactions} variant="outline" size="sm" className="mt-4 text-foreground hover:bg-accent hover:text-accent-foreground">
                    <RotateCcw className="mr-2 h-4 w-4" /> Retry
                </Button>
            </Alert>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                {searchTerm ? "No transactions match your search." : "No transactions found for this store yet."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Cashier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-foreground">{transaction.transactionDisplayId || transaction.id.substring(0,6)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.timestamp ? format(transaction.timestamp.toDate(), "PPpp") : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{transaction.customerName || "N/A"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{transaction.cashierName || "N/A"}</TableCell>
                    <TableCell className="text-right text-foreground">${transaction.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClasses(transaction.paymentStatus)}>
                        {transaction.paymentStatus.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                          <DropdownMenuItem onClick={() => handleViewDetails(transaction)}><ReceiptText className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={handleResendReceipt} disabled={!selectedTransaction || !selectedTransaction.digitalReceiptSent}>
                            <Send className="mr-2 h-4 w-4" /> Resend Receipt
                          </DropdownMenuItem>
                          {transaction.paymentStatus === "completed" && (
                            <DropdownMenuItem onClick={handleStartRefund}><RotateCcw className="mr-2 h-4 w-4" /> Start Refund</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedTransaction && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <ReceiptText className="mr-2 h-6 w-6 text-primary"/>
                Transaction Details: {selectedTransaction.transactionDisplayId || selectedTransaction.id.substring(0,6)}
              </DialogTitle>
              <DialogDescription>
                {selectedTransaction.timestamp ? format(selectedTransaction.timestamp.toDate(), "EEEE, MMMM dd, yyyy 'at' hh:mm:ss a") : 'Date not available'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="font-semibold text-foreground">Customer:</span> <span className="text-muted-foreground">{selectedTransaction.customerName || "N/A"}</span></div>
                <div><span className="font-semibold text-foreground">Cashier:</span> <span className="text-muted-foreground">{selectedTransaction.cashierName || "N/A"}</span></div>
              </div>

              <Separator />
              <h4 className="font-semibold text-foreground">Items:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTransaction.items.map((item: TransactionItem, index: number) => (
                    <TableRow key={`${item.itemId}-${index}`}>
                      <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{item.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-foreground">${item.totalPrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <Separator />

              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mt-2">
                 <div><span className="font-semibold text-foreground">Subtotal:</span></div>
                 <div className="text-right text-foreground">${selectedTransaction.subtotal.toFixed(2)}</div>

                {selectedTransaction.discountAmount > 0 && (
                  <>
                    <div><span className="font-semibold text-destructive">Discount Applied{selectedTransaction.promoCode ? ` (${selectedTransaction.promoCode})` : ''}:</span></div>
                    <div className="text-right text-destructive">-${selectedTransaction.discountAmount.toFixed(2)}</div>
                  </>
                )}

                <div><span className="font-semibold text-foreground">Tax Amount:</span></div>
                <div className="text-right text-foreground">${selectedTransaction.taxAmount.toFixed(2)}</div>
                
                <Separator className="col-span-2 my-1"/>

                <div><span className="font-bold text-lg text-foreground">Total Paid:</span></div>
                <div className="text-right font-bold text-lg text-primary">${selectedTransaction.totalAmount.toFixed(2)}</div>
              </div>
              
              <Separator />

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><span className="font-semibold text-foreground">Payment Method:</span> <span className="text-muted-foreground capitalize">{selectedTransaction.paymentMethod}</span></div>
                <div>
                    <span className="font-semibold text-foreground">Status:</span>
                    <Badge className={`ml-2 ${getStatusBadgeClasses(selectedTransaction.paymentStatus)}`}>
                        {selectedTransaction.paymentStatus.replace(/_/g, " ")}
                    </Badge>
                </div>
                {selectedTransaction.digitalReceiptSent && (
                     <div><span className="font-semibold text-foreground">Receipt Sent:</span> <span className="text-muted-foreground">{selectedTransaction.receiptChannel || 'Yes'} to {selectedTransaction.receiptRecipient || 'Customer'}</span></div>
                )}
                {!selectedTransaction.digitalReceiptSent && (
                     <div><span className="font-semibold text-foreground">Receipt:</span> <span className="text-muted-foreground">Not sent or opted out</span></div>
                )}
                {selectedTransaction.notes && (
                     <div className="col-span-2"><span className="font-semibold text-foreground">Notes:</span> <span className="text-muted-foreground">{selectedTransaction.notes}</span></div>
                )}
                 {selectedTransaction.offlineProcessed && (
                     <div className="col-span-2"><span className="font-semibold text-foreground">Processing:</span> <span className="text-muted-foreground">Transaction was processed offline {selectedTransaction.syncedAt ? `(Synced: ${format(selectedTransaction.syncedAt.toDate(), 'PPp')})` : '(Pending Sync)'}</span></div>
                )}
              </div>

            </div>
            </ScrollArea>
            <DialogFooter className="sm:justify-between pt-4">
              <div>
                <Button variant="outline" onClick={handleResendReceipt} disabled={!selectedTransaction.digitalReceiptSent || !selectedTransaction.receiptRecipient} className="text-foreground hover:bg-accent hover:text-accent-foreground">
                    <Send className="mr-2 h-4 w-4"/>Resend Receipt
                </Button>
                {selectedTransaction.paymentStatus === 'completed' && (
                    <Button variant="outline" onClick={handleStartRefund} className="ml-2 text-foreground hover:bg-accent hover:text-accent-foreground">
                        <RotateCcw className="mr-2 h-4 w-4"/>Start Refund
                    </Button>
                )}
              </div>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
