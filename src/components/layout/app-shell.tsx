
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";
import { siteConfig, mainNavItems, settingsNavItems, type NavItem, type UserRole } from "@/config/site";
import { UserNav } from "@/components/layout/user-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/context/UserContext"; // Import useUser

interface AppShellProps {
  children: React.ReactNode;
}

function NavMenuItems({ items, currentPath, userRole, closeSidebar }: { items: NavItem[], currentPath: string, userRole: UserRole | undefined, closeSidebar?: () => void }) {
  const { isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile && closeSidebar) {
      closeSidebar();
    }
  };
  
  const filteredItems = items.filter(item => {
    if (!item.allowedRoles) return userRole === 'admin'; // Default to admin if not specified
    if (userRole) return item.allowedRoles.includes(userRole);
    return false; // Don't show if no role or no allowedRoles
  });

  return filteredItems.map((item, index) => {
    if (item.items && item.items.length > 0) {
      // Filter sub-items as well
      const visibleSubItems = item.items.filter(subItem => {
        if (!subItem.allowedRoles) return userRole === 'admin';
        if (userRole) return subItem.allowedRoles.includes(userRole);
        return false;
      });

      if (visibleSubItems.length === 0) return null; // Don't render parent if no visible sub-items

      const isActiveParent = visibleSubItems.some(subItem => currentPath.startsWith(subItem.href));
      
      return (
        <SidebarMenuItem key={index}>
          <SidebarMenuButton
            className={cn(isActiveParent && "bg-sidebar-accent text-sidebar-accent-foreground")}
            isActive={isActiveParent}
            tooltip={item.title}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </SidebarMenuButton>
          <SidebarMenuSub>
            {visibleSubItems.map((subItem, subIndex) => (
              <SidebarMenuSubItem key={subIndex}>
                <Link href={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={currentPath.startsWith(subItem.href)}
                    onClick={handleLinkClick}
                  >
                    <span> {/* Wrapper span */}
                      <subItem.icon className="mr-2 h-4 w-4" />
                      {subItem.title}
                    </span>
                  </SidebarMenuSubButton>
                </Link>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={index}>
        <Link href={item.href}>
          <SidebarMenuButton
            asChild
            isActive={currentPath.startsWith(item.href)}
            onClick={handleLinkClick}
            tooltip={item.title}
          >
            <span> {/* Wrapper span */}
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  });
}


function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = React.useState(true); 
  const [syncState, setSyncState] = React.useState<'synced' | 'syncing' | 'offline'>('synced');

  React.useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        // Simulate "syncing" for a brief period when coming back online
        setSyncState('syncing');
        const timer = setTimeout(() => setSyncState('synced'), 3000); // Simulate sync duration
        return () => clearTimeout(timer);
      } else {
        setSyncState('offline');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    if (typeof navigator !== 'undefined') {
        updateOnlineStatus();
    } else { // Default for SSR or environments without navigator
        setIsOnline(true);
        setSyncState('synced');
    }
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);


  let statusText = "Online & Synced";
  let Icon = Wifi;
  let iconColorClass = "text-green-500 dark:text-green-400";
  let tooltipMessage = "Your data is synced with the cloud.";

  if (syncState === 'offline') {
    statusText = "Offline";
    Icon = WifiOff;
    iconColorClass = "text-destructive";
    tooltipMessage = "You are currently offline. Changes will be synced when connection is restored.";
  } else if (syncState === 'syncing') {
    statusText = "Syncing...";
    Icon = Wifi; 
    iconColorClass = "text-yellow-500 dark:text-yellow-400 animate-pulse";
    tooltipMessage = "Syncing local changes with the cloud.";
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
            <Icon className={cn("h-5 w-5", iconColorClass)} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-popover text-popover-foreground">
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AppShellInternal({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { userDoc, loading: userLoading } = useUser(); // Get userDoc from context

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const userRole = userDoc?.role;

  // Determine which nav items and title to display
  let currentNavItems: NavItem[] = [];
  let navTitle = "";

  if (pathname.startsWith("/settings")) {
    currentNavItems = settingsNavItems;
    navTitle = "Settings Menu";
  } else {
    currentNavItems = mainNavItems;
    navTitle = "Main Menu";
  }
  
  const mainBackLink = mainNavItems.find(item => item.href === "/dashboard");
  const settingsBackLink = settingsNavItems.find(item => item.href === "/settings");


  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMobileSidebar}>
            <Icons.Logo className="h-8 w-8 text-sidebar-primary" />
            <span className="font-headline text-2xl text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {siteConfig.name}
            </span>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden md:hidden"> 
            <SidebarTrigger className="text-sidebar-foreground hover:text-sidebar-accent-foreground" />
          </div>
        </SidebarHeader>
        <ScrollArea className="flex-grow">
          <SidebarContent className="p-0">
            {userLoading ? (
              <div className="p-2 space-y-2">
                <div className="h-6 w-1/3 bg-muted rounded animate-pulse group-data-[collapsible=icon]:hidden mb-2 ml-2"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse group-data-[collapsible=icon]:w-8 mx-2"></div>
                ))}
              </div>
            ) : (
              <>
                <SidebarGroup className="p-2">
                  <SidebarGroupLabel className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">{navTitle}</SidebarGroupLabel>
                  <SidebarMenu>
                    <NavMenuItems items={currentNavItems} currentPath={pathname} userRole={userRole} closeSidebar={closeMobileSidebar} />
                  </SidebarMenu>
                </SidebarGroup>
                
                {/* Conditional Back Links */}
                {pathname.startsWith("/settings") && !pathname.endsWith("/settings") && settingsBackLink && mainBackLink && (
                  <SidebarGroup className="p-2 mt-4">
                    <SidebarGroupLabel className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Back to App</SidebarGroupLabel>
                      <SidebarMenu>
                        <NavMenuItems items={[mainBackLink]} currentPath={pathname} userRole={userRole} closeSidebar={closeMobileSidebar}/>
                      </SidebarMenu>
                  </SidebarGroup>
                )}
                {!pathname.startsWith("/settings") && settingsBackLink && (
                  <SidebarGroup className="p-2 mt-4">
                    <SidebarGroupLabel className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">System</SidebarGroupLabel>
                      <SidebarMenu>
                        <NavMenuItems items={[settingsBackLink]} currentPath={pathname} userRole={userRole} closeSidebar={closeMobileSidebar}/>
                      </SidebarMenu>
                  </SidebarGroup>
                )}
              </>
            )}
          </SidebarContent>
        </ScrollArea>
        <SidebarFooter className="p-4 flex items-center justify-between border-t border-sidebar-border">
          <UserNav />
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
             <SyncStatusIndicator />
             <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6 md:justify-end">
          <div className="md:hidden"> 
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-2">
             <div className="hidden md:block"> 
                <SyncStatusIndicator />
             </div>
             <div className="hidden md:block">
              <ThemeToggle />
             </div>
             <UserNav /> 
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppShellInternal>{children}</AppShellInternal>
    </SidebarProvider>
  );
}

