import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  role: { name: string };
}

export interface AdminUsersParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const adminUsersApi = {
  async list(params: AdminUsersParams): Promise<{ items: AdminUser[]; pagination: Pagination }> {
    const { data } = await apiClient.get<{ data: AdminUser[]; pagination: Pagination }>("/users", { params });
    return { items: data.data, pagination: data.pagination };
  },
  async update(id: string, patch: { role?: string; status?: string }): Promise<AdminUser> {
    const { data } = await apiClient.patch<{ data: AdminUser }>(`/users/${id}`, patch);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

export function useAdminUsers() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<AdminUsersParams>({ page: 1, pageSize: 20 });
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminUsersApi.list(params),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { role?: string; status?: string } }) => adminUsersApi.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
    onError: (err) => setActionError(getApiErrorMessage(err, "Couldn't update that user.")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
    onError: (err) => setActionError(getApiErrorMessage(err, "Couldn't deactivate that user.")),
  });

  return {
    users: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    params,
    setParams,
    actionError,
    clearActionError: () => setActionError(null),
    updateUser: (id: string, patch: { role?: string; status?: string }) => updateMutation.mutate({ id, patch }),
    isUpdating: updateMutation.isPending,
    deactivateUser: (id: string) => removeMutation.mutate(id),
    isRemoving: removeMutation.isPending,
  };
}

export const adminAnalyticsApi = {
  async summary(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    mrr: number;
    totalSignals: number;
    openSignals: number;
    newUsersLast30Days: number;
  }> {
    const { data } = await apiClient.get("/analytics/admin-summary");
    return data.data;
  },
};

export function useAdminSummary() {
  const query = useQuery({ queryKey: ["admin", "summary"], queryFn: adminAnalyticsApi.summary });
  return { summary: query.data, isLoading: query.isLoading, isError: query.isError };
}
