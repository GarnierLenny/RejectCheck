import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
  usernameUpdatedAt: string | null;
  isPublic: boolean;
  bio: string | null;
  avatarUrl: string | null;
  displayName: string | null;
  githubUsername: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  socialLinks: string[];
  coverLetterName: string | null;
  followersCount: number;
  followingCount: number;
  followersLastSeenAt: string | null;
  unreadFollowersCount?: number;
};

export type PublicProfile = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  githubUsername: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  socialLinks: string[];
  joinedAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  challenges: {
    total: number;
    avgScore: number;
    bestScore: number;
    currentStreak: number;
    longestStreak: number;
    lastCompletedAt: string | null;
  };
  recentChallenges: Array<{
    challengeId: number;
    title: string;
    focusTag: string;
    difficulty: string;
    language: string;
    score: number;
    completedAt: string;
  }>;
};

export type FollowSummary = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  currentStreak: number;
  followedAt: string;
  isFollowing?: boolean;
};

export type FollowList = {
  entries: FollowSummary[];
  nextCursor: number | null;
};

export type PublicActivityEntry = {
  date: string;
  score: number;
};

export type SavedCv = {
  id: number;
  name: string;
  url: string;
  createdAt: string;
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

export function useInterviewsByAnalysis(analysisId: number | null) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['interview-history-by-analysis', userId, analysisId],
    queryFn: () =>
      apiFetch<PaginatedResponse<InterviewAttempt>>(
        `/api/interview/history?analysisId=${analysisId}&limit=50`,
        { headers: authHeaders(token!) },
      ),
    enabled: !!token && !!userId && analysisId !== null,
  });
}

export function useSavedCvs() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['saved-cvs', userId],
    queryFn: () =>
      apiFetch<SavedCv[]>('/api/analyze/saved-cvs', {
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

export function usePublicProfile(username: string | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;
  return useQuery({
    queryKey: ['public-profile', username, token ? 'auth' : 'anon'],
    queryFn: () =>
      apiFetch<PublicProfile>(`/api/u/${encodeURIComponent(username!)}`, {
        headers: token ? authHeaders(token) : undefined,
      }),
    enabled: !!username,
    staleTime: 60 * 1000,
  });
}

function fetchFollowPage(
  path: string,
  token: string | undefined,
  cursor: number | undefined,
): Promise<FollowList> {
  const qs = new URLSearchParams();
  if (cursor !== undefined) qs.set('cursor', String(cursor));
  return apiFetch<FollowList>(`${path}?${qs.toString()}`, {
    headers: token ? authHeaders(token) : undefined,
  });
}

export function useMyFollowers() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  return useInfiniteQuery({
    queryKey: ['social', 'me', 'followers', userId],
    queryFn: ({ pageParam }) =>
      fetchFollowPage('/api/social/me/followers', token, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token && !!userId,
    staleTime: 30 * 1000,
  });
}

export function useMyFollowing() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  return useInfiniteQuery({
    queryKey: ['social', 'me', 'following', userId],
    queryFn: ({ pageParam }) =>
      fetchFollowPage('/api/social/me/following', token, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token && !!userId,
    staleTime: 30 * 1000,
  });
}

export function usePublicFollowers(username: string | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;
  return useInfiniteQuery({
    queryKey: ['social', 'public', 'followers', username, token ? 'auth' : 'anon'],
    queryFn: ({ pageParam }) =>
      fetchFollowPage(
        `/api/u/${encodeURIComponent(username!)}/followers`,
        token,
        pageParam,
      ),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
    staleTime: 30 * 1000,
  });
}

export function usePublicFollowing(username: string | undefined) {
  const { session } = useAuth();
  const token = session?.access_token;
  return useInfiniteQuery({
    queryKey: ['social', 'public', 'following', username, token ? 'auth' : 'anon'],
    queryFn: ({ pageParam }) =>
      fetchFollowPage(
        `/api/u/${encodeURIComponent(username!)}/following`,
        token,
        pageParam,
      ),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
    staleTime: 30 * 1000,
  });
}

export function usePublicActivity(username: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', 'activity', username],
    queryFn: () =>
      apiFetch<PublicActivityEntry[]>(
        `/api/u/${encodeURIComponent(username!)}/activity`,
      ),
    enabled: !!username,
    staleTime: 60 * 1000,
  });
}

export function useAnalysis(id: number | null) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['analysis', id, userId],
    queryFn: () =>
      apiFetch<{ result: any; jobDescription: string; jobLabel?: string; company?: string; rewrite?: any; coverLetter?: string | null }>(
        `/api/analyze/${id}`,
        { headers: authHeaders(token!) },
      ),
    enabled: !!id && !!token && !!userId,
    staleTime: Infinity,
  });
}
