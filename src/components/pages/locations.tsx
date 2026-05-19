"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Pencil, ArrowUpDown } from "lucide-react";
import LocationForm from "@/components/pages/location-form";

type SortKey = "label" | "row" | "col" | "level";
type SortDir = "asc" | "desc";

export default function Locations() {
  const [search, setSearch]                         = useState("");
  const [editingProduct, setEditingProduct]         = useState<Product | null>(null);
  const [sortKey, setSortKey]                       = useState<SortKey>("label");
  const [sortDir, setSortDir]                       = useState<SortDir>("asc");

  // Завантажуємо продукти — щоб вибрати який редагувати
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { q: search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const sorted = [...products].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "label") cmp = a.name.localeCompare(b.name);
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const SortButton = ({ column, label }: { column: SortKey; label: string }) => (
      <button
          onClick={() => toggleSort(column)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
          data-testid={`button-sort-${column}`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
  );

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
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-page-title">
            Locations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a product to manage its warehouse locations
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-sm text-muted-foreground">Loading products...</div>
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-sm text-muted-foreground">No products found</p>
                  {search && (
                      <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setSearch("")}
                          data-testid="button-clear-search"
                      >
                        Clear search
                      </Button>
                  )}
                </div>
            ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><SortButton column="label" label="Product" /></TableHead>
                      <TableHead className="w-[120px]">SKU</TableHead>
                      <TableHead className="w-[120px]">Category</TableHead>
                      <TableHead className="w-[90px] text-right">Locations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((product) => (
                        <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
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