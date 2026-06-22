import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { Product } from "@/lib/schema";

interface AllocationBannerProps {
  product: Product;
  allocated: number;
}

export function AllocationBanner({ product, allocated }: AllocationBannerProps) {
  const delta = product.quantity - allocated;

  return (
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
            <span className="text-muted-foreground"> / {product.quantity}</span>
          </div>

          <Badge
            variant={delta === 0 ? "outline" : delta < 0 ? "destructive" : "outline"}
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
  );
}
