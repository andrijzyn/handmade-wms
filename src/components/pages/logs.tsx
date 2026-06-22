"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogsFilters } from "./logs-filters";
import { LogsTable, type AuditAction, type AuditLogItem } from "./logs-table";

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
          { cache: "no-store" },
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

  function toggleRow(id: string) {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleResetFilters() {
    setQuery("");
    setSelectedTable("all");
    setSelectedAction("all");
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

      <LogsFilters
        query={query}
        onQueryChange={setQuery}
        selectedTable={selectedTable}
        onTableChange={setSelectedTable}
        selectedAction={selectedAction}
        onActionChange={setSelectedAction}
        tableOptions={tableOptions}
        onApply={() => fetchLogs()}
        onReset={handleResetFilters}
      />

      <LogsTable
        loading={loading}
        logs={logs}
        expandedRows={expandedRows}
        onToggleRow={toggleRow}
      />
    </section>
  );
}
