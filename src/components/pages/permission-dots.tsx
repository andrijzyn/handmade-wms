import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

type AccessLevel = "none" | "read" | "write";

interface PermissionResource {
  label: string;
  read: Permission;
  write?: Permission;
  del?: Permission;
}

const RESOURCES: PermissionResource[] = [
  {
    label: "Products",
    read: PERMISSIONS.READ_PRODUCTS,
    write: PERMISSIONS.WRITE_PRODUCTS,
    del: PERMISSIONS.DELETE_PRODUCTS,
  },
  {
    label: "Locations",
    read: PERMISSIONS.READ_LOCATIONS,
    write: PERMISSIONS.WRITE_LOCATIONS,
    del: PERMISSIONS.DELETE_LOCATIONS,
  },
  {
    label: "Users",
    read: PERMISSIONS.READ_USERS,
    write: PERMISSIONS.WRITE_USERS,
    del: PERMISSIONS.DELETE_USERS,
  },
  { label: "Logs", read: PERMISSIONS.READ_LOGS },
];

const levelStyles: Record<AccessLevel, string> = {
  none: "bg-rose-500",
  read: "bg-amber-500",
  write: "bg-emerald-500",
};

const levelLabel: Record<AccessLevel, string> = {
  none: "No access",
  read: "Can view",
  write: "Can edit",
};

function accessLevel(
  permissions: Permission[],
  resource: PermissionResource,
): AccessLevel {
  if (
    (resource.write && permissions.includes(resource.write)) ||
    (resource.del && permissions.includes(resource.del))
  ) {
    return "write";
  }
  if (permissions.includes(resource.read)) return "read";
  return "none";
}

export function PermissionDotsHint() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex cursor-help text-muted-foreground"
          aria-label="Explain permission dot order"
          data-testid="permission-dots-hint"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 text-xs" sideOffset={4}>
        Dot order: {RESOURCES.map((r) => r.label).join(", ")}
      </PopoverContent>
    </Popover>
  );
}

export function PermissionDots({ permissions }: { permissions: Permission[] }) {
  return (
    <div className="flex items-center gap-1.5" data-testid="permission-dots">
      {RESOURCES.map((resource) => {
        const level = accessLevel(permissions, resource);

        return (
          <Tooltip key={resource.label}>
            <TooltipTrigger asChild>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${levelStyles[level]}`}
                data-testid={`permission-dot-${resource.label.toLowerCase()}-${level}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              {resource.label}: {levelLabel[level]}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
