import { supabase } from './supabase';

/** RejectCheck backend (NestJS). On a device/emulator localhost won't reach
 *  your machine — Android emulator uses 10.0.2.2, a physical device needs your
 *  LAN IP. Configured via EXPO_PUBLIC_API_URL. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8888';

/** Mirrors the backend GetEntitlementUseCase DTO (GET /api/me/entitlement). */
export type Entitlement = {
  plan: 'free' | 'shortlisted' | 'hired';
  isPremium: boolean;
  isHired: boolean;
  status: string;
  source: 'stripe' | 'revenuecat' | 'none';
  currentPeriodEnd: string | null;
  monthlyCap: number;
  creditsBalance: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Fetch with the Supabase access token attached. */
export async function authedFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export async function getEntitlement(): Promise<Entitlement> {
  const res = await authedFetch('/api/me/entitlement');
  if (!res.ok) {
    throw new ApiError(`Failed to load entitlement (${res.status})`, res.status);
  }
  return (await res.json()) as Entitlement;
}

/** Credits → human "analyses" (1 JD analysis = 100 credits on the backend). */
export const analysesFromCredits = (credits: number) => Math.round(credits / 100);
