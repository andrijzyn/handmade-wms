import { Fragment } from "react";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PermissionDots,
  PermissionDotsHint,
} from "@/components/pages/permission-dots";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

const PERMISSION_VALUES = new Set<string>(Object.values(PERMISSIONS));

function isPermissionList(value: unknown): value is Permission[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "string" && PERMISSION_VALUES.has(v))
  );
}

export type AuditAction = "INSERT" | "UPDATE" | "DELETE" | "REPLACE_PERMISSIONS";

export type AuditLogItem = {
  id: string;
  table_name: string;
  record_id: string | null;
  action: AuditAction;
  actor_user_id: string | null;
  actorUsername: string | null;
  actorFullName: string | null;
  correlation_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
};

const actionStyles: Record<AuditAction, string> = {
  INSERT:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  UPDATE:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  DELETE: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  REPLACE_PERMISSIONS:
    "bg-black-500/10 text-rose-700 dark:text-red-400 border-rose-500/20",
};

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function AuditObjectView({
  value,
  emptyLabel = "No data",
}: {
  value: Record<string, unknown> | null | undefined;
  emptyLabel?: string;
}) {
  if (!value || Object.keys(value).length === 0) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(value).map(([key, fieldValue]) => (
        <div key={key} className="min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            {key}
            {key === "permissions" && isPermissionList(fieldValue) && (
              <PermissionDotsHint />
            )}
          </div>
          {key === "permissions" && isPermissionList(fieldValue) ? (
            <PermissionDots permissions={fieldValue} />
          ) : (
            <div className="break-all">{formatAuditValue(fieldValue)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function AuditNewValues({
  newValues,
}: {
  newValues: Record<string, unknown> | null;
}) {
  const diff = newValues?.diff;

  if (diff && typeof diff === "object" && !Array.isArray(diff)) {
    const entries = Object.entries(diff as Record<string, unknown>);

    if (entries.length === 0) {
      return <span className="text-muted-foreground">No changes</span>;
    }

    return (
      <div className="space-y-2">
        {entries.map(([field, change]) => {
          const typedChange = change as { old?: unknown; new?: unknown };
          const isPermissionsField =
            field === "permissions" &&
            isPermissionList(typedChange.old) &&
            isPermissionList(typedChange.new);

          return (
            <div key={field} className="min-w-0">
              <div className="flex items-center gap-1.5 font-medium">
                {field}
                {isPermissionsField && <PermissionDotsHint />}
              </div>
              <div className="mt-1 grid grid-cols-[80px_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5">
                <span className="text-muted-foreground">Old</span>
                {isPermissionsField ? (
                  <PermissionDots permissions={typedChange.old as Permission[]} />
                ) : (
                  <code className="break-all">
                    {JSON.stringify(typedChange.old)}
                  </code>
                )}
                <span className="text-muted-foreground">New</span>
                {isPermissionsField ? (
                  <PermissionDots permissions={typedChange.new as Permission[]} />
                ) : (
                  <code className="break-all">
                    {JSON.stringify(typedChange.new)}
                  </code>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <AuditObjectView value={newValues} emptyLabel="No new values" />;
}

interface LogsTableProps {
  loading: boolean;
  logs: AuditLogItem[];
  expandedRows: Record<string, boolean>;
  onToggleRow: (id: string) => void;
}

export function LogsTable({
  loading,
  logs,
  expandedRows,
  onToggleRow,
}: LogsTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading audit logs...
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="py-16 text-center text-sm text-muted-foreground">
          No audit logs found.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr className="text-left">
              <th className="w-[44px] px-4 py-3"></th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Correlation ID</th>
              <th className="px-4 py-3 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const expanded = expandedRows[log.id] ?? false;

              return (
                <Fragment key={log.id}>
                  <tr className="border-b align-top transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggleRow(log.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted"
                        aria-label={
                          expanded ? "Collapse log details" : "Expand log details"
                        }
                      >
                        {expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{log.table_name}</div>
                      <div className="break-all text-xs text-muted-foreground">
                        {log.record_id ?? "No record ID"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={actionStyles[log.action]}
                        data-testid={`badge-action-${log.action.toLowerCase()}`}
                      >
                        {log.action}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div>
                        {log.actorUsername ?? log.actorFullName ?? "System"}
                      </div>
                      {log.actor_user_id && (
                        <div className="break-all text-xs text-muted-foreground">
                          {log.actor_user_id}
                        </div>
                      )}
                    </td>

                    <td className="break-all px-4 py-3 font-mono text-xs text-muted-foreground">
                      {log.correlation_id ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>

                  {expanded && (
                    <tr className="border-b bg-muted/10">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <section className="space-y-2">
                            <h3 className="text-sm font-medium">Old values</h3>
                            <div className="rounded-md border bg-background p-3">
                              <AuditObjectView
                                value={log.old_values}
                                emptyLabel="No previous values"
                              />
                            </div>
                          </section>

                          <section className="space-y-2">
                            <h3 className="text-sm font-medium">
                              {log.action === "UPDATE" ||
                              log.action === "REPLACE_PERMISSIONS"
                                ? "Changes"
                                : "New values"}
                            </h3>
                            <div className="rounded-md border bg-background p-3">
                              <AuditNewValues newValues={log.new_values} />
                            </div>
                          </section>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
