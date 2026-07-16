import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { API_BASE_URL, apiClient } from "@/lib/apiClient";

export interface Tick {
  symbol: string;
  price: number;
  timestamp: number;
}

interface SignalUpdatePayload {
  id: string;
  pair: string;
  status: string;
  [key: string]: unknown;
}

interface MarketDataContextValue {
  prices: Record<string, Tick>;
  connected: boolean;
  subscribeToSignalUpdates: (cb: (signals: SignalUpdatePayload[]) => void) => () => void;
}

const MarketDataContext = createContext<MarketDataContextValue | null>(null);

function wsUrl(): string {
  const base = API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
  return `${base}/ws/market`;
}

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15_000;

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, Tick>>({});
  const [connected, setConnected] = useState(false);
  const signalListeners = useRef(new Set<(signals: SignalUpdatePayload[]) => void>());
  const reconnectAttempt = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const closedByUs = useRef(false);

  useEffect(() => {
    closedByUs.current = false;

    // Hydrate immediately from the REST snapshot so the UI isn't blank
    // for the ~2s until the next periodic WS tick arrives.
    apiClient
      .get<{ data: Array<{ symbol: string; price: number | null; timestamp: number | null }> }>("/market/prices")
      .then(({ data }) => {
        const initial: Record<string, Tick> = {};
        for (const item of data.data) {
          if (item.price !== null && item.timestamp !== null) {
            initial[item.symbol] = { symbol: item.symbol, price: item.price, timestamp: item.timestamp };
          }
        }
        setPrices((prev) => ({ ...initial, ...prev }));
      })
      .catch(() => {
        // Non-fatal — the WebSocket will populate prices shortly regardless.
      });

    function connect() {
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempt.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "tick") {
            const tick = msg.data as Tick;
            setPrices((prev) => ({ ...prev, [tick.symbol]: tick }));
          } else if (msg.type === "signal_update") {
            for (const cb of signalListeners.current) cb(msg.data as SignalUpdatePayload[]);
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (closedByUs.current) return;
        const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt.current, RECONNECT_MAX_DELAY_MS);
        reconnectAttempt.current += 1;
        setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      closedByUs.current = true;
      wsRef.current?.close();
    };
  }, []);

  const subscribeToSignalUpdates = (cb: (signals: SignalUpdatePayload[]) => void) => {
    signalListeners.current.add(cb);
    return () => signalListeners.current.delete(cb);
  };

  return (
    <MarketDataContext.Provider value={{ prices, connected, subscribeToSignalUpdates }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData(): MarketDataContextValue {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error("useMarketData must be used within a MarketDataProvider");
  return ctx;
}

/** Convenience hook for a single instrument's live price, by display pair (e.g. "XAUUSD") or provider symbol (e.g. "XAU/USD"). */
export function useLivePrice(symbolOrPair: string): Tick | null {
  const { prices } = useMarketData();
  const bySymbol = prices[symbolOrPair];
  if (bySymbol) return bySymbol;
  const withSlash = symbolOrPair.length === 6 ? `${symbolOrPair.slice(0, 3)}/${symbolOrPair.slice(3)}` : symbolOrPair;
  return prices[withSlash] ?? null;
}
