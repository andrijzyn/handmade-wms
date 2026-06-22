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
import type { ProductLocationView } from "@/lib/schema";

interface DeleteLocationDialogProps {
  entry: ProductLocationView | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteLocationDialog({
  entry,
  onClose,
  onConfirm,
  isPending,
}: DeleteLocationDialogProps) {
  return (
    <AlertDialog open={Boolean(entry)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove location?</AlertDialogTitle>
          <AlertDialogDescription>
            The link between this product and location{" "}
            <strong>{entry?.location_label}</strong> will be removed.{" "}
            {entry?.quantity} unit(s) will return to the unallocated balance.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete-location"
          >
            {isPending ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
