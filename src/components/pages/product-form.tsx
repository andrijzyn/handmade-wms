"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertProductSchema,
  type InsertProduct,
  type Product,
} from "@/lib/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  getErrorMessage,
  getErrorStatus,
  type ApiClientError,
} from "@/lib/apiClientError";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
}

function getProductMutationMessage(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 403) return "You do not have permission to manage products.";
  if (status === 409) return "A product with this SKU already exists.";
  return getErrorMessage(error);
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const { toast } = useToast();
  const isEditing = !!product;

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema) as any,
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      category: product?.category ?? "",
      quantity: product?.quantity ?? 0,
      price: product?.price ?? 0,
      low_stock_threshold: product?.low_stock_threshold ?? 10,
      description: product?.description ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      if (isEditing) {
        await apiRequest("PATCH", `/api/products/${product.id}`, data);
      } else {
        await apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });

      toast({
        title: isEditing ? "Product updated" : "Product created",
        description: isEditing
          ? "The product has been updated successfully."
          : "The product has been added to inventory.",
      });

      onClose();
    },
    onError: (error: ApiClientError) => {
      toast({
        title: getErrorStatus(error) === 403 ? "Access denied" : "Error",
        description: getProductMutationMessage(error),
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertProduct) {
    mutation.mutate(data);
  }

  return (
    <div className="space-y-5" data-testid="product-form-page">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1
            className="text-xl font-semibold tracking-tight"
            data-testid="text-form-title"
          >
            {isEditing ? "Edit Product" : "Add Product"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isEditing
              ? "Update the product details below"
              : "Fill in the product details below"}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Wireless Mouse"
                          {...field}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. WM-001"
                          {...field}
                          data-testid="input-sku"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Electronics"
                        {...field}
                        data-testid="input-category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="low_stock_threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Stock Alert</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                          data-testid="input-threshold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional product description..."
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-submit"
                >
                  {mutation.isPending
                    ? isEditing
                      ? "Updating..."
                      : "Creating..."
                    : isEditing
                      ? "Update Product"
                      : "Create Product"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
