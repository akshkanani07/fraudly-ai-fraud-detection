"use client";

import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlert,
  CircleCheck,
  FileSpreadsheet,
  LoaderCircle,
  Star,
  UploadCloud,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useStartTraining, useTrainingJob } from "../hooks/use-fraud";
import {
  MAX_DATASET_SIZE_BYTES,
  trainingConfigSchema,
  type TrainingConfigValues,
} from "../schemas/fraud.schemas";
import { getErrorMessage } from "../services/fraud-api";
import {
  ALGORITHMS,
  ALGORITHM_LABELS,
  SELECTION_METRICS,
  SELECTION_METRIC_LABELS,
  type Algorithm,
  type TrainingJob,
} from "../types";
import {
  formatBytes,
  formatNumber,
  formatPercent,
} from "../utils/format";
import { NativeSelect, fieldClass } from "./fraud-ui";

const ALGORITHM_HINTS: Record<Algorithm, string> = {
  LOGISTIC_REGRESSION: "Fast, interpretable baseline",
  RANDOM_FOREST: "Robust ensemble of decision trees",
  XGBOOST: "Gradient boosting, usually the most accurate",
};

const TARGET_GUESS =
  /^(is_?fraud|fraud|class|label|target|fraudulent|is_?fraudulent)$/i;

/* ============================================================
 * CSV Helpers
 * ============================================================ */
function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells.filter(Boolean);
}

async function readHeader(file: File): Promise<string[]> {
  const text = (await file.slice(0, 65_536).text()).replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delimiter =
    [",", ";", "\t", "|"]
      .map((candidate) => ({
        candidate,
        count: firstLine.split(candidate).length,
      }))
      .sort((a, b) => b.count - a.count)[0]?.candidate ?? ",";
  return parseCsvLine(firstLine, delimiter);
}

/* ============================================================
 * Training Result View
 * ============================================================ */
