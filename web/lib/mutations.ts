import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { apiFetch, authHeaders } from './api';
import type { Profile } from './queries';

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
