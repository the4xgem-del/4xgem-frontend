import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { AuthUser } from "@/features/auth/authApi";

export interface Preferences {
  theme: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  telegramAlerts: boolean;
  favoriteInstruments: string[];
  timezone: string;
}

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

const settingsApi = {
  async updateProfile(patch: { firstName?: string; lastName?: string }): Promise<AuthUser> {
    const { data } = await apiClient.patch<{ data: AuthUser }>("/me", patch);
    return data.data;
  },
  async uploadAvatar(file: File): Promise<AuthUser> {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await apiClient.post<{ data: AuthUser }>("/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
  async getPreferences(): Promise<Preferences> {
    const { data } = await apiClient.get<{ data: Preferences }>("/me/preferences");
    return data.data;
  },
  async updatePreferences(patch: Partial<Preferences>): Promise<Preferences> {
    const { data } = await apiClient.patch<{ data: Preferences }>("/me/preferences", patch);
    return data.data;
  },
  async listSessions(): Promise<Session[]> {
    const { data } = await apiClient.get<{ data: Session[] }>("/me/sessions");
    return data.data;
  },
  async revokeSession(id: string): Promise<void> {
    await apiClient.delete(`/me/sessions/${id}`);
  },
  async revokeAllSessions(): Promise<void> {
    await apiClient.delete("/me/sessions");
  },
};

export function useProfileSettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const notify = (setter: (v: string | null) => void, msg: string) => {
    setter(msg);
    setTimeout(() => setter(null), 4000);
  };

  const profileMutation = useMutation({
    mutationFn: settingsApi.updateProfile,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      notify(setSuccess, "Profile updated.");
    },
    onError: (err) => notify(setError, getApiErrorMessage(err, "Couldn't update your profile.")),
  });

  const avatarMutation = useMutation({
    mutationFn: settingsApi.uploadAvatar,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      notify(setSuccess, "Avatar updated.");
    },
    onError: (err) => notify(setError, getApiErrorMessage(err, "Couldn't upload that image.")),
  });

  const preferencesQuery = useQuery({ queryKey: ["me", "preferences"], queryFn: settingsApi.getPreferences });

  const preferencesMutation = useMutation({
    mutationFn: settingsApi.updatePreferences,
    onSuccess: (prefs) => queryClient.setQueryData(["me", "preferences"], prefs),
    onError: (err) => notify(setError, getApiErrorMessage(err, "Couldn't update your preferences.")),
  });

  const sessionsQuery = useQuery({ queryKey: ["me", "sessions"], queryFn: settingsApi.listSessions });

  const revokeSessionMutation = useMutation({
    mutationFn: settingsApi.revokeSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me", "sessions"] }),
    onError: (err) => notify(setError, getApiErrorMessage(err, "Couldn't revoke that session.")),
  });

  const revokeAllMutation = useMutation({
    mutationFn: settingsApi.revokeAllSessions,
    onSuccess: () => notify(setSuccess, "Logged out of all other devices. You'll need to log in again next time."),
    onError: (err) => notify(setError, getApiErrorMessage(err, "Couldn't log out of other devices.")),
  });

  return {
    error,
    success,
    updateProfile: profileMutation.mutate,
    isUpdatingProfile: profileMutation.isPending,
    uploadAvatar: avatarMutation.mutate,
    isUploadingAvatar: avatarMutation.isPending,
    preferences: preferencesQuery.data,
    isLoadingPreferences: preferencesQuery.isLoading,
    updatePreferences: preferencesMutation.mutate,
    sessions: sessionsQuery.data ?? [],
    isLoadingSessions: sessionsQuery.isLoading,
    revokeSession: revokeSessionMutation.mutate,
    revokeAllSessions: revokeAllMutation.mutate,
  };
}
