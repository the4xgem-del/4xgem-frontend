import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ApiNotification {
  id: string;
  type: "SIGNAL" | "NEWS" | "BILLING" | "SYSTEM";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  async list(unreadOnly = false): Promise<{ items: ApiNotification[]; unreadCount: number }> {
    const { data } = await apiClient.get<{ data: ApiNotification[]; unreadCount: number }>("/notifications", {
      params: { unreadOnly, pageSize: 20 },
    });
    return { items: data.data, unreadCount: data.unreadCount };
  },
  async markRead(id: string): Promise<void> {
    await apiClient.post(`/notifications/${id}/read`);
  },
  async markAllRead(): Promise<void> {
    await apiClient.post("/notifications/read-all");
  },
};

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return {
    notifications: query.data?.items ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}
