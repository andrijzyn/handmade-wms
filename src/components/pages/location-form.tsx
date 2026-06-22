"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getErrorStatus, getErrorMessage } from "@/lib/apiClientError";
import type { Product, ProductLocationView, Location } from "@/lib/schema";
import {
  insertProductLocationSchema,
  type InsertProductLocation,
} from "@/lib/schema";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AllocationBanner } from "./location-allocation-banner";
import { LocationsTable } from "./location-entries-table";
import { AddLocationDialog } from "./location-add-dialog";
import { DeleteLocationDialog } from "./location-delete-dialog";

interface ProductLocationsFormProps {
  product: Product;
  onClose: () => void;
}

function getLocationMutationMessage(error: unknown) {
  const status = getErrorStatus(error);
  if (status === 403) return "You do not have permission to manage locations.";
  if (status === 409) return "This location is already linked to the product.";
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
  const usedLocationIds = entries.map((entry) => entry.location_id);
  const availableLocations = allLocations.filter(
    (loc) => !usedLocationIds.includes(loc.id),
  );

  const form = useForm<InsertProductLocation>({
    resolver: zodResolver(
      insertProductLocationSchema,
    ) as Resolver<InsertProductLocation>,
    defaultValues: { product_id: product.id, location_id: "", quantity: 0 },
  });

  function resetAddForm() {
    form.reset({ product_id: product.id, location_id: "", quantity: 0 });
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

      <AllocationBanner product={product} allocated={allocated} />

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

      <LocationsTable
        entries={entries}
        isLoading={isLoading}
        editingEntry={editingEntry}
        onEdit={setEditingEntry}
        onCancelEdit={() => setEditingEntry(null)}
        onDelete={setDeletingEntry}
        onSubmitQuantity={(id, value) =>
          updateMutation.mutate({ id, quantity: parseInt(value, 10) || 0 })
        }
      />

      <AddLocationDialog
        open={dialogOpen}
        onClose={closeAddDialog}
        form={form}
        onSubmit={(data) => createMutation.mutate(data)}
        usedLocationIds={usedLocationIds}
        isPending={createMutation.isPending}
      />

      <DeleteLocationDialog
        entry={deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirm={() => deletingEntry && deleteMutation.mutate(deletingEntry.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
