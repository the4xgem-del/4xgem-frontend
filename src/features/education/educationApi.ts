import { apiClient, getApiErrorMessage } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export interface EducationTopic {
  id: string;
  title: string;
  icon: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  lessons: number;
  color: string;
  progress: number;
}

const LEVEL_DISPLAY: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL_LEVELS: "All Levels",
};

const educationApi = {
  async list(): Promise<EducationTopic[]> {
    const { data } = await apiClient.get<{ data: EducationTopic[] }>("/education");
    return data.data;
  },
  async updateProgress(topicId: string, progressPercent: number): Promise<void> {
    await apiClient.put(`/education/${topicId}/progress`, { progressPercent });
  },
};

export function useEducation() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["education"], queryFn: educationApi.list });

  const progressMutation = useMutation({
    mutationFn: ({ topicId, progressPercent }: { topicId: string; progressPercent: number }) =>
      educationApi.updateProgress(topicId, progressPercent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["education"] }),
    onError: (err) => setError(getApiErrorMessage(err, "Couldn't save your progress.")),
  });

  return {
    topics: (query.data ?? []).map((t) => ({ ...t, levelDisplay: LEVEL_DISPLAY[t.level] ?? t.level })),
    isLoading: query.isLoading,
    isError: query.isError,
    error,
    markStarted: (topicId: string, currentProgress: number) =>
      progressMutation.mutate({ topicId, progressPercent: Math.min(100, currentProgress + 20) }),
  };
}
