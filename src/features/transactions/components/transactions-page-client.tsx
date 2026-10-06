"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatsCards } from "@/features/transactions/components/stats-cards";
import { TransactionSearch } from "@/features/transactions/components/transaction-search";
import { TransactionFilters } from "@/features/transactions/components/transaction-filters";
import { ActiveFilters } from "@/features/transactions/components/active-filters";
import { TransactionTable } from "@/features/transactions/components/transaction-table";
import { TransactionPagination } from "@/features/transactions/components/transaction-pagination";
import { BulkActionBar } from "@/features/transactions/components/bulk-action-bar";
import { ExportDropdown } from "@/features/transactions/components/export-dropdown";
import { TransactionDetailDialog } from "@/features/transactions/components/transaction-detail-dialog";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import { useTransactionFilters } from "@/features/transactions/hooks/use-transaction-filters";
import type {
  TransactionRow,
  TransactionSortField,
  SortDirection,
  TransactionFilters as Filters,
} from "@/features/transactions/types";

export function TransactionsPageClient() {
  const {
    state,
    apiParams,
    activeFilterCount,
    setFilter,
    setFilters,
    resetFilters,
    clearFilter,
  } = useTransactionFilters();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useTransactions({
    params: apiParams,
  });

  const transactions = data?.data ?? [];
  const stats = data?.stats;

  const handleSort = (
    field: TransactionSortField,
    direction: SortDirection,
  ) => {
    setFilters({ sortField: field, sortDirection: direction, page: 1 });
  };

  const handleRowClick = (row: TransactionRow) => {
    setDetailId(row.id);
  };

  const handleFilterChange = (patch: Partial<typeof state>) => {
    setSelectedIds(new Set());
    setFilters(patch);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all transactions in real-time.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-fit gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <TransactionSearch
            value={state.search}
            onChange={(v: string) =>
              handleFilterChange({ search: v || undefined })
            }
            onClear={() => handleFilterChange({ search: undefined })}
          />

          <TransactionFilters
            filters={state}
            onChange={(patch: Partial<Filters>) => handleFilterChange(patch)}
            onReset={resetFilters}
            activeCount={activeFilterCount}
          />
        </div>

        <ExportDropdown
          filters={state}
          selectedIds={Array.from(selectedIds)}
        />
      </div>

      {/* Active Filters */}
      <ActiveFilters
        filters={state}
        onRemove={clearFilter}
        onReset={resetFilters}
        activeCount={activeFilterCount}
      />

      {/* Table */}
      <TransactionTable
        data={transactions}
        isLoading={isLoading}
        isFetching={isFetching && !isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortField={state.sortField}
        sortDirection={state.sortDirection}
        onSort={handleSort}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {data && data.total > 0 && (
        <TransactionPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(page: number) => setFilter("page", page)}
          onPageSizeChange={(size: number) => {
            setSelectedIds(new Set());
            setFilters({ pageSize: size, page: 1 });
          }}
        />
      )}

      {/* Bulk Bar */}
      <BulkActionBar
        selectedIds={Array.from(selectedIds)}
        onClearSelection={() => setSelectedIds(new Set())}
        onSuccess={() => setSelectedIds(new Set())}
      />

      {/* Detail Dialog */}
      <TransactionDetailDialog
        transactionId={detailId}
        open={!!detailId}
        onOpenChange={(open: boolean) => {
          if (!open) setDetailId(null);
        }}
      />
    </div>
  );
}