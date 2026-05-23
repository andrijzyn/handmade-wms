"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simplified calendar stub — not used in StockPulse
function Calendar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-3", className)} {...props} />;
}
Calendar.displayName = "Calendar";

export { Calendar };
