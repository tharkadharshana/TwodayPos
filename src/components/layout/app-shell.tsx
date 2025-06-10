
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
import { siteConfig, mainNavItems, settingsNavItems, type NavItem } from "@/config/site";
import { UserNav } from "@/components/layout/user-nav";
import { cn } from "@/lib/utils";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppShellProps {
  children: React.ReactNode;
}

function NavMenuItems({ items, currentPath, closeSidebar }: { items: NavItem[], currentPath: string, closeSidebar?: () => void }) {
  const { isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile && closeSidebar) {
      closeSidebar();
    }
  };
  
  return items.map((item, index) => {
    if (item.items && item.items.length > 0) {
      const isActiveParent = item.items.some(subItem => currentPath.startsWith(subItem.href));
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
            {item.items.map((subItem, subIndex) => (
              <SidebarMenuSubItem key={subIndex}>
                <Link href={subItem.href} legacyBehavior passHref>
                  <SidebarMenuSubButton
                    asChild
                    isActive={currentPath.startsWith(subItem.href)}
                    onClick={handleLinkClick}
                  >
                    <a> {/* Anchor tag is required by asChild with legacyBehavior */}
                      <subItem.icon className="mr-2 h-4 w-4" />
                      {subItem.title}
                    </a>
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
        <Link href={item.href} legacyBehavior passHref>
          <SidebarMenuButton
            asChild
            isActive={currentPath.startsWith(item.href)}
            tooltip={item.title}
            onClick={handleLinkClick}
          >
            <a> {/* Anchor tag is required by asChild with legacyBehavior */}
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  });
}


function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = React.useState(true); 
  const [pendingSyncCount, setPendingSyncCount] = React.useState(0); 

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      setIsOnline(navigator.onLine);
    }


    const intervalId = setInterval(() => {
      if (isOnline && pendingSyncCount > 0) {
        setPendingSyncCount(prev => Math.max(0, prev - 1));
      } else if (!isOnline && Math.random() < 0.1) {
         setPendingSyncCount(prev => prev + 1);
      }
    }, 3000);


    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, pendingSyncCount]);

  let statusText = "Synced";
  let Icon = Wifi;
  let iconColor = "text-green-500";

  if (!isOnline) {
    statusText = "Offline";
    Icon = WifiOff;
    iconColor = "text-yellow-500";
    if (pendingSyncCount > 0) {
      statusText = `Offline - ${pendingSyncCount} pending`;
    }
  } else if (pendingSyncCount > 0) {
    statusText = `Syncing ${pendingSyncCount} items...`;
    Icon = Wifi; 
    iconColor = "text-blue-500 animate-pulse";
  }
  // TODO: Add actual error state
  // else if (syncError) {
  //   statusText = "Sync Error";
  //   Icon = AlertTriangle;
  //   iconColor = "text-red-500";
  // }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Icon className={cn("h-5 w-5", iconColor)} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-popover text-popover-foreground">
        <p>{statusText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Internal component to house the main shell structure and use sidebar context
function AppShellInternal({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const currentNavItems = pathname.startsWith("/settings") ? settingsNavItems : mainNavItems;
  const navTitle = pathname.startsWith("/settings") ? "Settings Menu" : "Main Menu";

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
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
             <SidebarGroup className="p-2">
              <SidebarGroupLabel className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">{navTitle}</SidebarGroupLabel>
              <SidebarMenu>
                <NavMenuItems items={currentNavItems} currentPath={pathname} closeSidebar={closeMobileSidebar} />
              </SidebarMenu>
            </SidebarGroup>
            
            {!pathname.startsWith("/settings") && (
               <SidebarGroup className="p-2 mt-4">
                <SidebarGroupLabel className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">System</SidebarGroupLabel>
                  <SidebarMenu>
                    <NavMenuItems items={settingsNavItems.filter(item => item.href === "/settings")} currentPath={pathname} closeSidebar={closeMobileSidebar}/>
                  </SidebarMenu>
              </SidebarGroup>
            )}
             {pathname.startsWith("/settings") && !pathname.endsWith("/settings") && (
               <SidebarGroup className="p-2 mt-4">
                 <SidebarGroupLabel className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Back to App</SidebarGroupLabel>
                  <SidebarMenu>
                    <NavMenuItems items={mainNavItems.filter(item => item.href === "/dashboard")} currentPath={pathname} closeSidebar={closeMobileSidebar}/>
                  </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
        </ScrollArea>
        <SidebarFooter className="p-4 flex items-center justify-between border-t border-sidebar-border">
          <UserNav />
          <div className="group-data-[collapsible=icon]:hidden">
             <SyncStatusIndicator />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 md:justify-end">
          <div className="md:hidden"> 
            <SidebarTrigger />
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block"> 
                <SyncStatusIndicator />
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
