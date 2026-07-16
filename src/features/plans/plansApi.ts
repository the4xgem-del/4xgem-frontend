import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface ApiPlan {
  id: string;
  tier: "FREE" | "BASIC" | "PREMIUM" | "VIP";
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  features: string[];
}

const TIER_STYLE: Record<string, { color: string; bg: string; popular: boolean }> = {
  FREE: { color: "#6B7280", bg: "#F9FAFB", popular: false },
  BASIC: { color: "#2563EB", bg: "#EFF6FF", popular: false },
  PREMIUM: { color: "#6D28D9", bg: "#F5F3FF", popular: true },
  VIP: { color: "#D97706", bg: "#FFFBEB", popular: false },
};

const TIER_CTA: Record<string, string> = {
  FREE: "Get Started",
  BASIC: "Subscribe",
  PREMIUM: "Upgrade Now",
  VIP: "Go VIP",
};

function toUiPlan(p: ApiPlan) {
  const style = TIER_STYLE[p.tier] ?? TIER_STYLE.FREE;
  return {
    id: p.id,
    tier: p.tier,
    name: p.name,
    price: p.priceCents === 0 ? "$0" : `$${(p.priceCents / 100).toFixed(0)}`,
    period: p.priceCents === 0 ? "forever" : `/${p.interval}`,
    color: style.color,
    bg: style.bg,
    features: p.features,
    cta: TIER_CTA[p.tier] ?? "Choose plan",
    popular: style.popular,
  };
}

export const plansApi = {
  async list(): Promise<ApiPlan[]> {
    const { data } = await apiClient.get<{ data: ApiPlan[] }>("/plans");
    return data.data;
  },
};

export function usePlans() {
  const query = useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.list,
    staleTime: 10 * 60_000, // plans rarely change
  });

  return {
    plans: (query.data ?? []).map(toUiPlan),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
