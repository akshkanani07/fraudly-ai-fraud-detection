"use client";

import { useState } from "react";
import {
  Ban,
  CheckCircle2,
  Flag,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSACTION_STATUS_OPTIONS } from "@/features/transactions/constants";
import { useBulkAction } from "@/features/transactions/hooks/use-bulk-action";
import type {
  BulkActionPayload,
  TransactionStatus,
} from "@/features/transactions/types";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess?: () => void;
}

export function BulkActionBar({
  selectedIds,
  onClearSelection,
  onSuccess,
}: BulkActionBarProps) {
  const count = selectedIds.length;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>("APPROVED");

  const mutation = useBulkAction();

  if (count === 0) return null;

  const run = (payload: BulkActionPayload) => {
    mutation.mutate(payload, {
      onSuccess: () => {
        onClearSelection();
        onSuccess?.();
      },
    });
  };

  return (
    <>
      {/* Floating Bar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform",
          "flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 shadow-2xl backdrop-blur",
        )}
      >
        <Badge variant="secondary" className="h-7 rounded-full px-3 text-xs">
          {count} selected
        </Badge>

        {/* Update Status */}
        <div className="flex items-center gap-1">
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as TransactionStatus)}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={mutation.isPending}
            onClick={() =>
              run({ action: "UPDATE_STATUS", ids: selectedIds, status })
            }
          >
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            Set
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Mark Fraud */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-red-600 hover:text-red-600 dark:text-red-400"
          disabled={mutation.isPending}
          onClick={() => run({ action: "MARK_FRAUD", ids: selectedIds })}
        >
          <Flag className="mr-1.5 h-3.5 w-3.5" />
          Fraud
        </Button>

        {/* Mark Legitimate */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
          disabled={mutation.isPending}
          onClick={() => run({ action: "MARK_LEGITIMATE", ids: selectedIds })}
        >
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          Legit
        </Button>

        {/* Delete */}
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-destructive hover:text-destructive"
          disabled={mutation.isPending}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Loading / Clear */}
        {mutation.isPending ? (
          <div className="flex h-8 items-center gap-1.5 px-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Working...
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {count} transaction(s)?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All associated predictions and
              audit entries will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => {
                setConfirmDelete(false);
                run({ action: "DELETE", ids: selectedIds });
              }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Delete permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}