import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllTrainings,
  getTrainingById,
  getTrainingDetail,
  enrollTraining,
  getUserEnrollments,
  updateProgress,
  completeTraining,
} from "./api";
import type {
  EnrollRequest,
  UpdateProgressRequest,
  CompleteTrainingRequest,
} from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const trainingKeys = {
  all: ["trainings"] as const,
  lists: () => [...trainingKeys.all, "list"] as const,
  list: () => [...trainingKeys.lists()] as const,
  details: () => [...trainingKeys.all, "detail"] as const,
  detail: (id: string) => [...trainingKeys.details(), id] as const,
  enrollments: () => ["enrollments"] as const,
  userEnrollments: (umkmId: string) => [...trainingKeys.enrollments(), "user", umkmId] as const,
};

// ─── Training Queries ─────────────────────────────────────────────────────────

/**
 * Hook untuk get all trainings
 */
export function useTrainings() {
  return useQuery({
    queryKey: trainingKeys.list(),
    queryFn: getAllTrainings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook untuk get training by ID
 */
export function useTraining(trainingId: string) {
  return useQuery({
    queryKey: trainingKeys.detail(trainingId),
    queryFn: () => getTrainingById(trainingId),
    enabled: !!trainingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook untuk get training detail with modules
 */
export function useTrainingDetail(trainingId: string) {
  return useQuery({
    queryKey: trainingKeys.detail(trainingId),
    queryFn: () => getTrainingDetail(trainingId),
    enabled: !!trainingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook untuk get user enrollments
 */
export function useUserEnrollments(umkmId: string) {
  return useQuery({
    queryKey: trainingKeys.userEnrollments(umkmId),
    queryFn: () => getUserEnrollments(umkmId),
    enabled: !!umkmId,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: "always",
  });
}

// ─── Training Mutations ───────────────────────────────────────────────────────

/**
 * Hook untuk enroll training
 */
export function useEnrollTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EnrollRequest) => enrollTraining(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trainingKeys.enrollments(),
        refetchType: "all",
      });
    },
  });
}

/**
 * Hook untuk update progress
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProgressRequest) => updateProgress(data),
    onSuccess: () => {
      // Invalidate enrollments untuk refresh progress
      queryClient.invalidateQueries({
        queryKey: trainingKeys.enrollments(),
      });
    },
  });
}

/**
 * Hook untuk complete training
 */
export function useCompleteTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteTrainingRequest) => completeTraining(data),
    onSuccess: () => {
      // Invalidate enrollments untuk refresh status
      queryClient.invalidateQueries({
        queryKey: trainingKeys.enrollments(),
      });
    },
  });
}
