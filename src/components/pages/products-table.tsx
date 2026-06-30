import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { getErrorMessage, getErrorStatus } from "@/lib/apiClientError";
import type { Product } from "@/lib/schema";

export type SortKey = "name" | "sku" | "category" | "quantity" | "price";
export type SortDir = "asc" | "desc";

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

  if (product.quantity <= product.low_stock_threshold) {
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
}: {
  column: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggle: (key: SortKey) => void;
}) {
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
      {isActive && (
        <span className="text-xs text-muted-foreground">
          {sortDir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );
}

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  search: string;
  categoryFilter: string;
  onClearFilters: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
}

export function ProductsTable({
  products,
  isLoading,
  isError,
  error,
  search,
  categoryFilter,
  onClearFilters,
  onEdit,
  onDelete,
  sortKey,
  sortDir,
  onToggleSort,
}: ProductsTableProps) {
  const sortProps = { sortKey, sortDir, onToggle: onToggleSort };

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-muted-foreground">Loading products...</div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-destructive">
              {getErrorStatus(error) === 403
                ? "You do not have permission to view products."
                : getErrorMessage(error, "Failed to fetch products.")}
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">No products found</p>
            {(search || categoryFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={onClearFilters}
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
                  <SortButton column="name" label="Name" {...sortProps} />
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortButton column="sku" label="SKU" {...sortProps} />
                </TableHead>
                <TableHead className="w-[130px]">
                  <SortButton column="category" label="Category" {...sortProps} />
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  <SortButton column="quantity" label="Qty" {...sortProps} />
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  <SortButton column="price" label="Price" {...sortProps} />
                </TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[90px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      {product.description && (
                        <p className="max-w-[240px] truncate text-xs text-muted-foreground">
                          {product.description}
                        </p>
                      )}
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
                        onClick={() => onEdit(product)}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(product)}
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
  );
}
