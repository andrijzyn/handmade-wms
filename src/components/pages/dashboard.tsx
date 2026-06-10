"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  DollarSign,
  AlertTriangle,
  XCircle,
  FolderOpen,
} from "lucide-react";
import type { Product } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
}

// Required for card navigation handling
export default function Dashboard({
  onNavigateAction,
}: {
  onNavigateAction: (
    page: "dashboard" | "products" | "users" | "locations",
  ) => void;
}) {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const lowStockProducts =
    products?.filter(
      (p) => p.quantity > 0 && p.quantity <= p.low_stock_threshold,
    ) ?? [];
  const outOfStockProducts = products?.filter((p) => p.quantity === 0) ?? [];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight"
          data-testid="text-page-title"
        >
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your inventory status
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card
          className="cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => onNavigateAction("products")}
          data-testid="card-total-products"
        >
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {statsLoading ? "—" : (stats?.totalProducts ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Products</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-value">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              $
              {statsLoading
                ? "—"
                : (stats?.totalValue ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Value</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-amber-400/30 transition-colors"
          onClick={() => onNavigateAction("products")}
          data-testid="card-low-stock"
        >
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {statsLoading ? "—" : (stats?.lowStockCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Low Stock</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-red-400/30 transition-colors"
          onClick={() => onNavigateAction("products")}
          data-testid="card-out-of-stock"
        >
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {statsLoading ? "—" : (stats?.outOfStockCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of Stock</p>
          </CardContent>
        </Card>

        <Card data-testid="card-categories">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <FolderOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {statsLoading ? "—" : (stats?.categoriesCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card data-testid="card-low-stock-alerts">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                All products are well-stocked
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    data-testid={`row-low-stock-${product.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {product.sku}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-xs"
                    >
                      {product.quantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-out-of-stock-alerts">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outOfStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No products are out of stock
              </p>
            ) : (
              <div className="space-y-3">
                {outOfStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    data-testid={`row-out-of-stock-${product.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {product.sku}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Out of stock
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
