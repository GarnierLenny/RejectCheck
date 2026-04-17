const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.rejectcheck.com';

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  // NestJS serialises `return null` as an empty body — handle gracefully
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}
