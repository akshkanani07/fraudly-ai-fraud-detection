"use client";

import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportTransactions } from "@/features/transactions/hooks/use-bulk-action";
import type {
  ExportFormat,
  TransactionFilters,
} from "@/features/transactions/types";

interface ExportDropdownProps {
  filters: TransactionFilters;
  selectedIds?: string[];
  disabled?: boolean;
}

export function ExportDropdown({
  filters,
  selectedIds,
  disabled,
}: ExportDropdownProps) {
  const mutation = useExportTransactions();

  const run = (format: ExportFormat) => {
    mutation.mutate({
      format,
      ids: selectedIds && selectedIds.length > 0 ? selectedIds : undefined,
      filters:
        selectedIds && selectedIds.length > 0 ? undefined : filters,
    });
  };

  const label =
    selectedIds && selectedIds.length > 0
      ? `Export ${selectedIds.length} selected`
      : "Export all (filtered)";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="gap-2"
            disabled={disabled || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {label}
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => run("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Download as CSV
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => run("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Download as Excel (.xlsx)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => run("pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Download as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}