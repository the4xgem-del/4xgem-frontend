import { useQuery } from "@tanstack/react-query";
import { newsApi, toUiNewsItem } from "./newsApi";

export function useNews() {
  const query = useQuery({
    queryKey: ["news"],
    queryFn: () => newsApi.list(),
    staleTime: 60_000,
  });

  return {
    news: (query.data ?? []).map(toUiNewsItem),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
