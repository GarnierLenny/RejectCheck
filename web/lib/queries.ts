import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { apiFetch, authHeaders } from './api';

// ─── Shared types ────────────────────────────────────────────────────────────

export type Subscription = {
  plan: string;
  status: string;
  currentPeriodEnd: string;
};

export type Profile = {
  username: string | null;
  avatarUrl: string | null;
};

export type HistoryItem = {
  id: number;
  jobDescription: string;
  jobLabel?: string;
  company?: string;
  createdAt: string;
  result: any;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
};

export type InterviewAttempt = {
  id: number;
  analysisId: number;
  createdAt: string;
  globalScore: number | null;
  analysis?: any;
};

export type Application = {
  id: number;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  notes?: string | null;
  analysisId?: number | null;
  seniority?: string | null;
  pay?: string | null;
  officeLocation?: string | null;
  workSetting?: string | null;
  contractType?: string | null;
  languagesRequired?: string | null;
  yearsOfExperience?: string | null;
  companyStage?: string | null;
  analysis?: {
    id: number;
    jobLabel?: string | null;
    company?: string | null;
    createdAt: string;
    result: any;
  } | null;
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSubscription() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: () =>
      apiFetch<Subscription | null>('/api/stripe/subscription', {
        headers: authHeaders(token!),
      }),
    enabled: !!token && !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfile() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () =>
      apiFetch<Profile | null>('/api/analyze/profile', {
        headers: authHeaders(token!),
      }),
    enabled: !!token && !!userId,
  });
}

export function useAnalysisHistory(page: number) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['analysis-history', userId, page],
    queryFn: () =>
      apiFetch<PaginatedResponse<HistoryItem>>(`/api/analyze/history?page=${page}&limit=10`, {
        headers: authHeaders(token!),
      }),
    enabled: !!token && !!userId,
  });
}

export function useInterviewHistory(page: number) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['interview-history', userId, page],
    queryFn: () =>
      apiFetch<PaginatedResponse<InterviewAttempt>>(`/api/interview/history?page=${page}&limit=10`, {
        headers: authHeaders(token!),
      }),
    enabled: !!token && !!userId,
  });
}

export function useApplications() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['applications', userId],
    queryFn: () =>
      apiFetch<Application[]>('/api/applications', {
        headers: authHeaders(token!),
      }),
    enabled: !!token && !!userId,
  });
}

export function useAnalysis(id: number | null) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['analysis', id, userId],
    queryFn: () =>
      apiFetch<{ result: any; jobDescription: string; jobLabel?: string; company?: string; rewrite?: any }>(
        `/api/analyze/${id}`,
        { headers: authHeaders(token!) },
      ),
    enabled: !!id && !!token && !!userId,
    staleTime: Infinity,
  });
}
