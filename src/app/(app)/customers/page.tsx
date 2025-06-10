import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, Edit2, History, Award } from "lucide-react";
import type { Customer } from "@/types";

const mockCustomers: Customer[] = [
  { id: "1", name: "Alice Wonderland", email: "alice@example.com", phone: "555-1234", totalSpent: 1250.75, loyaltyPoints: 125, birthday: "1990-05-15" },
  { id: "2", name: "Bob The Builder", email: "bob@example.com", phone: "555-5678", totalSpent: 875.50, loyaltyPoints: 87 },
  { id: "3", name: "Charlie Brown", email: "charlie@example.com", phone: "555-9012", totalSpent: 2300.00, loyaltyPoints: 230, birthday: "1985-10-20" },
  { id: "4", name: "Diana Prince", phone: "555-3456", totalSpent: 550.20, loyaltyPoints: 55 },
];

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-foreground">Customer Management</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground">Customers List</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage customer profiles.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search customers by name, email, or phone..." className="pl-10 w-full md:w-1/3" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] hidden md:table-cell">Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Total Spent</TableHead>
                <TableHead className="text-right">Loyalty Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="hidden md:table-cell">
                    <Avatar>
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${customer.name.charAt(0)}`} alt={customer.name} data-ai-hint="avatar person" />
                      <AvatarFallback>{customer.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    <div>{customer.email || "N/A"}</div>
                    <div>{customer.phone || "N/A"}</div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-foreground">${customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-foreground">{customer.loyaltyPoints}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                        <DropdownMenuItem><Edit2 className="mr-2 h-4 w-4" /> Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem><History className="mr-2 h-4 w-4" /> View Purchase History</DropdownMenuItem>
                        <DropdownMenuItem><Award className="mr-2 h-4 w-4" /> Adjust Loyalty Points</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">Delete Customer</DropdownMenuItem>
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
