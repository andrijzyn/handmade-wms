import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditAction } from "./logs-table";

interface LogsFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  selectedTable: string;
  onTableChange: (t: string) => void;
  selectedAction: AuditAction | "all";
  onActionChange: (a: AuditAction | "all") => void;
  tableOptions: string[];
  onApply: () => void;
  onReset: () => void;
}

export function LogsFilters({
  query,
  onQueryChange,
  selectedTable,
  onTableChange,
  selectedAction,
  onActionChange,
  tableOptions,
  onApply,
  onReset,
}: LogsFiltersProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto_auto] gap-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search table, record ID, correlation ID..."
            className="w-full h-10 rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="input-logs-search"
          />
        </div>

        <select
          value={selectedTable}
          onChange={(e) => onTableChange(e.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="select-logs-table"
        >
          <option value="all">All tables</option>
          {tableOptions.map((table_name, index) => (
            <option key={`table-${table_name}-${index}`} value={table_name}>
              {table_name}
            </option>
          ))}
        </select>

        <select
          value={selectedAction}
          onChange={(e) => onActionChange(e.target.value as AuditAction | "all")}
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="select-logs-action"
        >
          <option value="all">All actions</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>

        <Button onClick={onApply} data-testid="button-apply-logs-filters">
          Apply
        </Button>

        <Button variant="outline" onClick={onReset} data-testid="button-reset-logs-filters">
          Reset
        </Button>
      </div>
    </div>
  );
}
