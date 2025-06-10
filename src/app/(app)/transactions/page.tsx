
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, FileText, RotateCcw, FileDown, Loader2, WifiOff } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getTransactionsByStoreId } from "@/lib/firestoreUtils";
import type { Transaction } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";

function getStatusBadgeVariant(status: Transaction['paymentStatus']): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default"; 
    case "refunded": return "destructive";
    case "partially_refunded": return "secondary";
    case "pending_sync": return "outline"; 
    default: return "outline";
  }
}

function getStatusBadgeClasses(status: Transaction['paymentStatus']): string {
  switch (status) {
    case 'completed': return 'bg-green-500 text-white';
    case 'refunded': return 'bg-red-500 text-white';
    case 'partially_refunded': return 'bg-yellow-400 text-yellow-900';
    case 'pending_sync': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}


export default function TransactionsPage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [offlineError, setOfflineError] = React.useState<string | null>(null);

  const fetchTransactions = React.useCallback(async () => {
    if (userDoc?.storeId) {
      setIsLoading(true);
      setOfflineError(null);
      try {
        const fetchedTransactions = await getTransactionsByStoreId(userDoc.storeId);
        setTransactions(fetchedTransactions);
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        if (error instanceof FirebaseError && (error.code === 'unavailable' || error.message.includes("offline"))) {
          setOfflineError("Cannot load transactions while offline. Please check your connection. Some previously loaded data might be shown if available.");
          // Keep existing transactions if any, so user can see stale data
        } else {
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
        <h1 className="text-3xl font-headline tracking-tight text-text-black">Transaction History</h1>
        <Button variant="outline" className="text-text-black hover:bg-accent hover:text-accent-foreground">
          <FileDown className="mr-2 h-4 w-4" /> Export Data (Soon)
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-text-black">All Transactions</CardTitle>
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
            {/* Date Range Picker can be added here */}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : offlineError ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2">
                <WifiOff className="h-12 w-12 text-destructive" />
                <p className="text-lg font-semibold text-destructive">Offline</p>
                <p>{offlineError}</p>
                <Button onClick={fetchTransactions} variant="outline" className="mt-4 text-text-black hover:bg-accent hover:text-accent-foreground">
                    <RotateCcw className="mr-2 h-4 w-4" /> Retry
                </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                {searchTerm ? "No transactions match your search." : "No transactions found for this store yet."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date & Time</TableHead>
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
                    <TableCell className="font-medium text-text-black">{transaction.transactionDisplayId || transaction.id.substring(0,6)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.timestamp ? format(transaction.timestamp.toDate(), "PPpp") : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{transaction.customerName || "N/A"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{transaction.cashierName || "N/A"}</TableCell>
                    <TableCell className="text-right text-text-black">${transaction.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(transaction.paymentStatus)}
                             className={getStatusBadgeClasses(transaction.paymentStatus)}
                      >
                        {transaction.paymentStatus.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-text-black">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> Resend Receipt</DropdownMenuItem>
                          {transaction.paymentStatus === "completed" && (
                            <DropdownMenuItem><RotateCcw className="mr-2 h-4 w-4" /> Start Refund</DropdownMenuItem>
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
    </div>
  );
}
