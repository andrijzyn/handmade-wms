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

  const statItems = [
    {
      key: "products",
      label: "Total Products",
      value: statsLoading ? "—" : (stats?.totalProducts ?? 0),
      icon: Package,
      iconClass: "text-primary",
      iconBgClass: "bg-primary/10",
      testId: "card-total-products",
      onClick: () => onNavigateAction("products"),
    },
    {
      key: "value",
      label: "Total Value",
      value: statsLoading
        ? "—"
        : `$${(stats?.totalValue ?? 0).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
      icon: DollarSign,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      iconBgClass: "bg-emerald-500/10",
      testId: "card-total-value",
    },
    {
      key: "low-stock",
      label: "Low Stock",
      value: statsLoading ? "—" : (stats?.lowStockCount ?? 0),
      icon: AlertTriangle,
      iconClass: "text-amber-600 dark:text-amber-400",
      iconBgClass: "bg-amber-500/10",
      testId: "card-low-stock",
      onClick: () => onNavigateAction("products"),
    },
    {
      key: "out-of-stock",
      label: "Out of Stock",
      value: statsLoading ? "—" : (stats?.outOfStockCount ?? 0),
      icon: XCircle,
      iconClass: "text-red-600 dark:text-red-400",
      iconBgClass: "bg-red-500/10",
      testId: "card-out-of-stock",
      onClick: () => onNavigateAction("products"),
    },
    {
      key: "categories",
      label: "Categories",
      value: statsLoading ? "—" : (stats?.categoriesCount ?? 0),
      icon: FolderOpen,
      iconClass: "text-violet-600 dark:text-violet-400",
      iconBgClass: "bg-violet-500/10",
      testId: "card-categories",
    },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight sm:text-2xl"
          data-testid="text-page-title"
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your inventory status
        </p>
      </div>

      {/* Mobile KPI list */}
      <div className="sm:hidden">
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {statItems.map((item) => {
                const Icon = item.icon;
                const clickable = Boolean(item.onClick);

                const content = (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconBgClass}`}
                    >
                      <Icon className={`h-4 w-4 ${item.iconClass}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-lg font-semibold tracking-tight break-words">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );

                if (clickable) {
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      className="block w-full text-left transition-colors hover:bg-muted/30 active:bg-muted/40"
                      data-testid={item.testId}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div key={item.key} data-testid={item.testId}>
                    {content}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tablet/Desktop KPI cards */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          const clickable = Boolean(item.onClick);

          const cardBody = (
            <CardContent className="px-4 py-4 sm:px-5 sm:pt-5 sm:pb-4">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg p-2 ${item.iconBgClass}`}>
                  <Icon className={`h-4 w-4 ${item.iconClass}`} />
                </div>
              </div>

              <div className="text-xl font-semibold tracking-tight sm:text-2xl break-words">
                {item.value}
              </div>

              <p className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-xs">
                {item.label}
              </p>
            </CardContent>
          );

          if (clickable) {
            return (
              <Card
                key={item.key}
                className="cursor-pointer transition-colors hover:border-primary/30 active:scale-[0.99]"
                onClick={item.onClick}
                data-testid={item.testId}
              >
                {cardBody}
              </Card>
            );
          }

          return (
            <Card key={item.key} data-testid={item.testId}>
              {cardBody}
            </Card>
          );
        })}
      </div>

      {/* Alerts section */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card data-testid="card-low-stock-alerts">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>

          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                All products are well-stocked
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0"
                    data-testid={`row-low-stock-${product.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-300 text-xs text-amber-600 dark:border-amber-700 dark:text-amber-400"
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
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              Out of Stock
            </CardTitle>
          </CardHeader>

          <CardContent>
            {outOfStockProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No products are out of stock
              </p>
            ) : (
              <div className="space-y-3">
                {outOfStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0"
                    data-testid={`row-out-of-stock-${product.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {product.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {product.sku}
                      </p>
                    </div>

                    <Badge variant="destructive" className="shrink-0 text-xs">
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
