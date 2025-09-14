// web/src/lib/api.ts
import { getToken } from '@/lib/session';

export async function api<T>(path: string, init?: RequestInit) {
  const base = process.env.NEXT_PUBLIC_API_CORE ?? 'http://localhost:4000';
  const token = typeof window !== 'undefined' ? getToken() : null;

  const res = await fetch(`${base}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}
