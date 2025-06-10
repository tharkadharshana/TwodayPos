
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, Landmark, FileText, Users, CreditCard, Bell, Palette, ShieldCheck, ShoppingBag } from "lucide-react";
import { settingsNavItems } from "@/config/site";

// Define custom icons before they are used
const PercentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>
);
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const PuzzleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19.439 7.852c-2.434-2.266-5.467-3.355-8.442-2.345-2.975 1.009-5.05 3.795-5.05 6.903 0 2.05.789 3.937 2.122 5.348L3.987 22l4.013-4.013c1.08.38 2.233.593 3.427.593 4.29 0 7.904-2.827 9.073-6.848-1.439.86-3.13 1.316-4.912 1.316-3.234 0-6.002-1.745-7.558-4.266 1.403-.393 2.827-.613 4.273-.613 2.975 0 5.705 1.258 7.557 3.328z"></path>
  </svg>
);
const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);
const HardDriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="22" y1="12" x2="2" y2="12"></line>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
    <line x1="6" y1="16" x2="6.01" y2="16"></line>
    <line x1="10" y1="16" x2="10.01" y2="16"></line>
  </svg>
);
const WifiOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="1" y1="1" x2="23" y2="23"></line>
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
    <line x1="12" y1="20" x2="12.01" y2="20"></line>
  </svg>
);

const settingCategories = [
  { title: "Store Details", description: "Manage store name, address, contact info.", href: "/settings/store", icon: Landmark },
  { title: "Tax Settings", description: "Configure tax rates and rules.", href: "/settings/taxes", icon: PercentIcon },
  { title: "Business Hours", description: "Set your operational hours.", href: "/settings/hours", icon: ClockIcon },
  { title: "Digital Receipts", description: "Customize receipt logo and messages.", href: "/settings/receipts", icon: FileText },
  { title: "User Management", description: "Manage staff accounts and roles.", href: "/settings/users", icon: Users },
  { title: "Payment Gateways", description: "Connect and manage payment processors.", href: "/settings/payments", icon: CreditCard },
  { title: "Notifications", description: "Configure alert preferences.", href: "/settings/notifications", icon: Bell },
  { title: "Appearance", description: "Customize POS theme and layout.", href: "/settings/appearance", icon: Palette },
  { title: "Security", description: "Manage passwords and access control.", href: "/settings/security", icon: ShieldCheck },
  { title: "Integrations", description: "Manage third-party app connections.", href: "/settings/integrations", icon: PuzzleIcon },
  { title: "Subscription", description: "Manage your PerfectPOS subscription.", href: "/settings/subscription", icon: StarIcon },
  { title: "Devices", description: "Manage connected POS devices.", href: "/settings/devices", icon: HardDriveIcon },
  { title: "Offline Mode", description: "Configure offline transaction settings.", href: "/settings/offline", icon: WifiOffIcon },
  { title: "Product Settings", description: "Manage categories, variants, and modifiers.", href: "/settings/products", icon: ShoppingBag },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline tracking-tight text-text-black">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingCategories.map((category) => {
          // Check if this category is directly in settingsNavItems
          const isCoreSetting = settingsNavItems.some(navItem => navItem.href === category.href);
          // Use the icon from settingsNavItems if it's a core setting and found, otherwise use the icon from category
          let IconComponent = category.icon; // Default to category.icon
          if (isCoreSetting) {
            const navItemConfig = settingsNavItems.find(navItem => navItem.href === category.href);
            if (navItemConfig && navItemConfig.icon) {
              IconComponent = navItemConfig.icon;
            }
          }
          
          return (
            <Link href={category.href} key={category.title} className="block hover:no-underline">
              <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-text-black flex items-center">
                    <IconComponent className="mr-3 h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
