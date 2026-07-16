import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface PerformancePoint {
  month: string;
  pips: number;
  winRate: number;
}

export interface CategoryBreakdownSlice {
  name: string;
  value: number;
  color: string;
}

export const analyticsApi = {
  async performance(): Promise<PerformancePoint[]> {
    const { data } = await apiClient.get<{ data: PerformancePoint[] }>("/analytics/performance");
    return data.data;
  },
  async categoryBreakdown(): Promise<CategoryBreakdownSlice[]> {
    const { data } = await apiClient.get<{ data: CategoryBreakdownSlice[] }>("/analytics/category-breakdown");
    return data.data;
  },
};

export function usePerformance() {
  const query = useQuery({ queryKey: ["analytics", "performance"], queryFn: analyticsApi.performance, staleTime: 5 * 60_000 });
  return { data: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}

export function useCategoryBreakdown() {
  const query = useQuery({ queryKey: ["analytics", "category-breakdown"], queryFn: analyticsApi.categoryBreakdown, staleTime: 5 * 60_000 });
  return { data: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}
