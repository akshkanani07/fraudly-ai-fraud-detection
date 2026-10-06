"use client";

import { useState } from "react";
import { Brain, CircleCheck, EllipsisVertical, Eye, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { useActivateModel, useDeleteModel, useModelDetail, useModels, useRetrainModel } from "../hooks/use-fraud";
import { getErrorMessage } from "../services/fraud-api";
import type { ModelRow } from "../types";
import { formatDateTime, formatNumber, formatPercent, humanize } from "../utils/format";
import { AlgorithmBadge, EmptyState, SectionCard, Stat, axisTick, tooltipStyle } from "./fraud-ui";

interface ModelLibraryProps {
  canTrain: boolean;
  canActivate: boolean;
  canRetrain: boolean;
  canDelete: boolean;
  onTrain: () => void;
  onJobStarted: (jobId: string) => void;
}

function MetricCell({ value }: { value: number | null }) {
  return <span className="font-mono text-sm">{formatPercent(value)}</span>;
}

function ModelDetailDialog({ modelId, onClose }: { modelId: string | null; onClose: () => void }) {
  const { data, isLoading } = useModelDetail(modelId);
  const model = data?.model;
  const metrics = data?.metrics;
  const matrix = model?.confusionMatrix;

  const cells = matrix
    ? [
        { label: "True negative", value: matrix.trueNegative, tone: "bg-success/15 text-success" },
        { label: "False positive", value: matrix.falsePositive, tone: "bg-warning/15 text-warning" },
        { label: "False negative", value: matrix.falseNegative, tone: "bg-destructive/15 text-destructive" },
        { label: "True positive", value: matrix.truePositive, tone: "bg-success/15 text-success" },
      ]
    : [];

  const importance = (model?.featureImportance ?? []).slice(0, 10);
  const maxImportance = Math.max(...importance.map((item) => item.importance), 1e-9);

  return (
    <Dialog open={Boolean(modelId)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{model?.name ?? "Model details"}</DialogTitle>
          <DialogDescription>
            {model ? `Version ${model.version} · trained ${formatDateTime(model.trainedAt)}` : "Loading model information"}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !model ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Accuracy" value={formatPercent(model.accuracy)} />
              <Stat label="Precision" value={formatPercent(model.precision)} />
              <Stat label="Recall" value={formatPercent(model.recall)} />
              <Stat label="F1 score" value={formatPercent(model.f1Score)} />
              <Stat label="ROC-AUC" value={formatPercent(model.rocAuc)} />
              <Stat label="PR-AUC" value={formatPercent(metrics?.prAuc)} />
              <Stat label="Specificity" value={formatPercent(metrics?.specificity)} />
              <Stat label="Threshold" value={formatPercent(metrics?.threshold)} hint="tuned for F1" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-semibold">Confusion matrix</h4>
                <div className="grid grid-cols-2 gap-2">
                  {cells.map((cell) => (
                    <div key={cell.label} className={cn("rounded-xl p-4 text-center", cell.tone)}>
                      <p className="font-mono text-xl font-semibold">{formatNumber(cell.value)}</p>
                      <p className="mt-1 text-[11px] opacity-80">{cell.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Top features</h4>
                <ul className="space-y-2.5">
                  {importance.map((item) => (
                    <li key={item.feature} className="space-y-1">
                      <div className="flex justify-between gap-3 text-xs">
                        <span className="truncate">{humanize(item.feature)}</span>
                        <span className="font-mono text-muted-foreground">{formatPercent(item.importance)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="gradient-brand h-full rounded-full" style={{ width: `${(item.importance / maxImportance) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {model.hyperparameters ? (
              <div>
                <h4 className="mb-3 text-sm font-semibold">Hyperparameters</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(model.hyperparameters).map(([key, value]) => (
                    <span key={key} className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-xs">
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ModelLibrary({ canTrain, canActivate, canRetrain, canDelete, onTrain, onJobStarted }: ModelLibraryProps) {
  const { data, isLoading } = useModels();
  const activate = useActivateModel();
  const remove = useDeleteModel();
  const retrain = useRetrainModel();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ModelRow | null>(null);

  const models = (data?.models ?? []).filter((model) => model.status !== "ARCHIVED");

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  if (models.length === 0) {
    return (
      <SectionCard>
        <EmptyState
          icon={Brain}
          title="Your model library is empty"
          description="Trained models appear here with their evaluation metrics so you can compare and activate the best one."
          action={
            canTrain ? (
              <Button onClick={onTrain} className="gradient-brand mt-2 text-white">
                <Sparkles className="size-4" />
                Train a model
              </Button>
            ) : null
          }
        />
      </SectionCard>
    );
  }

  const chartData = models.slice(0, 6).map((model) => ({
    name: `${model.name.split(" \u00b7 ")[0]?.slice(0, 14)} v${model.version}`,
    Precision: Math.round((model.precision ?? 0) * 1000) / 10,
    Recall: Math.round((model.recall ?? 0) * 1000) / 10,
    F1: Math.round((model.f1Score ?? 0) * 1000) / 10,
    "ROC-AUC": Math.round((model.rocAuc ?? 0) * 1000) / 10,
  }));

  return (
    <div className="space-y-6">
      <SectionCard title="Model comparison" description="Evaluation on a held-out test set (higher is better).">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={axisTick} unit="%" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Precision" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ROC-AUC" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Trained models" className="p-0 sm:p-0" description={undefined}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Model</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Recall</TableHead>
                <TableHead>F1</TableHead>
                <TableHead>ROC-AUC</TableHead>
                <TableHead>Predictions</TableHead>
                <TableHead>Trained</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id} className="group">
                  <TableCell className="pl-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name.split(" \u00b7 ")[0]}</span>
                        <span className="font-mono text-xs text-muted-foreground">v{model.version}</span>
                        {model.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                            <CircleCheck className="size-3" /> Active
                          </span>
                        ) : null}
                      </div>
                      <AlgorithmBadge algorithm={model.algorithm} />
                    </div>
                  </TableCell>
                  <TableCell><MetricCell value={model.precision} /></TableCell>
                  <TableCell><MetricCell value={model.recall} /></TableCell>
                  <TableCell><MetricCell value={model.f1Score} /></TableCell>
                  <TableCell><MetricCell value={model.rocAuc} /></TableCell>
                  <TableCell className="font-mono text-sm">{formatNumber(model.predictionCount)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(model.trainedAt)}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Model actions"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
                      >
                        <EllipsisVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setDetailId(model.id)}>
                          <Eye className="size-4" /> View details
                        </DropdownMenuItem>
                        {canActivate && !model.isActive && model.status === "READY" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              activate.mutate(model.id, {
                                onSuccess: () => toast.success(`${model.name} is now the active model`),
                                onError: (error) => toast.error(getErrorMessage(error)),
                              })
                            }
                          >
                            <CircleCheck className="size-4" /> Set as active
                          </DropdownMenuItem>
                        ) : null}
                        {canRetrain && model.mlModelId ? (
                          <DropdownMenuItem
                            onClick={() =>
                              retrain.mutate(model.id, {
                                onSuccess: ({ jobId }) => {
                                  toast.success("Retraining started");
                                  onJobStarted(jobId);
                                },
                                onError: (error) => toast.error(getErrorMessage(error)),
                              })
                            }
                          >
                            <RefreshCw className="size-4" /> Retrain
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete ? (
                          <DropdownMenuItem className="text-destructive" onClick={() => setPendingDelete(model)}>
                            <Trash2 className="size-4" /> {model.predictionCount > 0 ? "Archive" : "Delete"}
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <ModelDetailDialog modelId={detailId} onClose={() => setDetailId(null)} />

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingDelete && pendingDelete.predictionCount > 0 ? "Archive this model?" : "Delete this model?"}</DialogTitle>
            <DialogDescription>
              {pendingDelete && pendingDelete.predictionCount > 0
                ? "This model already produced predictions, so it will be archived. Its prediction history stays intact."
                : "The model and its files will be permanently removed. This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (!pendingDelete) return;
                remove.mutate(pendingDelete.id, {
                  onSuccess: ({ result }) => {
                    toast.success(result === "archived" ? "Model archived" : "Model deleted");
                    setPendingDelete(null);
                  },
                  onError: (error) => toast.error(getErrorMessage(error)),
                });
              }}
            >
              {remove.isPending ? "Working..." : pendingDelete && pendingDelete.predictionCount > 0 ? "Archive" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}