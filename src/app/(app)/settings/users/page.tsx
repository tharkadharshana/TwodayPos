
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Users, PlusCircle, Loader2, ShieldCheck, UserCog, UserX, UserCheck, Send, UserRoundCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";
import { getUsersByStoreId, updateUserRole, updateUserStatus } from "@/lib/firestoreUtils";
import type { UserDocument, UserRole } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

const roleDisplayNames: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  cashier: "Cashier",
};

const availableRoles: UserRole[] = ["admin", "manager", "cashier"];

export default function UserManagementPage() {
  const { user: currentUser, userDoc: currentUserDoc, storeId } = useUser();
  const { toast } = useToast();

  const [usersList, setUsersList] = React.useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null); // Store userId being updated

  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = React.useState(false);
  const [isConfirmStatusModalOpen, setIsConfirmStatusModalOpen] = React.useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<UserDocument | null>(null);
  const [selectedNewRole, setSelectedNewRole] = React.useState<UserRole | null>(null);
  const [newStatusIsActive, setNewStatusIsActive] = React.useState<boolean>(true);

  const fetchUsers = React.useCallback(async () => {
    if (storeId && currentUserDoc?.role === 'admin') {
      setIsLoading(true);
      try {
        const fetchedUsers = await getUsersByStoreId(storeId);
        setUsersList(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({ title: "Error", description: "Could not load users for your store.", variant: "destructive" });
      }
      setIsLoading(false);
    } else if (currentUserDoc && currentUserDoc.role !== 'admin') {
        toast({ title: "Access Denied", description: "You do not have permission to manage users.", variant: "destructive" });
        setIsLoading(false);
    }
  }, [storeId, currentUserDoc, toast]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openChangeRoleModal = (user: UserDocument) => {
    setSelectedUserForEdit(user);
    setSelectedNewRole(user.role);
    setIsChangeRoleModalOpen(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUserForEdit || !selectedNewRole || !currentUser) return;
    if (selectedUserForEdit.uid === currentUser.uid && selectedNewRole !== 'admin') {
        toast({ title: "Action Not Allowed", description: "You cannot change your own role to non-admin.", variant: "destructive"});
        return;
    }

    setIsUpdating(selectedUserForEdit.uid);
    try {
      await updateUserRole(selectedUserForEdit.uid, selectedNewRole);
      toast({ title: "Role Updated", description: `${selectedUserForEdit.displayName}'s role changed to ${roleDisplayNames[selectedNewRole]}.` });
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
    setIsUpdating(null);
    setIsChangeRoleModalOpen(false);
    setSelectedUserForEdit(null);
  };

  const openConfirmStatusModal = (user: UserDocument, newStatus: boolean) => {
    setSelectedUserForEdit(user);
    setNewStatusIsActive(newStatus);
    setIsConfirmStatusModalOpen(true);
  };
  
  const handleChangeUserStatus = async () => {
    if (!selectedUserForEdit || !currentUser) return;

    if (selectedUserForEdit.uid === currentUser.uid && !newStatusIsActive) {
        toast({ title: "Action Not Allowed", description: "You cannot deactivate your own account.", variant: "destructive"});
        return;
    }

    setIsUpdating(selectedUserForEdit.uid);
    try {
      await updateUserStatus(selectedUserForEdit.uid, newStatusIsActive);
      toast({ title: "Status Updated", description: `${selectedUserForEdit.displayName}'s account has been ${newStatusIsActive ? 'activated' : 'deactivated'}.` });
      fetchUsers(); // Refresh list
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
    setIsUpdating(null);
    setIsConfirmStatusModalOpen(false);
    setSelectedUserForEdit(null);
  };
  
  if (currentUserDoc && currentUserDoc.role !== 'admin') {
    return (
      <div className="flex flex-col gap-6 items-center justify-center h-full">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-destructive flex items-center">
              <UserX className="mr-2 h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have the necessary permissions to view or manage users.</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-foreground flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" /> User Management
        </h1>
        <Button disabled> {/* TODO: Implement Add New User functionality */}
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User (Coming Soon)
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground">Store Staff</CardTitle>
          <CardDescription className="text-muted-foreground">Manage roles and access for users in your store.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : usersList.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
                No other users found in this store.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] hidden md:table-cell">Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersList.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="hidden md:table-cell">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${user.displayName?.charAt(0)}`} alt={user.displayName} data-ai-hint="avatar person" />
                        <AvatarFallback>{user.displayName?.split(" ").map(n => n[0]).join("").substring(0,2) || "U"}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{user.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? "default" : "secondary"} className={user.role === 'admin' ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-accent hover:bg-accent/90 text-accent-foreground"}>
                        {roleDisplayNames[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"} className={user.isActive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {currentUser?.uid !== user.uid ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" disabled={isUpdating === user.uid}>
                              {isUpdating === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                            <DropdownMenuItem onClick={() => openChangeRoleModal(user)}>
                              <UserCog className="mr-2 h-4 w-4" /> Change Role
                            </DropdownMenuItem>
                            {user.isActive ? (
                              <DropdownMenuItem onClick={() => openConfirmStatusModal(user, false)} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                                <UserX className="mr-2 h-4 w-4" /> Deactivate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openConfirmStatusModal(user, true)}>
                                <UserCheck className="mr-2 h-4 w-4" /> Reactivate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled> {/* TODO: Implement Password Reset */}
                              <Send className="mr-2 h-4 w-4" /> Send Password Reset
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                         <Badge variant="outline" className="text-muted-foreground">You</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Change Role Modal */}
      <Dialog open={isChangeRoleModalOpen} onOpenChange={setIsChangeRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {selectedUserForEdit?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label htmlFor="role-select">New Role</Label>
            <Select 
                onValueChange={(value) => setSelectedNewRole(value as UserRole)} 
                defaultValue={selectedUserForEdit?.role}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {roleDisplayNames[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedUserForEdit?.uid === currentUser?.uid && selectedNewRole !== 'admin' && (
                <p className="text-sm text-destructive">Warning: You cannot change your own role to a non-administrator.</p>
            )}
             {selectedUserForEdit?.uid !== currentUser?.uid && selectedUserForEdit?.role === 'admin' && selectedNewRole !== 'admin' && (
                 <p className="text-sm text-yellow-600 dark:text-yellow-500">Warning: Changing an administrator's role will remove their admin privileges.</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleChangeRole} disabled={isUpdating === selectedUserForEdit?.uid || (selectedUserForEdit?.uid === currentUser?.uid && selectedNewRole !== 'admin')}>
              {isUpdating === selectedUserForEdit?.uid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Status Change Modal */}
       <AlertDialog open={isConfirmStatusModalOpen} onOpenChange={setIsConfirmStatusModalOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Confirm Account {newStatusIsActive ? "Activation" : "Deactivation"}</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to {newStatusIsActive ? "reactivate" : "deactivate"} the account for {selectedUserForEdit?.displayName}?
                {selectedUserForEdit?.uid === currentUser?.uid && !newStatusIsActive && <span className="font-semibold text-destructive block mt-2">You cannot deactivate your own account.</span>}
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedUserForEdit(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleChangeUserStatus}
                disabled={isUpdating === selectedUserForEdit?.uid || (selectedUserForEdit?.uid === currentUser?.uid && !newStatusIsActive)}
                className={!newStatusIsActive ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
            >
                {isUpdating === selectedUserForEdit?.uid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {newStatusIsActive ? "Reactivate" : "Deactivate"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
