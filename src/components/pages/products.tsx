"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  getErrorStatus,
  getErrorMessage,
  createApiClientErrorFromResponse,
} from "@/lib/apiClientError";
import type { Product } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/pages/product-form";
import { ProductsFilters } from "./products-filters";
import { ProductsTable, type SortKey, type SortDir } from "./products-table";
import { DeleteProductDialog } from "./products-delete-dialog";

async function fetchProducts(
  search: string,
  categoryFilter: string,
): Promise<Product[]> {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (categoryFilter && categoryFilter !== "all")
    params.set("category", categoryFilter);

  const queryString = params.toString();
  const url = queryString ? `/api/products?${queryString}` : "/api/products";
  const res = await fetch(url);

  if (!res.ok) {
    throw await createApiClientErrorFromResponse(res, "Failed to fetch products");
  }

  return (await res.json()) as Product[];
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
        description:
          getErrorStatus(error) === 403
            ? "You do not have permission to delete products."
            : getErrorMessage(error, "Failed to delete the product."),
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

        <Button onClick={() => setShowForm(true)} data-testid="button-add-product">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <ProductsFilters
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
      />

      <ProductsTable
        products={sortedProducts}
        isLoading={isLoading}
        isError={isError}
        error={error}
        search={search}
        categoryFilter={categoryFilter}
        onClearFilters={() => {
          setSearch("");
          setCategoryFilter("all");
        }}
        onEdit={setEditingProduct}
        onDelete={setDeletingProduct}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
      />

      <DeleteProductDialog
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() =>
          deletingProduct && deleteMutation.mutate(deletingProduct.id)
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
