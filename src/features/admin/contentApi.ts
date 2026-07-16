import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface CreateSignalPayload {
  pair: string;
  name: string;
  category: "FOREX" | "GOLD" | "CRYPTO" | "INDICES" | "COMMODITIES";
  direction: "BUY" | "SELL" | "BUY_LIMIT" | "SELL_LIMIT";
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  takeProfit3?: number;
  riskPercent: number;
  confidence: number;
  requiredTier: "FREE" | "BASIC" | "PREMIUM" | "VIP";
}

export interface CreateNewsPayload {
  category: "FOREX" | "GOLD" | "CRYPTO" | "INDICES" | "COMMODITIES";
  impact: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  summary: string;
  body?: string;
}

export interface CreateEventPayload {
  eventTime: string; // ISO datetime
  country: string;
  currency: string;
  title: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  previous?: string;
  forecast?: string;
}

const adminContentApi = {
  async createSignal(payload: CreateSignalPayload): Promise<void> {
    await apiClient.post("/signals", payload);
  },
  async createNews(payload: CreateNewsPayload): Promise<void> {
    await apiClient.post("/news", payload);
  },
  async createEvent(payload: CreateEventPayload): Promise<void> {
    await apiClient.post("/calendar", payload);
  },
};

export function useCreateSignal() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: adminContentApi.createSignal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => setError(getApiErrorMessage(err, "Couldn't publish that signal.")),
  });

  return {
    createSignal: mutation.mutate,
    isCreating: mutation.isPending,
    error,
    success,
    clearError: () => setError(null),
  };
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: adminContentApi.createNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => setError(getApiErrorMessage(err, "Couldn't publish that article.")),
  });

  return {
    createNews: mutation.mutate,
    isCreating: mutation.isPending,
    error,
    success,
    clearError: () => setError(null),
  };
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: adminContentApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => setError(getApiErrorMessage(err, "Couldn't add that event.")),
  });

  return {
    createEvent: mutation.mutate,
    isCreating: mutation.isPending,
    error,
    success,
    clearError: () => setError(null),
  };
}
