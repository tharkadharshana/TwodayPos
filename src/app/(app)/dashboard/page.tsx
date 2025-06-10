
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart as BarChartIcon, DollarSign, Users, ShoppingCart, TrendingUp, AlertCircle, PackageCheck, Palette } from "lucide-react"; 
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, PieChart, Cell } from "recharts"; 
import type { SalesKPIs, SalesTrendDataPoint, TopSellingProduct, PaymentMethodDistribution } from "@/types";

const kpiData: SalesKPIs = {
  totalSales: 45231.89,
  totalTransactions: 2350,
  averageSaleValue: 19.25,
};

const salesTrendData: SalesTrendDataPoint[] = [
  { date: "Jan", sales: 4000 },
  { date: "Feb", sales: 3000 },
  { date: "Mar", sales: 5000 },
  { date: "Apr", sales: 4500 },
  { date: "May", sales: 6000 },
  { date: "Jun", sales: 5500 },
];

const topProductsData: TopSellingProduct[] = [
  { productId: "1", name: "Espresso", quantitySold: 1200, totalRevenue: 3600 },
  { productId: "2", name: "Cappuccino", quantitySold: 950, totalRevenue: 4275 },
  { productId: "3", name: "Croissant", quantitySold: 800, totalRevenue: 2400 },
];

const paymentMethodsData: PaymentMethodDistribution[] = [
  { method: "Card", count: 1500, amount: 30000 },
  { method: "Cash", count: 700, amount: 10231.89 },
  { method: "Mobile Pay", count: 150, amount: 5000 },
];

const chartConfig = {
  sales: { label: "Sales", color: "hsl(var(--chart-1))" }, // Primary color for sales
  // Add other keys if needed, e.g., for PieChart sections if they map to config
  card: { label: "Card", color: "hsl(var(--chart-1))" },
  cash: { label: "Cash", color: "hsl(var(--chart-2))" },
  mobile: { label: "Mobile Pay", color: "hsl(var(--chart-3))" },
};

const PIE_COLORS = [
    "hsl(var(--chart-1))", 
    "hsl(var(--chart-2))", 
    "hsl(var(--chart-3))", 
    "hsl(var(--chart-4))", 
    "hsl(var(--chart-5))"
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-headline tracking-tight text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-foreground hover:bg-accent hover:text-accent-foreground">
            Last 30 Days
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">${kpiData.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Transactions</CardTitle>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">+{kpiData.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg. Sale Value</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">${kpiData.averageSaleValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-foreground">Sales Trend</CardTitle>
            <CardDescription className="text-muted-foreground">Monthly sales performance</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} className="fill-muted-foreground"/>
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value / 1000}k`} className="fill-muted-foreground"/>
                  <ChartTooltip 
                    content={<ChartTooltipContent labelClassName="text-foreground" className="bg-popover text-popover-foreground" />} 
                  />
                  <Bar dataKey="sales" fill="var(--color-chart-1)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-foreground">Payment Methods</CardTitle>
             <CardDescription className="text-muted-foreground">Distribution of payment methods</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ChartContainer config={chartConfig} className="h-full w-full aspect-square">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <ChartTooltip 
                        content={<ChartTooltipContent nameKey="method" hideLabel className="bg-popover text-popover-foreground"/>} 
                    />
                    <Pie data={paymentMethodsData} dataKey="amount" nameKey="method" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}>
                        {paymentMethodsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="method" className="text-muted-foreground" />} />
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-foreground">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                {topProductsData.map((product) => (
                    <li key={product.productId} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                    <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantitySold} units sold</p>
                    </div>
                    <p className="font-semibold text-primary">${product.totalRevenue.toLocaleString()}</p>
                    </li>
                ))}
                </ul>
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-headline text-foreground">Inventory Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-destructive"/>
                    <div>
                        <p className="font-medium text-destructive">Low Stock: Arabica Beans</p>
                        <p className="text-xs text-destructive/80 dark:text-destructive/70">Only 5 units left. Expected stockout in 2 days.</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">Reorder</Button>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                    <PackageCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-500"/>
                    <div>
                        <p className="font-medium text-emerald-700 dark:text-emerald-400">Reorder Placed: Milk Cartons</p>
                        <p className="text-xs text-emerald-600/80 dark:text-emerald-500/70">50 units ordered. Expected delivery tomorrow.</p>
                    </div>
                 </div>
            </CardContent>
        </Card>
       </div>

    </div>
  );
}
