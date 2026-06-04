"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createApiClientErrorFromResponse,
  getErrorMessage,
  getErrorStatus,
} from "@/lib/apiClientError";
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/pages/product-form";

type SortKey = "name" | "sku" | "category" | "quantity" | "price";
type SortDir = "asc" | "desc";

type SortButtonProps = {
  column: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggle: (key: SortKey) => void;
};

function getProductsErrorMessage(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 403) return "You do not have permission to view products.";
  return getErrorMessage(error, "Failed to fetch products.");
}

function getDeleteProductErrorMessage(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 403) return "You do not have permission to delete products.";
  return getErrorMessage(error, "Failed to delete the product.");
}

async function fetchProducts(
  search: string,
  categoryFilter: string,
): Promise<Product[]> {
  const params = new URLSearchParams();

  if (search) {
    params.set("q", search);
  }

  if (categoryFilter && categoryFilter !== "all") {
    params.set("category", categoryFilter);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/products?${queryString}` : "/api/products";

  const res = await fetch(url);

  if (!res.ok) {
    throw await createApiClientErrorFromResponse(res, "Failed to fetch products");
  }

  return (await res.json()) as Product[];
}

function getStockBadge(product: Product) {
  if (product.quantity === 0) {
    return (
      <Badge
        variant="destructive"
        className="text-xs"
        data-testid={`status-stock-${product.id}`}
      >
        Out of stock
      </Badge>
    );
  }

  if (product.quantity <= product.lowStockThreshold) {
    return (
      <Badge
        variant="outline"
        className="border-amber-300 text-xs text-amber-600 dark:border-amber-700 dark:text-amber-400"
        data-testid={`status-stock-${product.id}`}
      >
        Low stock
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-emerald-300 text-xs text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
      data-testid={`status-stock-${product.id}`}
    >
      In stock
    </Badge>
  );
}

function SortButton({
                      column,
                      label,
                      sortKey,
                      sortDir,
                      onToggle,
                    }: SortButtonProps) {
  const isActive = sortKey === column;

  return (
    <button
      type="button"
      onClick={() => onToggle(column)}
      className="flex items-center gap-1 transition-colors hover:text-foreground"
      data-testid={`button-sort-${column}`}
    >
      <span>{label}</span>
      <ArrowUpDown className="h-3 w-3 opacity-50" />
      {isActive ? (
        <span className="text-xs text-muted-foreground">
          {sortDir === "asc" ? "↑" : "↓"}
        </span>
      ) : null}
    </button>
  );
}

export default function Products() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<Product[]>({
    queryKey: ["/api/products", { q: search, category: categoryFilter }],
    queryFn: () => fetchProducts(search, categoryFilter),
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/categories"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });

      toast({
        title: "Product deleted",
        description: "The product has been removed from inventory.",
      });

      setDeletingProduct(null);
    },
    onError: (error: unknown) => {
      toast({
        title: getErrorStatus(error) === 403 ? "Access denied" : "Error",
        description: getDeleteProductErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let cmp = 0;

      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "sku") cmp = a.sku.localeCompare(b.sku);
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      else if (sortKey === "quantity") cmp = a.quantity - b.quantity;
      else if (sortKey === "price") cmp = a.price - b.price;

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

  if (showForm || editingProduct) {
    return (
      <ProductForm
        product={editingProduct ?? undefined}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5" data-testid="products-page">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold tracking-tight"
            data-testid="text-page-title"
          >
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} items in inventory
          </p>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          data-testid="button-add-product"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, SKU, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger
            className="w-full sm:w-[180px]"
            data-testid="select-category-filter"
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-destructive">
                {getProductsErrorMessage(error)}
              </p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">No products found</p>

              {(search || categoryFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">
                    <SortButton
                      column="name"
                      label="Name"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton
                      column="sku"
                      label="SKU"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[130px]">
                    <SortButton
                      column="category"
                      label="Category"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[100px] text-right">
                    <SortButton
                      column="quantity"
                      label="Qty"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[100px] text-right">
                    <SortButton
                      column="price"
                      label="Price"
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[90px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    data-testid={`row-product-${product.id}`}
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        {product.description ? (
                          <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                            {product.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {product.sku}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {product.category}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right font-mono text-sm">
                      {product.quantity}
                    </TableCell>

                    <TableCell className="text-right font-mono text-sm">
                      ${product.price.toFixed(2)}
                    </TableCell>

                    <TableCell>{getStockBadge(product)}</TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingProduct(product)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingProduct(product)}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={() => setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingProduct?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                if (deletingProduct) {
                  deleteMutation.mutate(deletingProduct.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
