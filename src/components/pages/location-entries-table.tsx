import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type { ProductLocationView } from "@/lib/schema";

interface LocationsTableProps {
  entries: ProductLocationView[];
  isLoading: boolean;
  editingEntry: ProductLocationView | null;
  onEdit: (entry: ProductLocationView) => void;
  onCancelEdit: () => void;
  onDelete: (entry: ProductLocationView) => void;
  onSubmitQuantity: (id: string, value: string) => void;
}

export function LocationsTable({
  entries,
  isLoading,
  editingEntry,
  onEdit,
  onCancelEdit,
  onDelete,
  onSubmitQuantity,
}: LocationsTableProps) {
  return (
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
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="w-[90px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} data-testid={`row-location-${entry.id}`}>
                  <TableCell className="font-mono text-sm font-medium">
                    {entry.location_label || "—"}
                  </TableCell>

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
                            if (e.key === "Enter") onSubmitQuantity(entry.id, input.value);
                            if (e.key === "Escape") onCancelEdit();
                          }}
                          data-testid={`input-quantity-${entry.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            const input =
                              e.currentTarget.previousElementSibling as HTMLInputElement | null;
                            onSubmitQuantity(entry.id, input?.value ?? "0");
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
                        onClick={() => onEdit(entry)}
                        data-testid={`button-edit-location-${entry.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(entry)}
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
  );
}
