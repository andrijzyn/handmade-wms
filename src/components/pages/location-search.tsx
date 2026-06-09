"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Location } from "@/lib/schema";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  value: string;
  onChange: (location_id: string) => void;
  excludeIds?: string[];
  initialLabel?: string;
}

export function LocationSearch({
  value,
  onChange,
  excludeIds,
  initialLabel = "",
}: LocationSearchProps) {
  const excluded = excludeIds ?? [];
  const [input, setInput] = useState(initialLabel);
  const [open, setOpen] = useState(false);

  const { data: results = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", input],
    queryFn: async () => {
      if (input.length < 2) return [];
      const res = await fetch(`/api/locations?q=${encodeURIComponent(input)}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: input.length >= 2,
  });

  const available = results.filter((l) => !excluded.includes(l.id));

  function select(loc: Location) {
    setInput(loc.label);
    setOpen(false);
    onChange(loc.id);
  }

  function handleInput(val: string) {
    setInput(val);
    setOpen(true);
    if (!val) onChange("");
  }

  return (
    <div className="relative">
      <Input
        placeholder="Enter label... (R001C007L10)"
        value={input}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => input.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="font-mono"
        data-testid="input-location-search"
      />
      {open && available.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md overflow-y-auto max-h-60">
          {available.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onMouseDown={() => select(loc)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                value === loc.id && "bg-accent",
              )}
              data-testid={`option-location-${loc.id}`}
            >
              <span className="font-mono font-medium">{loc.label}</span>
              <span className="text-xs text-muted-foreground">
                R{String(loc.row).padStart(3, "0")} C
                {String(loc.col).padStart(3, "0")} L{loc.level}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && input.length >= 2 && available.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md px-3 py-4 text-sm text-muted-foreground text-center">
          No locations found
        </div>
      )}
    </div>
  );
}
