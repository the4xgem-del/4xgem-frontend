import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { signalsApi, toUiSignal, type ApiSignal, type SignalListParams } from "./signalsApi";
import { useMarketData } from "@/features/market/MarketDataContext";
import { instrumentForPair } from "@/features/market/instruments";

export function useSignals(params: SignalListParams = {}) {
  const query = useQuery({
    queryKey: ["signals", params],
    queryFn: () => signalsApi.list(params),
    staleTime: 15_000,
    refetchInterval: 30_000, // safety-net poll — real-time updates come from the WebSocket below
  });

  const { prices, subscribeToSignalUpdates } = useMarketData();

  // Live signal_update events (status changes: OPEN -> RUNNING -> HIT_TPx /
  // HIT_SL, driven by the live price feed on the backend) patch matching
  // signals in place, so a status change appears instantly without waiting
  // for the next 30s poll.
  const [liveOverrides, setLiveOverrides] = useState<Map<string, ApiSignal>>(new Map());

  useEffect(() => {
    return subscribeToSignalUpdates((updated) => {
      setLiveOverrides((prev) => {
        const next = new Map(prev);
        for (const signal of updated) next.set(signal.id, signal as unknown as ApiSignal);
        return next;
      });
    });
  }, [subscribeToSignalUpdates]);

  const items = useMemo(() => {
    const base = query.data?.items ?? [];
    return base.map((item) => liveOverrides.get(item.id) ?? item);
  }, [query.data?.items, liveOverrides]);

  const signals = useMemo(
    () =>
      items.map((item) => {
        const instrument = instrumentForPair(item.pair);
        const currentPrice = instrument ? prices[instrument.symbol]?.price : undefined;
        return toUiSignal(item, currentPrice);
      }),
    [items, prices],
  );

  return {
    signals,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
