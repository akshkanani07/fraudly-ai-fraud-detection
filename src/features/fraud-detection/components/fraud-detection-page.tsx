"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useFraudOverview } from "../hooks/use-fraud";
import { FraudInsights, FraudKpis } from "./fraud-overview";
import { LiveDetection } from "./live-detection";
import { ModelLibrary } from "./model-library";
import { PredictionHistory } from "./prediction-history";
import { TrainModelDialog } from "./train-model-dialog";

export interface FraudPermissions {
  canPredict: boolean;
  canTrain: boolean;
  canActivate: boolean;
  canRetrain: boolean;
  canDelete: boolean;
}

function MlStatus() {
  const { data } = useFraudOverview();
  if (!data) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        data.mlOnline ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      <span className="relative flex size-2">
        {data.mlOnline ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" /> : null}
        <span className={cn("relative inline-flex size-2 rounded-full", data.mlOnline ? "bg-success" : "bg-destructive")} />
      </span>
      ML service {data.mlOnline ? "online" : "offline"}
    </span>
  );
}

export function FraudDetectionPage({ permissions }: { permissions: FraudPermissions }) {
  const [tab, setTab] = useState("detection");
  const [trainOpen, setTrainOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  function openTraining(existingJobId: string | null = null) {
    setJobId(existingJobId);
    setTrainOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Fraud <span className="gradient-text">Detection</span>
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Score transactions in real time with machine learning, compare models and understand every decision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MlStatus />
          {permissions.canTrain ? (
            <Button onClick={() => openTraining()} className="gradient-brand h-10 text-white shadow-lg shadow-primary/25">
              <Sparkles className="size-4" />
              Train model
            </Button>
          ) : null}
        </div>
      </header>

      <FraudKpis />

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="space-y-6">
        <TabsList className="h-auto flex-wrap gap-1 rounded-xl p-1">
          <TabsTrigger value="detection" className="px-4 py-2">Live detection</TabsTrigger>
          <TabsTrigger value="models" className="px-4 py-2">Model library</TabsTrigger>
          <TabsTrigger value="history" className="px-4 py-2">Prediction history</TabsTrigger>
          <TabsTrigger value="insights" className="px-4 py-2">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="detection">
          <LiveDetection canPredict={permissions.canPredict} canTrain={permissions.canTrain} onTrain={() => openTraining()} />
        </TabsContent>

        <TabsContent value="models">
          <ModelLibrary
            canTrain={permissions.canTrain}
            canActivate={permissions.canActivate}
            canRetrain={permissions.canRetrain}
            canDelete={permissions.canDelete}
            onTrain={() => openTraining()}
            onJobStarted={(id) => openTraining(id)}
          />
        </TabsContent>

        <TabsContent value="history">
          <PredictionHistory />
        </TabsContent>

        <TabsContent value="insights">
          <FraudInsights />
        </TabsContent>
      </Tabs>

      <TrainModelDialog open={trainOpen} onOpenChange={setTrainOpen} initialJobId={jobId} />
    </div>
  );
}