
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, Boxes, Users, History, SettingsIcon, BotMessageSquare, FileText, Landmark, TestTubeDiagonal, ConciergeBell, Wifi, MonitorSmartphone, UserCog, ShieldCheck } from 'lucide-react';
import type { UserDocument, Permission } from '@/types';

// Removed: export type UserRole = UserDocument['role'];

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
  requiredPermission?: Permission;
};

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermission: "dashboard:view",
  },
  {
    title: "Terminal",
    href: "/terminal",
    icon: MonitorSmartphone,
    requiredPermission: "terminal:access",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    requiredPermission: "inventory:view",
    items: [
      {
        title: "Manage Stock",
        href: "/inventory",
        icon: Boxes, 
        requiredPermission: "inventory:view",
      },
      {
        title: "Predictive AI",
        href: "/inventory/predictive",
        icon: BotMessageSquare,
        requiredPermission: "inventory:view:ai",
      }
    ]
  },
  {
    title: "Services",
    href: "/services",
    icon: ConciergeBell,
    requiredPermission: "service:view", // Assuming "service:view", can be "service:manage"
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
    requiredPermission: "customer:view", // Assuming "customer:view", can be "customer:manage"
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: History,
    requiredPermission: "transaction:read",
  },
  {
    title: "Developer",
    href: "/dev/populate-data",
    icon: TestTubeDiagonal, 
    requiredPermission: "dev:tools:access",
  },
];

export const settingsNavItems: NavItem[] = [
   {
    title: "Store Settings",
    href: "/settings/store",
    icon: Landmark,
    requiredPermission: "settings:view:store",
  },
  {
    title: "User Management",
    href: "/settings/users",
    icon: UserCog,
    requiredPermission: "settings:manage:users",
  },
  {
    title: "Roles & Permissions",
    href: "/settings/roles",
    icon: ShieldCheck,
    requiredPermission: "settings:manage:roles",
  },
  {
    title: "Receipts",
    href: "/settings/receipts",
    icon: FileText,
    requiredPermission: "settings:view:receipts",
  },
  {
    title: "Offline & Sync", 
    href: "/settings/offline-sync",
    icon: Wifi,
    requiredPermission: "settings:view:offline",
  },
  {
    title: "General", 
    href: "/settings",
    icon: SettingsIcon, 
    requiredPermission: "settings:view",
  },
];
