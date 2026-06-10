"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AuditAction = "INSERT" | "UPDATE" | "DELETE" | "REPLACE_PERMISSIONS";

type AuditLogItem = {
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
  DELETE:
    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  REPLACE_PERMISSIONS:
    "bg-black-500/10 text-rose-700 dark:text-red-400 border-rose-500/20",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState("all");
  const [selectedAction, setSelectedAction] = useState<AuditAction | "all">(
    "all",
  );
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchLogs = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (selectedTable !== "all") params.set("table_name", selectedTable);
        if (selectedAction !== "all") params.set("action", selectedAction);

        const res = await fetch(
          `/api/logs${params.toString() ? `?${params.toString()}` : ""}`,
          {
            cache: "no-store",
          },
        );

        if (!res.ok) {
          console.error(
            "Failed to fetch audit logs:",
            res.status,
            res.statusText,
          );
          setLogs([]);
          return;
        }

        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        setLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query, selectedTable, selectedAction],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const tableOptions = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) => log.table_name)
          .filter((value): value is string => Boolean(value?.trim())),
      ),
    ).sort();
  }, [logs]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedTable("all");
    setSelectedAction("all");
  };

  function renderAuditNewValue(newValues: any) {
    const diff = newValues?.diff;

    if (diff && typeof diff === "object" && !Array.isArray(diff)) {
      const entries = Object.entries(diff);

      if (entries.length === 0) {
        return <span className="text-muted-foreground">No changes</span>;
      }

      return (
        <div className="space-y-2">
          {entries.map(([field, change]) => {
            const typedChange = change as { old?: unknown; new?: unknown };

            return (
              <div
                key={field}
                // className="rounded-md border p-2 text-sm"
              >
                <div className="font-medium">{field}</div>
                <div className="mt-1 grid grid-cols-[80px_1fr] gap-x-2 gap-y-1">
                  <span className="text-muted-foreground">Old</span>
                  <code>{JSON.stringify(typedChange.old)}</code>

                  <span className="text-muted-foreground">New</span>
                  <code>{JSON.stringify(typedChange.new)}</code>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return <pre className="text-xs">{JSON.stringify(newValues, null, 2)}</pre>;
  }

  function renderOldValues(oldValues: Record<string, unknown> | null | undefined) {
    if (!oldValues || Object.keys(oldValues).length === 0) {
      return <span className="text-muted-foreground">No previous values</span>;
    }

    return (
      <div className="space-y-1.5">
        {Object.entries(oldValues).map(([key, value]) => (
          <div
            key={key}
            className="flex items-start justify-between gap-4 rounded-md border px-3 py-2"
          >
          <span className="min-w-[140px] font-mono text-xs text-muted-foreground">
            {key}
          </span>

            <code className="text-right font-mono text-sm whitespace-pre-wrap break-all">
              {formatAuditValue(value)}
            </code>
          </div>
        ))}
      </div>
    );
  }

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
          <div
            key={key}>
            <div className="font-mono text-xs text-muted-foreground">{key}</div>
            {formatAuditValue(fieldValue)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6" data-testid="logs-page">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            History of changes across system entities and user actions.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="gap-2"
          data-testid="button-refresh-logs"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto_auto] gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search table, record ID, correlation ID..."
              className="w-full h-10 rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="input-logs-search"
            />
          </div>

          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
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
            onChange={(e) =>
              setSelectedAction(e.target.value as AuditAction | "all")
            }
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="select-logs-action"
          >
            <option value="all">All actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <Button
            onClick={handleApplyFilters}
            data-testid="button-apply-logs-filters"
          >
            Apply
          </Button>

          <Button
            variant="outline"
            onClick={handleResetFilters}
            data-testid="button-reset-logs-filters"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No audit logs found.
          </div>
        ) : (
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
                            onClick={() => toggleRow(log.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted"
                            aria-label={expanded ? "Collapse log details" : "Expand log details"}
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
                          <div>{log.actorUsername ?? log.actorFullName ?? "System"}</div>
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
                                  {log.action === "UPDATE" || log.action === "REPLACE_PERMISSIONS"
                                    ? "Changes"
                                    : "New values"}
                                </h3>
                                <div className="rounded-md border bg-background p-3">
                                  {renderAuditNewValue(log.new_values)}
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
        )}
      </div>
    </section>
  );
}
