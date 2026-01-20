import { apiFetch } from "./http";

export interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  newCustomers: number;
  productsInStock: number;
  lowStockProducts: number;
  conversionRate: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string | null;
  sales: number;
  revenue: number;
}

export interface MostViewedProduct {
  id: string;
  name: string;
  sku: string | null;
  views: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  topProducts: TopProduct[];
  lowProducts: TopProduct[];
  mostViewedProducts: MostViewedProduct[];
}

export async function getDashboardMetrics(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/admin/dashboard");
}
