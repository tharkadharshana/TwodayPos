
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"; // Added sendPasswordResetEmail
import { auth as firebaseAuth } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Users, PlusCircle, Loader2, UserCog, UserX, UserCheck, Send, UserRoundCog, ShieldQuestion } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUser } from "@/context/UserContext";
import { getUsersByStoreId, updateUserRole, updateUserStatus, adminCreateUserInFirestore } from "@/lib/firestoreUtils";
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

const availableRolesForCreation: Exclude<UserRole, 'admin'>[] = ["manager", "cashier"];
const availableRolesForEdit: UserRole[] = ["admin", "manager", "cashier"];


const addUserFormSchema = z
  .object({
    displayName: z.string().min(1, { message: "Display name is required." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
    role: z.enum(["manager", "cashier"], { required_error: "Role is required."}),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type AddUserFormValue = z.infer<typeof addUserFormSchema>;


export default function UserManagementPage() {
  const { user: currentUser, userDoc: currentUserDoc, storeId } = useUser();
  const { toast } = useToast();

  const [usersList, setUsersList] = React.useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null); 
  const [isSendingReset, setIsSendingReset] = React.useState<string | null>(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = React.useState(false);
  const [isSubmittingNewUser, setIsSubmittingNewUser] = React.useState(false);

  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = React.useState(false);
  const [isConfirmStatusModalOpen, setIsConfirmStatusModalOpen] = React.useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = React.useState<UserDocument | null>(null);
  const [selectedNewRole, setSelectedNewRole] = React.useState<UserRole | null>(null);
  const [newStatusIsActive, setNewStatusIsActive] = React.useState<boolean>(true);

  const addUserForm = useForm<AddUserFormValue>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "cashier",
    },
  });

  const fetchUsers = React.useCallback(async () => {
    if (storeId && currentUserDoc?.role === 'admin') {
      setIsLoading(true);
      try {
        const fetchedUsers = await getUsersByStoreId(storeId);
        setUsersList(fetchedUsers.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "")));
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

  const handleAddNewUser = async (data: AddUserFormValue) => {
    if (!storeId || !currentUserDoc || currentUserDoc.role !== 'admin') {
      toast({ title: "Permission Denied", description: "Only admins can add new users.", variant: "destructive" });
      return;
    }
    setIsSubmittingNewUser(true);
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
      const newFirebaseUser = userCredential.user;

      // Create UserDocument in Firestore
      await adminCreateUserInFirestore({
        uid: newFirebaseUser.uid,
        storeId: storeId,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
      });

      toast({ title: "User Created", description: `${data.displayName} has been added as a ${roleDisplayNames[data.role]}.` });
      addUserForm.reset();
      setIsAddUserModalOpen(false);
      fetchUsers(); // Refresh the user list
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email address is already in use.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "The password is too weak. It must be at least 6 characters.";
      }
      console.error("Error adding new user:", error);
      toast({ title: "Add User Failed", description: errorMessage, variant: "destructive" });
    }
    setIsSubmittingNewUser(false);
  };


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
    if (selectedUserForEdit.uid === currentUser.uid && selectedNewRole === 'admin' && selectedUserForEdit.role === 'admin') {
        toast({ title: "No Change", description: "User is already an administrator.", variant: "default"});
        setIsChangeRoleModalOpen(false);
        return;
    }


    setIsUpdating(selectedUserForEdit.uid);
    try {
      await updateUserRole(selectedUserForEdit.uid, selectedNewRole);
      toast({ title: "Role Updated", description: `${selectedUserForEdit.displayName}'s role changed to ${roleDisplayNames[selectedNewRole]}.` });
      fetchUsers(); 
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
      fetchUsers(); 
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
    setIsUpdating(null);
    setIsConfirmStatusModalOpen(false);
    setSelectedUserForEdit(null);
  };

  const handleSendPasswordReset = async (userToReset: UserDocument) => {
    if (!userToReset || !userToReset.email) {
      toast({ title: "Error", description: "User email not found.", variant: "destructive" });
      return;
    }
    setIsSendingReset(userToReset.uid);
    try {
      await sendPasswordResetEmail(firebaseAuth, userToReset.email);
      toast({ title: "Password Reset Email Sent", description: `A password reset email has been sent to ${userToReset.email}.` });
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      let message = "Could not send password reset email.";
      if (error.code === 'auth/user-not-found') {
          message = "This user account may not exist in Firebase Authentication, or may have been deleted."
      }
      toast({ title: "Password Reset Failed", description: message, variant: "destructive" });
    }
    setIsSendingReset(null);
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
        <Button onClick={() => { addUserForm.reset(); setIsAddUserModalOpen(true);}}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground">Store Staff</CardTitle>
          <CardDescription className="text-muted-foreground">Manage roles and access for users in your store. New users created here will be prompted to change their password on first login (recommended).</CardDescription>
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
                        <AvatarFallback>{user.displayName?.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() || "U"}</AvatarFallback>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" disabled={isUpdating === user.uid || isSendingReset === user.uid}>
                            {isUpdating === user.uid || isSendingReset === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                          {currentUser?.uid !== user.uid && (
                            <>
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
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleSendPasswordReset(user)} disabled={isSendingReset === user.uid}>
                            <Send className="mr-2 h-4 w-4" /> Send Password Reset
                          </DropdownMenuItem>
                           {currentUser?.uid === user.uid && (
                            <DropdownMenuItem disabled>
                                <ShieldQuestion className="mr-2 h-4 w-4 text-muted-foreground" /> You (No direct actions)
                            </DropdownMenuItem>
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

       {/* Add New User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center"><UserRoundCog className="mr-2 h-6 w-6 text-primary"/>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for your store. They will receive an email to verify their account if it's a new email to Firebase.
            </DialogDescription>
          </DialogHeader>
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(handleAddNewUser)} className="space-y-4 py-4">
              <FormField
                control={addUserForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Display Name</FormLabel>
                    <FormControl><Input placeholder="Full Name" {...field} className="text-foreground" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl><Input type="email" placeholder="user@example.com" {...field} className="text-foreground" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={addUserForm.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground">Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} className="text-foreground" /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={addUserForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-foreground">Confirm Password</FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} className="text-foreground" /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
               </div>
              <FormField
                control={addUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableRolesForCreation.map(role => (
                          <SelectItem key={role} value={role}>
                            {roleDisplayNames[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmittingNewUser}>
                  {isSubmittingNewUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


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
                {availableRolesForEdit.map(role => (
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
            <Button onClick={handleChangeRole} disabled={isUpdating === selectedUserForEdit?.uid || (selectedUserForEdit?.uid === currentUser?.uid && selectedNewRole !== 'admin') || selectedNewRole === selectedUserForEdit?.role}>
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

