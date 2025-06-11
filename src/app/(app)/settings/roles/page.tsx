"use client";

import * as React from "react";
import { useUser } from "@/context/UserContext";
import { getRolesByStoreId, createRole, updateRole, deleteRole } from "@/lib/firestoreUtils";
import type { Role } from "@/types"; // Assuming Permission type is also in "@/types"
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Eye, ShieldCheck, Loader2, MoreHorizontal } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// Define ALL_AVAILABLE_PERMISSIONS and Permission type
const ALL_AVAILABLE_PERMISSIONS = [
  "customer:create",
  "customer:delete",
  "customer:read",
  "customer:update",
  "customer:view",
  "dashboard:view",
  "dev:tools:access",
  "inventory:manage",
  "inventory:view",
  "inventory:view:ai",
  "product:create",
  "product:delete",
  "product:read",
  "product:update",
  "reports:export:data",
  "reports:view:inventory",
  "reports:view:sales",
  "service:create",
  "service:delete",
  "service:read",
  "service:update",
  "service:view",
  "settings:manage:roles",
  "settings:manage:store",
  "settings:manage:users",
  "settings:view",
  "settings:view:offline",
  "settings:view:receipts",
  "settings:view:roles",
  "settings:view:store",
  "settings:view:users",
  "terminal:access",
  "terminal:apply_discounts",
  "terminal:process_refunds",
  "terminal:process_sales",
  "transaction:create",
  "transaction:read",
  "transaction:refund",
  "transaction:update",
] as const;

type Permission = typeof ALL_AVAILABLE_PERMISSIONS[number];

