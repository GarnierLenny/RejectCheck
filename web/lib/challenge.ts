import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { apiFetch, authHeaders } from './api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

export type ChallengeIssue = {
  title: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
};

export type PublicChallenge = {
  id: number;
  date: string;
  language: string;
  title: string;
  focusTag: string;
  difficulty: string;
  snippet: string;
  question: string;
  estimatedTime: number;
};

export type DayStats = {
  completions: number;
  averageScore: number;
  scoreDistribution: number[];
};

export type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
};

export type ScoreBreakdown = {
  issues_found: number;
  explanation_quality: number;
  prioritization: number;
  bonus: number;
};

export type FinalResponse = {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  feedback: string;
  missed_issues: string[];
  issues: ChallengeIssue[];
  stats: DayStats;
  streak: Streak;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useTodayChallenge() {
  return useQuery({
    queryKey: ['challenge', 'today'],
    queryFn: () => apiFetch<PublicChallenge>('/api/challenge/today'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDayStats(challengeId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['challenge', 'stats', challengeId],
    queryFn: () => apiFetch<DayStats>(`/api/challenge/stats/${challengeId}`),
    enabled: enabled && !!challengeId,
  });
}

export function useChallengeStreak() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  return useQuery({
    queryKey: ['challenge', 'streak', userId],
    queryFn: () =>
      apiFetch<Streak>('/api/challenge/streak', {
        headers: authHeaders(token!),
      }),
    enabled: !!token && !!userId,
    staleTime: 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export class ChallengeApiError extends Error {
  status: number;
  code?: string;
  payload: unknown;
  constructor(status: number, message: string, code: string | undefined, payload: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

async function postJson<T>(path: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const parsed: { message?: string; code?: string } & Record<string, unknown> =
    text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new ChallengeApiError(
      res.status,
      parsed?.message || `HTTP ${res.status}`,
      parsed?.code,
      parsed,
    );
  }
  return parsed as T;
}

export function useSubmitFirstAnswer() {
  const { session } = useAuth();
  const token = session?.access_token;
  return useMutation({
    mutationFn: async (body: { challengeId: number; firstAnswer: string }) => {
      if (!token) throw new Error('Not authenticated');
      return postJson<{ aiChallenge: string }>('/api/challenge/submit/first', token, body);
    },
  });
}

export function useSubmitFinalAnswer() {
  const { session } = useAuth();
  const token = session?.access_token;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { challengeId: number; secondAnswer: string }) => {
      if (!token) throw new Error('Not authenticated');
      return postJson<FinalResponse>('/api/challenge/submit/final', token, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenge', 'streak'] });
      qc.invalidateQueries({ queryKey: ['challenge', 'stats'] });
      qc.invalidateQueries({ queryKey: ['challenge', 'history'] });
    },
  });
}
