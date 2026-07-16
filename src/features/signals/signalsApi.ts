import { apiClient } from "@/lib/apiClient";
import { computeFloatingPips } from "@/features/market/instruments";

export interface ApiSignal {
  id: string;
  pair: string;
  name: string;
  category: string;
  status: string;
  confidence: number;
  pips: number;
  requiredTier: string;
  createdAt: string;
  locked: boolean;
  direction?: string;
  entry?: string;
  stopLoss?: string;
  takeProfit1?: string;
  takeProfit2?: string | null;
  takeProfit3?: string | null;
  riskPercent?: string;
}

export interface SignalListParams {
  category?: string;
  status?: string;
  sort?: "newest" | "oldest" | "confidence";
  page?: number;
  pageSize?: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const signalsApi = {
  async list(params: SignalListParams = {}): Promise<{ items: ApiSignal[]; pagination: Pagination }> {
    const { data } = await apiClient.get<{ data: ApiSignal[]; pagination: Pagination }>("/signals", { params });
    return { items: data.data, pagination: data.pagination };
  },
};

const STATUS_DISPLAY: Record<string, string> = {
  OPEN: "Open",
  RUNNING: "Running",
  HIT_TP1: "Hit TP1",
  HIT_TP2: "Hit TP2",
  HIT_TP3: "Hit TP3",
  HIT_SL: "Hit SL",
  CLOSED: "Closed",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  FOREX: "Forex",
  GOLD: "Gold",
  CRYPTO: "Crypto",
  INDICES: "Indices",
  COMMODITIES: "Commodities",
};

const DIRECTION_DISPLAY: Record<string, string> = {
  BUY: "BUY",
  SELL: "SELL",
  BUY_LIMIT: "BUY LIMIT",
  SELL_LIMIT: "SELL LIMIT",
};

function riskLevelOf(riskPercent?: string): "Low" | "Medium" | "High" {
  const pct = riskPercent ? parseFloat(riskPercent) : 0;
  if (pct >= 1.75) return "High";
  if (pct >= 1.0) return "Medium";
  return "Low";
}

function elapsedSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

/**
 * Maps the real API's signal shape onto the exact field names the existing
 * (originally mock-data-driven) UI components already expect, so
 * `SignalCard` etc. don't need to be rewritten — only the data source changes.
 *
 * `floatingProfit` is computed live from the current market price when one
 * is available (passed in from the WebSocket price feed); otherwise it
 * shows "—" rather than a fabricated number. It's expressed in pips/points,
 * not a dollar amount — see the backend's `computeFloatingPips` for why.
 */
export function toUiSignal(s: ApiSignal, currentPrice?: number) {
  const liveFloatingPips =
    !s.locked && s.direction && s.entry && currentPrice !== undefined
      ? computeFloatingPips(s.pair, s.direction as "BUY" | "SELL" | "BUY_LIMIT" | "SELL_LIMIT", parseFloat(s.entry), currentPrice)
      : null;

  return {
    id: s.id,
    pair: s.pair,
    name: s.name,
    category: CATEGORY_DISPLAY[s.category] ?? s.category,
    type: s.direction ? DIRECTION_DISPLAY[s.direction] ?? s.direction : "—",
    entry: s.entry ?? "🔒 Upgrade to view",
    sl: s.stopLoss ?? "🔒",
    tp1: s.takeProfit1 ?? "🔒",
    tp2: s.takeProfit2 ?? "🔒",
    tp3: s.takeProfit3 ?? "🔒",
    risk: s.riskPercent ? `${s.riskPercent}%` : "—",
    status: STATUS_DISPLAY[s.status] ?? s.status,
    confidence: s.confidence,
    pips: s.pips > 0 ? `+${s.pips}` : String(s.pips),
    countdown: elapsedSince(s.createdAt),
    riskLevel: riskLevelOf(s.riskPercent),
    floatingProfit: liveFloatingPips === null ? "—" : `${liveFloatingPips > 0 ? "+" : ""}${liveFloatingPips} pips`,
    isLive: liveFloatingPips !== null,
    locked: s.locked,
    requiredTier: s.requiredTier,
  };
}
