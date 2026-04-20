import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { apiFetch, authHeaders } from './api';
import type { Profile, Application } from './queries';

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
