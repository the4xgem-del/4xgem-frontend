import { apiClient } from "@/lib/apiClient";

export interface ApiEconomicEvent {
  id: string;
  eventTime: string;
  country: string;
  currency: string;
  title: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  previous: string | null;
  forecast: string | null;
  actual: string | null;
}

const CURRENCY_FLAG: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  CHF: "🇨🇭",
  NZD: "🇳🇿",
};

const IMPACT_DISPLAY: Record<string, string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

export const calendarApi = {
  async list(params: { from?: string; to?: string; impact?: string } = {}): Promise<ApiEconomicEvent[]> {
    const { data } = await apiClient.get<{ data: ApiEconomicEvent[] }>("/calendar", { params });
    return data.data;
  },
};

export function toUiEvent(e: ApiEconomicEvent) {
  const time = new Date(e.eventTime);
  return {
    id: e.id,
    time: time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }),
    flag: CURRENCY_FLAG[e.currency] ?? "🏳️",
    country: e.currency,
    event: e.title,
    impact: IMPACT_DISPLAY[e.impact] ?? e.impact,
    previous: e.previous ?? "—",
    forecast: e.forecast ?? "—",
    actual: e.actual ?? "—",
  };
}