function TrainingResultView({ job }: { job: TrainingJob }) {
  const result = job.result;
  if (!result) return null;

  const { datasetProfile: profile, cleaningSummary: cleaning } = result;
  const dropped = [
    ...cleaning.idLikeColumnsDropped,
    ...cleaning.constantColumnsDropped,
    ...cleaning.highMissingColumnsDropped,
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
        <CircleCheck className="size-5 shrink-0" />
        <p className="text-sm font-medium">
          Training finished in {result.totalTrainingSeconds.toFixed(1)}s. Best
          model: {ALGORITHM_LABELS[result.bestAlgorithm]}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {result.results.map((item) => (
          <div
            key={item.modelId}
            className={cn(
              "rounded-xl border p-4",
              item.isBest
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-background/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold">
                {ALGORITHM_LABELS[item.algorithm]}
              </p>
              {item.isBest ? (
                <Star className="size-4 shrink-0 fill-primary text-primary" />
              ) : null}
            </div>
            <dl className="mt-3 space-y-1.5 text-xs">
              {[
                ["F1", item.metrics.f1Score],
                ["Precision", item.metrics.precision],
                ["Recall", item.metrics.recall],
                ["ROC-AUC", item.metrics.rocAuc],
                ["PR-AUC", item.metrics.prAuc],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-muted-foreground">{label as string}</dt>
                  <dd className="font-mono">
                    {formatPercent(value as number)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4 text-xs text-muted-foreground">
        <p>
          Used {formatNumber(profile.rowCount)} rows (
          {formatPercent(profile.fraudRate, 2)} fraud).
          {cleaning.duplicateRowsRemoved > 0
            ? ` Removed ${formatNumber(cleaning.duplicateRowsRemoved)} duplicate rows.`
            : ""}
          {cleaning.missingValuesImputed > 0
            ? ` Imputed ${formatNumber(cleaning.missingValuesImputed)} missing values.`
            : ""}
        </p>
        {dropped.length > 0 ? (
          <p className="mt-1">Ignored columns: {dropped.join(", ")}.</p>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================
 * Train Model Dialog
 * ============================================================ */
interface TrainModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialJobId?: string | null;
}

export function TrainModelDialog({
  open,
  onOpenChange,
  initialJobId = null,
}: TrainModelDialogProps) {
  const start = useStartTraining();
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(() => initialJobId);
  const { data: job } = useTrainingJob(jobId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TrainingConfigValues>({
    resolver: zodResolver(trainingConfigSchema),
    defaultValues: {
      modelName: "",
      targetColumn: "",
      positiveLabel: "",
      algorithms: [...ALGORITHMS],
      selectionMetric: "pr_auc",
      handleImbalance: true,
      optimizeThreshold: true,
    },
  });

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const selected = accepted[0];
      if (!selected) return;

      const header = await readHeader(selected);
      if (header.length < 2) {
        toast.error("Could not read column names from this CSV file.");
        return;
      }

      setFile(selected);
      setColumns(header);
      setValue(
        "targetColumn",
        header.find((column) => TARGET_GUESS.test(column)) ?? "",
      );
      setValue(
        "modelName",
        selected.name
          .replace(/\.csv$/i, "")
          .replace(/[_-]+/g, " ")
          .slice(0, 80),
      );
    },
    [setValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    maxSize: MAX_DATASET_SIZE_BYTES,
    onDropRejected: () =>
      toast.error("Only CSV files up to 100 MB are supported."),
  });

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setFile(null);
      setColumns([]);
      setJobId(null);
      reset();
    }
  }

  function submit(config: TrainingConfigValues) {
    if (!file) {
      toast.error("Upload a CSV dataset first.");
      return;
    }
    start.mutate(
      { file, config },
      {
        onSuccess: ({ jobId: id }) => setJobId(id),
        onError: (error) =>
          toast.error(
            getErrorMessage(error, "Could not start training"),
          ),
      },
    );
  }

  const running =
    job && (job.status === "QUEUED" || job.status === "RUNNING");

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Train fraud detection models</DialogTitle>
          <DialogDescription>
            Upload a labelled CSV. Data is cleaned, engineered and used to
            train and compare the selected algorithms.
          </DialogDescription>
        </DialogHeader>

        {jobId ? (
          <div className="space-y-5 py-2">
            {!job || running ? (
              <div className="space-y-4 rounded-xl border border-border bg-background/40 p-6">
                <div className="flex items-center gap-3">
                  <LoaderCircle className="size-5 animate-spin text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      {job?.stage ?? "Starting"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This can take a few minutes for large datasets.
                    </p>
                  </div>
                  <span className="ml-auto font-mono text-sm">
                    {job?.progress ?? 0}%
                  </span>
                </div>
                <Progress value={job?.progress ?? 0} />
              </div>
            ) : null}

            {job?.status === "FAILED" ? (
              <div className="space-y-4">
                <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                  <CircleAlert className="mt-0.5 size-5 shrink-0" />
                  <p className="text-sm">{job.error ?? "Training failed."}</p>
                </div>
                <Button variant="outline" onClick={() => setJobId(null)}>
                  Back to settings
                </Button>
              </div>
            ) : null}

            {job?.status === "COMPLETED" ? (
              <>
                <TrainingResultView job={job} />
                <div className="flex justify-end">
                  <Button
                    onClick={() => close(false)}
                    className="gradient-brand text-white"
                  >
                    Done
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(submit)}
            className="space-y-5"
            noValidate
          >
            {/* ---- File Upload ---- */}
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-4">
                <div className="gradient-brand flex size-10 items-center justify-center rounded-lg text-white">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · {columns.length} columns
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove file"
                  onClick={() => {
                    setFile(null);
                    setColumns([]);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/30",
                )}
              >
                <input {...getInputProps()} />
                <UploadCloud className="size-9 text-primary" />
                <p className="text-sm font-medium">
                  Drag and drop a CSV file, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Up to 100 MB. Must include a fraud label column.
                </p>
              </div>
            )}

            {/* ---- Form Fields ---- */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Model Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="modelName"
                  className="text-sm font-medium"
                >
                  Model name
                </label>
                <input
                  id="modelName"
                  className={fieldClass}
                  placeholder="e.g. Card fraud v1"
                  {...register("modelName")}
                />
                {errors.modelName ? (
                  <p className="text-xs text-destructive">
                    {errors.modelName.message}
                  </p>
                ) : null}
              </div>

              {/* ============================================================
                  Target Column — Shadcn Select via Controller
                  ============================================================ */}
              <div className="space-y-1.5">
                <label
                  htmlFor="targetColumn"
                  className="text-sm font-medium"
                >
                  Target column (fraud label)
                </label>
                <Controller
                  control={control}
                  name="targetColumn"
                  render={({ field }) => (
                    <NativeSelect
                      id="targetColumn"
                      disabled={columns.length === 0}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        columns.length
                          ? "Select a column"
                          : "Upload a file first"
                      }
                    >
                      {columns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                />
                {errors.targetColumn ? (
                  <p className="text-xs text-destructive">
                    {errors.targetColumn.message}
                  </p>
                ) : null}
              </div>

              {/* Positive Label */}
              <div className="space-y-1.5">
                <label
                  htmlFor="positiveLabel"
                  className="text-sm font-medium"
                >
                  Fraud value (optional)
                </label>
                <input
                  id="positiveLabel"
                  className={fieldClass}
                  placeholder="Auto-detected, e.g. 1 or fraud"
                  {...register("positiveLabel")}
                />
              </div>

              {/* ============================================================
                  Selection Metric — Shadcn Select via Controller
                  ============================================================ */}
              <div className="space-y-1.5">
                <label
                  htmlFor="selectionMetric"
                  className="text-sm font-medium"
                >
                  Choose best model by
                </label>
                <Controller
                  control={control}
                  name="selectionMetric"
                  render={({ field }) => (
                    <NativeSelect
                      id="selectionMetric"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select metric"
                    >
                      {SELECTION_METRICS.map((metric) => (
                        <option key={metric} value={metric}>
                          {SELECTION_METRIC_LABELS[metric]}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                />
              </div>
            </div>

            {/* ---- Algorithms ---- */}
            <Controller
              control={control}
              name="algorithms"
              render={({ field }) => (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    Algorithms
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {ALGORITHMS.map((algorithm) => {
                      const checked = field.value.includes(algorithm);
                      return (
                        <label
                          key={algorithm}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                            checked
                              ? "border-primary/50 bg-primary/5"
                              : "border-border hover:bg-muted/30",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              field.onChange(
                                value === true
                                  ? [...field.value, algorithm]
                                  : field.value.filter(
                                      (item) => item !== algorithm,
                                    ),
                              )
                            }
                            className="mt-0.5"
                          />
                          <span className="min-w-0 space-y-0.5">
                            <span className="block truncate text-sm font-medium">
                              {ALGORITHM_LABELS[algorithm]}
                            </span>
                            <span className="block text-[11px] leading-snug text-muted-foreground">
                              {ALGORITHM_HINTS[algorithm]}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.algorithms ? (
                    <p className="text-xs text-destructive">
                      {errors.algorithms.message}
                    </p>
                  ) : null}
                </fieldset>
              )}
            />

            {/* ---- Toggles ---- */}
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  [
                    "handleImbalance",
                    "Handle class imbalance",
                    "Weights the rare fraud class during training",
                  ],
                  [
                    "optimizeThreshold",
                    "Optimise decision threshold",
                    "Tunes the cut-off for the best F1 score",
                  ],
                ] as const
              ).map(([name, title, description]) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3.5">
                      <span>
                        <span className="block text-sm font-medium">
                          {title}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {description}
                        </span>
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </label>
                  )}
                />
              ))}
            </div>

            {/* ---- Actions ---- */}
            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => close(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={start.isPending}
                className="gradient-brand text-white"
              >
                {start.isPending ? "Uploading..." : "Start training"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}