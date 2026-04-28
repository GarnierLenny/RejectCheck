import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { apiFetch, authHeaders } from './api';
import type { Profile, Application, PublicProfile } from './queries';
import type { NegotiationAnalysis } from '../app/components/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

export class UsernameTakenError extends Error {
  constructor() {
    super('Username already taken');
    this.name = 'UsernameTakenError';
  }
}

export class UsernameRateLimitError extends Error {
  retryAt: Date;
  constructor(retryAt: Date) {
    super('Username changes are rate-limited');
    this.name = 'UsernameRateLimitError';
    this.retryAt = retryAt;
  }
}

export function useDeleteAnalysis() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/analyze/${id}/delete`, {
        method: 'POST',
        headers: authHeaders(token!),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-history', userId] });
    },
  });
}

export function useUpdateProfile() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Profile>) =>
      apiFetch<Profile>('/api/analyze/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(token!),
        },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useClaimUsername() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`${BASE_URL}/api/profile/claim-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(token!),
        },
        body: JSON.stringify({ username }),
      });
      if (res.status === 409) throw new UsernameTakenError();
      if (res.status === 429) {
        try {
          const body = await res.json();
          const retryAt = body?.retryAt ? new Date(body.retryAt) : new Date();
          throw new UsernameRateLimitError(retryAt);
        } catch (err) {
          if (err instanceof UsernameRateLimitError) throw err;
          throw new UsernameRateLimitError(new Date());
        }
      }
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          message = body.message || message;
        } catch { /* ignore */ }
        throw new Error(message);
      }
      return (await res.json()) as { username: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useFollow() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      apiFetch<{ ok: true; created: boolean }>(
        `/api/social/follow/${encodeURIComponent(username)}`,
        {
          method: 'POST',
          headers: authHeaders(token!),
        },
      ),
    onMutate: async (username) => {
      const keys = [
        ['public-profile', username, 'auth'],
        ['public-profile', username, 'anon'],
      ];
      await Promise.all(
        keys.map((k) => queryClient.cancelQueries({ queryKey: k })),
      );
      const snapshots = keys.map((k) => ({
        key: k,
        prev: queryClient.getQueryData<PublicProfile>(k),
      }));
      for (const { key, prev } of snapshots) {
        if (prev && !prev.isFollowing) {
          queryClient.setQueryData<PublicProfile>(key, {
            ...prev,
            isFollowing: true,
            followersCount: prev.followersCount + 1,
          });
        }
      }
      return { snapshots };
    },
    onError: (_err, _username, ctx) => {
      ctx?.snapshots?.forEach(({ key, prev }) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
    },
    onSettled: (_data, _err, username) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
      queryClient.invalidateQueries({ queryKey: ['social', 'me', 'following', userId] });
    },
  });
}

export function useUnfollow() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      apiFetch<{ ok: true; removed: boolean }>(
        `/api/social/follow/${encodeURIComponent(username)}`,
        {
          method: 'DELETE',
          headers: authHeaders(token!),
        },
      ),
    onMutate: async (username) => {
      const keys = [
        ['public-profile', username, 'auth'],
        ['public-profile', username, 'anon'],
      ];
      await Promise.all(
        keys.map((k) => queryClient.cancelQueries({ queryKey: k })),
      );
      const snapshots = keys.map((k) => ({
        key: k,
        prev: queryClient.getQueryData<PublicProfile>(k),
      }));
      for (const { key, prev } of snapshots) {
        if (prev && prev.isFollowing) {
          queryClient.setQueryData<PublicProfile>(key, {
            ...prev,
            isFollowing: false,
            followersCount: Math.max(0, prev.followersCount - 1),
          });
        }
      }
      return { snapshots };
    },
    onError: (_err, _username, ctx) => {
      ctx?.snapshots?.forEach(({ key, prev }) => {
        if (prev) queryClient.setQueryData(key, prev);
      });
    },
    onSettled: (_data, _err, username) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
      queryClient.invalidateQueries({ queryKey: ['social', 'me', 'following', userId] });
    },
  });
}

export function useBlock() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      apiFetch<{ ok: true; created: boolean }>(
        `/api/social/block/${encodeURIComponent(username)}`,
        { method: 'POST', headers: authHeaders(token!) },
      ),
    onSuccess: (_data, username) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
      queryClient.invalidateQueries({ queryKey: ['social', 'me', 'following', userId] });
      queryClient.invalidateQueries({ queryKey: ['social', 'me', 'followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['social', 'me', 'blocked', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useUnblock() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      apiFetch<{ ok: true; removed: boolean }>(
        `/api/social/block/${encodeURIComponent(username)}`,
        { method: 'DELETE', headers: authHeaders(token!) },
      ),
    onSuccess: (_data, username) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', username] });
      queryClient.invalidateQueries({ queryKey: ['social', 'me', 'blocked', userId] });
    },
  });
}

export function useMarkFollowersSeen() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ ok: true }>('/api/social/me/seen-followers', {
        method: 'POST',
        headers: authHeaders(token!),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useUpdatePublicSettings() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { isPublic?: boolean; bio?: string | null }) =>
      apiFetch<{ isPublic: boolean; bio: string | null }>(
        '/api/profile/public-settings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(token!),
          },
          body: JSON.stringify(data),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: ({ plan, email }: { plan: 'shortlisted' | 'hired'; email?: string }) =>
      apiFetch<{ url: string }>('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email }),
      }),
  });
}

export function useAddSavedCv() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; url: string }) =>
      apiFetch('/api/analyze/saved-cvs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token!) },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cvs', userId] });
    },
  });
}

export function useDeleteSavedCv() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/analyze/saved-cvs/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token!),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cvs', userId] });
    },
  });
}

export function useCreatePortalSession() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: () =>
      apiFetch<{ url: string }>('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token!) },
        body: JSON.stringify({ returnUrl: window.location.href }),
      }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });
}

export function useDeleteAccount() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: () =>
      apiFetch('/api/account', {
        method: 'DELETE',
        headers: authHeaders(token!),
      }),
  });
}

type ApplicationInput = {
  jobTitle: string;
  company: string;
  status?: string;
  appliedAt?: string;
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
};

export function useCreateApplication() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApplicationInput) =>
      apiFetch<Application>('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token!) },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
    },
  });
}

export function useUpdateApplication() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<ApplicationInput>) =>
      apiFetch<Application>(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders(token!) },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
    },
  });
}

export function useDeleteApplication() {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: authHeaders(token!),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', userId] });
    },
  });
}

export function useGenerateCoverLetter() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: ({ analysisId, language }: { analysisId: number; language: string }) =>
      apiFetch<{ coverLetter: string; detectedLanguage: string }>(
        '/api/analyze/cover-letter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(token!),
          },
          body: JSON.stringify({ analysisId, language }),
        },
      ),
  });
}

export function useGenerateNegotiation() {
  const { session } = useAuth();
  const token = session?.access_token;

  return useMutation({
    mutationFn: ({ analysisId, locale }: { analysisId: number; locale?: string }) =>
      apiFetch<{ negotiation: NegotiationAnalysis }>(
        `/api/analyze/${analysisId}/negotiation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(token!),
          },
          body: JSON.stringify({ locale: locale ?? 'en' }),
        },
      ),
  });
}
