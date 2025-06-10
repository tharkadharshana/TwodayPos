import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, FileText, RotateCcw, FileDown } from "lucide-react";
import type { Transaction } from "@/types";
import { format } from "date-fns";

const mockTransactions: Transaction[] = [
  { id: "TXN001", timestamp: new Date().toISOString(), items: [{ productId: "1", name: "Espresso", quantity: 2, price: 3.00, totalPrice: 6.00 }], subtotal: 6.00, taxAmount: 0.48, discountAmount: 0, totalAmount: 6.48, paymentMethod: "card", cashierId: "user1", storeId: "storeA", status: "completed", customerId: "1" },
  { id: "TXN002", timestamp: new Date(Date.now() - 3600000).toISOString(), items: [{ productId: "2", name: "Latte", quantity: 1, price: 4.50, totalPrice: 4.50 }, { productId: "3", name: "Croissant", quantity: 1, price: 2.50, totalPrice: 2.50 }], subtotal: 7.00, taxAmount: 0.56, discountAmount: 0, totalAmount: 7.56, paymentMethod: "cash", cashierId: "user2", storeId: "storeA", status: "completed" },
  { id: "TXN003", timestamp: new Date(Date.now() - 7200000).toISOString(), items: [{ productId: "4", name: "Muffin", quantity: 1, price: 2.75, totalPrice: 2.75 }], subtotal: 2.75, taxAmount: 0.22, discountAmount: 0, totalAmount: 2.97, paymentMethod: "card", cashierId: "user1", storeId: "storeA", status: "refunded", originalTransactionId: "TXN000" },
];

function getStatusBadgeVariant(status: Transaction['status']): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default"; // Green
    case "refunded": return "destructive"; // Red
    case "partially_refunded": return "secondary"; // Yellow-ish
    case "pending_sync": return "outline"; // Blue-ish or gray
    default: return "outline";
  }
}

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-text-black">Transaction History</h1>
        <Button variant="outline" className="text-text-black hover:bg-accent hover:text-accent-foreground">
          <FileDown className="mr-2 h-4 w-4" /> Export Data
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-text-black">All Transactions</CardTitle>
          <CardDescription className="text-muted-foreground">View detailed historical transaction data.</CardDescription>
          <div className="flex flex-col md:flex-row gap-2 mt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by ID, customer, cashier..." className="pl-10 w-full" />
            </div>
            <Input type="date" placeholder="Date Range" className="w-full md:w-auto" />
            {/* Add more filters for customer, cashier, store, payment method */}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium text-text-black">{transaction.id}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(transaction.timestamp), "PPpp")}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{transaction.customerId || "N/A"}</TableCell>
                  <TableCell className="text-right text-text-black">${transaction.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(transaction.status)}
                           className={
                            transaction.status === 'completed' ? 'bg-green-500 text-white' :
                            transaction.status === 'refunded' ? 'bg-red-500 text-white' :
                            transaction.status === 'partially_refunded' ? 'bg-yellow-400 text-yellow-900' :
                            'bg-blue-500 text-white' // for pending_sync
                           }
                    >
                      {transaction.status.replace("_", " ")}
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
                        {transaction.status === "completed" && (
                          <DropdownMenuItem><RotateCcw className="mr-2 h-4 w-4" /> Start Refund</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
