"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Pencil, ArrowUpDown } from "lucide-react";
import LocationForm from "@/components/pages/location-form";

type SortKey = "label" | "sku" | "category";
type SortDir = "asc" | "desc";

type SortButtonProps = {
  column: SortKey;
  label: string;
  activeKey: SortKey;
  activeDir: SortDir;
  onToggle: (key: SortKey) => void;
};

function SortButton({
                      column,
                      label,
                      activeKey,
                      activeDir,
                      onToggle,
                    }: SortButtonProps) {
  const isActive = activeKey === column;
  const directionMark = isActive ? (activeDir === "asc" ? "↑" : "↓") : "";

  return (
    <button
      type="button"
      onClick={() => onToggle(column)}
      className="inline-flex items-center gap-1 text-left font-medium"
    >
      <span>{label}</span>
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{directionMark}</span>
    </button>
  );
}

function getSortValue(product: Product, sortKey: SortKey): string {
  switch (sortKey) {
    case "label":
      return product.name ?? "";
    case "sku":
      return product.sku ?? "";
    case "category":
      return product.category ?? "";
    default:
      return "";
  }
}

export default function LocationsPage() {
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("label");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: products = [], isLoading, isError, error } = useQuery<Product[]>({
    queryKey: ["products", { q: search }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();

      if (search) {
        params.set("q", search);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/products?${queryString}` : "/api/products";

      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      return (await res.json()) as Product[];
    },
  });

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aValue = getSortValue(a, sortKey);
      const bValue = getSortValue(b, sortKey);
      const cmp = aValue.localeCompare(bValue, "uk", { sensitivity: "base" });

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [products, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDir("asc");
  }

  if (editingProduct) {
    return (
      <LocationForm
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
      />
    );
  }

  return (
    <div className="space-y-5" data-testid="locations-page">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight"
          data-testid="text-page-title"
        >
          Locations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a product to manage its warehouse locations
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-sm text-muted-foreground">
                Loading products...
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load products"}
              </div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">No products found</p>
              {search ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSearch("")}
                  data-testid="button-clear-search"
                >
                  Clear search
                </Button>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton
                      column="label"
                      label="Product"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton
                      column="sku"
                      label="SKU"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton
                      column="category"
                      label="Category"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[90px] text-right">
                    Locations
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    data-testid={`row-product-${product.id}`}
                  >
                    <TableCell>
                      <p className="text-sm font-medium">{product.name}</p>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {product.sku}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {product.category}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingProduct(product)}
                        data-testid={`button-manage-locations-${product.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
