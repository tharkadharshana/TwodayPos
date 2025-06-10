
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, Boxes, Users, History, SettingsIcon, BotMessageSquare, FileText, Landmark, TestTubeDiagonal, ConciergeBell, Wifi, MonitorSmartphone } from 'lucide-react';
import type { UserDocument } from '@/types'; // Import UserRole type

export type UserRole = UserDocument['role']; // 'admin' | 'manager' | 'cashier'

export const siteConfig = {
  name: "PerfectPOS",
  description: "Modern Point of Sale System",
};

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  items?: NavItem[];
  allowedRoles?: UserRole[]; // Roles that can access this item
};

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'manager', 'cashier'],
  },
  {
    title: "Terminal",
    href: "/terminal",
    icon: MonitorSmartphone,
    allowedRoles: ['admin', 'manager', 'cashier'],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    allowedRoles: ['admin', 'manager'],
    items: [
      {
        title: "Manage Stock",
        href: "/inventory",
        icon: Boxes, 
        allowedRoles: ['admin', 'manager'],
      },
      {
        title: "Predictive AI",
        href: "/inventory/predictive",
        icon: BotMessageSquare,
        allowedRoles: ['admin', 'manager'],
      }
    ]
  },
  {
    title: "Services",
    href: "/services",
    icon: ConciergeBell,
    allowedRoles: ['admin', 'manager'],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    allowedRoles: ['admin', 'manager'],
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: History,
    allowedRoles: ['admin', 'manager', 'cashier'],
  },
  {
    title: "Developer",
    href: "/dev/populate-data",
    icon: TestTubeDiagonal, 
    allowedRoles: ['admin'], // Typically admin only
  },
];

export const settingsNavItems: NavItem[] = [
   {
    title: "Store Settings",
    href: "/settings/store",
    icon: Landmark,
    allowedRoles: ['admin', 'manager'],
  },
  {
    title: "Receipts",
    href: "/settings/receipts",
    icon: FileText,
    allowedRoles: ['admin', 'manager'],
  },
  {
    title: "Offline & Sync", 
    href: "/settings/offline-sync",
    icon: Wifi,
    allowedRoles: ['admin', 'manager'],
  },
  {
    title: "General", // Main settings link
    href: "/settings",
    icon: SettingsIcon, 
    allowedRoles: ['admin', 'manager', 'cashier'], // All roles can see the settings hub
  },
  // Add allowedRoles to other specific settings pages if they exist and need restriction
  // Example: User Management should be admin only.
  // { title: "User Management", href: "/settings/users", icon: UsersIcon, allowedRoles: ['admin'] } 
];

