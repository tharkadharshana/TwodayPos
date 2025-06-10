
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, Boxes, Users, History, SettingsIcon, BotMessageSquare, FileText, Landmark, TestTubeDiagonal, ConciergeBell, Wifi, MonitorSmartphone } from 'lucide-react'; // Added Wifi, MonitorSmartphone

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
};

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Terminal",
    href: "/terminal",
    icon: MonitorSmartphone, // Changed from ShoppingCart
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    items: [
      {
        title: "Manage Stock",
        href: "/inventory",
        icon: Boxes, 
      },
      {
        title: "Predictive AI",
        href: "/inventory/predictive",
        icon: BotMessageSquare,
      }
    ]
  },
  {
    title: "Services",
    href: "/services",
    icon: ConciergeBell,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: History,
  },
  {
    title: "Developer",
    href: "/dev/populate-data",
    icon: TestTubeDiagonal, 
  },
];

export const settingsNavItems: NavItem[] = [
   {
    title: "Store Settings",
    href: "/settings/store",
    icon: Landmark,
  },
  {
    title: "Receipts",
    href: "/settings/receipts",
    icon: FileText,
  },
  {
    title: "Offline & Sync", 
    href: "/settings/offline-sync",
    icon: Wifi,
  },
  {
    title: "General",
    href: "/settings",
    icon: SettingsIcon, 
  },
];
