import { useQuery } from "@tanstack/react-query";
import { calendarApi, toUiEvent } from "./calendarApi";

export function useCalendar() {
  const query = useQuery({
    queryKey: ["calendar", "today"],
    queryFn: () => calendarApi.list(),
    staleTime: 5 * 60_000,
  });

  return {
    events: (query.data ?? []).map(toUiEvent),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
