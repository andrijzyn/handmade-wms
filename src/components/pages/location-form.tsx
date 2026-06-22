"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product, ProductLocationView, Location } from "@/lib/schema";
import {
  insertProductLocationSchema,
  type InsertProductLocation,
} from "@/lib/schema";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { LocationSearch } from "./location-search";

interface ProductLocationsFormProps {
  product: Product;
  onClose: () => void;
}


function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }

  if (error instanceof Error) {
    const match = error.message.match(/^(\d{3}):/);
    if (match) return Number(match[1]);
  }

  return undefined;
}

function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (!(error instanceof Error)) return fallback;

  const raw = error.message.trim();
  if (!raw) return fallback;

  const colonIndex = raw.indexOf(":");
  const body = colonIndex >= 0 ? raw.slice(colonIndex + 1).trim() : raw;

  if (body.startsWith("{") && body.endsWith("}")) {
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {}
  }

  return body || fallback;
}

function getLocationMutationMessage(error: unknown) {
  const status = getErrorStatus(error);

  if (status === 403) {
    return "You do not have permission to manage locations.";
  }

  if (status === 409) {
    return "This location is already linked to the product.";
  }

  return getErrorMessage(error);
}

export default function LocationForm({
  product,
  onClose,
}: ProductLocationsFormProps) {
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProductLocationView | null>(
    null,
  );
  const [deletingEntry, setDeletingEntry] =
    useState<ProductLocationView | null>(null);

  const locationsQueryKey = [`/api/products/${product.id}/locations`] as const;

  const { data: entries = [], isLoading } = useQuery<ProductLocationView[]>({
    queryKey: locationsQueryKey,
  });

  const { data: allLocations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const allocated = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const delta = product.quantity - allocated;

  const usedLocationIds = new Set(entries.map((entry) => entry.location_id));
  const availableLocations = allLocations.filter(
    (location) => !usedLocationIds.has(location.id),
  );

  const form = useForm<InsertProductLocation>({
    resolver: zodResolver(insertProductLocationSchema) as Resolver<InsertProductLocation>,
    defaultValues: {
      product_id: product.id,
      location_id: "",
      quantity: 0,
    },
  });

  function resetAddForm() {
    form.reset({
      product_id: product.id,
      location_id: "",
      quantity: 0,
    });
  }

  function openAddDialog() {
    resetAddForm();
    setDialogOpen(true);
  }

  function closeAddDialog() {
    setDialogOpen(false);
    resetAddForm();
  }

  function invalidateEntries() {
    queryClient.invalidateQueries({ queryKey: locationsQueryKey });
  }

  function showMutationError(error: unknown) {
    toast({
      title: "Error",
      description: getLocationMutationMessage(error),
      variant: "destructive",
    });
  }

  const createMutation = useMutation({
    mutationFn: async (data: InsertProductLocation) => {
      await apiRequest("POST", `/api/products/${product.id}/locations`, data);
    },
    onSuccess: () => {
      invalidateEntries();
      toast({ title: "Location added" });
      closeAddDialog();
    },
    onError: showMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await apiRequest("PATCH", `/api/product-locations/${id}`, { quantity });
    },
    onSuccess: () => {
      invalidateEntries();
      toast({ title: "Quantity updated" });
      setEditingEntry(null);
    },
    onError: showMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/product-locations/${id}`);
    },
    onSuccess: () => {
      invalidateEntries();
      toast({ title: "Location removed" });
      setDeletingEntry(null);
    },
    onError: showMutationError,
  });

  function onSubmit(data: InsertProductLocation) {
    createMutation.mutate(data);
  }

  function submitInlineQuantity(id: string, value: string) {
    updateMutation.mutate({
      id,
      quantity: parseInt(value, 10) || 0,
    });
  }

  return (
    <div className="space-y-5" data-testid="product-locations-page">
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
          <h1 className="text-xl font-semibold tracking-tight">
            Locations: {product.name}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            SKU: {product.sku} · Total quantity: {product.quantity}
          </p>
        </div>
      </div>

      <Card
        className={
          delta === 0
            ? "border-emerald-300 dark:border-emerald-700"
            : delta < 0
              ? "border-destructive"
              : "border-amber-300 dark:border-amber-700"
        }
      >
        <CardContent className="flex items-center gap-3 py-4">
          {delta === 0 && (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          )}
          {delta > 0 && (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
          {delta < 0 && <XCircle className="h-5 w-5 text-destructive" />}

          <div className="flex flex-1 items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Allocated: </span>
              <span className="font-mono">{allocated}</span>
              <span className="text-muted-foreground">
                {" "}
                / {product.quantity}
              </span>
            </div>

            <Badge
              variant={
                delta === 0 ? "outline" : delta < 0 ? "destructive" : "outline"
              }
              className={
                delta === 0
                  ? "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                  : delta > 0
                    ? "border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                    : ""
              }
            >
              {delta === 0
                ? "Balanced"
                : delta > 0
                  ? `Unallocated: +${delta}`
                  : `Exceeded: ${delta}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {entries.length === 0
            ? "No linked locations"
            : `${entries.length} location${entries.length === 1 ? "" : "s"}`}
        </h2>

        <Button
          size="sm"
          onClick={openAddDialog}
          disabled={availableLocations.length === 0}
          data-testid="button-add-location"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add location
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              This product has no linked locations yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  {/*<TableHead>Row / Column / Level</TableHead>*/}
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="w-[90px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    data-testid={`row-location-${entry.id}`}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {entry.location_label || "—"}
                    </TableCell>

                    {/*<TableCell className="text-sm text-muted-foreground">*/}
                    {/*  {entry.location_row != null &&*/}
                    {/*  entry.location_col != null &&*/}
                    {/*  entry.location_level != null &&*/}
                    {/*  !(entry.location_row === 0 && entry.location_col === 0 && entry.location_level === 0)*/}
                    {/*    ? `R${String(entry.location_row).padStart(3, "0")} / C${String(entry.location_col).padStart(3, "0")} / L${entry.location_level}`*/}
                    {/*    : "—"}*/}
                    {/*</TableCell>*/}

                    <TableCell className="text-right font-mono text-sm">
                      {editingEntry?.id === entry.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            min="0"
                            defaultValue={entry.quantity}
                            className="h-7 w-24 text-right font-mono text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              const input = e.currentTarget;

                              if (e.key === "Enter") {
                                submitInlineQuantity(entry.id, input.value);
                              }

                              if (e.key === "Escape") {
                                setEditingEntry(null);
                              }
                            }}
                            data-testid={`input-quantity-${entry.id}`}
                          />

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              const input = e.currentTarget
                                .previousElementSibling as HTMLInputElement | null;

                              submitInlineQuantity(
                                entry.id,
                                input?.value ?? "0",
                              );
                            }}
                          >
                            ✓
                          </Button>
                        </div>
                      ) : (
                        entry.quantity
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingEntry(entry)}
                          data-testid={`button-edit-location-${entry.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingEntry(entry)}
                          data-testid={`button-delete-location-${entry.id}`}
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeAddDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add location</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <LocationSearch
                        value={field.value}
                        onChange={field.onChange}
                        excludeIds={Array.from(usedLocationIds)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 0)
                        }
                        data-testid="input-location-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-location"
                >
                  {createMutation.isPending ? "Adding..." : "Add"}
                </Button>

                <Button type="button" variant="ghost" onClick={closeAddDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingEntry)}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove location?</AlertDialogTitle>
            <AlertDialogDescription>
              The link between this product and location{" "}
              <strong>{deletingEntry?.location_label}</strong> will be removed.{" "}
              {deletingEntry?.quantity} unit(s) will return to the unallocated
              balance.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={() =>
                deletingEntry && deleteMutation.mutate(deletingEntry.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-location"
            >
              {deleteMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
