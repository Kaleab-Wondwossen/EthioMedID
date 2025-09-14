export async function api<T>(path: string, init?: RequestInit) {
  const base = process.env.NEXT_PUBLIC_API_CORE!;
  const res = await fetch(`${base}${path}`, {
    ...init,
    cache: 'no-store',
    credentials: 'include', // <— send cookie
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}
