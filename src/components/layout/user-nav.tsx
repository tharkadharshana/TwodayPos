"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar"; // To check if sidebar is collapsed

export function UserNav() {
  const router = useRouter();
  const { state: sidebarState, isMobile } = useSidebar(); // Get sidebar state

  const handleLogout = () => {
    // In a real app, clear session/token
    router.push("/login");
  };

  // Determine if only icon should be shown (sidebar collapsed and not mobile)
  const showOnlyIcon = sidebarState === "collapsed" && !isMobile;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn(
          "relative h-10 rounded-full p-0",
          showOnlyIcon ? "w-10" : "w-auto px-3" // Adjust width based on state
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User avatar" data-ai-hint="user avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          {!showOnlyIcon && (
             <span className="ml-2 hidden md:inline text-sm font-medium text-sidebar-foreground">John Doe</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover text-popover-foreground" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">John Doe</p>
            <p className="text-xs leading-none text-muted-foreground">
              admin@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/settings/profile" passHref legacyBehavior>
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings/billing" passHref legacyBehavior>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings" passHref legacyBehavior>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