export default function RolesManagementPage() {
  const { storeId, userDoc, loading: userContextLoading, hasPermission } = useUser();
  const { toast } = useToast();

  const [roles, setRoles] = React.useState<Role[]>([]);
  const [pageLoading, setPageLoading] = React.useState(true); // Separate page loading from context loading
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [roleName, setRoleName] = React.useState("");
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<Permission>>(new Set());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null);

  const fetchRoles = React.useCallback(async () => {
    if (!storeId) {
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    try {
      const fetchedRoles = await getRolesByStoreId(storeId);
      setRoles(fetchedRoles.sort((a, b) => {
        if (a.isPredefined && !b.isPredefined) return -1;
        if (!a.isPredefined && b.isPredefined) return 1;
        return a.name.localeCompare(b.name);
      }));
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({ title: "Error", description: "Could not load roles.", variant: "destructive" });
    }
    setPageLoading(false);
  }, [storeId, toast]);

  React.useEffect(() => {
    // Fetch roles only if the user has permission and storeId is available
    // The initial check for permission happens below, after context loading
    if (storeId && hasPermission('settings:manage:roles')) {
      fetchRoles();
    } else if (storeId && !hasPermission('settings:manage:roles')) {
      // User has a store but no permission for this specific page
      setPageLoading(false);
    } else if (!storeId && !userContextLoading) {
      // No storeId and context is not loading (e.g. user not fully set up)
      setPageLoading(false);
    }
    // Do not fetch if context is loading, wait for hasPermission to be stable
  }, [storeId, hasPermission, fetchRoles, userContextLoading]);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setSelectedPermissions(new Set(role.permissions as Permission[])); // Cast needed if Role.permissions is string[]
    } else {
      setEditingRole(null);
      setRoleName("");
      setSelectedPermissions(new Set());
    }
    setIsRoleModalOpen(true);
  };

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    const newPermissions = new Set(selectedPermissions);
    if (checked) {
      newPermissions.add(permission);
    } else {
      newPermissions.delete(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !roleName.trim()) {
      toast({ title: "Validation Error", description: "Role name cannot be empty.", variant: "destructive" });
      return;
    }
    if (selectedPermissions.size === 0 && !editingRole?.isPredefined) {
        toast({ title: "Validation Error", description: "A role must have at least one permission.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const permissionsArray = Array.from(selectedPermissions);
    try {
      if (editingRole) {
        if (editingRole.isPredefined) {
          toast({ title: "Error", description: "Predefined roles cannot be modified here.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        await updateRole(editingRole.id, { name: roleName, permissions: permissionsArray });
        toast({ title: "Role Updated", description: `Role "${roleName}" has been updated.` });
      } else {
        await createRole(storeId, { name: roleName, permissions: permissionsArray });
        toast({ title: "Role Created", description: `Role "${roleName}" has been created.` });
      }
      fetchRoles();
      setIsRoleModalOpen(false);
    } catch (error: any) {
      console.error("Error saving role:", error);
      toast({ title: "Error", description: error.message || "Could not save role.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete || roleToDelete.isPredefined) {
      toast({ title: "Error", description: "This role cannot be deleted.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteRole(roleToDelete.id);
      toast({ title: "Role Deleted", description: `Role "${roleToDelete.name}" has been deleted.` });
      fetchRoles();
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({ title: "Error", description: error.message || "Could not delete role.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const permissionGroups = React.useMemo(() => {
     const groups: Record<string, Permission[]> = {};
     ALL_AVAILABLE_PERMISSIONS.forEach(p => {
         const groupName = p.split(':')[0];
         if (!groups[groupName]) groups[groupName] = [];
         groups[groupName].push(p);
     });
     return groups;
  }, []);

  // Add a check for admin rights here based on userDoc.roleId and its permissions for 'settings:manage:roles'
  // This is a placeholder for more robust permission checking to be added later.
  // For now, if not `canManageRoles` (basic check), show a restricted message or redirect.
  if (userContextLoading || pageLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  if (!hasPermission('settings:manage:roles')) {
    return (
       <Card className="w-full max-w-md mx-auto mt-10 shadow-lg">
        <CardHeader className="items-center text-center">
          <ShieldCheck className="h-16 w-16 text-destructive mb-4" />
          <CardTitle className="text-xl font-headline text-destructive">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">You do not have the necessary permissions to manage roles and permissions.</p>
          {/* Optionally, provide a button to go back or to the dashboard */}
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-headline tracking-tight text-foreground flex items-center">
          <ShieldCheck className="mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> Roles & Permissions
        </h1>
        <Button onClick={() => handleOpenModal()} size="sm" className="w-full sm:w-auto" disabled={!hasPermission('settings:manage:roles')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Role
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Roles</CardTitle>
          <CardDescription>Define custom roles or view predefined roles and their permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Permissions</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {roles.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No roles found. Start by adding a new role.
                        </TableCell>
                    </TableRow>
                )}
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium whitespace-nowrap">{role.name}</TableCell>
                    <TableCell>{role.isPredefined ?
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Predefined</span>
                        : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Custom</span>}
                    </TableCell>
                    <TableCell>{role.permissions.length} granted</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {role.isPredefined ? (
                            <DropdownMenuItem onClick={() => handleOpenModal(role)}>
                              <Eye className="mr-2 h-4 w-4" /> View Permissions
                            </DropdownMenuItem>
                          ) : (
                            hasPermission('settings:manage:roles') && (
                              <DropdownMenuItem onClick={() => handleOpenModal(role)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Role
                              </DropdownMenuItem>
                            )
                          )}
                          {!role.isPredefined && hasPermission('settings:manage:roles') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => { setRoleToDelete(role); setShowDeleteConfirm(true); }}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                              </DropdownMenuItem>
                            </>
                          )}
                           {/* If user has no manage:roles perm but view:roles (not implemented yet), they could still view custom roles */}
                           {!role.isPredefined && !hasPermission('settings:manage:roles') && hasPermission('settings:view:roles') && (
                             <DropdownMenuItem onClick={() => handleOpenModal(role)}>
                                <Eye className="mr-2 h-4 w-4" /> View Permissions
                            </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRole ? (editingRole.isPredefined ? "View Permissions" : "Edit Role") : "Add New Role"}</DialogTitle>
            {editingRole?.isPredefined && <DialogDescription>Permissions for predefined roles cannot be changed.</DialogDescription>}
             {!editingRole && <DialogDescription>Create a new custom role by defining its name and permissions.</DialogDescription>}
             {editingRole && !editingRole.isPredefined && <DialogDescription>Modify the name and permissions for this custom role.</DialogDescription>}
          </DialogHeader>
          <form onSubmit={handleSubmitRole} className="flex-grow overflow-y-auto space-y-4 py-1 pr-2">
            <div>
              <Label htmlFor="roleName" className="text-foreground">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., Shift Supervisor"
                className="mt-1"
                disabled={editingRole?.isPredefined}
                required
              />
            </div>
            <div>
              <Label className="text-foreground mb-1 block">Permissions</Label>
              <div className="space-y-3 rounded-md border p-4 max-h-[40vh] overflow-y-auto bg-muted/20">
                 {Object.entries(permissionGroups).map(([groupName, perms]) => (
                     <div key={groupName}>
                         <h4 className="font-semibold capitalize mb-2 text-sm text-foreground border-b pb-1">
                           {groupName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pl-1">
                         {perms.map(permission => (
                             <div key={permission} className="flex items-center space-x-2">
                             <Checkbox
                                 id={`perm-${permission}`}
                                 checked={selectedPermissions.has(permission)}
                                 onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
                                 disabled={editingRole?.isPredefined}
                             />
                             <Label htmlFor={`perm-${permission}`} className="font-normal text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                 {permission.split(':')[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                             </Label>
                             </div>
                         ))}
                         </div>
                     </div>
                 ))}
              </div>
            </div>
            {!editingRole?.isPredefined && (
              <DialogFooter className="pt-4 sticky bottom-0 bg-background">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button
                  type="submit"
                  disabled={isSubmitting || !roleName.trim() || !hasPermission('settings:manage:roles')}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRole ? "Save Changes" : "Create Role"}
                </Button>
              </DialogFooter>
            )}
             {editingRole?.isPredefined && (
                 <DialogFooter className="pt-4 sticky bottom-0 bg-background">
                     <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                 </DialogFooter>
             )}
          </form>
        </DialogContent>
      </Dialog>

     <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
         <AlertDialogContent>
             <AlertDialogHeader>
                 <AlertDialogTitle>Delete "{roleToDelete?.name}"?</AlertDialogTitle>
                 <AlertDialogDescription>
                     This action cannot be undone. Users currently assigned this role will need to be manually reassigned to a new role.
                 </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
                 <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancel</AlertDialogCancel>
                 <AlertDialogAction
                     onClick={handleDeleteRole}
                     disabled={isSubmitting || !hasPermission('settings:manage:roles')}
                     variant="destructive" // Use destructive variant for the button itself
                 >
                     {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Delete Role
                 </AlertDialogAction>
             </AlertDialogFooter>
         </AlertDialogContent>
     </AlertDialog>
    </div>
  );
}
