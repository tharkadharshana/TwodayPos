
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search, ConciergeBell, Edit2, Trash2, EyeOff, Eye, FileDown, UploadCloud, Loader2, DownloadCloud } from "lucide-react";
import type { Service } from "@/types";
import { useUser } from "@/context/UserContext";
import { getServicesByStoreId, deleteService } from "@/lib/firestoreUtils";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// CSV Helper functions (could be moved to a utils file if used in multiple places)
const escapeCSVField = (field: any): string => {
  if (field === null || field === undefined) {
    return "";
  }
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const convertServicesToCSV = (data: Service[], headers: string[], isTemplate: boolean = false): string => {
  const headerRow = headers.join(',');
  if (isTemplate) {
    return headerRow;
  }

  const rows = data.map(service => {
    return headers.map(header => {
      const value = (service as any)[header];
      return escapeCSVField(value);
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
};

const downloadCSV = (csvString: string, filename: string) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};


export default function ServicesPage() {
  const { userDoc } = useUser();
  const { toast } = useToast();
  const [services, setServices] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const serviceCsvHeaders = [
    "id", "name", "description", "price", "durationMinutes", 
    "category", "isVisibleOnPOS", "isBookable", "imageUrl"
  ];
  const serviceTemplateHeaders = [
    "name", "description", "price", "durationMinutes", 
    "category", "isVisibleOnPOS", "isBookable", "imageUrl"
  ];

  const fetchServices = React.useCallback(async () => {
    if (userDoc?.storeId) {
      setIsLoading(true);
      try {
        const fetchedServices = await getServicesByStoreId(userDoc.storeId);
        setServices(fetchedServices);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast({ title: "Error", description: "Could not load services.", variant: "destructive" });
      }
      setIsLoading(false);
    }
  }, [userDoc?.storeId, toast]);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDeleteService = async (serviceId: string) => {
    setIsDeleting(serviceId);
    try {
      await deleteService(serviceId);
      toast({ title: "Success", description: "Service deleted successfully." });
      fetchServices(); 
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast({ title: "Error", description: `Failed to delete service: ${error.message}`, variant: "destructive" });
    }
    setIsDeleting(null);
  };

  const handleExportAllServices = () => {
    if (services.length === 0) {
      toast({ title: "No Services", description: "There are no services to export.", variant: "default" });
      return;
    }
    const csvString = convertServicesToCSV(services, serviceCsvHeaders);
    downloadCSV(csvString, "all_services.csv");
    toast({ title: "Export Successful", description: "All services exported to all_services.csv" });
  };

  const handleExportServiceTemplate = () => {
    const csvString = convertServicesToCSV([], serviceTemplateHeaders, true);
    downloadCSV(csvString, "service_import_template.csv");
    toast({ title: "Template Downloaded", description: "Service import template (service_import_template.csv) downloaded." });
  };

  const handleImportServiceClick = () => {
    fileInputRef.current?.click();
  };

  const handleServiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Selected",
        description: `${file.name} ready for import. Service import processing not yet implemented.`,
      });
      if(fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
      // TODO: Implement CSV parsing and data import logic for services
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
       <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".csv"
        onChange={handleServiceFileChange}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-foreground flex items-center">
          <ConciergeBell className="mr-3 h-8 w-8 text-primary" /> Service Management
        </h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="text-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleImportServiceClick}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-foreground hover:bg-accent hover:text-accent-foreground">
                <DownloadCloud className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
              <DropdownMenuItem onClick={handleExportAllServices}>
                <FileDown className="mr-2 h-4 w-4" /> Export All Services
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FileDown className="mr-2 h-4 w-4" /> Export Selected (Soon)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportServiceTemplate}>
                <FileDown className="mr-2 h-4 w-4" /> Export CSV Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/services/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Service
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-foreground">Services List</CardTitle>
          <CardDescription className="text-muted-foreground">Manage your offered services, pricing, and details.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services by name, category, description..."
              className="pl-10 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
                {searchTerm ? "No services match your search." : "No services found. Add your first service!"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Duration (min)</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Visible on POS</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium text-foreground">{service.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{service.category}</TableCell>
                    <TableCell className="text-right text-foreground">${service.price.toFixed(2)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-muted-foreground">{service.durationMinutes || "N/A"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <Badge variant={service.isVisibleOnPOS ? "default" : "secondary"} className={service.isVisibleOnPOS ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-muted hover:bg-muted/80"}>
                        {service.isVisibleOnPOS ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                        {service.isVisibleOnPOS ? "Visible" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" disabled={isDeleting === service.id}>
                            {isDeleting === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                          <DropdownMenuItem disabled> {/* TODO: Implement Edit Service Page */}
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Service 
                          </DropdownMenuItem>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Service
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the service "{service.name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteService(service.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  {isDeleting === service.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

