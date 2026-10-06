"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Eraser,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useModelDetail, useModels, usePredict } from "../hooks/use-fraud";
import { getErrorMessage } from "../services/fraud-api";
import {
  ALGORITHM_LABELS,
  type FeatureSchemaItem,
  type FeatureValue,
  type PredictionResult,
} from "../types";
import { humanize } from "../utils/format";
import {
  EmptyState,
  NativeSelect,
  SectionCard,
  fieldClass,
} from "./fraud-ui";
import { PredictionResultView } from "./prediction-result";

const VISIBLE_FIELDS = 8;

interface LiveDetectionProps {
  canPredict: boolean;
  canTrain: boolean;
  onTrain: () => void;
}

function formatRange(item: FeatureSchemaItem): string | null {
  if (item.kind !== "numeric" || item.min === null || item.max === null)
    return null;
  return `range ${Number(item.min.toFixed(2))} to ${Number(item.max.toFixed(2))}`;
}

export function LiveDetection({
  canPredict,
  canTrain,
  onTrain,
}: LiveDetectionProps) {
  const { data: modelData, isLoading } = useModels();
  const predict = usePredict();

  const readyModels = useMemo(
    () => (modelData?.models ?? []).filter((model) => model.status === "READY"),
    [modelData],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [values, setValues] = useState<Record<string, string>>({});
  const [jsonText, setJsonText] = useState("{\n  \n}");
  const [showAll, setShowAll] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const effectiveSelectedId = useMemo(() => {
    if (selectedId && readyModels.some((model) => model.id === selectedId))
      return selectedId;
    return (
      readyModels.find((model) => model.isActive)?.id ??
      readyModels[0]?.id ??
      null
    );
  }, [readyModels, selectedId]);

  const { data: detail, isLoading: isLoadingDetail } = useModelDetail(
    effectiveSelectedId,
  );

  const handleModelChange = (nextId: string | null) => {
    setSelectedId(nextId);
    setValues({});
    setResult(null);
    setShowAll(false);
  };

  const fields = useMemo(() => {
    const schema = detail?.featureSchema ?? [];
    const rank = new Map(
      (detail?.model.featureImportance ?? []).map((item, index) => [
        item.feature,
        index,
      ]),
    );
    return [...schema].sort(
      (a, b) =>
        (rank.get(a.name) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.name) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [detail]);

  const visibleFields = showAll ? fields : fields.slice(0, VISIBLE_FIELDS);

  function fillSample() {
    const sample: Record<string, string> = {};
    for (const field of fields) {
      if (field.example !== null && field.example !== undefined)
        sample[field.name] = String(field.example);
    }
    setValues(sample);
    setJsonText(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(sample).map(([k, v]) => [
            k,
            isNaN(Number(v)) || v === "" ? v : Number(v),
          ]),
        ),
        null,
        2,
      ),
    );
  }

  function collectFeatures(): Record<string, FeatureValue> | null {
    if (mode === "json") {
      try {
        const parsed: unknown = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
          throw new Error();
        return parsed as Record<string, FeatureValue>;
      } catch {
        toast.error(
          'Enter a valid JSON object, for example {"amount": 120.5}',
        );
        return null;
      }
    }

    const features: Record<string, FeatureValue> = {};
    for (const field of fields) {
      const raw = values[field.name]?.trim();
      if (!raw) continue;
      if (field.kind === "numeric") {
        const number = Number(raw);
        if (!Number.isFinite(number)) {
          toast.error(`"${humanize(field.name)}" must be a number`);
          return null;
        }
        features[field.name] = number;
      } else {
        features[field.name] = raw;
      }
    }

    if (Object.keys(features).length === 0) {
      toast.error("Enter at least one value");
      return null;
    }
    return features;
  }

  function submit() {
    if (!selectedId) return;
    const features = collectFeatures();
    if (!features) return;

    predict.mutate(
      { modelId: selectedId, features, explain: true },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.isFraud)
            toast.error("Fraud detected", {
              description: `${(data.fraudProbability * 100).toFixed(1)}% fraud probability`,
            });
          else toast.success("Transaction looks legitimate");
        },
        onError: (error) =>
          toast.error(getErrorMessage(error, "Prediction failed")),
      },
    );
  }

  if (isLoading) {
    return <div className="glass h-[420px] animate-pulse rounded-2xl" />;
  }

  if (readyModels.length === 0) {
    return (
      <SectionCard>
        <EmptyState
          icon={Brain}
          title="No trained models yet"
          description="Upload a labelled transaction dataset to train Logistic Regression, Random Forest and XGBoost models, then run real-time predictions."
          action={
            canTrain ? (
              <Button
                onClick={onTrain}
                className="gradient-brand mt-2 text-white"
              >
                <Sparkles className="size-4" />
                Train your first model
              </Button>
            ) : null
          }
        />
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
      <SectionCard
        title="Analyse a transaction"
        description="Enter the transaction details. Missing values are handled automatically."
        action={
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
            {(["form", "json"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={cn(
                  "rounded-md px-3 py-1.5 capitalize transition-colors",
                  mode === item
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        }
      >
        <div className="space-y-5">
          {/* ============================================
              MODEL SELECT — Now using Shadcn Select
              ============================================ */}
          <div className="space-y-2">
            <label htmlFor="model" className="text-sm font-medium">
              Model
            </label>
            <NativeSelect
              id="model"
              value={selectedId ?? ""}
              onChange={(value) => setSelectedId(value)}
              placeholder="Select a model..."
            >
              {readyModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} (v{model.version})
                  {model.isActive ? " - active" : ""}
                </option>
              ))}
            </NativeSelect>
          </div>

          {mode === "json" ? (
            <textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              spellCheck={false}
              rows={12}
              aria-label="Transaction JSON"
              className={cn(
                fieldClass,
                "h-auto resize-y py-3 font-mono text-xs leading-relaxed",
              )}
            />
          ) : isLoadingDetail ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-[66px] animate-pulse rounded-xl bg-muted/50"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleFields.map((field) => {
                  const hint = formatRange(field);
                  const listId = `list-${field.name}`;
                  return (
                    <div key={field.name} className="space-y-1.5">
                      <label
                        htmlFor={`f-${field.name}`}
                        className="flex items-center justify-between gap-2 text-xs font-medium"
                      >
                        <span className="truncate">
                          {humanize(field.name)}
                        </span>
                        {hint ? (
                          <span className="shrink-0 font-normal text-muted-foreground">
                            {hint}
                          </span>
                        ) : null}
                      </label>
                      <input
                        id={`f-${field.name}`}
                        className={fieldClass}
                        type={field.kind === "numeric" ? "number" : "text"}
                        step="any"
                        inputMode={
                          field.kind === "numeric" ? "decimal" : "text"
                        }
                        list={
                          field.categories.length > 0 ? listId : undefined
                        }
                        placeholder={
                          field.example !== null
                            ? `e.g. ${field.example}`
                            : "optional"
                        }
                        value={values[field.name] ?? ""}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                      />
                      {field.categories.length > 0 ? (
                        <datalist id={listId}>
                          {field.categories.map((category) => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {fields.length > VISIBLE_FIELDS ? (
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
                >
                  {showAll ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {showAll
                    ? "Show fewer features"
                    : `Show all ${fields.length} features`}
                </button>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              onClick={submit}
              disabled={!canPredict || predict.isPending || !selectedId}
              className="gradient-brand h-11 flex-1 text-sm font-semibold text-white shadow-lg shadow-primary/25 sm:flex-none sm:px-8"
            >
              {predict.isPending ? "Analysing..." : "Run prediction"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={fillSample}
              className="h-11 bg-background/40"
            >
              <Wand2 className="size-4" />
              Fill sample
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setValues({});
                setJsonText("{\n  \n}");
                setResult(null);
              }}
              className="h-11"
            >
              <Eraser className="size-4" />
              Clear
            </Button>
          </div>

          {!canPredict ? (
            <p className="text-xs text-muted-foreground">
              Your role does not allow creating predictions.
            </p>
          ) : null}

          {detail?.model ? (
            <p className="text-xs text-muted-foreground">
              {ALGORITHM_LABELS[detail.model.algorithm]} · trained on{" "}
              {detail.model.trainingRows?.toLocaleString("en-US") ?? "-"} rows
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Result"
        description="Risk score, confidence and the factors behind it."
      >
        {result ? (
          <PredictionResultView result={result} />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Ready when you are"
            description="Run a prediction to see the fraud probability, risk level and an explanation of the most influential signals."
          />
        )}
      </SectionCard>
    </div>
  );
}