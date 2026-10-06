"use client";

import { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PredictionsQuery } from "../schemas/fraud.schemas";
import { fraudApi } from "../services/fraud-api";

export const fraudKeys = {
  all: ["fraud"] as const,
  overview: ["fraud", "overview"] as const,
  models: ["fraud", "models"] as const,
  model: (id: string | null) => ["fraud", "model", id] as const,
  predictions: (params: PredictionsQuery) => ["fraud", "predictions", params] as const,
  job: (id: string | null) => ["fraud", "job", id] as const,
};

export function useFraudOverview() {
  return useQuery({ queryKey: fraudKeys.overview, queryFn: fraudApi.overview, refetchInterval: 30_000 });
}

export function useModels() {
  return useQuery({ queryKey: fraudKeys.models, queryFn: fraudApi.models });
}

export function useModelDetail(id: string | null) {
  return useQuery({
    queryKey: fraudKeys.model(id),
    queryFn: () => fraudApi.model(id as string),
    enabled: Boolean(id),
  });
}

export function usePredictions(params: PredictionsQuery) {
  return useQuery({
    queryKey: fraudKeys.predictions(params),
    queryFn: () => fraudApi.predictions(params),
    placeholderData: keepPreviousData,
  });
}

export function usePredict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fraudApi.predict,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fraud", "predictions"] });
      void queryClient.invalidateQueries({ queryKey: fraudKeys.overview });
      void queryClient.invalidateQueries({ queryKey: fraudKeys.models });
    },
  });
}

export function useActivateModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fraudApi.activateModel,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fraudKeys.models });
      void queryClient.invalidateQueries({ queryKey: fraudKeys.overview });
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fraudApi.deleteModel,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fraudKeys.models });
      void queryClient.invalidateQueries({ queryKey: fraudKeys.overview });
    },
  });
}

export function useRetrainModel() {
  return useMutation({ mutationFn: fraudApi.retrainModel });
}

export function useStartTraining() {
  return useMutation({
    mutationFn: ({ file, config }: { file: File; config: Parameters<typeof fraudApi.startTraining>[1] }) =>
      fraudApi.startTraining(file, config),
  });
}

export function useTrainingJob(jobId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: fraudKeys.job(jobId),
    queryFn: () => fraudApi.trainingJob(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (state) => {
      const status = state.state.data?.status;
      return status === "COMPLETED" || status === "FAILED" ? false : 2000;
    },
  });

  const status = query.data?.status;
  useEffect(() => {
    if (status === "COMPLETED") {
      void queryClient.invalidateQueries({ queryKey: fraudKeys.models });
      void queryClient.invalidateQueries({ queryKey: fraudKeys.overview });
    }
  }, [status, queryClient]);

  return query;
}