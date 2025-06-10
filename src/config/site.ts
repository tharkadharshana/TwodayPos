import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, ShoppingCart, Boxes, Users, History, SettingsIcon, BotMessageSquare, FileText, Landmark } from 'lucide-react';

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
    title: "Sales",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    items: [
      {
        title: "Manage Stock",
        href: "/inventory",
        icon: Boxes, // Redundant but fine for sub-item
      },
      {
        title: "Predictive AI",
        href: "/inventory/predictive",
        icon: BotMessageSquare,
      }
    ]
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
    title: "General",
    href: "/settings",
    icon: SettingsIcon, // General settings could use the main settings icon
  },
];
