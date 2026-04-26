import { request, APIRequestContext } from '@playwright/test';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${process.env.E2E_API_PORT ?? 8889}`;

export async function apiContext(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API_URL });
}
